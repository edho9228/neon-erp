import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST - Clear all data
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { confirmDelete } = await request.json();
    
    if (confirmDelete !== 'HAPUS SEMUA DATA') {
      return NextResponse.json({ error: 'Konfirmasi tidak valid' }, { status: 400 });
    }

    // Delete all data in correct order (respecting foreign key constraints)
    const results = {
      transactions: 0,
      rabItems: 0,
      progressHistory: 0,
      budgetPlans: 0,
      monthlyReports: 0,
      tenders: 0,
      projects: 0,
      items: 0,
      clients: 0,
      assetLoans: 0,
      assets: 0,
      company: false,
    };

    // Delete transactions
    const deletedTransactions = await db.transaction.deleteMany();
    results.transactions = deletedTransactions.count;

    // Delete RAB items
    const deletedRAB = await db.rABItem.deleteMany();
    results.rabItems = deletedRAB.count;

    // Delete progress history
    const deletedProgress = await db.progressHistory.deleteMany();
    results.progressHistory = deletedProgress.count;

    // Delete budget plans
    const deletedBudget = await db.budgetPlan.deleteMany();
    results.budgetPlans = deletedBudget.count;

    // Delete monthly reports
    const deletedReports = await db.monthlyReport.deleteMany();
    results.monthlyReports = deletedReports.count;

    // Delete tenders
    const deletedTenders = await db.tender.deleteMany();
    results.tenders = deletedTenders.count;

    // Delete projects
    const deletedProjects = await db.project.deleteMany();
    results.projects = deletedProjects.count;

    // Delete master items
    const deletedItems = await db.masterItem.deleteMany();
    results.items = deletedItems.count;

    // Delete clients
    const deletedClients = await db.client.deleteMany();
    results.clients = deletedClients.count;

    // Delete asset loans
    const deletedLoans = await db.assetLoan.deleteMany();
    results.assetLoans = deletedLoans.count;

    // Delete assets
    const deletedAssets = await db.asset.deleteMany();
    results.assets = deletedAssets.count;

    // Reset company to default
    try {
      await db.company.deleteMany();
      await db.company.create({
        data: {
          name: 'PT. Konstruksi Nusantara',
          address: 'Jakarta, Indonesia',
          phone: '021-12345678',
          email: 'info@konstruksi.co.id',
        }
      });
      results.company = true;
    } catch (e) {
      console.error('Failed to reset company:', e);
    }

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        module: 'Backup & Restore',
        action: 'Hapus Semua Data',
        details: `Semua data dihapus oleh ${user.name} - ${results.projects} projects, ${results.items} items, ${results.clients} clients, ${results.transactions} transactions, ${results.assets} assets`,
      }
    });

    return NextResponse.json({
      message: 'Semua data berhasil dihapus',
      results
    });
  } catch (error: any) {
    console.error('Clear all data error:', error);
    return NextResponse.json({ error: 'Failed to clear data: ' + error.message }, { status: 500 });
  }
}
