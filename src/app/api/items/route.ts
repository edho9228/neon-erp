import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Helper function to generate item code based on category
async function generateItemCode(category: string): Promise<string> {
  // Category prefix mapping
  const prefixes: Record<string, string> = {
    'Interior': 'INT',
    'Civil': 'CVL',
    'MEP': 'MEP',
    'General': 'GEN',
  };
  
  const prefix = prefixes[category] || 'ITM';
  
  // Find the highest number for this category
  const items = await db.masterItem.findMany({
    where: {
      code: { startsWith: prefix },
    },
    orderBy: { code: 'desc' },
    take: 1,
  });
  
  let nextNumber = 1;
  
  if (items.length > 0) {
    // Extract the number from the last code
    const lastCode = items[0].code;
    const match = lastCode.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }
  
  // Format: PREFIX-0000 (e.g., INT-0001, CVL-0012)
  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

// GET all items with search
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const where: any = { isActive: true };
    
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }

    const items = await db.masterItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Get items error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST create item or restore from backup
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Handle restore action
    if (data.action === 'restore' && data.items) {
      let restored = 0;
      for (const item of data.items) {
        try {
          await db.masterItem.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              category: item.category,
              unit: item.unit,
              price: item.price,
              description: item.description,
              isActive: item.isActive ?? true,
            },
            create: {
              id: item.id,
              code: item.code,
              name: item.name,
              category: item.category,
              unit: item.unit,
              price: item.price,
              description: item.description,
              isActive: item.isActive ?? true,
            },
          });
          restored++;
        } catch (e) {
          console.error('Failed to restore item:', item.id, e);
        }
      }
      return NextResponse.json({ message: `Berhasil restore ${restored} items` });
    }

    const { code, name, category, unit, price, description } = data;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama item wajib diisi' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: 'Kategori wajib dipilih' }, { status: 400 });
    }
    if (!unit || !unit.trim()) {
      return NextResponse.json({ error: 'Satuan wajib diisi' }, { status: 400 });
    }
    if (price === undefined || price === null || price === '') {
      return NextResponse.json({ error: 'Harga wajib diisi' }, { status: 400 });
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      return NextResponse.json({ error: 'Harga harus berupa angka yang valid' }, { status: 400 });
    }

    // Generate auto code based on category
    const itemCode = await generateItemCode(category);

    const item = await db.masterItem.create({
      data: {
        code: itemCode,
        name: name.trim(),
        category,
        unit: unit.trim(),
        price: priceValue,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ item, message: `Item berhasil dibuat dengan kode: ${itemCode}` });
  } catch (error: any) {
    console.error('Create item error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Kode item sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}

// PUT update item
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, code, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Item ID wajib diisi' }, { status: 400 });
    }

    // Validate required fields
    if (updateData.name !== undefined && !updateData.name?.trim()) {
      return NextResponse.json({ error: 'Nama item wajib diisi' }, { status: 400 });
    }
    if (updateData.unit !== undefined && !updateData.unit?.trim()) {
      return NextResponse.json({ error: 'Satuan wajib diisi' }, { status: 400 });
    }
    if (updateData.price !== undefined) {
      const priceValue = parseFloat(updateData.price);
      if (isNaN(priceValue) || priceValue < 0) {
        return NextResponse.json({ error: 'Harga harus berupa angka yang valid' }, { status: 400 });
      }
      updateData.price = priceValue;
    }

    // Clean up string fields
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.unit) updateData.unit = updateData.unit.trim();
    if (updateData.description) updateData.description = updateData.description.trim();

    // Don't allow code update - it's auto-generated
    delete updateData.code;

    const item = await db.masterItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('Update item error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}

// DELETE item
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Item ID wajib diisi' }, { status: 400 });
    }

    // Check if item is used in RAB
    const rabUsage = await db.rABItem.count({
      where: { itemId: id },
    });

    if (rabUsage > 0) {
      // Soft delete if used
      await db.masterItem.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: 'Item berhasil dinonaktifkan (sedang digunakan di RAB)' });
    }

    // Hard delete if not used
    await db.masterItem.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Item berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete item error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}
