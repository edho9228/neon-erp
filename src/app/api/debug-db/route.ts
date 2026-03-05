import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: []
  };

  // Check 1: Environment variable
  const dbUrl = process.env.DATABASE_URL;
  results.checks.push({
    name: 'DATABASE_URL exists',
    status: !!dbUrl,
    value: dbUrl ? `${dbUrl.substring(0, 30)}...` : 'NOT SET'
  });

  // Check 2: Try to connect and query
  try {
    const userCount = await db.user.count();
    results.checks.push({
      name: 'Database connection',
      status: true,
      message: `Connected. Found ${userCount} users.`
    });

    // Check if admin exists
    const admin = await db.user.findUnique({
      where: { email: 'admin@neon.com' }
    });
    results.checks.push({
      name: 'Admin user exists',
      status: !!admin,
      value: admin ? { email: admin.email, name: admin.name, role: admin.role } : 'NOT FOUND'
    });

    // Check company
    const company = await db.company.findFirst();
    results.checks.push({
      name: 'Company exists',
      status: !!company,
      value: company ? company.name : 'NOT FOUND'
    });

    // Check clients
    const clientCount = await db.client.count();
    results.checks.push({
      name: 'Clients count',
      status: true,
      value: clientCount
    });

    // Check projects
    const projectCount = await db.project.count();
    results.checks.push({
      name: 'Projects count',
      status: true,
      value: projectCount
    });

  } catch (error: any) {
    results.checks.push({
      name: 'Database connection',
      status: false,
      error: error.message,
      code: error.code
    });
  }

  return NextResponse.json(results, { status: 200 });
}
