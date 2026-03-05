import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET all clients
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await db.client.findMany({
      include: {
        _count: {
          select: { projects: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST create new client or restore from backup
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Silakan login terlebih dahulu' }, { status: 401 });
    }

    const data = await request.json();

    // Handle restore action
    if (data.action === 'restore' && data.clients) {
      let restored = 0;
      for (const client of data.clients) {
        try {
          await db.client.upsert({
            where: { id: client.id },
            update: {
              name: client.name,
              contactPerson: client.contactPerson,
              phone: client.phone,
              email: client.email,
              address: client.address,
              notes: client.notes,
              isActive: client.isActive ?? true,
            },
            create: {
              id: client.id,
              code: client.code,
              name: client.name,
              contactPerson: client.contactPerson,
              phone: client.phone,
              email: client.email,
              address: client.address,
              notes: client.notes,
              isActive: client.isActive ?? true,
            },
          });
          restored++;
        } catch (e) {
          console.error('Failed to restore client:', client.id, e);
        }
      }
      return NextResponse.json({ message: `Berhasil restore ${restored} clients` });
    }

    const { name, contactPerson, phone, email, address, notes } = data;

    if (!name || !contactPerson || !phone) {
      return NextResponse.json({ error: 'Nama Client, Contact Person, dan Telepon wajib diisi' }, { status: 400 });
    }

    // Generate sequential client code (CLT-001, CLT-002, etc.)
    const clientCount = await db.client.count();
    const sequenceNumber = clientCount + 1;
    let clientCode = `CLT-${String(sequenceNumber).padStart(3, '0')}`;

    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.client.findUnique({ where: { code: clientCode } });
      if (!existing) break;
      clientCode = `CLT-${String(sequenceNumber + attempts + 1).padStart(3, '0')}`;
      attempts++;
    }

    const client = await db.client.create({
      data: {
        code: clientCode,
        name,
        contactPerson,
        phone,
        email,
        address,
        notes,
      },
    });

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          // @ts-ignore
          userId: user.id as any,
          module: 'Clients',
          action: 'Create',
          details: `${user.name} menambahkan client baru: ${name} (${clientCode})`,
        },
      });
    } catch (logError) {
      console.log('Failed to log activity:', logError);
    }

    return NextResponse.json({ client });
  } catch (error: any) {
    console.error('Create client error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT update client
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, name, contactPerson, phone, email, address, notes, isActive } = data;

    if (!id) {
      return NextResponse.json({ error: 'Client ID wajib diisi' }, { status: 400 });
    }

    const client = await db.client.update({
      where: { id },
      data: {
        name,
        contactPerson,
        phone,
        email,
        address,
        notes,
        isActive,
      },
    });

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          // @ts-ignore
          userId: user.id as any,
          module: 'Clients',
          action: 'Update',
          details: `${user.name} mengupdate client: ${name} (${client.code})`,
        },
      });
    } catch (logError) {
      console.log('Failed to log activity:', logError);
    }

    return NextResponse.json({ client });
  } catch (error: any) {
    console.error('Update client error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE client
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Client ID wajib diisi' }, { status: 400 });
    }

    // Check if client has projects
    const projectCount = await db.project.count({
      where: { clientId: id }
    });

    if (projectCount > 0) {
      return NextResponse.json({ 
        error: `Client tidak dapat dihapus karena memiliki ${projectCount} project terkait` 
      }, { status: 400 });
    }

    const client = await db.client.delete({
      where: { id },
    });

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          // @ts-ignore
          userId: user.id as any,
          module: 'Clients',
          action: 'Delete',
          details: `${user.name} menghapus client: ${client.name} (${client.code})`,
        },
      });
    } catch (logError) {
      console.log('Failed to log activity:', logError);
    }

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
