# Panduan Instalasi NEON ERP - Project Dashboard

## 📋 Prasyarat

Sebelum menginstall, pastikan komputer Anda memiliki:

1. **Node.js** (versi 18 atau lebih baru)
   - Download: https://nodejs.org/
   - Cek versi: `node --version`

2. **Bun** (recommended) atau npm
   - Bun lebih cepat, download: https://bun.sh/
   - Atau gunakan npm (sudah termasuk di Node.js)

3. **Git** (opsional, untuk clone)
   - Download: https://git-scm.com/

---

## 🚀 Cara Instalasi

### Metode 1: Copy Folder Project

1. **Copy seluruh folder project** ke komputer Anda
   ```
   C:\Projects\my-project    (Windows)
   /home/user/my-project     (Linux/Mac)
   ```

2. **Buka terminal/command prompt** di folder project
   ```bash
   cd C:\Projects\my-project
   ```

3. **Install dependencies**
   ```bash
   bun install
   ```
   atau dengan npm:
   ```bash
   npm install
   ```

4. **Setup database**
   ```bash
   bunx prisma generate
   bunx prisma db push
   ```
   atau dengan npm:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Buat admin default**
   ```bash
   bunx prisma db seed
   ```
   atau:
   ```bash
   npx prisma db seed
   ```

6. **Jalankan aplikasi**
   ```bash
   bun run dev
   ```
   atau:
   ```bash
   npm run dev
   ```

7. **Buka browser** dan akses:
   ```
   http://localhost:3000
   ```

---

### Metode 2: Clone dari Git Repository

1. **Clone repository**
   ```bash
   git clone <url-repository>
   cd my-project
   ```

2. **Ikuti langkah 3-7 dari Metode 1**

---

## 🔐 Login Default

Setelah instalasi, gunakan akun default:

| Email | Password | Role |
|-------|----------|------|
| admin@neon.com | admin123 | Admin |

**⚠️ PENTING:** Segera ganti password setelah login pertama!

---

## 📁 Struktur Folder

```
my-project/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Data awal
├── public/
│   └── logo.png           # Logo perusahaan
├── src/
│   ├── app/
│   │   ├── page.tsx       # Halaman utama
│   │   ├── api/           # API routes
│   │   └── layout.tsx     # Layout
│   ├── components/        # UI Components
│   └── lib/               # Utilities
├── .env                   # Environment variables
├── package.json           # Dependencies
└── README.md
```

---

## ⚙️ Konfigurasi Environment

Buat file `.env` di root folder:

```env
# Database
DATABASE_URL="file:./dev.db"

# Session Secret (ganti dengan string random yang panjang)
SESSION_SECRET="your-super-secret-key-change-this-in-production"

# Environment
NODE_ENV="development"
```

---

## 🔧 Build untuk Production

Untuk menjalankan dalam mode production:

1. **Build aplikasi**
   ```bash
   bun run build
   ```
   atau:
   ```bash
   npm run build
   ```

2. **Jalankan production server**
   ```bash
   bun run start
   ```
   atau:
   ```bash
   npm run start
   ```

---

## 📦 Backup & Restore Data

### Backup Data
1. Login sebagai Admin
2. Buka menu **Settings**
3. Klik **Download Backup**

### Restore Data
1. Login sebagai Admin
2. Buka menu **Settings**
3. Klik **Choose File** dan pilih file backup (.json)
4. Klik **Restore Data**

---

## 🆘 Troubleshooting

### Error: "Cannot find module"
```bash
bun install
# atau
npm install
```

### Error: "Database not found"
```bash
bunx prisma db push
# atau
npx prisma db push
```

### Error: "Port 3000 already in use"
Ganti port di file `.env`:
```env
PORT=3001
```

### Reset Database
```bash
bunx prisma db push --force-reset
bunx prisma db seed
# atau
npx prisma db push --force-reset
npx prisma db seed
```

---

## 💻 Spesifikasi Minimum

| Komponen | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 4 GB | 8 GB |
| Storage | 500 MB | 1 GB |
| Node.js | v18 | v20+ |
| OS | Windows 10, Linux, macOS | Windows 11, Ubuntu 22+, macOS 12+ |

---

## 📞 Dukungan

Jika mengalami masalah, hubungi:
- Developer: Edho
- Email: support@neon-erp.com

---

## 📝 Catatan Penting

1. **Data tersimpan di file SQLite** (`prisma/dev.db`)
2. **Backup rutin** disarankan untuk menghindari kehilangan data
3. **Jangan hapus folder** `.next` dan `node_modules` saat aplikasi berjalan
4. **Ganti SESSION_SECRET** dengan nilai yang aman untuk production

---

© 2026 NEON ERP - Project Dashboard | Developed by Edho
