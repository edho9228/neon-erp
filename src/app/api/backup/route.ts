import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// GET - Download backup (Complete backup of all data)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    // Fetch ALL data from database
    const [
      projects,
      items,
      clients,
      assets,
      transactions,
      company,
      rabItems,
      budgetPlans,
      progressHistory,
      monthlyReports,
      tenders,
      assetLoans,
      users,
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
      db.user.findMany({
        select: { id: true, email: true, name: true, role: true, avatar: true, isActive: true, lastLogin: true, createdAt: true, updatedAt: true }
      }),
    ]);

    const backupData = {
      backupDate: new Date().toISOString(),
      version: '2.1',
      createdBy: user.name,
      data: { company, users, clients, items, projects, rabItems, tenders, transactions, budgetPlans, monthlyReports, assets, assetLoans, progressHistory },
      summary: {
        company: company ? 1 : 0,
        users: users.length,
        clients: clients.length,
        items: items.length,
        projects: projects.length,
        rabItems: rabItems.length,
        tenders: tenders.length,
        transactions: transactions.length,
        budgetPlans: budgetPlans.length,
        monthlyReports: monthlyReports.length,
        assets: assets.length,
        assetLoans: assetLoans.length,
        progressHistory: progressHistory.length,
      }
    };

    await db.activityLog.create({
      data: { userId: user.id, module: 'Backup & Restore', action: 'Backup Data', details: `Backup oleh ${user.name}` }
    });

    return NextResponse.json(backupData);
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Failed to create backup: ' + error.message }, { status: 500 });
  }
}

// POST - Restore backup with FAST batch operations
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

    console.log('Restore started by:', user.name, 'Summary:', backupData.summary);

    const data = backupData.data;
    const results = { company: false, clients: 0, items: 0, projects: 0, rabItems: 0, tenders: 0, transactions: 0, budgetPlans: 0, monthlyReports: 0, assets: 0, assetLoans: 0, progressHistory: 0 };

    // Use transaction for faster batch operations
    await db.$transaction(async (tx) => {
      // 1. Restore Company
      if (data.company) {
        await tx.company.deleteMany();
        await tx.company.create({
          data: {
            name: data.company.name || 'PT. Konstruksi Nusantara',
            address: data.company.address || '',
            phone: data.company.phone || '',
            email: data.company.email,
            logo: data.company.logo,
            bankName: data.company.bankName,
            bankAccount: data.company.bankAccount,
          }
        });
        results.company = true;
      }

      // 2. Restore Master Items (batch)
      if (data.items?.length > 0) {
        // Delete existing and insert new
        await tx.masterItem.deleteMany();
        await tx.masterItem.createMany({
          data: data.items.map((item: any) => ({
            id: item.id,
            code: item.code,
            name: item.name,
            category: item.category,
            unit: item.unit,
            price: item.price,
            description: item.description,
            isActive: item.isActive ?? true,
          })),
          skipDuplicates: true,
        });
        results.items = data.items.length;
      }

      // 3. Restore Clients (batch)
      if (data.clients?.length > 0) {
        await tx.client.deleteMany();
        await tx.client.createMany({
          data: data.clients.map((client: any) => ({
            id: client.id,
            code: client.code,
            name: client.name,
            contactPerson: client.contactPerson,
            phone: client.phone,
            email: client.email,
            address: client.address,
            notes: client.notes,
            isActive: client.isActive ?? true,
          })),
          skipDuplicates: true,
        });
        results.clients = data.clients.length;
      }

      // 4. Restore Projects (batch)
      if (data.projects?.length > 0) {
        await tx.project.deleteMany();
        await tx.project.createMany({
          data: data.projects.map((project: any) => ({
            id: project.id,
            code: project.code,
            name: project.name,
            clientId: project.clientId,
            status: project.status || 'Negotiation',
            contractValue: project.contractValue || 0,
            modalKerja: project.modalKerja || 0,
            progress: project.progress || 0,
            progressNote: project.progressNote,
            startDate: project.startDate ? new Date(project.startDate) : null,
            endDate: project.endDate ? new Date(project.endDate) : null,
            responsible: project.responsible,
            userId: project.userId,
          })),
          skipDuplicates: true,
        });
        results.projects = data.projects.length;
      }

      // 5. Restore RAB Items (batch)
      if (data.rabItems?.length > 0) {
        await tx.rABItem.deleteMany();
        await tx.rABItem.createMany({
          data: data.rabItems.map((rab: any) => ({
            id: rab.id,
            projectId: rab.projectId,
            itemId: rab.itemId,
            description: rab.description,
            quantity: rab.quantity,
            unitPrice: rab.unitPrice,
            totalPrice: rab.totalPrice,
            category: rab.category,
          })),
          skipDuplicates: true,
        });
        results.rabItems = data.rabItems.length;
      }

      // 6. Restore Transactions (batch)
      if (data.transactions?.length > 0) {
        await tx.transaction.deleteMany();
        await tx.transaction.createMany({
          data: data.transactions.map((txn: any) => ({
            id: txn.id,
            projectId: txn.projectId,
            userId: txn.userId,
            source: txn.source || 'Project',
            type: txn.type,
            category: txn.category,
            description: txn.description,
            amount: txn.amount,
            date: new Date(txn.date),
            receipt: txn.receipt,
            notes: txn.notes,
          })),
          skipDuplicates: true,
        });
        results.transactions = data.transactions.length;
      }

      // 7. Restore Tenders (batch)
      if (data.tenders?.length > 0) {
        await tx.tender.deleteMany();
        await tx.tender.createMany({
          data: data.tenders.map((tender: any) => ({
            id: tender.id,
            projectId: tender.projectId,
            name: tender.name,
            value: tender.value,
            status: tender.status,
            submitDate: new Date(tender.submitDate),
            resultDate: tender.resultDate ? new Date(tender.resultDate) : null,
            notes: tender.notes,
          })),
          skipDuplicates: true,
        });
        results.tenders = data.tenders.length;
      }

      // 8. Restore Budget Plans (batch)
      if (data.budgetPlans?.length > 0) {
        await tx.budgetPlan.deleteMany();
        await tx.budgetPlan.createMany({
          data: data.budgetPlans.map((budget: any) => ({
            id: budget.id,
            projectId: budget.projectId,
            category: budget.category,
            description: budget.description,
            planned: budget.planned,
            actual: budget.actual,
            variance: budget.variance,
            month: budget.month,
            year: budget.year,
          })),
          skipDuplicates: true,
        });
        results.budgetPlans = data.budgetPlans.length;
      }

      // 9. Restore Monthly Reports (batch)
      if (data.monthlyReports?.length > 0) {
        await tx.monthlyReport.deleteMany();
        await tx.monthlyReport.createMany({
          data: data.monthlyReports.map((report: any) => ({
            id: report.id,
            projectId: report.projectId,
            year: report.year,
            month: report.month,
            budget: report.budget,
            actual: report.actual,
            income: report.income,
            profit: report.profit,
          })),
          skipDuplicates: true,
        });
        results.monthlyReports = data.monthlyReports.length;
      }

      // 10. Restore Progress History (batch)
      if (data.progressHistory?.length > 0) {
        await tx.progressHistory.deleteMany();
        await tx.progressHistory.createMany({
          data: data.progressHistory.map((progress: any) => ({
            id: progress.id,
            projectId: progress.projectId,
            progress: progress.progress,
            note: progress.note,
            date: new Date(progress.date),
          })),
          skipDuplicates: true,
        });
        results.progressHistory = data.progressHistory.length;
      }

      // 11. Restore Assets (batch)
      if (data.assets?.length > 0) {
        await tx.asset.deleteMany();
        await tx.asset.createMany({
          data: data.assets.map((asset: any) => ({
            id: asset.id,
            code: asset.code,
            name: asset.name,
            category: asset.category,
            brand: asset.brand,
            model: asset.model,
            serialNumber: asset.serialNumber,
            purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : null,
            purchasePrice: asset.purchasePrice || 0,
            currentValue: asset.currentValue || asset.purchasePrice || 0,
            condition: asset.condition || 'Baik',
            location: asset.location,
            assignedTo: asset.assignedTo,
            notes: asset.notes,
            photo: asset.photo,
            loanStatus: asset.loanStatus || 'Tersedia',
            borrowerName: asset.borrowerName,
            loanDate: asset.loanDate ? new Date(asset.loanDate) : null,
            expectedReturnDate: asset.expectedReturnDate ? new Date(asset.expectedReturnDate) : null,
            actualReturnDate: asset.actualReturnDate ? new Date(asset.actualReturnDate) : null,
            isActive: asset.isActive ?? true,
          })),
          skipDuplicates: true,
        });
        results.assets = data.assets.length;
      }

      // 12. Restore Asset Loans (batch)
      if (data.assetLoans?.length > 0) {
        await tx.assetLoan.deleteMany();
        await tx.assetLoan.createMany({
          data: data.assetLoans.map((loan: any) => ({
            id: loan.id,
            assetId: loan.assetId,
            borrowerName: loan.borrowerName,
            borrowerPhone: loan.borrowerPhone,
            borrowerAddress: loan.borrowerAddress,
            loanDate: new Date(loan.loanDate),
            expectedReturnDate: new Date(loan.expectedReturnDate),
            actualReturnDate: loan.actualReturnDate ? new Date(loan.actualReturnDate) : null,
            status: loan.status,
            notes: loan.notes,
            returnNotes: loan.returnNotes,
            returnedCondition: loan.returnedCondition,
          })),
          skipDuplicates: true,
        });
        results.assetLoans = data.assetLoans.length;
      }
    }, {
      timeout: 30000, // 30 second timeout
    });

    // Log activity (outside transaction)
    await db.activityLog.create({
      data: { userId: user.id, module: 'Backup & Restore', action: 'Restore Data', details: `Restore oleh ${user.name} - ${results.projects} projects` }
    });

    console.log('Restore completed:', results);

    return NextResponse.json({
      message: 'Restore completed successfully',
      results,
      summary: { totalRecords: Object.values(results).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : (b ? 1 : 0)), 0) }
    });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json({ error: 'Failed to restore: ' + error.message }, { status: 500 });
  }
}
