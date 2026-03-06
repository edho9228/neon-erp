import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    console.log('Dashboard API - User authenticated:', !!user, user ? user.email : 'No user');
    
    // Allow access even without authentication (for visitor mode)

    // Get ALL projects with transactions in ONE query
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
      console.log('Dashboard API - Total projects from DB:', allProjects.length);
    } catch (e) {
      console.error('Error fetching projects:', e);
      allProjects = [];
    }

    // Filter out COMPLETED projects for dashboard charts
    const activeProjects = allProjects.filter(p => p.status !== 'Completed');
    console.log('Dashboard API - Active projects (non-Completed):', activeProjects.length);

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

    // Calculate total stats
    const totalProjectsCount = allProjects.length;
    const activeProjectsCount = allProjects.filter(p => p.status === 'InProgress').length;
    const completedProjectsCount = allProjects.filter(p => p.status === 'Completed').length;

    // Get ALL transactions once (optimized - no loop queries)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    let allTransactions: any[] = [];
    try {
      allTransactions = await db.transaction.findMany({
        where: {
          date: {
            gte: thirtyDaysAgo,
            lte: now,
          },
        },
        include: {
          project: {
            select: { id: true, name: true, status: true }
          }
        }
      });
      console.log('Dashboard API - Transactions fetched:', allTransactions.length);
    } catch (e) {
      console.error('Error fetching transactions:', e);
      allTransactions = [];
    }

    // Process daily data in memory (no additional queries)
    const dailyData: { date: string; income: number; expense: number; profit: number; cumulativeProfit: number }[] = [];
    let totalCumulativeProfit = 0;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateLabel = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Filter transactions in memory
      const dayTransactions = allTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= dayStart && tDate <= dayEnd && t.project?.status !== 'Completed';
      });

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

    // Project status distribution
    const statusCounts = allProjects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Recent transactions (from memory)
    const recentTransactions = allTransactions
      .filter(t => t.project?.status !== 'Completed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

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

    // Project daily data (from memory - no additional queries)
    const projectDailyData: { projectId: string; projectName: string; date: string; cumulativeProfit: number; dailyProfit: number }[] = [];
    
    for (const project of activeProjects) {
      const projectTransactions = allTransactions.filter(t => t.projectId === project.id);
      if (projectTransactions.length === 0) continue;
      
      let cumulativeProfit = 0;
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateLabel = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const dayTransactions = projectTransactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= dayStart && tDate <= dayEnd;
        });

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

    // Activity logs (separate query but limited)
    let activityLogs: any[] = [];
    try {
      activityLogs = await db.activityLog.findMany({
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

    console.log('Dashboard API - Returning projectStats:', projectStats.length, 'projects');

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
