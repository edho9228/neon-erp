import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET budget plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const projectId = searchParams.get('projectId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    
    if (id) {
      const budgetPlan = await db.budgetPlan.findUnique({
        where: { id },
        include: { project: true },
      });
      
      if (!budgetPlan) {
        return NextResponse.json(
          { success: false, error: 'Budget plan not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true, data: budgetPlan });
    }
    
    // Build where clause
    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (year) where.year = parseInt(year);
    if (month) where.month = parseInt(month);
    
    const budgetPlans = await db.budgetPlan.findMany({
      where,
      include: {
        project: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { category: 'asc' },
      ],
    });
    
    // Calculate summary
    const summary = budgetPlans.reduce((acc, plan) => {
      acc.totalPlanned += plan.planned;
      acc.totalActual += plan.actual;
      acc.totalVariance += plan.variance;
      return acc;
    }, { totalPlanned: 0, totalActual: 0, totalVariance: 0 });
    
    // Group by category
    const byCategory = budgetPlans.reduce((acc, plan) => {
      const cat = plan.category;
      if (!acc[cat]) {
        acc[cat] = { planned: 0, actual: 0, variance: 0 };
      }
      acc[cat].planned += plan.planned;
      acc[cat].actual += plan.actual;
      acc[cat].variance += plan.variance;
      return acc;
    }, {} as Record<string, { planned: number; actual: number; variance: number }>);
    
    return NextResponse.json({
      success: true,
      data: budgetPlans,
      summary,
      byCategory,
    });
  } catch (error) {
    console.error('Get budget plans error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budget plans' },
      { status: 500 }
    );
  }
}

// POST create/update budget plan
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const variance = data.planned - data.actual;
    
    // Check if exists (unique constraint on projectId, category, month, year)
    const existing = await db.budgetPlan.findFirst({
      where: {
        projectId: data.projectId,
        category: data.category,
        month: data.month,
        year: data.year,
      },
    });
    
    let budgetPlan;
    
    if (existing) {
      // Update existing
      budgetPlan = await db.budgetPlan.update({
        where: { id: existing.id },
        data: {
          description: data.description,
          planned: data.planned,
          actual: data.actual,
          variance,
        },
      });
    } else {
      // Create new
      budgetPlan = await db.budgetPlan.create({
        data: {
          projectId: data.projectId,
          category: data.category,
          description: data.description,
          planned: data.planned,
          actual: data.actual,
          variance,
          month: data.month,
          year: data.year,
        },
      });
    }
    
    // Log activity
    await db.activityLog.create({
      data: {
        module: 'BudgetPlan',
        action: existing ? 'Update' : 'Create',
        details: `${existing ? 'Updated' : 'Created'} budget plan: ${data.category}`,
        projectId: data.projectId,
      },
    });
    
    return NextResponse.json({ success: true, data: budgetPlan });
  } catch (error) {
    console.error('Create budget plan error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create budget plan' },
      { status: 500 }
    );
  }
}

// PUT update budget plan
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Budget plan ID is required' },
        { status: 400 }
      );
    }
    
    // Recalculate variance
    if (updateData.planned !== undefined || updateData.actual !== undefined) {
      const existing = await db.budgetPlan.findUnique({ where: { id } });
      if (existing) {
        const planned = updateData.planned ?? existing.planned;
        const actual = updateData.actual ?? existing.actual;
        updateData.variance = planned - actual;
      }
    }
    
    const budgetPlan = await db.budgetPlan.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json({ success: true, data: budgetPlan });
  } catch (error) {
    console.error('Update budget plan error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update budget plan' },
      { status: 500 }
    );
  }
}

// DELETE budget plan
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Budget plan ID is required' },
        { status: 400 }
      );
    }
    
    await db.budgetPlan.delete({ where: { id } });
    
    return NextResponse.json({
      success: true,
      message: 'Budget plan deleted successfully',
    });
  } catch (error) {
    console.error('Delete budget plan error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete budget plan' },
      { status: 500 }
    );
  }
}
