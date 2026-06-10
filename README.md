# 🚗 Tilang Checker

Web app untuk **mendeteksi masa berlaku STNK** dari foto plat / stiker pajak kendaraan
Indonesia. Cukup foto bagian stiker masa berlaku, sistem akan membaca bulan/tahun,
menentukan status **AKTIF / MATI / PERLU VERIFIKASI**, dan menghasilkan laporan singkat
berbahasa Indonesia memakai LLM.

> Capstone Practicum — Pembelajaran Mesin, Semester 4.

---

## ✨ Fitur

- 📸 Ambil foto langsung dari kamera HP atau upload dari galeri
- 🔍 Deteksi kendaraan & crop area plat otomatis (YOLOv8)
- 🧠 Validasi apakah objek benar-benar plat (MobileNetV2)
- 🔤 Baca tanggal masa berlaku dengan OCR (EasyOCR) + normalisasi karakter
- ⚖️ Tentukan status STNK berdasarkan tanggal hari ini
- 📝 Laporan otomatis untuk petugas (Gemini / LLM lokal, ada fallback template)
- 📱 UI bergaya iOS glassmorphism, responsif, siap dijadikan PWA

---

## 🏗️ Arsitektur Pipeline

Saat user mengirim foto, backend menjalankan 5 modul berurutan:

```
Foto (base64)
   │
   ▼
[M2] detect.py    →  YOLOv8: deteksi kendaraan, crop area plat
   │
   ▼
[M1] classify.py  →  MobileNetV2: valid plat / bukan (fallback rule-based)
   │
   ▼
[M3] ocr.py       →  EasyOCR: baca bulan/tahun dari stiker STNK
   │
   ▼
[M5] agent.py     →  Logika: bandingkan dengan tanggal hari ini → AKTIF/MATI
   │
   ▼
[M4] report.py    →  LLM (Gemini / lokal) susun laporan, fallback template
   │
   ▼
JSON hasil  →  Frontend menampilkan layar AKTIF / MATI / PERLU_VERIFIKASI
```

| Modul | File | Teknologi |
|-------|------|-----------|
| M1 — Classifier | `backend/pipeline/classify.py` | MobileNetV2 (PyTorch) |
| M2 — Detection | `backend/pipeline/detect.py` | YOLOv8 (Ultralytics) |
| M3 — OCR | `backend/pipeline/ocr.py` | EasyOCR |
| M4 — Report (LLM) | `backend/pipeline/report.py` | Gemini API / LM Studio lokal |
| M5 — Agent | `backend/pipeline/agent.py` | Logika Python |

---

## 🧰 Tech Stack

### Frontend
| Komponen | Versi |
|----------|-------|
| Next.js (App Router) | 16.2.7 |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS | 3.4.17 |
| next-pwa | 5.6.0 |

### Backend
| Komponen | Versi |
|----------|-------|
| Python | 3.11 |
| FastAPI | 0.115 |
| Uvicorn | 0.30 |
| Ultralytics (YOLOv8) | 8.2 |
| EasyOCR | 1.7 |
| PyTorch / TorchVision | 2.3 / 0.18 |
| google-generativeai | 0.7 |

### Deploy
- **Frontend** → Vercel
- **Backend** → HuggingFace Spaces (Docker) / Railway

---

## 📁 Struktur Folder

```
CAPSTONE/
├── README.md
├── backend/
│   ├── main.py              # FastAPI app: /health, /check
│   ├── config.py            # Env & konstanta
│   ├── requirements.txt
│   ├── Dockerfile           # Untuk HuggingFace Spaces
│   ├── nixpacks.toml        # Untuk Railway
│   ├── yolov8n.pt           # Model YOLO (auto-download bila tidak ada)
│   └── pipeline/
│       ├── detect.py        # M2
│       ├── classify.py      # M1
│       ├── ocr.py           # M3
│       ├── agent.py         # M5
│       └── report.py        # M4
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx         # Router berbasis state (1 halaman, banyak screen)
│   ├── components/
│   │   ├── HomeScreen.tsx
│   │   ├── CaptureScreen.tsx
│   │   ├── ProcessingScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── ResultAktif.tsx
│   │   ├── ResultMati.tsx
│   │   └── ResultVerifikasi.tsx
│   ├── lib/api.ts           # Fetch ke backend
│   └── package.json
└── data/samples/            # Foto contoh untuk testing
```

---

## 🚀 Menjalankan di Lokal

### Prasyarat
- **Python 3.11**
- **Node.js 18+** dan npm
- (Opsional) **LM Studio** kalau mau LLM lokal, atau **Gemini API key** untuk LLM cloud

### 1. Backend (FastAPI)

```bash
cd backend

# Buat virtual environment
python3.11 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies (pertama kali ~beberapa menit)
pip install -r requirements.txt

# Jalankan server
uvicorn main:app --reload --port 8000
```

Backend jalan di **http://localhost:8000**. Cek:
```bash
curl http://localhost:8000/health     # {"status":"ok"}
```

> Saat request `/check` pertama, EasyOCR & YOLO akan mengunduh model (~beberapa ratus MB).
> Ini hanya sekali; request berikutnya cepat.

### 2. Frontend (Next.js)

Buka terminal baru:
```bash
cd frontend

npm install
npm run dev
```

Frontend jalan di **http://localhost:3000**. Buka di browser, upload foto dari
`data/samples/`, dan lihat hasilnya.

---

## 🔑 Environment Variables

### `backend/.env`
```bash
LLM_MODE=local                 # "local" (LM Studio) atau "gemini"
GEMINI_API_KEY=                # diisi kalau LLM_MODE=gemini
LOCAL_LLM_URL=http://localhost:1234/v1/chat/completions
```

### `frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> File `.env` tidak ikut ke Git (sudah di `.gitignore`). Untuk production,
> set variable ini di dashboard masing-masing (HuggingFace Secrets / Vercel Env).

---

## 🤖 Mode LLM (Modul M4)

Laporan akhir disusun LLM. Ada 2 mode + fallback:

| Mode | Kapan dipakai | Cara aktifkan |
|------|---------------|---------------|
| `local` | Dev pakai LM Studio | `LLM_MODE=local`, jalankan LM Studio server di port 1234 |
| `gemini` | Production | `LLM_MODE=gemini` + `GEMINI_API_KEY` (model `gemini-2.0-flash`) |
| *fallback* | Otomatis | Kalau LLM tidak tersedia, pakai template teks bawaan |

Gemini API key gratis dibuat di https://aistudio.google.com/apikey (diawali `AIzaSy...`).

---

## 🔌 API

### `GET /health`
```json
{ "status": "ok" }
```

### `POST /check`
**Request**
```json
{ "image": "<base64 gambar tanpa prefix data:>" }
```
**Response**
```json
{
  "status": "AKTIF",
  "plate_text": "UNKNOWN",
  "expiry_month": 6,
  "expiry_year": 2027,
  "days_remaining": 386,
  "report": "Masa berlaku Juni 2027. Masih aktif 386 hari lagi.",
  "confidence": 0.91
}
```

`status` bisa bernilai `AKTIF`, `MATI`, atau `PERLU_VERIFIKASI`
(saat OCR ragu / tanggal tidak terbaca).

Contoh test via curl:
```bash
curl -X POST http://localhost:8000/check \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$(base64 -i data/samples/test2.jpg)\"}"
```

---

## 🧪 Testing Cepat

Foto contoh tersedia di `data/samples/`. Hasil pipeline (diuji lokal):

| File | Plat | Status | Masa Berlaku |
|------|------|--------|--------------|
| `test1.jpg` | B 537 RUM | AKTIF | Juni 2027 |
| `test2.jpg` | 7601 TS | MATI | April 2022 |
| `test5.jpg` | L 1253 EM | MATI | April 2020 |
| `test6.jpg` | 1237 KCE | AKTIF | Agustus 2029 |
| `test7.jpg` | — | AKTIF | September 2027 |
| `test8.jpg` | B 6577 MEF | MATI | ~2016 |
| `test10.jpg` | 4927 PH | AKTIF | September 2029 |
| `test11.jpg` | 4927 PH | AKTIF | September 2029 |

> OCR berbasis EasyOCR (CPU). Akurasi bergantung pada kualitas foto dan keterbacaan stiker STNK.
> Foto buram, resolusi kecil, atau stiker tertutup bisa menghasilkan `PERLU_VERIFIKASI`.

### Kenapa plat bisa `UNKNOWN`?

Nomor plat ditampilkan `UNKNOWN` ketika OCR tidak berhasil mengenali pola
`[kode area] [angka] [suffix]` dari foto. Ini bisa terjadi karena:

1. **Kode area tertutup** — huruf kode kota (misal `L`, `B`) berada di area yang terhalang logo kendaraan, stiker lain, atau terpotong frame foto.
2. **Foto terlalu dekat ke stiker tanggal** — pipeline mendeteksi tanggal STNK dengan baik, tapi nomor plat tidak masuk dalam frame crop.
3. **Resolusi rendah atau miring** — EasyOCR kesulitan memisahkan karakter plat dari noise latar.
4. **EasyOCR bukan model khusus plat** — ditraining untuk teks umum, bukan font dan layout spesifik plat Indonesia. Nomor seperti `4927 PH` tetap bisa ditampilkan meski kode area tidak terbaca.

> **Status AKTIF/MATI tetap akurat** meski plat `UNKNOWN` — karena status ditentukan dari
> tanggal STNK, bukan dari nomor plat.

---

## ☁️ Deployment

| Layanan | URL | Keterangan |
|---------|-----|------------|
| Frontend (Vercel) | https://tilang-chacker-web-app.vercel.app | Production |
| Backend (HuggingFace) | https://zacky912-tilang-checker-backend.hf.space | API server |

### Cara deploy ulang

- **Backend → HuggingFace Spaces**: pakai `backend/Dockerfile` (SDK Docker, port 7860),
  set Secret `LLM_MODE=gemini` & `GEMINI_API_KEY`.
- **Backend → Railway**: pakai `backend/nixpacks.toml`.
- **Frontend → Vercel**: Root Directory `frontend`, set `NEXT_PUBLIC_API_URL` ke URL backend.

---

## 📝 Lisensi

MIT — proyek edukasi capstone.
