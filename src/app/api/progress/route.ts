import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET progress history
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID wajib diisi' }, { status: 400 });
    }

    const history = await db.progressHistory.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Get progress history error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST update progress
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { projectId, progress, note } = data;

    if (!projectId || progress === undefined) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Create progress history
    const history = await db.progressHistory.create({
      data: {
        projectId,
        progress: parseFloat(progress),
        note,
      },
    });

    // Update project progress
    const project = await db.project.update({
      where: { id: projectId },
      data: {
        progress: parseFloat(progress),
        progressNote: note,
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: (user as any).id as any,
        module: 'Progress',
        action: 'Update',
        details: `Progress updated to ${progress}%`,
        projectId,
      },
    });

    return NextResponse.json({ history, project });
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
