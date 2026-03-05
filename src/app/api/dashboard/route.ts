import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ALL projects for counts
    let allProjects: any[] = [];
    try {
      allProjects = await db.project.findMany({
        include: {
          client: true,
          transactions: true,
          rabItems: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.error('Error fetching projects:', e);
      allProjects = [];
    }

    // Filter out COMPLETED projects for dashboard charts - only show active projects
    const activeProjects = allProjects.filter(p => p.status !== 'Completed');

    // Calculate stats from ACTIVE projects only
    let totalBudget = 0;
    let totalExpense = 0;
    let totalIncome = 0;
    let totalContractValue = 0;

    const projectStats = activeProjects.map(p => {
      const budget = p.rabItems?.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0;
      const expense = p.transactions?.filter((t: any) => t.type === 'Expense').reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
      const income = p.transactions?.filter((t: any) => t.type === 'Income').reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
      const profit = income - expense;

      totalBudget += budget;
      totalExpense += expense;
      totalIncome += income;
      totalContractValue += p.contractValue || 0;

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        clientName: p.client?.name || '-',
        status: p.status,
        progress: p.progress || 0,
        contractValue: p.contractValue || 0,
        modalKerja: p.modalKerja || 0,
        startDate: p.startDate,
        endDate: p.endDate,
        responsible: p.responsible,
        budget,
        expense,
        income,
        profit,
        profitMargin: budget > 0 ? ((profit / budget) * 100) : 0,
      };
    });

    // Calculate total stats including completed for display
    const totalProjectsCount = allProjects.length;
    const activeProjectsCount = allProjects.filter(p => p.status === 'InProgress').length;
    const completedProjectsCount = allProjects.filter(p => p.status === 'Completed').length;

    // Daily data - Last 30 days (from ALL transactions)
    const dailyData: { date: string; income: number; expense: number; profit: number; cumulativeProfit: number }[] = [];
    const now = new Date();
    let totalCumulativeProfit = 0;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dateLabel = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      let dayTransactions: any[] = [];
      try {
        // Only get transactions from ACTIVE (non-completed) projects
        dayTransactions = await db.transaction.findMany({
          where: {
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
            project: {
              status: { not: 'Completed' }
            }
          },
        });
      } catch (e) {
        dayTransactions = [];
      }

      const income = dayTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
      const dayProfit = income - expense;
      totalCumulativeProfit += dayProfit;

      dailyData.push({
        date: dateLabel,
        income,
        expense,
        profit: dayProfit,
        cumulativeProfit: totalCumulativeProfit,
      });
    }

    // Project status distribution (for all projects)
    const statusCounts = allProjects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Recent transactions (from active projects only)
    let recentTransactions: any[] = [];
    try {
      recentTransactions = await db.transaction.findMany({
        where: {
          project: {
            status: { not: 'Completed' }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { project: true },
      });
    } catch (e) {
      recentTransactions = [];
    }

    // Activity logs (from active projects only)
    let activityLogs: any[] = [];
    try {
      activityLogs = await db.activityLog.findMany({
        where: {
          project: {
            status: { not: 'Completed' }
          }
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { 
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
    } catch (e) {
      activityLogs = [];
    }

    // Treemap data (active projects only)
    const treemapData = projectStats
      .filter(p => p.expense > 0 || p.income > 0)
      .map(p => ({
        id: p.id,
        name: p.name,
        profit: p.profit,
        isProfit: p.profit >= 0,
        value: Math.abs(p.profit),
        expense: p.expense,
        income: p.income,
      }));

    // Project daily data - cumulative profit per project (active only)
    const projectDailyData: { projectId: string; projectName: string; date: string; cumulativeProfit: number; dailyProfit: number }[] = [];
    
    const projectsWithTransactions = activeProjects.filter(p => 
      p.transactions && p.transactions.length > 0
    );
    
    for (const project of projectsWithTransactions) {
      let cumulativeProfit = 0;
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateLabel = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        let dayTransactions: any[] = [];
        try {
          dayTransactions = await db.transaction.findMany({
            where: {
              projectId: project.id,
              date: {
                gte: dayStart,
                lte: dayEnd,
              },
            },
          });
        } catch (e) {
          dayTransactions = [];
        }

        const income = dayTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
        const dailyProfit = income - expense;
        cumulativeProfit += dailyProfit;

        projectDailyData.push({
          projectId: project.id,
          projectName: project.name,
          date: dateLabel,
          cumulativeProfit,
          dailyProfit,
        });
      }
    }

    return NextResponse.json({
      stats: {
        totalProjects: totalProjectsCount,
        activeProjects: activeProjectsCount,
        completedProjects: completedProjectsCount,
        totalContractValue,
        totalBudget,
        totalExpense,
        totalIncome,
        netProfit: totalIncome - totalExpense,
        profitMargin: totalBudget > 0 ? (((totalIncome - totalExpense) / totalBudget) * 100) : 0,
      },
      projects: projectStats,
      allProjects: allProjects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
      })),
      dailyData,
      statusDistribution,
      recentTransactions,
      activityLogs,
      treemapData,
      projectDailyData,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ 
      error: 'Terjadi kesalahan server',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
