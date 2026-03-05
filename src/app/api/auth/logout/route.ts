import { NextResponse } from 'next/server';
import { logout, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Get user info before logout for activity log
    const user = await getCurrentUser();
    
    if (user) {
      // Log logout activity
      try {
        await db.activityLog.create({
          data: {
            userId: user.id,
            module: 'Auth',
            action: 'Logout',
            details: `${user.name} melakukan logout dari sistem`,
          },
        });
      } catch (logError) {
        console.log('Could not log logout activity:', logError);
      }
    }
    
    await logout();
    return NextResponse.json({ message: 'Logout berhasil' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
