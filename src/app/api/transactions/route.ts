import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET transactions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');
    const source = searchParams.get('source'); // 'Project', 'Internal', or 'all'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    
    // Filter by source
    if (source && source !== 'all') {
      where.source = source;
    }
    
    // Filter by project
    if (projectId && projectId !== 'all') {
      where.projectId = projectId;
    }
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        project: true,
        user: true,
      },
      orderBy: { date: 'desc' },
    });

    // Calculate summary
    const summary = {
      totalIncome: transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0),
      totalExpense: transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0),
      count: transactions.length,
    };

    return NextResponse.json({ transactions, summary });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST create transaction
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { projectId, type, category, description, amount, date, receipt, notes, source } = data;

    // Determine if this is internal or project transaction
    const transactionSource = source || (projectId ? 'Project' : 'Internal');
    
    // For Internal transactions, projectId can be null
    if (transactionSource === 'Project' && !projectId) {
      return NextResponse.json({ error: 'Project ID wajib diisi untuk transaksi project' }, { status: 400 });
    }
    
    if (!type || !description || !amount || !date) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const transaction = await db.transaction.create({
      data: {
        projectId: transactionSource === 'Internal' ? null : projectId,
        userId: (user as any).id as any,
        source: transactionSource,
        type,
        category: category || 'Other',
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        receipt,
        notes,
      },
      include: { project: true },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: (user as any).id as any,
        module: transactionSource === 'Internal' ? 'Internal Journal' : 'Accounting',
        action: type === 'Income' ? 'Create Income' : 'Create Expense',
        details: `${user.name} mencatat ${type === 'Income' ? 'pemasukan' : 'pengeluaran'} internal: ${description} sebesar Rp ${parseFloat(amount).toLocaleString('id-ID')}`,
        projectId: transactionSource === 'Internal' ? null : projectId,
      },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT update transaction
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, source, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID wajib diisi' }, { status: 400 });
    }

    // Get existing transaction for logging
    const existing = await db.transaction.findUnique({
      where: { id },
      include: { project: true }
    });

    if (updateData.amount !== undefined) {
      updateData.amount = parseFloat(updateData.amount);
    }
    
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    
    // Handle source change
    if (source !== undefined) {
      updateData.source = source;
      if (source === 'Internal') {
        updateData.projectId = null;
      }
    }

    const transaction = await db.transaction.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: (user as any).id as any,
        module: existing?.source === 'Internal' ? 'Internal Journal' : 'Accounting',
        action: 'Update',
        details: `${user.name} mengupdate transaksi: ${existing?.description || 'Unknown'}`,
        projectId: existing?.projectId,
      },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE transaction
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID wajib diisi' }, { status: 400 });
    }

    // Get transaction info for logging
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: { project: true }
    });

    await db.transaction.delete({
      where: { id },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: (user as any).id as any,
        module: transaction?.source === 'Internal' ? 'Internal Journal' : 'Accounting',
        action: 'Delete',
        details: `${user.name} menghapus transaksi: ${transaction?.description || 'Unknown'}`,
        projectId: transaction?.projectId,
      },
    });

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
