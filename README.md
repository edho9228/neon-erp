# NEON ERP - Construction Management System

Sistem ERP konstruksi lengkap untuk manajemen proyek, keuangan, dan operasional.

## 🚀 Features

### 📊 Dashboard
- Overview profit/loss per project
- Real-time financial summary
- Progress tracking semua proyek
- Marquee update profit/loss terbaru

### 📁 Project Management
- Pipeline proyek (Negotiation → Deal → In Progress → Completed)
- RAB (Rencana Anggaran Biaya) management
- Progress tracking dengan history
- Tender management

### 💰 Financial Management
- Transaksi Income & Expense per project
- Kategori otomatis per modul
- Laporan keuangan bulanan
- Budget planning (Modal Kerja)

### 👥 Client Database
- Database client lengkap
- Contact person management
- Riwayat proyek per client

### 📦 Master Data
- Master item/pekerjaan
- Kategori: Civil, MEP, Interior, General
- Harga satuan

### 🏢 Asset Management
- Daftar aset perusahaan
- Peminjaman aset
- Tracking kondisi aset

### ⚙️ Settings
- Company profile dengan logo
- User management
- PIN protection untuk settings

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS 4, shadcn/ui, Recharts
- **Database**: PostgreSQL (Supabase/Railway)
- **ORM**: Prisma
- **Auth**: NextAuth.js

## 📦 Installation

### 1. Clone Repository
```bash
git clone https://github.com/ppmalkanza/neon-erp.git
cd neon-erp
```

### 2. Install Dependencies
```bash
npm install
# atau
bun install
```

### 3. Setup Environment
```bash
cp .env.example .env
```

Edit `.env` dengan database URL PostgreSQL:
```
DATABASE_URL="postgresql://postgres:password@host:5432/database"
```

### 4. Setup Database
```bash
npx prisma db push
npx prisma db seed
```

### 5. Run Development Server
```bash
npm run dev
# atau
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 🔐 Default Login

- **Email**: admin@neon.com
- **Password**: admin123
- **PIN Settings**: 123456

## 🚀 Deployment (Vercel + Supabase)

### 1. Buat Database Supabase
1. Daftar di [supabase.com](https://supabase.com)
2. Buat project baru
3. Copy connection string dari Settings > Database

### 2. Deploy ke Vercel
1. Push kode ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Add Environment Variable:
   - `DATABASE_URL` = connection string Supabase
4. Deploy

### 3. Setup Database Production
Setelah deploy, jalankan migrasi:
```bash
npx prisma db push
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/          # API Routes
│   ├── page.tsx      # Main Application
│   ├── layout.tsx    # Root Layout
│   └── globals.css   # Global Styles
├── components/ui/    # shadcn/ui Components
├── lib/              # Utilities
├── hooks/            # Custom Hooks
└── types/            # TypeScript Types

prisma/
├── schema.prisma     # Database Schema
└── seed.ts           # Seed Data
```

## 📝 License

MIT License - Free for personal and commercial use.

---

Built with ❤️ for construction management
