import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    const where: any = {};
    if (projectId && projectId !== 'all') {
      where.projectId = projectId;
    }

    const tenders = await db.tender.findMany({
      where,
      include: { project: true },
      orderBy: { submitDate: 'desc' },
    });

    return NextResponse.json({ tenders });
  } catch (error) {
    console.error('Get tenders error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { projectId, name, value, status, submitDate, notes } = data;

    if (!projectId || !name || !value) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const tender = await db.tender.create({
      data: {
        projectId,
        name,
        value: parseFloat(value),
        status: status || 'Submitted',
        submitDate: submitDate ? new Date(submitDate) : new Date(),
        notes,
      },
    });

    return NextResponse.json({ tender });
  } catch (error) {
    console.error('Create tender error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Tender ID wajib diisi' }, { status: 400 });
    }

    if (updateData.value !== undefined) {
      updateData.value = parseFloat(updateData.value);
    }
    if (updateData.resultDate) {
      updateData.resultDate = new Date(updateData.resultDate);
    }

    const tender = await db.tender.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ tender });
  } catch (error) {
    console.error('Update tender error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Tender ID wajib diisi' }, { status: 400 });
    }

    await db.tender.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Tender deleted successfully' });
  } catch (error) {
    console.error('Delete tender error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
