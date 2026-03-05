import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // @ts-ignore - Prisma type issue
    return NextResponse.json({
      user: {
        // @ts-ignore
        id: user.id,
        // @ts-ignore
        email: user.email,
        // @ts-ignore
        name: user.name,
        // @ts-ignore
        role: user.role,
        // @ts-ignore
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
