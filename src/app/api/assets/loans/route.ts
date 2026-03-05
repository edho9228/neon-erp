import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET loan history for an asset or all loans
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const status = searchParams.get('status'); // 'active' or 'all'

    if (assetId) {
      // Get loans for specific asset
      const loans = await db.assetLoan.findMany({
        where: { assetId },
        include: {
          asset: {
            select: { code: true, name: true, category: true }
          }
        },
        orderBy: { loanDate: 'desc' }
      });
      return NextResponse.json({ loans });
    }

    // Get all loans
    const whereClause = status === 'active' ? { status: 'Dipinjam' } : {};
    const loans = await db.assetLoan.findMany({
      where: whereClause,
      include: {
        asset: {
          select: { code: true, name: true, category: true, condition: true }
        }
      },
      orderBy: { loanDate: 'desc' }
    });

    return NextResponse.json({ loans });
  } catch (error) {
    console.error('Get loans error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST - Create new loan (pinjam aset)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Silakan login terlebih dahulu' }, { status: 401 });
    }

    const data = await request.json();
    const { 
      assetId, borrowerName, borrowerPhone, borrowerAddress,
      loanDate, expectedReturnDate, notes 
    } = data;

    if (!assetId || !borrowerName || !loanDate || !expectedReturnDate) {
      return NextResponse.json({ error: 'Data peminjaman tidak lengkap' }, { status: 400 });
    }

    // Check if asset is available
    const asset = await db.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return NextResponse.json({ error: 'Aset tidak ditemukan' }, { status: 404 });
    }

    if (asset.loanStatus === 'Dipinjam') {
      return NextResponse.json({ error: 'Aset sedang dipinjam' }, { status: 400 });
    }

    // Create loan record and update asset status
    const loan = await db.assetLoan.create({
      data: {
        assetId,
        borrowerName,
        borrowerPhone,
        borrowerAddress,
        loanDate: new Date(loanDate),
        expectedReturnDate: new Date(expectedReturnDate),
        notes,
        status: 'Dipinjam',
      }
    });

    // Update asset status
    await db.asset.update({
      where: { id: assetId },
      data: {
        loanStatus: 'Dipinjam',
        borrowerName,
        loanDate: new Date(loanDate),
        expectedReturnDate: new Date(expectedReturnDate),
      }
    });

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          // @ts-ignore
          userId: user.id as any,
          module: 'Assets',
          action: 'Loan',
          details: `${user.name} meminjamkan aset ${asset.name} (${asset.code}) kepada ${borrowerName}`,
        },
      });
    } catch (logError) {
      console.log('Failed to log activity:', logError);
    }

    return NextResponse.json({ loan, message: 'Peminjaman berhasil dicatat' });
  } catch (error: any) {
    console.error('Create loan error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT - Return asset (kembalikan aset)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { loanId, assetId, returnNotes, returnedCondition } = data;

    let loan: any = null;

    // If loanId is provided, find by loanId
    if (loanId) {
      loan = await db.assetLoan.findUnique({
        where: { id: loanId },
        include: { asset: true }
      });
    } 
    // If assetId is provided, find active loan for that asset
    else if (assetId) {
      loan = await db.assetLoan.findFirst({
        where: { assetId, status: 'Dipinjam' },
        include: { asset: true }
      });
    }

    if (!loan) {
      return NextResponse.json({ error: 'Data peminjaman tidak ditemukan' }, { status: 404 });
    }

    if (loan.status === 'Dikembalikan') {
      return NextResponse.json({ error: 'Aset sudah dikembalikan' }, { status: 400 });
    }

    const now = new Date();

    // Update loan record
    const updatedLoan = await db.assetLoan.update({
      where: { id: loan.id },
      data: {
        status: 'Dikembalikan',
        actualReturnDate: now,
        returnNotes,
        returnedCondition,
      }
    });

    // Update asset status
    await db.asset.update({
      where: { id: loan.assetId },
      data: {
        loanStatus: 'Tersedia',
        borrowerName: null,
        loanDate: null,
        expectedReturnDate: null,
        actualReturnDate: now,
        condition: returnedCondition || loan.asset?.condition,
      }
    });

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          // @ts-ignore
          userId: user.id as any,
          module: 'Assets',
          action: 'Return',
          details: `${user.name} mencatat pengembalian aset ${loan.asset?.name} (${loan.asset?.code}) dari ${loan.borrowerName}`,
        },
      });
    } catch (logError) {
      console.log('Failed to log activity:', logError);
    }

    return NextResponse.json({ loan: updatedLoan, message: 'Pengembalian berhasil dicatat' });
  } catch (error: any) {
    console.error('Return loan error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
