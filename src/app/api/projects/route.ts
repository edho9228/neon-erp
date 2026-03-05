import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET all projects
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await db.project.findMany({
      include: {
        client: true,
        rabItems: {
          include: { item: true },
        },
        transactions: true,
        tenders: true,
        progressHistory: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        budgetPlans: {
          orderBy: [{ year: 'asc' }, { month: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST create new project/RAB or restore from backup
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Silakan login terlebih dahulu' }, { status: 401 });
    }

    const data = await request.json();

    // Handle restore action
    if (data.action === 'restore' && data.projects) {
      let restored = 0;
      for (const project of data.projects) {
        try {
          await db.project.upsert({
            where: { id: project.id },
            update: {
              name: project.name,
              clientId: project.clientId,
              status: project.status,
              contractValue: project.contractValue || 0,
              modalKerja: project.modalKerja || 0,
              progress: project.progress || 0,
              startDate: project.startDate ? new Date(project.startDate) : null,
              endDate: project.endDate ? new Date(project.endDate) : null,
              responsible: project.responsible,
            },
            create: {
              id: project.id,
              code: project.code,
              name: project.name,
              clientId: project.clientId,
              status: project.status || 'Negotiation',
              contractValue: project.contractValue || 0,
              modalKerja: project.modalKerja || 0,
              progress: project.progress || 0,
              startDate: project.startDate ? new Date(project.startDate) : null,
              endDate: project.endDate ? new Date(project.endDate) : null,
              responsible: project.responsible,
            },
          });
          restored++;
        } catch (e) {
          console.error('Failed to restore project:', project.id, e);
        }
      }
      return NextResponse.json({ message: `Berhasil restore ${restored} projects` });
    }

    const { 
      code, name, clientId, status, 
      contractValue, modalKerja, startDate, endDate,
      progress, progressNote, responsible
    } = data;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Nama project wajib diisi' }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client wajib dipilih' }, { status: 400 });
    }

    // Verify client exists
    const client = await db.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 400 });
    }

    // Generate sequential project code (PRJ-001, PRJ-002, etc.)
    let projectCode = code;
    if (!projectCode) {
      const projectCount = await db.project.count();
      const sequenceNumber = projectCount + 1;
      projectCode = `PRJ-${String(sequenceNumber).padStart(3, '0')}`;
      
      let attempts = 0;
      while (attempts < 10) {
        const existing = await db.project.findUnique({ where: { code: projectCode } });
        if (!existing) break;
        projectCode = `PRJ-${String(sequenceNumber + attempts + 1).padStart(3, '0')}`;
        attempts++;
      }
    }

    // Validate status-specific fields
    const projectStatus = status || 'Negotiation';
    
    // Only allow Contract Value, Modal Kerja, Start Date, End Date when Deal or InProgress
    const allowFinancialFields = ['Deal', 'InProgress', 'Completed'].includes(projectStatus);

    const project = await db.project.create({
      data: {
        code: projectCode,
        name,
        clientId,
        status: projectStatus,
        contractValue: allowFinancialFields && contractValue ? parseFloat(String(contractValue)) : 0,
        modalKerja: allowFinancialFields && modalKerja ? parseFloat(String(modalKerja)) : 0,
        startDate: allowFinancialFields && startDate ? new Date(startDate) : null,
        endDate: allowFinancialFields && endDate ? new Date(endDate) : null,
        progress: projectStatus === 'InProgress' && progress ? parseFloat(String(progress)) : 0,
        progressNote: projectStatus === 'InProgress' ? progressNote : null,
        responsible: responsible || null,
      },
      include: {
        client: true,
      },
    });

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          // @ts-ignore
          userId: user.id as any,
          module: 'Projects',
          action: 'Create',
          details: `${user.name} menambahkan RAB/Project baru: ${name} (${projectCode}) untuk client ${client.name}${responsible ? ` - PJ: ${responsible}` : ''}`,
          projectId: project.id,
        },
      });
    } catch (logError) {
      console.log('Failed to log activity:', logError);
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Create project error:', error);
    
    let errorMessage = 'Terjadi kesalahan server';
    
    if (error?.code === 'P2002') {
      errorMessage = 'Kode project sudah digunakan';
    } else if (error?.code === 'P2003') {
      errorMessage = 'Referensi client tidak valid';
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT update project
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, progress, progressNote, clientId, status, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Project ID wajib diisi' }, { status: 400 });
    }

    // Get current project to check status changes
    const currentProject = await db.project.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!currentProject) {
      return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 });
    }

    // Handle progress update - only for InProgress status
    if (progress !== undefined && progress !== null && (status === 'InProgress' || currentProject.status === 'InProgress')) {
      try {
        await db.progressHistory.create({
          data: {
            projectId: id,
            progress: parseFloat(String(progress)),
            note: progressNote || null,
          },
        });
      } catch (historyError) {
        console.log('Failed to create progress history:', historyError);
      }
    }

    // Determine allowed fields based on new status
    const newStatus = status || currentProject.status;
    const allowFinancialFields = ['Deal', 'InProgress', 'Completed'].includes(newStatus);

    // Filter out fields that shouldn't be updated directly
    const { rabItems, transactions, tenders, progressHistory, monthlyReports, budgetPlans, user: _, userId, createdAt, client, ...safeUpdateData } = updateData as any;

    // Prepare update object
    const updateObject: any = {
      ...safeUpdateData,
      status: newStatus,
    };

    // Only update financial fields if status allows
    if (allowFinancialFields) {
      if (safeUpdateData.contractValue !== undefined) {
        updateObject.contractValue = parseFloat(String(safeUpdateData.contractValue)) || 0;
      }
      if (safeUpdateData.modalKerja !== undefined) {
        updateObject.modalKerja = parseFloat(String(safeUpdateData.modalKerja)) || 0;
      }
      if (safeUpdateData.startDate) {
        updateObject.startDate = new Date(safeUpdateData.startDate);
      }
      if (safeUpdateData.endDate) {
        updateObject.endDate = new Date(safeUpdateData.endDate);
      }
    } else {
      // Reset financial fields if status is Negotiation or Lost
      updateObject.contractValue = 0;
      updateObject.modalKerja = 0;
      updateObject.startDate = null;
      updateObject.endDate = null;
    }

    // Update progress only for InProgress
    if (newStatus === 'InProgress') {
      updateObject.progress = progress !== undefined ? parseFloat(String(progress)) : currentProject.progress;
      updateObject.progressNote = progressNote;
    } else if (newStatus === 'Completed') {
      updateObject.progress = 100;
    } else {
      updateObject.progress = 0;
      updateObject.progressNote = null;
    }

    // Update client if provided
    if (clientId && clientId !== currentProject.clientId) {
      const newClient = await db.client.findUnique({ where: { id: clientId } });
      if (!newClient) {
        return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 400 });
      }
      updateObject.clientId = clientId;
    }

    const project = await db.project.update({
      where: { id },
      data: updateObject,
      include: {
        client: true,
      },
    });

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          // @ts-ignore
          userId: user.id as any,
          module: 'Projects',
          action: 'Update',
          details: `${user.name} mengupdate project: ${project.name} (${project.code}) - Status: ${newStatus}`,
          projectId: project.id,
        },
      });
    } catch (logError) {
      console.log('Failed to log activity:', logError);
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Update project error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE project
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Project ID wajib diisi' }, { status: 400 });
    }

    const project = await db.project.delete({
      where: { id },
      include: { client: true },
    });

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          // @ts-ignore
          userId: user.id as any,
          module: 'Projects',
          action: 'Delete',
          details: `${user.name} menghapus project: ${project.name} (${project.code})`,
        },
      });
    } catch (logError) {
      console.log('Failed to log activity:', logError);
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
