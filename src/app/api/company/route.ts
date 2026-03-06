import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET company data - Allow public access for visitor mode
export async function GET() {
  try {
    // Allow access without authentication for visitor mode
    const company = await db.company.findFirst();

    if (!company) {
      return NextResponse.json({ company: null });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Get company error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT update company data
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, address, phone, email, bankName, bankAccount, logo } = data;

    let company = await db.company.findFirst();

    if (company) {
      company = await db.company.update({
        where: { id: company.id },
        data: {
          name,
          address,
          phone,
          email,
          bankName,
          bankAccount,
          logo,
        },
      });
    } else {
      company = await db.company.create({
        data: {
          name: name || 'Perusahaan',
          address: address || '',
          phone: phone || '',
          email,
          bankName,
          bankAccount,
          logo,
        },
      });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
