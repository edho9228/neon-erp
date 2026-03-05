import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - Download backup (Complete backup of all data)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const [
      projects, items, clients, assets, transactions, company, rabItems,
      budgetPlans, progressHistory, monthlyReports, tenders, assetLoans, users,
    ] = await Promise.all([
      db.project.findMany({ include: { client: true, rabItems: { include: { item: true } }, transactions: true } }),
      db.masterItem.findMany(),
      db.client.findMany(),
      db.asset.findMany({ include: { loans: true } }),
      db.transaction.findMany({ include: { project: true, user: true } }),
      db.company.findFirst(),
      db.rABItem.findMany({ include: { item: true } }),
      db.budgetPlan.findMany(),
      db.progressHistory.findMany(),
      db.monthlyReport.findMany(),
      db.tender.findMany(),
      db.assetLoan.findMany(),
      db.user.findMany({ select: { id: true, email: true, name: true, role: true, avatar: true, isActive: true, lastLogin: true, createdAt: true, updatedAt: true } }),
    ]);

    const backupData = {
      backupDate: new Date().toISOString(),
      version: '2.2',
      createdBy: user.name,
      data: { company, users, clients, items, projects, rabItems, tenders, transactions, budgetPlans, monthlyReports, assets, assetLoans, progressHistory },
      summary: {
        company: company ? 1 : 0, users: users.length, clients: clients.length, items: items.length,
        projects: projects.length, rabItems: rabItems.length, tenders: tenders.length, transactions: transactions.length,
        budgetPlans: budgetPlans.length, monthlyReports: monthlyReports.length, assets: assets.length,
        assetLoans: assetLoans.length, progressHistory: progressHistory.length,
      }
    };

    await db.activityLog.create({ data: { userId: user.id, module: 'Backup & Restore', action: 'Backup Data', details: `Backup oleh ${user.name}` } });
    return NextResponse.json(backupData);
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Failed to create backup: ' + error.message }, { status: 500 });
  }
}

// POST - Restore with clear-all-first approach for speed
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    let backupData;
    try {
      backupData = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
    }

    if (!backupData.data) {
      return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 });
    }

    // Check for chunked restore mode
    const url = new URL(request.url);
    const phase = url.searchParams.get('phase') || 'all';
    
    const data = backupData.data;
    const results: any = { phase, company: false, clients: 0, items: 0, projects: 0, rabItems: 0, tenders: 0, transactions: 0, budgetPlans: 0, monthlyReports: 0, assets: 0, assetLoans: 0, progressHistory: 0 };

    // PHASE 1: Clear all data (fast)
    if (phase === 'clear' || phase === 'all') {
      console.log('Phase: Clearing all data...');
      await Promise.all([
        db.rABItem.deleteMany(),
        db.transaction.deleteMany(),
        db.tender.deleteMany(),
        db.budgetPlan.deleteMany(),
        db.monthlyReport.deleteMany(),
        db.progressHistory.deleteMany(),
        db.assetLoan.deleteMany(),
        db.asset.deleteMany(),
        db.project.deleteMany(),
        db.masterItem.deleteMany(),
        db.client.deleteMany(),
      ]);
      console.log('Clear completed');
      if (phase === 'clear') return NextResponse.json({ message: 'Clear completed', results });
    }

    // PHASE 2: Restore core data (company, items, clients)
    if (phase === 'core' || phase === 'all') {
      console.log('Phase: Restoring core data...');
      
      // Company
      if (data.company) {
        await db.company.deleteMany().catch(() => {});
        await db.company.create({ data: { name: data.company.name || 'PT. Konstruksi', address: data.company.address || '', phone: data.company.phone || '', email: data.company.email, logo: data.company.logo, bankName: data.company.bankName, bankAccount: data.company.bankAccount } });
        results.company = true;
      }
      
      // Items
      if (data.items?.length > 0) {
        await db.masterItem.createMany({ data: data.items.map((i: any) => ({ id: i.id, code: i.code, name: i.name, category: i.category, unit: i.unit, price: i.price, description: i.description, isActive: i.isActive ?? true })), skipDuplicates: true });
        results.items = data.items.length;
      }
      
      // Clients
      if (data.clients?.length > 0) {
        await db.client.createMany({ data: data.clients.map((c: any) => ({ id: c.id, code: c.code, name: c.name, contactPerson: c.contactPerson, phone: c.phone, email: c.email, address: c.address, notes: c.notes, isActive: c.isActive ?? true })), skipDuplicates: true });
        results.clients = data.clients.length;
      }
      
      console.log('Core data restored:', results);
      if (phase === 'core') return NextResponse.json({ message: 'Core data restored', results });
    }

    // PHASE 3: Restore projects and RAB
    if (phase === 'projects' || phase === 'all') {
      console.log('Phase: Restoring projects...');
      
      if (data.projects?.length > 0) {
        await db.project.createMany({ data: data.projects.map((p: any) => ({ id: p.id, code: p.code, name: p.name, clientId: p.clientId, status: p.status || 'Negotiation', contractValue: p.contractValue || 0, modalKerja: p.modalKerja || 0, progress: p.progress || 0, progressNote: p.progressNote, startDate: p.startDate ? new Date(p.startDate) : null, endDate: p.endDate ? new Date(p.endDate) : null, responsible: p.responsible, userId: p.userId })), skipDuplicates: true });
        results.projects = data.projects.length;
      }
      
      if (data.rabItems?.length > 0) {
        await db.rABItem.createMany({ data: data.rabItems.map((r: any) => ({ id: r.id, projectId: r.projectId, itemId: r.itemId, description: r.description, quantity: r.quantity, unitPrice: r.unitPrice, totalPrice: r.totalPrice, category: r.category })), skipDuplicates: true });
        results.rabItems = data.rabItems.length;
      }
      
      console.log('Projects restored:', results.projects, results.rabItems);
      if (phase === 'projects') return NextResponse.json({ message: 'Projects restored', results });
    }

    // PHASE 4: Restore transactions
    if (phase === 'transactions' || phase === 'all') {
      console.log('Phase: Restoring transactions...');
      
      if (data.transactions?.length > 0) {
        await db.transaction.createMany({ data: data.transactions.map((t: any) => ({ id: t.id, projectId: t.projectId, userId: t.userId, source: t.source || 'Project', type: t.type, category: t.category, description: t.description, amount: t.amount, date: new Date(t.date), receipt: t.receipt, notes: t.notes })), skipDuplicates: true });
        results.transactions = data.transactions.length;
      }
      
      console.log('Transactions restored:', results.transactions);
      if (phase === 'transactions') return NextResponse.json({ message: 'Transactions restored', results });
    }

    // PHASE 5: Restore assets
    if (phase === 'assets' || phase === 'all') {
      console.log('Phase: Restoring assets...');
      
      if (data.assets?.length > 0) {
        await db.asset.createMany({ data: data.assets.map((a: any) => ({ id: a.id, code: a.code, name: a.name, category: a.category, brand: a.brand, model: a.model, serialNumber: a.serialNumber, purchaseDate: a.purchaseDate ? new Date(a.purchaseDate) : null, purchasePrice: a.purchasePrice || 0, currentValue: a.currentValue || a.purchasePrice || 0, condition: a.condition || 'Baik', location: a.location, assignedTo: a.assignedTo, notes: a.notes, photo: a.photo, loanStatus: a.loanStatus || 'Tersedia', borrowerName: a.borrowerName, loanDate: a.loanDate ? new Date(a.loanDate) : null, expectedReturnDate: a.expectedReturnDate ? new Date(a.expectedReturnDate) : null, actualReturnDate: a.actualReturnDate ? new Date(a.actualReturnDate) : null, isActive: a.isActive ?? true })), skipDuplicates: true });
        results.assets = data.assets.length;
      }
      
      if (data.assetLoans?.length > 0) {
        await db.assetLoan.createMany({ data: data.assetLoans.map((l: any) => ({ id: l.id, assetId: l.assetId, borrowerName: l.borrowerName, borrowerPhone: l.borrowerPhone, borrowerAddress: l.borrowerAddress, loanDate: new Date(l.loanDate), expectedReturnDate: new Date(l.expectedReturnDate), actualReturnDate: l.actualReturnDate ? new Date(l.actualReturnDate) : null, status: l.status, notes: l.notes, returnNotes: l.returnNotes, returnedCondition: l.returnedCondition })), skipDuplicates: true });
        results.assetLoans = data.assetLoans.length;
      }
      
      console.log('Assets restored:', results.assets);
      if (phase === 'assets') return NextResponse.json({ message: 'Assets restored', results });
    }

    // PHASE 6: Restore other data
    if (phase === 'other' || phase === 'all') {
      console.log('Phase: Restoring other data...');
      
      if (data.tenders?.length > 0) {
        await db.tender.createMany({ data: data.tenders.map((t: any) => ({ id: t.id, projectId: t.projectId, name: t.name, value: t.value, status: t.status, submitDate: new Date(t.submitDate), resultDate: t.resultDate ? new Date(t.resultDate) : null, notes: t.notes })), skipDuplicates: true });
        results.tenders = data.tenders.length;
      }
      
      if (data.budgetPlans?.length > 0) {
        await db.budgetPlan.createMany({ data: data.budgetPlans.map((b: any) => ({ id: b.id, projectId: b.projectId, category: b.category, description: b.description, planned: b.planned, actual: b.actual, variance: b.variance, month: b.month, year: b.year })), skipDuplicates: true });
        results.budgetPlans = data.budgetPlans.length;
      }
      
      if (data.monthlyReports?.length > 0) {
        await db.monthlyReport.createMany({ data: data.monthlyReports.map((m: any) => ({ id: m.id, projectId: m.projectId, year: m.year, month: m.month, budget: m.budget, actual: m.actual, income: m.income, profit: m.profit })), skipDuplicates: true });
        results.monthlyReports = data.monthlyReports.length;
      }
      
      if (data.progressHistory?.length > 0) {
        await db.progressHistory.createMany({ data: data.progressHistory.map((p: any) => ({ id: p.id, projectId: p.projectId, progress: p.progress, note: p.note, date: new Date(p.date) })), skipDuplicates: true });
        results.progressHistory = data.progressHistory.length;
      }
      
      console.log('Other data restored');
    }

    await db.activityLog.create({ data: { userId: user.id, module: 'Backup & Restore', action: 'Restore Data', details: `Restore oleh ${user.name}` } });
    console.log('Restore completed:', results);

    return NextResponse.json({ message: 'Restore completed successfully', results });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json({ error: 'Failed to restore: ' + error.message }, { status: 500 });
  }
}
