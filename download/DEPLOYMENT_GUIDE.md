# 🚀 Panduan Deploy NEON ERP - Hosting Gratis

## Daftar Isi
1. [Persiapan](#persiapan)
2. [Opsi 1: Vercel + Supabase (Rekomendasi)](#opsi-1-vercel--supabase)
3. [Opsi 2: Railway (Support SQLite)](#opsi-2-railway)
4. [Opsi 3: Render](#opsi-3-render)
5. [Troubleshooting](#troubleshooting)

---

## Persiapan

### Yang Diperlukan:
- Akun GitHub (gratis) - https://github.com
- Akun email untuk daftar hosting

### Backup Data Anda
Sebelum deploy, backup data SQLite Anda:
1. Login ke aplikasi
2. Buka Settings → Backup & Restore
3. Download backup

---

## Opsi 1: Vercel + Supabase

### Kelebihan:
- ✅ Paling mudah untuk Next.js
- ✅ Domain gratis: `namaproject.vercel.app`
- ✅ SSL otomatis
- ✅ CDN global cepat
- ✅ Deploy otomatis dari GitHub

### Kekurangan:
- ❌ Tidak support SQLite (perlu PostgreSQL)

### Langkah-langkah:

#### A. Buat Database PostgreSQL Gratis (Supabase)

1. Kunjungi https://supabase.com
2. Klik "Start your project"
3. Sign up dengan GitHub
4. Buat organization baru (jika belum ada)
5. Klik "New Project"
6. Isi:
   - **Name**: `neon-erp-db`
   - **Database Password**: (simpan password ini!)
   - **Region**: Southeast Asia (Singapore)
7. Klik "Create new project" (tunggu ~2 menit)
8. Setelah project ready, pergi ke **Settings** → **Database**
9. Scroll ke bawah, copy **Connection string** (URI format)
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

#### B. Setup Environment Variables

1. Ganti `[YOUR-PASSWORD]` dengan password yang Anda buat tadi
2. Simpan URL ini, akan digunakan sebagai `DATABASE_URL`

#### C. Push ke GitHub

1. Buat repository baru di GitHub
2. Di terminal project Anda:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO-NAME.git
   git push -u origin main
   ```

#### D. Deploy ke Vercel

1. Kunjungi https://vercel.com
2. Sign up dengan GitHub
3. Klik "Add New..." → "Project"
4. Import repository GitHub Anda
5. Klik "Environment Variables"
6. Tambahkan:
   - **Name**: `DATABASE_URL`
   - **Value**: (paste connection string dari Supabase)
7. Klik "Deploy"
8. Tunggu proses deploy (±2-3 menit)
9. Selesai! 🎉

#### E. Migrasi Database

Setelah deploy pertama kali, Anda perlu menjalankan migrasi database:

1. Di Vercel dashboard, buka project Anda
2. Pergi ke **Storage** → **Neon Postgres** atau gunakan Prisma
3. Atau jalankan perintah lokal dengan database production:

```bash
# Set DATABASE_URL ke production database
npx prisma migrate deploy
npx prisma db seed
```

---

## Opsi 2: Railway

### Kelebihan:
- ✅ Mendukung SQLite dengan persistent volume
- ✅ PostgreSQL gratis juga tersedia
- ✅ $5 credit gratis per bulan
- ✅ Domain gratis

### Langkah-langkah:

#### A. Daftar Railway

1. Kunjungi https://railway.app
2. Sign up dengan GitHub
3. Klik "New Project"
4. Pilih "Deploy from GitHub repo"
5. Pilih repository Anda

#### B. Tambah Database

1. Di project dashboard, klik "+ New"
2. Pilih "Database" → "PostgreSQL" atau biarkan SQLite
3. Untuk SQLite, tambahkan volume:
   - Klik service Anda
   - Pergi ke "Volumes" tab
   - Klik "Add Volume"
   - Mount path: `/app/db`

#### C. Set Environment Variables

1. Klik service Anda
2. Pergi ke "Variables" tab
3. Tambahkan:
   - `DATABASE_URL` = (connection string database)

#### D. Deploy

1. Railway akan otomatis deploy
2. Tunggu hingga selesai
3. Klik "Settings" → "Generate Domain" untuk domain gratis

---

## Opsi 3: Render

### Kelebihan:
- ✅ Web service gratis
- ✅ PostgreSQL gratis
- ✅ Domain gratis

### Langkah-langkah:

#### A. Daftar Render

1. Kunjungi https://render.com
2. Sign up dengan GitHub

#### B. Buat Web Service

1. Klik "New" → "Web Service"
2. Connect repository GitHub Anda
3. Isi:
   - **Name**: `neon-erp`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
4. Pilih "Free" tier
5. Tambahkan environment variable:
   - `DATABASE_URL` = (connection string)
6. Klik "Create Web Service"

#### C. Buat Database

1. Klik "New" → "PostgreSQL"
2. Pilih "Free" tier
3. Copy Internal Database URL
4. Paste ke environment variable `DATABASE_URL` di Web Service

---

## Perubahan Kode yang Diperlukan

Untuk menggunakan PostgreSQL di hosting, ubah file `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Ubah dari "sqlite"
  url      = env("DATABASE_URL")
}
```

Kemudian jalankan:
```bash
npx prisma migrate dev --name init
```

---

## Troubleshooting

### Error: Database Connection
- Pastikan `DATABASE_URL` benar
- Cek firewall/whitelist IP hosting

### Error: Prisma Migration
```bash
npx prisma migrate deploy
npx prisma generate
```

### Error: Build Failed
- Cek Node.js version di `package.json`
- Pastikan semua dependencies terinstall

### Error: 404 Not Found
- Pastikan `output: 'standalone'` di `next.config.js`

---

## Domain Gratis Tambahan

Setelah deploy, Anda bisa mendapatkan domain gratis:
1. **Vercel**: `namaproject.vercel.app`
2. **Railway**: `namaproject.up.railway.app`
3. **Render**: `namaproject.onrender.com`

Atau gunakan custom domain gratis dari:
- **Freenom**: http://www.freenom.com (domain .tk, .ml, .ga, .cf, .gq)
- **DuckDNS**: https://www.duckdns.org (subdomain gratis)

---

## Butuh Bantuan?

Jika mengalami kendala, berikan informasi:
1. Platform hosting mana yang digunakan
2. Pesan error yang muncul
3. Screenshot jika perlu
