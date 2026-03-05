import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET RAB items
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    // If projectId is 'all' or not provided, get all RAB items from all projects
    let rabItems;
    
    if (!projectId || projectId === 'all') {
      rabItems = await db.rABItem.findMany({
        include: { 
          item: true,
          project: {
            include: { client: true }
          }
        },
        orderBy: [
          { project: { name: 'asc' } },
          { category: 'asc' }
        ],
      });
    } else {
      rabItems = await db.rABItem.findMany({
        where: { projectId },
        include: { 
          item: true,
          project: {
            include: { client: true }
          }
        },
        orderBy: { category: 'asc' },
      });
    }

    const totalBudget = rabItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Group by project first, then by category
    const groupedByProject = rabItems.reduce((acc, item) => {
      const projId = item.projectId;
      const projName = item.project?.name || 'Unknown';
      
      if (!acc[projId]) {
        acc[projId] = {
          projectId: projId,
          projectName: projName,
          projectCode: item.project?.code,
          clientName: item.project?.client?.name,
          items: [],
          totalByCategory: {} as Record<string, number>,
          totalBudget: 0
        };
      }
      
      acc[projId].items.push(item);
      acc[projId].totalBudget += item.totalPrice;
      
      const cat = item.category || item.item?.category || 'Other';
      if (!acc[projId].totalByCategory[cat]) {
        acc[projId].totalByCategory[cat] = 0;
      }
      acc[projId].totalByCategory[cat] += item.totalPrice;
      
      return acc;
    }, {} as Record<string, any>);

    // Group by category only (for single project view)
    const groupedByCategory = rabItems.reduce((acc, item) => {
      const cat = item.category || item.item?.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, typeof rabItems>);

    return NextResponse.json({ 
      rabItems, 
      totalBudget, 
      groupedByCategory,
      groupedByProject: Object.values(groupedByProject),
      projectCount: Object.keys(groupedByProject).length
    });
  } catch (error) {
    console.error('Get RAB error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST add RAB item
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { projectId, itemId, description, quantity, unitPrice } = data;

    if (!projectId || !itemId || !quantity) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Get item for price and category
    const item = await db.masterItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 });
    }

    const price = unitPrice || item.price;
    const totalPrice = price * parseFloat(quantity);

    const rabItem = await db.rABItem.create({
      data: {
        projectId,
        itemId,
        description,
        quantity: parseFloat(quantity),
        unitPrice: price,
        totalPrice,
        category: item.category,
      },
      include: { item: true },
    });

    // Log activity
    // Get project name for logging
    const project = await db.project.findUnique({ where: { id: projectId } });
    await db.activityLog.create({
      data: {
        userId: (user as any).id as any,
        module: 'RAB',
        action: 'Create',
        details: `${user.name} menambahkan item RAB: ${item.name} x ${quantity} pada project ${project?.name || 'Unknown'}`,
        projectId,
      },
    });

    return NextResponse.json({ rabItem });
  } catch (error) {
    console.error('Create RAB item error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT update RAB item
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'RAB Item ID wajib diisi' }, { status: 400 });
    }

    // Get existing item for logging
    const existing = await db.rABItem.findUnique({ 
      where: { id },
      include: { item: true, project: true }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'RAB Item tidak ditemukan' }, { status: 404 });
    }

    // Recalculate total if quantity or price changed
    if (updateData.quantity !== undefined || updateData.unitPrice !== undefined) {
      const qty = updateData.quantity !== undefined ? parseFloat(updateData.quantity) : existing.quantity;
      const price = updateData.unitPrice !== undefined ? updateData.unitPrice : existing.unitPrice;
      updateData.totalPrice = qty * price;
      updateData.quantity = qty;
    }

    const rabItem = await db.rABItem.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: (user as any).id as any,
        module: 'RAB',
        action: 'Update',
        details: `${user.name} mengupdate item RAB: ${existing.item?.name || 'Unknown'} pada project ${existing.project?.name || 'Unknown'}`,
        projectId: existing.projectId,
      },
    });

    return NextResponse.json({ rabItem });
  } catch (error) {
    console.error('Update RAB item error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE RAB item
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'RAB Item ID wajib diisi' }, { status: 400 });
    }

    // Get item info for logging
    const rabItem = await db.rABItem.findUnique({
      where: { id },
      include: { item: true, project: true }
    });

    await db.rABItem.delete({
      where: { id },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: (user as any).id as any,
        module: 'RAB',
        action: 'Delete',
        details: `${user.name} menghapus item RAB: ${rabItem?.item?.name || 'Unknown'} pada project ${rabItem?.project?.name || 'Unknown'}`,
        projectId: rabItem?.projectId,
      },
    });

    return NextResponse.json({ message: 'RAB item deleted successfully' });
  } catch (error) {
    console.error('Delete RAB item error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
