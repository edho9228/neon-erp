import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// Hash password with SHA256 (same as auth.ts)
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Starting seed...');

  // Create default company
  const company = await prisma.company.upsert({
    where: { id: 'company-1' },
    update: {},
    create: {
      id: 'company-1',
      name: 'NEON Construction',
      address: 'Jakarta, Indonesia',
      phone: '021-12345678',
      email: 'info@neon.com',
      logo: '/logo.png',
      bankName: 'Bank BCA',
      bankAccount: '1234567890',
    },
  });
  console.log('✅ Company created:', company.name);

  // Create admin user with SHA256 hash
  const hashedPassword = hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@neon.com' },
    update: { password: hashedPassword },
    create: {
      id: 'user_admin_001',
      email: 'admin@neon.com',
      password: hashedPassword,
      name: 'Administrator',
      role: 'admin',
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create sample clients
  const clients = [
    { code: 'CLT-001', name: 'PT Maju Bersama', contactPerson: 'Budi Santoso', phone: '021-5551234', email: 'budi@majubersama.co.id', address: 'Jl. Sudirman No. 100, Jakarta Pusat' },
    { code: 'CLT-002', name: 'Bapak Hartono', contactPerson: 'Hartono Wijaya', phone: '081234567890', email: 'hartono.w@gmail.com', address: 'Jl. Kemang Raya No. 25, Jakarta Selatan' },
    { code: 'CLT-003', name: 'CV Textile Jaya', contactPerson: 'Dewi Sartika', phone: '022-7891234', email: 'dewi@textilejaya.com', address: 'Jl. Industri Bandung No. 50, Bandung' },
  ];

  for (const client of clients) {
    await prisma.client.upsert({
      where: { code: client.code },
      update: {},
      create: {
        code: client.code,
        name: client.name,
        contactPerson: client.contactPerson,
        phone: client.phone,
        email: client.email,
        address: client.address,
        isActive: true,
      },
    });
  }
  console.log('✅ Clients created:', clients.length, 'clients');

  // Create sample master items
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
    await prisma.masterItem.upsert({
      where: { code: item.code },
      update: {},
      create: {
        code: item.code,
        name: item.name,
        category: item.category,
        unit: item.unit,
        price: item.price,
        description: `${item.name} - ${item.category}`,
        isActive: true,
      },
    });
  }
  console.log('✅ Master items created:', items.length, 'items');

  // Create sample projects
  const firstClient = await prisma.client.findFirst();
  if (firstClient && admin) {
    const project = await prisma.project.upsert({
      where: { code: 'PRJ-001' },
      update: {},
      create: {
        code: 'PRJ-001',
        name: 'Gedung Perkantoran Sudirman',
        clientId: firstClient.id,
        userId: admin.id,
        status: 'InProgress',
        progress: 45,
        contractValue: 2500000000,
        modalKerja: 2000000000,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-15'),
        responsible: 'Ahmad Suryadi',
      },
    });

    // Create transactions for the project
    const existingTransactions = await prisma.transaction.count({ where: { projectId: project.id } });
    if (existingTransactions === 0) {
      await prisma.transaction.createMany({
        data: [
          {
            projectId: project.id,
            type: 'Income',
            category: 'Progress Payment',
            description: 'Termin 1',
            amount: 750000000,
            date: new Date('2024-02-15'),
            source: 'Project',
          },
          {
            projectId: project.id,
            type: 'Expense',
            category: 'Material',
            description: 'Pembelian Material Awal',
            amount: 800000000,
            date: new Date('2024-02-01'),
            source: 'Project',
          },
        ],
      });
    }
    console.log('✅ Sample project created:', project.name);
  }

  console.log('🎉 Seed completed!');
  console.log('');
  console.log('📋 Login credentials:');
  console.log('   Email: admin@neon.com');
  console.log('   Password: admin123');
  console.log('   PIN Settings: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
