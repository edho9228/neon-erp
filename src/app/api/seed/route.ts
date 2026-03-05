import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// Support both GET and POST for easier seeding
export async function GET() {
  return seedDatabase();
}

export async function POST() {
  return seedDatabase();
}

async function seedDatabase() {
  try {
    console.log('Starting database seed...');
    
    // Check if admin exists with correct email
    let admin = await db.user.findUnique({ where: { email: 'admin@neon.com' } });
    
    // Create default admin user if not exists
    if (!admin) {
      console.log('Creating admin user...');
      admin = await db.user.create({
        data: {
          id: 'user_admin_001',
          email: 'admin@neon.com',
          password: hashPassword('admin123'),
          name: 'Administrator',
          role: 'admin',
          isActive: true,
        },
      });
    } else {
      // Update password to ensure it's correct
      console.log('Updating admin password...');
      await db.user.update({
        where: { id: admin.id },
        data: { password: hashPassword('admin123') }
      });
    }

    // Create company data if not exists
    let company = await db.company.findFirst();
    if (!company) {
      console.log('Creating company...');
      company = await db.company.create({
        data: {
          id: 'company_001',
          name: 'NEON Construction',
          address: 'Jakarta, Indonesia',
          phone: '021-12345678',
          email: 'info@neon.com',
          logo: '/logo.png',
          bankName: 'Bank BCA',
          bankAccount: '1234567890',
        },
      });
    }

    // Create master items if not exist
    const existingItems = await db.masterItem.findFirst();
    if (!existingItems) {
      console.log('Creating master items...');
      const items = [
        { code: 'CVL-001', name: 'Semen Portland 50kg', category: 'Civil', unit: 'Sak', price: 72000 },
        { code: 'CVL-002', name: 'Besi Beton 10mm', category: 'Civil', unit: 'Batang', price: 85000 },
        { code: 'CVL-003', name: 'Batako', category: 'Civil', unit: 'Pcs', price: 3500 },
        { code: 'CVL-004', name: 'Pasir Pasang', category: 'Civil', unit: 'M3', price: 350000 },
        { code: 'CVL-005', name: 'Kerikil/Split', category: 'Civil', unit: 'M3', price: 450000 },
        { code: 'MEP-001', name: 'Kabel NYA 1.5mm', category: 'MEP', unit: 'Roll', price: 180000 },
        { code: 'MEP-002', name: 'Kabel NYA 2.5mm', category: 'MEP', unit: 'Roll', price: 280000 },
        { code: 'MEP-003', name: 'Pipa PVC 3 inch', category: 'MEP', unit: 'Batang', price: 95000 },
        { code: 'MEP-004', name: 'AC Split 1 PK', category: 'MEP', unit: 'Unit', price: 4500000 },
        { code: 'MEP-005', name: 'MCB 1 Phase 16A', category: 'MEP', unit: 'Unit', price: 75000 },
        { code: 'INT-001', name: 'Granit Tile 60x60', category: 'Interior', unit: 'M2', price: 185000 },
        { code: 'INT-002', name: 'Cat Tembok Premium', category: 'Interior', unit: 'Kaleng', price: 165000 },
        { code: 'INT-003', name: 'Plywood 9mm', category: 'Interior', unit: 'Lembar', price: 125000 },
        { code: 'INT-004', name: 'Gypsum Board 9mm', category: 'Interior', unit: 'Lembar', price: 85000 },
        { code: 'INT-005', name: 'Door Handle Set', category: 'Interior', unit: 'Set', price: 275000 },
      ];

      for (const item of items) {
        await db.masterItem.create({
          data: {
            ...item,
            description: `${item.name} - ${item.category}`,
          },
        });
      }
    }

    // Create sample clients if not exist
    let clients = await db.client.findMany();
    if (clients.length === 0) {
      console.log('Creating clients...');
      const clientData = [
        { code: 'CLT-001', name: 'PT Maju Bersama', contactPerson: 'Budi Santoso', phone: '021-5551234', email: 'budi@majubersama.co.id', address: 'Jl. Sudirman No. 100, Jakarta Pusat' },
        { code: 'CLT-002', name: 'Bapak Hartono', contactPerson: 'Hartono Wijaya', phone: '081234567890', email: 'hartono.w@gmail.com', address: 'Jl. Kemang Raya No. 25, Jakarta Selatan' },
        { code: 'CLT-003', name: 'CV Textile Jaya', contactPerson: 'Dewi Sartika', phone: '022-7891234', email: 'dewi@textilejaya.com', address: 'Jl. Industri Bandung No. 50, Bandung' },
      ];

      for (const client of clientData) {
        await db.client.create({ data: client });
      }
      clients = await db.client.findMany();
    }

    // Create sample projects if not exist
    const existingProjects = await db.project.findFirst();
    if (!existingProjects && clients.length > 0) {
      console.log('Creating projects...');
      const masterItems = await db.masterItem.findMany({ take: 5 });
      
      const projectData = [
        {
          code: 'PRJ-001',
          name: 'Gedung Perkantoran Sudirman',
          clientId: clients[0].id,
          status: 'InProgress',
          progress: 45,
          contractValue: 2500000000,
          modalKerja: 2000000000,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-12-15'),
          responsible: 'Ahmad Suryadi',
        },
        {
          code: 'PRJ-002',
          name: 'Rumah Tinggal Mewah',
          clientId: clients[1]?.id || clients[0].id,
          status: 'InProgress',
          progress: 70,
          contractValue: 850000000,
          modalKerja: 680000000,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-09-01'),
          responsible: 'Budi Santoso',
        },
      ];

      for (const project of projectData) {
        const createdProject = await db.project.create({
          data: {
            ...project,
            userId: admin.id,
          },
        });
        
        // Create RAB items
        for (let i = 0; i < Math.min(masterItems.length, 3); i++) {
          const masterItem = masterItems[i];
          await db.rABItem.create({
            data: {
              projectId: createdProject.id,
              itemId: masterItem.id,
              quantity: 100,
              unitPrice: masterItem.price,
              totalPrice: 100 * masterItem.price,
              category: masterItem.category,
            },
          });
        }

        // Create sample transactions
        await db.transaction.create({
          data: {
            projectId: createdProject.id,
            type: 'Income',
            category: 'Progress Payment',
            description: 'Termin 1',
            amount: project.contractValue * 0.3,
            date: new Date('2024-02-15'),
          },
        });
        
        await db.transaction.create({
          data: {
            projectId: createdProject.id,
            type: 'Expense',
            category: 'Material',
            description: 'Pembelian Material',
            amount: project.modalKerja * 0.3,
            date: new Date('2024-02-01'),
          },
        });
      }
    }

    console.log('Database seed completed!');

    return NextResponse.json({ 
      success: true,
      message: 'Database seeded successfully!',
      login: { 
        email: 'admin@neon.com', 
        password: 'admin123' 
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ 
      success: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
