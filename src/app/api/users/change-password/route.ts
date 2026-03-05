import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

// POST - Change password (requires old password verification)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
    }

    const body = await request.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    // Validate input
    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ 
        error: 'Semua field harus diisi' 
      }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ 
        error: 'Password baru dan konfirmasi tidak cocok' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'Password baru minimal 6 karakter' 
      }, { status: 400 });
    }

    // Get current user with password
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, password: true, name: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Verify old password
    const hashedOldPassword = hashPassword(oldPassword);
    if (currentUser.password !== hashedOldPassword) {
      return NextResponse.json({ 
        error: 'Password lama tidak benar' 
      }, { status: 400 });
    }

    // Check if new password is same as old password
    const hashedNewPassword = hashPassword(newPassword);
    if (currentUser.password === hashedNewPassword) {
      return NextResponse.json({ 
        error: 'Password baru tidak boleh sama dengan password lama' 
      }, { status: 400 });
    }

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        module: 'User Management',
        action: 'Change Password',
        details: `${user.name} mengubah password akun`,
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Password berhasil diubah' 
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ 
      error: 'Gagal mengubah password: ' + error.message 
    }, { status: 500 });
  }
}
