import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash } from 'crypto';

// Hash function - same as auth.ts
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function GET() {
  try {
    // Check database connection
    const dbUrl = process.env.DATABASE_URL;
    const dbUrlMasked = dbUrl ? `${dbUrl.substring(0, 30)}...` : 'NOT SET';

    // Check if admin user exists with email admin@neon.com
    const adminUser = await db.user.findUnique({
      where: { email: 'admin@neon.com' }
    });

    // Expected hash for admin123
    const expectedHash = hashPassword('admin123');

    // Check all users
    const allUsers = await db.user.findMany({
      select: { email: true, name: true, role: true }
    });

    return NextResponse.json({
      database: {
        url: dbUrlMasked,
        connected: true
      },
      adminUser: adminUser ? {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        storedHash: adminUser.password.substring(0, 30) + '...',
        expectedHash: expectedHash.substring(0, 30) + '...',
        hashMatch: adminUser.password === expectedHash
      } : 'NOT FOUND',
      allUsers,
      totalUsers: allUsers.length,
      loginCredentials: {
        email: 'admin@neon.com',
        password: 'admin123'
      },
      solution: adminUser ? 
        (adminUser.password === expectedHash ? '✅ Login SHOULD WORK! Use admin@neon.com / admin123' : '❌ Password mismatch - run /api/seed') :
        '❌ No admin user - run /api/seed'
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      solution: 'Check DATABASE_URL environment variable'
    }, { status: 500 });
  }
}
