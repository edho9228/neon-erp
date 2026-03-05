import { NextResponse } from 'next/server';

export async function GET() {
  const guide = {
    title: "NEON ERP Setup Guide",
    timestamp: new Date().toISOString(),
    currentEnv: {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPreview: process.env.DATABASE_URL
        ? `${process.env.DATABASE_URL.substring(0, 20)}...`
        : 'NOT SET'
    },
    steps: [
      {
        step: 1,
        title: "Get Supabase Database Credentials",
        instructions: [
          "1. Go to https://supabase.com/dashboard",
          "2. Select your project: dxyrncyzzifymiyhvmyw",
          "3. Go to Project Settings > Database",
          "4. Find 'Connection string' section",
          "5. Copy the 'Connection pooling' URL (port 6543)",
          "6. Or use 'Direct connection' URL (port 5432)"
        ]
      },
      {
        step: 2,
        title: "Set Environment Variable in Vercel",
        instructions: [
          "1. Go to https://vercel.com/dashboard",
          "2. Select your project: neon-erp",
          "3. Go to Settings > Environment Variables",
          "4. Add or update DATABASE_URL with your connection string",
          "5. Make sure to replace [YOUR-PASSWORD] with actual password",
          "6. Redeploy the project"
        ]
      },
      {
        step: 3,
        title: "Seed the Database",
        instructions: [
          "1. After database connection is working",
          "2. Visit: /api/seed",
          "3. This will create admin user and sample data",
          "4. Login with: admin@neon.com / admin123"
        ]
      }
    ],
    credentials: {
      adminEmail: "admin@neon.com",
      adminPassword: "admin123",
      pinSettings: "123456"
    },
    connectionFormats: {
      pooler: "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres",
      direct: "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
    },
    troubleshooting: [
      {
        error: "Authentication failed",
        solution: "Check password is correct. If password contains special characters, URL-encode them (@ = %40)"
      },
      {
        error: "Prepared statement error",
        solution: "Use pooler connection (port 6543) instead of direct connection"
      },
      {
        error: "Database does not exist",
        solution: "Make sure you're using 'postgres' as database name"
      }
    ]
  };

  return NextResponse.json(guide, { status: 200 });
}
