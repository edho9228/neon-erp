import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET all chat messages
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all broadcast messages and direct messages to/from the user
    const messages = await db.chatMessage.findMany({
      where: {
        OR: [
          { recipientId: null }, // Broadcast messages
          { recipientId: user.id }, // Messages sent to current user
          { userId: user.id }, // Messages sent by current user
        ],
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
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Reverse to show oldest first
    const sortedMessages = [...messages].reverse();

    return NextResponse.json({ messages: sortedMessages });
  } catch (error) {
    console.error('Get chat messages error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST send a new chat message
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { message, recipientId } = data;

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
    }

    const chatMessage = await db.chatMessage.create({
      data: {
        userId: user.id,
        message: message.trim(),
        recipientId: recipientId || null, // null for broadcast
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

    return NextResponse.json({ message: chatMessage });
  } catch (error) {
    console.error('Send chat message error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { messageIds } = data;

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: 'Message IDs required' }, { status: 400 });
    }

    await db.chatMessage.updateMany({
      where: {
        id: { in: messageIds },
        recipientId: user.id, // Only mark messages sent to this user
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark messages read error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
