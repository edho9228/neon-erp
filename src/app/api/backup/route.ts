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
      // Projects with all relations
      db.project.findMany({
        include: {
          client: true,
          rabItems: { include: { item: true } },
          transactions: true,
          budgetPlans: true,
          progressHistory: true,
          monthlyReports: true,
          tenders: true,
        }
      }),
      // Master Items
      db.masterItem.findMany(),
      // Clients
      db.client.findMany(),
      // Assets
      db.asset.findMany({
        include: {
          loans: true,
        }
      }),
      // All Transactions (Project & Internal)
      db.transaction.findMany({
        include: {
          project: true,
          user: true,
        }
      }),
      // Company
      db.company.findFirst(),
      // RAB Items (standalone for easy restore)
      db.rABItem.findMany({
        include: {
          item: true,
        }
      }),
      // Budget Plans
      db.budgetPlan.findMany(),
      // Progress History
      db.progressHistory.findMany(),
      // Monthly Reports
      db.monthlyReport.findMany(),
      // Tenders
      db.tender.findMany(),
      // Asset Loans
      db.assetLoan.findMany(),
      // Users (without passwords for security)
      db.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
    ]);

    const backupData = {
      backupDate: new Date().toISOString(),
      version: '2.0',
      createdBy: user.name,
      data: {
        // Core Data
        company,
        users,
        clients,
        items,
        
        // Project Data
        projects,
        rabItems,
        tenders,
        
        // Financial Data
        transactions,
        budgetPlans,
        monthlyReports,
        
        // Asset Data
        assets,
        assetLoans,
        
        // Progress Data
        progressHistory,
      },
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

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        module: 'Backup & Restore',
        action: 'Backup Data',
        details: `Backup lengkap oleh ${user.name} - ${projects.length} projects, ${transactions.length} transactions, ${rabItems.length} RAB items, ${assets.length} assets`,
      }
    });

    return NextResponse.json(backupData);
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Failed to create backup: ' + error.message }, { status: 500 });
  }
}

// POST - Restore backup (Complete restore of all data)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    let backupData;
    try {
      backupData = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON file - File mungkin corrupted' }, { status: 400 });
    }

    if (!backupData.data) {
      return NextResponse.json({ error: 'Invalid backup file format - Missing data property' }, { status: 400 });
    }

    // Log backup info
    console.log('Restore started by:', user.name);
    console.log('Backup version:', backupData.version);
    console.log('Backup date:', backupData.backupDate);
    console.log('Backup summary:', backupData.summary);

    const results = {
      company: false,
      users: 0,
      clients: 0,
      items: 0,
      projects: 0,
      rabItems: 0,
      tenders: 0,
      transactions: 0,
      budgetPlans: 0,
      monthlyReports: 0,
      assets: 0,
      assetLoans: 0,
      progressHistory: 0,
    };

    // 1. Restore Company
    if (backupData.data.company) {
      try {
        await db.company.deleteMany();
        await db.company.create({
          data: {
            name: backupData.data.company.name || 'PT. Konstruksi Nusantara',
            address: backupData.data.company.address || '',
            phone: backupData.data.company.phone || '',
            email: backupData.data.company.email,
            logo: backupData.data.company.logo,
            bankName: backupData.data.company.bankName,
            bankAccount: backupData.data.company.bankAccount,
          }
        });
        results.company = true;
      } catch (e) {
        console.error('Failed to restore company:', e);
      }
    }

    // 2. Restore Master Items
    if (backupData.data.items && backupData.data.items.length > 0) {
      for (const item of backupData.data.items) {
        try {
          await db.masterItem.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              category: item.category,
              unit: item.unit,
              price: item.price,
              description: item.description,
              isActive: item.isActive ?? true,
            },
            create: {
              id: item.id,
              code: item.code,
              name: item.name,
              category: item.category,
              unit: item.unit,
              price: item.price,
              description: item.description,
              isActive: item.isActive ?? true,
            },
          });
          results.items++;
        } catch (e) {
          console.error('Failed to restore item:', item.id, e);
        }
      }
    }

    // 3. Restore Clients
    if (backupData.data.clients && backupData.data.clients.length > 0) {
      for (const client of backupData.data.clients) {
        try {
          await db.client.upsert({
            where: { id: client.id },
            update: {
              name: client.name,
              contactPerson: client.contactPerson,
              phone: client.phone,
              email: client.email,
              address: client.address,
              notes: client.notes,
              isActive: client.isActive ?? true,
            },
            create: {
              id: client.id,
              code: client.code,
              name: client.name,
              contactPerson: client.contactPerson,
              phone: client.phone,
              email: client.email,
              address: client.address,
              notes: client.notes,
              isActive: client.isActive ?? true,
            },
          });
          results.clients++;
        } catch (e) {
          console.error('Failed to restore client:', client.id, e);
        }
      }
    }

    // 4. Restore Projects
    if (backupData.data.projects && backupData.data.projects.length > 0) {
      for (const project of backupData.data.projects) {
        try {
          await db.project.upsert({
            where: { id: project.id },
            update: {
              name: project.name,
              clientId: project.clientId,
              status: project.status,
              contractValue: project.contractValue || 0,
              modalKerja: project.modalKerja || 0,
              progress: project.progress || 0,
              progressNote: project.progressNote,
              startDate: project.startDate ? new Date(project.startDate) : null,
              endDate: project.endDate ? new Date(project.endDate) : null,
              responsible: project.responsible,
              userId: project.userId,
            },
            create: {
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
            },
          });
          results.projects++;
        } catch (e) {
          console.error('Failed to restore project:', project.id, e);
        }
      }
    }

    // 5. Restore RAB Items
    if (backupData.data.rabItems && backupData.data.rabItems.length > 0) {
      for (const rab of backupData.data.rabItems) {
        try {
          await db.rABItem.upsert({
            where: { id: rab.id },
            update: {
              projectId: rab.projectId,
              itemId: rab.itemId,
              description: rab.description,
              quantity: rab.quantity,
              unitPrice: rab.unitPrice,
              totalPrice: rab.totalPrice,
              category: rab.category,
            },
            create: {
              id: rab.id,
              projectId: rab.projectId,
              itemId: rab.itemId,
              description: rab.description,
              quantity: rab.quantity,
              unitPrice: rab.unitPrice,
              totalPrice: rab.totalPrice,
              category: rab.category,
            },
          });
          results.rabItems++;
        } catch (e) {
          console.error('Failed to restore RAB item:', rab.id, e);
        }
      }
    }

    // 6. Restore Tenders
    if (backupData.data.tenders && backupData.data.tenders.length > 0) {
      for (const tender of backupData.data.tenders) {
        try {
          await db.tender.upsert({
            where: { id: tender.id },
            update: {
              projectId: tender.projectId,
              name: tender.name,
              value: tender.value,
              status: tender.status,
              submitDate: new Date(tender.submitDate),
              resultDate: tender.resultDate ? new Date(tender.resultDate) : null,
              notes: tender.notes,
            },
            create: {
              id: tender.id,
              projectId: tender.projectId,
              name: tender.name,
              value: tender.value,
              status: tender.status,
              submitDate: new Date(tender.submitDate),
              resultDate: tender.resultDate ? new Date(tender.resultDate) : null,
              notes: tender.notes,
            },
          });
          results.tenders++;
        } catch (e) {
          console.error('Failed to restore tender:', tender.id, e);
        }
      }
    }

    // 7. Restore Transactions (Project & Internal)
    if (backupData.data.transactions && backupData.data.transactions.length > 0) {
      for (const txn of backupData.data.transactions) {
        try {
          await db.transaction.upsert({
            where: { id: txn.id },
            update: {
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
            },
            create: {
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
            },
          });
          results.transactions++;
        } catch (e) {
          console.error('Failed to restore transaction:', txn.id, e);
        }
      }
    }

    // 8. Restore Budget Plans
    if (backupData.data.budgetPlans && backupData.data.budgetPlans.length > 0) {
      for (const budget of backupData.data.budgetPlans) {
        try {
          await db.budgetPlan.upsert({
            where: { id: budget.id },
            update: {
              projectId: budget.projectId,
              category: budget.category,
              description: budget.description,
              planned: budget.planned,
              actual: budget.actual,
              variance: budget.variance,
              month: budget.month,
              year: budget.year,
            },
            create: {
              id: budget.id,
              projectId: budget.projectId,
              category: budget.category,
              description: budget.description,
              planned: budget.planned,
              actual: budget.actual,
              variance: budget.variance,
              month: budget.month,
              year: budget.year,
            },
          });
          results.budgetPlans++;
        } catch (e) {
          console.error('Failed to restore budget plan:', budget.id, e);
        }
      }
    }

    // 9. Restore Monthly Reports
    if (backupData.data.monthlyReports && backupData.data.monthlyReports.length > 0) {
      for (const report of backupData.data.monthlyReports) {
        try {
          await db.monthlyReport.upsert({
            where: { id: report.id },
            update: {
              projectId: report.projectId,
              year: report.year,
              month: report.month,
              budget: report.budget,
              actual: report.actual,
              income: report.income,
              profit: report.profit,
            },
            create: {
              id: report.id,
              projectId: report.projectId,
              year: report.year,
              month: report.month,
              budget: report.budget,
              actual: report.actual,
              income: report.income,
              profit: report.profit,
            },
          });
          results.monthlyReports++;
        } catch (e) {
          console.error('Failed to restore monthly report:', report.id, e);
        }
      }
    }

    // 10. Restore Progress History
    if (backupData.data.progressHistory && backupData.data.progressHistory.length > 0) {
      for (const progress of backupData.data.progressHistory) {
        try {
          await db.progressHistory.upsert({
            where: { id: progress.id },
            update: {
              projectId: progress.projectId,
              progress: progress.progress,
              note: progress.note,
              date: new Date(progress.date),
            },
            create: {
              id: progress.id,
              projectId: progress.projectId,
              progress: progress.progress,
              note: progress.note,
              date: new Date(progress.date),
            },
          });
          results.progressHistory++;
        } catch (e) {
          console.error('Failed to restore progress history:', progress.id, e);
        }
      }
    }

    // 11. Restore Assets
    if (backupData.data.assets && backupData.data.assets.length > 0) {
      for (const asset of backupData.data.assets) {
        try {
          await db.asset.upsert({
            where: { id: asset.id },
            update: {
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
            },
            create: {
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
            },
          });
          results.assets++;
        } catch (e) {
          console.error('Failed to restore asset:', asset.id, e);
        }
      }
    }

    // 12. Restore Asset Loans
    if (backupData.data.assetLoans && backupData.data.assetLoans.length > 0) {
      for (const loan of backupData.data.assetLoans) {
        try {
          await db.assetLoan.upsert({
            where: { id: loan.id },
            update: {
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
            },
            create: {
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
            },
          });
          results.assetLoans++;
        } catch (e) {
          console.error('Failed to restore asset loan:', loan.id, e);
        }
      }
    }

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        module: 'Backup & Restore',
        action: 'Restore Data',
        details: `Restore lengkap oleh ${user.name} - ${results.projects} projects, ${results.transactions} transactions, ${results.rabItems} RAB, ${results.assets} assets`,
      }
    });

    console.log('Restore completed:', results);

    return NextResponse.json({
      message: 'Restore completed successfully',
      results,
      summary: {
        totalRecords: Object.values(results).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : (b ? 1 : 0)), 0),
        backupVersion: backupData.version,
        backupDate: backupData.backupDate,
      }
    });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json({ 
      error: 'Failed to restore: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
