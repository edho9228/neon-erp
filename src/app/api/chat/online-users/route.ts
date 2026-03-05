import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET online users (users with recent activity or sessions)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get users with active sessions (not expired)
    const now = new Date();
    const activeSessions = await db.session.findMany({
      where: {
        expiresAt: {
          gt: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Unique users with active sessions
    const onlineUsers = activeSessions
      .map((session) => session.user)
      .filter((user, index, self) => self.findIndex((u) => u.id === user.id) === index);

    // Add current user if not in list
    if (!onlineUsers.find((u) => u.id === user.id)) {
      onlineUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }

    return NextResponse.json({ users: onlineUsers });
  } catch (error) {
    console.error('Get online users error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
