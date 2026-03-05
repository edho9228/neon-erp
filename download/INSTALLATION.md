# Panduan Instalasi NEON ERP - Project Dashboard

## 📋 Prasyarat

Sebelum menginstall, pastikan komputer Anda memiliki:

1. **Node.js** (versi 18 atau lebih baru)
   - Download: https://nodejs.org/
   - Pilih LTS version
   - Cek versi: `node --version`

---

## 🚀 Langkah Instalasi

### 1. Extract File ZIP
Extract file `neon-erp-project-v3.zip` ke folder, misalnya:
```
C:\Users\NamaAnda\Dashboard
```
**JANGAN** extract ke `C:\Program Files\`

### 2. Copy File Penting dari Folder `download/`
Setelah extract, copy file berikut dari folder `download/` ke root folder project:

| File dari | Copy ke |
|-----------|---------|
| `download/package.json` | Root folder |
| `download/tailwind.config.ts` | Root folder |
| `download/.env` | Root folder |
| `download/next.config.js` | Root folder |

### 3. Buka Command Prompt
- Buka folder project di Windows Explorer
- Ketik `cmd` di address bar
- Tekan Enter

### 4. Install Dependencies
```bash
npm install
```
Tunggu hingga selesai (2-5 menit)

### 5. Setup Database
```bash
npx prisma generate
npx prisma db push
```

### 6. Buat Data Awal (Admin User)
```bash
npx prisma db seed
```

### 7. Jalankan Aplikasi
```bash
npm run dev
```

### 8. Buka Browser
Akses: **http://localhost:3000**

---

## 🔐 Login Default

| Email | Password |
|-------|----------|
| admin@neon.com | admin123 |

**⚠️ PENTING:** Segera ganti password setelah login pertama!

---

## 📁 Struktur File Setelah Copy

```
Dashboard/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── logo.png
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
├── package.json        ← copy dari download/
├── tailwind.config.ts  ← copy dari download/
├── .env                ← copy dari download/
├── next.config.js      ← copy dari download/
├── tsconfig.json
└── ...
```

---

## ❌ Troubleshooting

### Error: "EPERM: operation not permitted"
**Solusi:** Jangan install di folder `Program Files`

### Error: "next.config.ts is not supported"
**Solusi:** Gunakan `next.config.js` (sudah disediakan di folder download/)

### Error: "Port 3000 already in use"
**Solusi:**
```bash
npm run dev -- -p 3001
```

### Error saat seed database
**Solusi:**
```bash
npx prisma db push --force-reset
npx prisma db seed
```

### Error: "module not found"
**Solusi:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 💻 Spesifikasi Minimum

| Komponen | Minimum |
|----------|---------|
| RAM | 4 GB |
| Storage | 1 GB |
| Node.js | v18 |
| OS | Windows 10/11 |

---

© 2026 NEON ERP - Project Dashboard | Developed by Edho
