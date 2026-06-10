# Tilang Checker — Frontend

Next.js web app untuk antarmuka deteksi masa berlaku STNK.
Bergaya iOS glassmorphism, mobile-first, bisa digunakan dari browser HP.

---

## Tech Stack

| Komponen | Versi |
|----------|-------|
| Next.js (App Router) | ^16.2.7 |
| React | ^19.0.0 |
| TypeScript | 5 |
| Tailwind CSS | 3 |

---

## Setup Lokal

**Prasyarat:** Node.js 18+

```bash
cd frontend

# Install dependencies
npm install

# Salin file env
cp .env.local.example .env.local   # lalu sesuaikan

# Jalankan dev server
npm run dev
```

Buka **http://localhost:3000** di browser.

> Pastikan backend sudah berjalan di port 8000 sebelum upload foto.

---

## Environment Variables

Buat file `frontend/.env.local`:

```bash
# Dev lokal — backend di localhost
NEXT_PUBLIC_API_URL=http://localhost:8000

# Uji backend HuggingFace dari lokal (uncomment jika perlu)
# NEXT_PUBLIC_API_URL=https://zacky912-tilang-checker-backend.hf.space
```

Untuk production di Vercel, set via **Settings → Environment Variables**.

---

## Struktur Layar

Aplikasi menggunakan satu halaman (`app/page.tsx`) dengan state-based routing — tidak ada navigasi URL, semua transisi layar dikelola via React state.

```
HomeScreen
   │
   └─► CaptureScreen         foto dari kamera atau galeri
           │
           └─► ProcessingScreen   loading saat API dipanggil
                   │
                   ├─► ResultAktif       STNK masih berlaku
                   ├─► ResultMati        STNK sudah habis
                   └─► ResultVerifikasi  OCR tidak bisa baca
```

### Komponen

| File | Deskripsi |
|------|-----------|
| `HomeScreen.tsx` | Halaman utama, tombol mulai scan |
| `CaptureScreen.tsx` | Upload foto / ambil dari kamera |
| `ProcessingScreen.tsx` | Animasi loading saat menunggu API |
| `ResultAktif.tsx` | Tampil hasil status AKTIF (hijau) |
| `ResultMati.tsx` | Tampil hasil status MATI (merah) |
| `ResultVerifikasi.tsx` | Tampil hasil PERLU VERIFIKASI (kuning) |
| `HistoryScreen.tsx` | Riwayat scan tersimpan di localStorage |

---

## API Client

`lib/api.ts` menangani semua komunikasi ke backend:

- `compressImage(file)` — resize & compress gambar via Canvas API sebelum upload (maks 1280px, quality 0.85)
- `checkPlateBase64(base64)` — kirim base64 ke `POST /check`, return `CheckResult`
- `healthCheck()` — cek apakah backend online

---

## Build & Deploy

```bash
# Build production
npm run build

# Preview production build
npm start
```

### Deploy ke Vercel
1. Import repo GitHub di vercel.com
2. Set Root Directory: `frontend`
3. Tambah environment variable: `NEXT_PUBLIC_API_URL=<URL backend HuggingFace>`
4. Deploy

---

## Catatan

- Kamera belakang diaktifkan via `capture="environment"` pada input file
- Gambar di-compress di sisi client sebelum dikirim agar upload lebih cepat
- Riwayat scan disimpan di `localStorage` (persisten antar sesi)
- Thumbnail foto ditampilkan di layar hasil dari data URL (tidak di-upload ulang)
