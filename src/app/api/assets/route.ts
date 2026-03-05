import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET all assets with loan information
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assets = await db.asset.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        loans: {
          where: { status: 'Dipinjam' },
          orderBy: { loanDate: 'desc' },
          take: 1,
        }
      }
    });

    // Calculate summary
    const totalPurchaseValue = assets.reduce((sum, a) => sum + a.purchasePrice, 0);
    const totalCurrentValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
    const activeCount = assets.filter(a => a.isActive).length;
    const loanedCount = assets.filter(a => a.loanStatus === 'Dipinjam').length;
    const availableCount = assets.filter(a => a.loanStatus === 'Tersedia' && a.isActive).length;

    return NextResponse.json({ 
      assets,
      summary: {
        totalAssets: assets.length,
        activeCount,
        totalPurchaseValue,
        totalCurrentValue,
        loanedCount,
        availableCount,
      }
    });
  } catch (error) {
    console.error('Get assets error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST create new asset or restore from backup
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Silakan login terlebih dahulu' }, { status: 401 });
    }

    const data = await request.json();

    // Handle restore action
    if (data.action === 'restore' && data.assets) {
      let restored = 0;
      for (const asset of data.assets) {
        try {
          await db.asset.upsert({
            where: { id: asset.id },
            update: {
              name: asset.name,
              category: asset.category,
              brand: asset.brand,
              model: asset.model,
              serialNumber: asset.serialNumber,
              purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : null,
              purchasePrice: asset.purchasePrice || 0,
              currentValue: asset.currentValue || asset.purchasePrice || 0,
              condition: asset.condition || 'Baik',
              location: asset.location,
              assignedTo: asset.assignedTo,
              notes: asset.notes,
              loanStatus: asset.loanStatus || 'Tersedia',
              isActive: asset.isActive ?? true,
            },
            create: {
              id: asset.id,
              code: asset.code,
              name: asset.name,
              category: asset.category,
              brand: asset.brand,
              model: asset.model,
              serialNumber: asset.serialNumber,
              purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : null,
              purchasePrice: asset.purchasePrice || 0,
              currentValue: asset.currentValue || asset.purchasePrice || 0,
              condition: asset.condition || 'Baik',
              location: asset.location,
              assignedTo: asset.assignedTo,
              notes: asset.notes,
              loanStatus: asset.loanStatus || 'Tersedia',
              isActive: asset.isActive ?? true,
            },
          });
          restored++;
        } catch (e) {
          console.error('Failed to restore asset:', asset.id, e);
        }
      }
      return NextResponse.json({ message: `Berhasil restore ${restored} assets` });
    }

    const { 
      name, category, brand, model, serialNumber, 
      purchaseDate, purchasePrice, currentValue, 
      condition, location, assignedTo, notes 
    } = data;

    if (!name || !category) {
      return NextResponse.json({ error: 'Nama aset dan kategori wajib diisi' }, { status: 400 });
    }

    // Generate sequential asset code (AST-001, AST-002, etc.)
    const assetCount = await db.asset.count();
    const sequenceNumber = assetCount + 1;
    let assetCode = `AST-${String(sequenceNumber).padStart(3, '0')}`;

    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.asset.findUnique({ where: { code: assetCode } });
      if (!existing) break;
      assetCode = `AST-${String(sequenceNumber + attempts + 1).padStart(3, '0')}`;
      attempts++;
    }

    const asset = await db.asset.create({
      data: {
        code: assetCode,
        name,
        category,
        brand,
        model,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: parseFloat(String(purchasePrice)) || 0,
        currentValue: parseFloat(String(currentValue)) || parseFloat(String(purchasePrice)) || 0,
        condition: condition || 'Baik',
        location,
        assignedTo,
        notes,
        loanStatus: 'Tersedia',
      },
    });

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          // @ts-ignore
          userId: user.id as any,
          module: 'Assets',
          action: 'Create',
          details: `${user.name} menambahkan aset baru: ${name} (${assetCode})`,
        },
      });
    } catch (logError) {
      console.log('Failed to log activity:', logError);
    }

    return NextResponse.json({ asset });
  } catch (error: any) {
    console.error('Create asset error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT update asset
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { 
      id, name, category, brand, model, serialNumber, 
      purchaseDate, purchasePrice, currentValue, 
      condition, location, assignedTo, notes, isActive,
      // Loan fields
      loanStatus, borrowerName, loanDate, expectedReturnDate, actualReturnDate
    } = data;

    if (!id) {
      return NextResponse.json({ error: 'Asset ID wajib diisi' }, { status: 400 });
    }

    const asset = await db.asset.update({
      where: { id },
      data: {
        name,
        category,
        brand,
        model,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: parseFloat(String(purchasePrice)) || 0,
        currentValue: parseFloat(String(currentValue)) || 0,
        condition,
        location,
        assignedTo,
        notes,
        isActive,
        // Loan fields
        loanStatus,
        borrowerName,
        loanDate: loanDate ? new Date(loanDate) : null,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        actualReturnDate: actualReturnDate ? new Date(actualReturnDate) : null,
      },
    });

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          // @ts-ignore
          userId: user.id as any,
          module: 'Assets',
          action: 'Update',
          details: `${user.name} mengupdate aset: ${name} (${asset.code})`,
        },
      });
    } catch (logError) {
      console.log('Failed to log activity:', logError);
    }

    return NextResponse.json({ asset });
  } catch (error: any) {
    console.error('Update asset error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE asset
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Asset ID wajib diisi' }, { status: 400 });
    }

    const asset = await db.asset.delete({
      where: { id },
    });

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          // @ts-ignore
          userId: user.id as any,
          module: 'Assets',
          action: 'Delete',
          details: `${user.name} menghapus aset: ${asset.name} (${asset.code})`,
        },
      });
    } catch (logError) {
      console.log('Failed to log activity:', logError);
    }

    return NextResponse.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete asset error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
