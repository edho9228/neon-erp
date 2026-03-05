import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET budget plans
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID wajib diisi' }, { status: 400 });
    }

    const budgetPlans = await db.budgetPlan.findMany({
      where: { projectId },
      orderBy: [{ year: 'asc' }, { month: 'asc' }, { category: 'asc' }],
    });

    // Calculate summary by category
    const summary = budgetPlans.reduce((acc, plan) => {
      if (!acc[plan.category]) {
        acc[plan.category] = { planned: 0, actual: 0, variance: 0 };
      }
      acc[plan.category].planned += plan.planned;
      acc[plan.category].actual += plan.actual;
      acc[plan.category].variance += plan.variance;
      return acc;
    }, {} as Record<string, { planned: number; actual: number; variance: number }>);

    return NextResponse.json({ budgetPlans, summary });
  } catch (error) {
    console.error('Get budget plans error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST create/update budget plan
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { projectId, category, description, planned, actual, month, year } = data;

    if (!projectId || !category || !month || !year) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const variance = (parseFloat(planned) || 0) - (parseFloat(actual) || 0);

    // Upsert
    const budgetPlan = await db.budgetPlan.upsert({
      where: {
        projectId_category_month_year: {
          projectId,
          category,
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      update: {
        description,
        planned: parseFloat(planned) || 0,
        actual: parseFloat(actual) || 0,
        variance,
      },
      create: {
        projectId,
        category,
        description,
        planned: parseFloat(planned) || 0,
        actual: parseFloat(actual) || 0,
        variance,
        month: parseInt(month),
        year: parseInt(year),
      },
    });

    return NextResponse.json({ budgetPlan });
  } catch (error) {
    console.error('Create budget plan error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// Recalculate budget plan actual from transactions
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID wajib diisi' }, { status: 400 });
    }

    // Get all transactions for the project
    const transactions = await db.transaction.findMany({
      where: { projectId, type: 'Expense' },
    });

    // Group by category and month
    const grouped = transactions.reduce((acc, t) => {
      const date = new Date(t.date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `${t.category}-${month}-${year}`;

      if (!acc[key]) {
        acc[key] = {
          category: t.category,
          month,
          year,
          total: 0,
        };
      }
      acc[key].total += t.amount;
      return acc;
    }, {} as Record<string, { category: string; month: number; year: number; total: number }>);

    // Update budget plans
    for (const key of Object.keys(grouped)) {
      const data = grouped[key];
      
      const existing = await db.budgetPlan.findFirst({
        where: {
          projectId,
          category: data.category,
          month: data.month,
          year: data.year,
        },
      });

      if (existing) {
        await db.budgetPlan.update({
          where: { id: existing.id },
          data: {
            actual: data.total,
            variance: existing.planned - data.total,
          },
        });
      }
    }

    return NextResponse.json({ message: 'Budget actual recalculated' });
  } catch (error) {
    console.error('Recalculate budget error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
