import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    // Build where clause for filtering
    const projectWhere = projectId && projectId !== 'all' ? { id: projectId } : {};

    // Get projects with error handling
    let projects: any[] = [];
    try {
      projects = await db.project.findMany({
        where: projectWhere,
        include: {
          client: true,
          transactions: true,
          rabItems: true,
          progressHistory: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.error('Error fetching projects:', e);
      // Return empty projects if error
      projects = [];
    }

    // Calculate stats
    let totalBudget = 0;
    let totalExpense = 0;
    let totalIncome = 0;
    let totalContractValue = 0;

    const projectStats = projects.map(p => {
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

    // Monthly data
    const monthlyData: { month: string; income: number; expense: number; profit: number }[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      let monthTransactions: any[] = [];
      try {
        monthTransactions = await db.transaction.findMany({
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
            ...(projectId && projectId !== 'all' ? { projectId } : {}),
          },
        });
      } catch (e) {
        monthTransactions = [];
      }

      const income = monthTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({
        month: monthName,
        income,
        expense,
        profit: income - expense,
      });
    }

    // Project status distribution
    const statusCounts = projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Recent transactions
    let recentTransactions: any[] = [];
    try {
      recentTransactions = await db.transaction.findMany({
        where: projectId && projectId !== 'all' ? { projectId } : {},
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { project: true },
      });
    } catch (e) {
      recentTransactions = [];
    }

    // Activity logs
    let activityLogs: any[] = [];
    try {
      activityLogs = await db.activityLog.findMany({
        where: projectId && projectId !== 'all' ? { projectId } : {},
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

    // Treemap data
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

    // Project monthly data
    const projectMonthlyData: { projectId: string; projectName: string; month: string; cumulativeProfit: number; monthlyProfit: number }[] = [];
    
    // Include all projects that have transactions (not just InProgress/Deal)
    const projectsWithTransactions = projects.filter(p => 
      p.transactions && p.transactions.length > 0
    );
    
    for (const project of projectsWithTransactions) {
      let cumulativeProfit = 0;
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        let monthTransactions: any[] = [];
        try {
          monthTransactions = await db.transaction.findMany({
            where: {
              projectId: project.id,
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          });
        } catch (e) {
          monthTransactions = [];
        }

        const income = monthTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
        const monthlyProfit = income - expense;
        cumulativeProfit += monthlyProfit;

        projectMonthlyData.push({
          projectId: project.id,
          projectName: project.name,
          month: monthName,
          cumulativeProfit,
          monthlyProfit,
        });
      }
    }

    return NextResponse.json({
      stats: {
        totalProjects: projects.length,
        totalContractValue,
        totalBudget,
        totalExpense,
        totalIncome,
        netProfit: totalIncome - totalExpense,
        profitMargin: totalBudget > 0 ? (((totalIncome - totalExpense) / totalBudget) * 100) : 0,
      },
      projects: projectStats,
      monthlyData,
      statusDistribution,
      recentTransactions,
      activityLogs,
      treemapData,
      projectMonthlyData,
      selectedProject: projectId,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ 
      error: 'Terjadi kesalahan server',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
