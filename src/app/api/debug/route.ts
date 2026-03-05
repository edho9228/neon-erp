import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash } from 'crypto';

export async function GET() {
  try {
    const users = await db.user.findMany();
    const hashedPassword = createHash('sha256').update('admin123').digest('hex');
    
    return NextResponse.json({
      users: users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, passwordHash: u.password })),
      expectedHash: hashedPassword,
      userCount: users.length
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const hashedPassword = createHash('sha256').update('admin123').digest('hex');
    
    // Create admin user
    const admin = await db.user.create({
      data: {
        email: 'admin@neonerp.com',
        password: hashedPassword,
        name: 'Administrator',
        role: 'admin'
      }
    });
    
    return NextResponse.json({ 
      message: 'Admin created',
      admin: { id: admin.id, email: admin.email, name: admin.name }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
