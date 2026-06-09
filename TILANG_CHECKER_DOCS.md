# TILANG CHECKER — Project Documentation
### Capstone ML Practicum | Deteksi Masa Berlaku STNK dari Foto Plat

---

## Ringkasan Proyek

Aplikasi web yang memungkinkan petugas memfoto plat kendaraan, lalu sistem otomatis
membaca stiker masa berlaku STNK dan menentukan apakah kendaraan aktif atau kena tilang.

**Input:** Foto plat kendaraan
**Output:** Status (AKTIF / MATI / PERLU VERIFIKASI) + laporan teks otomatis dari AI

---

## Tech Stack

| Layer | Teknologi | Keterangan |
|-------|-----------|------------|
| Frontend | Next.js 15 + Tailwind CSS + shadcn/ui | Deploy: Vercel |
| Backend ML | FastAPI (Python 3.11) | Deploy: Railway |
| Detection (M2) | YOLOv8 (Ultralytics) | Deteksi plat + stiker |
| Classifier (M1) | PyTorch CNN custom | Validasi plat asli |
| OCR (M3) | EasyOCR | Baca teks bulan/tahun |
| Agent (M5) | Python logic | Decision loop |
| LLM (M4) | LM Studio / Gemini API | Generate laporan |

---

## Arsitektur M1–M5

```
Foto plat masuk
      │
      ▼
[M2] YOLOv8 ──────── Deteksi & crop area plat + stiker tanggal
      │
      ▼
[M1] CNN ─────────── Validasi: "ini plat kendaraan asli / bukan"
      │ (gagal → PERLU_VERIFIKASI)
      ▼
[M3] EasyOCR ─────── Baca teks stiker: "10 26" → bulan=10, tahun=2026
      │ (confidence < 0.6 → PERLU_VERIFIKASI)
      ▼
[M5] Agent Loop ──── Parse tanggal → bandingkan hari ini → verdict
      │               AKTIF / MATI / PERLU_VERIFIKASI
      ▼
[M4] LLM ─────────── Generate laporan 2-3 kalimat Bahasa Indonesia
      │
      ▼
JSON response → Frontend
```

---

## Screens (7 total, didesain di Google Stitch iOS 26 Liquid Glass)

| # | Screen | Route | File |
|---|--------|-------|------|
| 1 | Home / Welcome | `/` | HomeScreen.tsx |
| 2 | Capture / Scan | `/scan` | CaptureScreen.tsx |
| 3 | Processing | `/processing` | ProcessingScreen.tsx |
| 4 | Riwayat | `/history` | HistoryScreen.tsx |
| 5 | Result: AKTIF | `/result` | ResultAktif.tsx |
| 6 | Result: MATI | `/result` | ResultMati.tsx |
| 7 | Result: Perlu Verifikasi | `/result` | ResultVerifikasi.tsx |

Design language: iOS 26 Liquid Glass, light mode, system blue #007AFF primary.

---

## Struktur Folder

```
tilang-checker/
├── CLAUDE.md                     # Dibaca Claude Code otomatis
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # → HomeScreen
│   │   ├── scan/page.tsx         # → CaptureScreen
│   │   ├── processing/page.tsx   # → ProcessingScreen
│   │   ├── history/page.tsx      # → HistoryScreen
│   │   └── result/page.tsx       # → Result (kondisional)
│   ├── components/
│   │   ├── HomeScreen.tsx
│   │   ├── CaptureScreen.tsx
│   │   ├── ProcessingScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── ResultAktif.tsx
│   │   ├── ResultMati.tsx
│   │   └── ResultVerifikasi.tsx
│   ├── lib/
│   │   └── api.ts                # POST /check ke backend
│   ├── styles/globals.css        # CSS variables + .glass-card
│   └── package.json
│
├── backend/
│   ├── main.py                   # FastAPI entry + POST /check
│   ├── config.py                 # LLM_MODE = "local" | "gemini"
│   ├── pipeline/
│   │   ├── detect.py             # M2: YOLO
│   │   ├── classify.py           # M1: CNN
│   │   ├── ocr.py                # M3: EasyOCR
│   │   ├── agent.py              # M5: decision logic
│   │   └── report.py             # M4: LLM
│   ├── models/                   # Weight files (.pt)
│   └── requirements.txt
│
└── data/samples/                 # Foto plat test
```

---

## API Spec

### POST /check

```json
// Request
{ "image": "<base64 string>" }

// Response
{
  "status": "AKTIF",
  "plate_text": "L 1478 XK",
  "expiry_month": 10,
  "expiry_year": 2026,
  "current_date": "2026-06-09",
  "days_remaining": 113,
  "report": "Kendaraan plat L 1478 XK masa berlaku Oktober 2026. Masih aktif 113 hari.",
  "confidence": 0.91
}
```

Status: `AKTIF` | `MATI` | `PERLU_VERIFIKASI`

---

## Kode Inti

### config.py
```python
LLM_MODE = "local"          # ganti "gemini" sebelum deploy
GEMINI_API_KEY = ""
LOCAL_LLM_URL  = "http://localhost:1234/v1/chat/completions"
LOCAL_LLM_MODEL = "qwen2.5-coder-7b-instruct"
```

### pipeline/agent.py (M5)
```python
from datetime import date

def run_agent(detect_result, ocr_result):
    if not detect_result["found"]:
        return {"status": "PERLU_VERIFIKASI", "reason": "Plat tidak terdeteksi"}
    if not detect_result["is_valid_plate"]:
        return {"status": "PERLU_VERIFIKASI", "reason": "Bukan plat kendaraan"}

    month = ocr_result.get("month")
    year  = ocr_result.get("year")
    if not month or not year:
        return {"status": "PERLU_VERIFIKASI", "reason": "Tanggal tidak terbaca"}

    delta  = (date(year, month, 1) - date.today()).days
    return {
        "status": "AKTIF" if delta > 0 else "MATI",
        "expiry_month": month,
        "expiry_year": year,
        "days_remaining": delta
    }
```

### pipeline/report.py (M4)
```python
import requests, google.generativeai as genai
from config import LLM_MODE, GEMINI_API_KEY, LOCAL_LLM_URL, LOCAL_LLM_MODEL

def generate_report(plate_text, expiry_month, expiry_year, status, days_remaining):
    prompt = f"""Buat laporan singkat status kendaraan:
- Nomor plat: {plate_text}
- Masa berlaku STNK: {expiry_month}/{expiry_year}
- Status: {status}
- Sisa hari: {days_remaining}
Tulis 2-3 kalimat Bahasa Indonesia untuk petugas tilang."""

    if LLM_MODE == "local":
        res = requests.post(LOCAL_LLM_URL, json={
            "model": LOCAL_LLM_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 200
        })
        return res.json()["choices"][0]["message"]["content"]

    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel("gemini-2.0-flash").generate_content(prompt).text
```

---

## Timeline 3 Minggu

### Minggu 1 — Pipeline Backend (M2 + M3 + M5)
- [ ] Init repo + struktur folder
- [ ] M2: YOLO deteksi plat (pre-trained dulu)
- [ ] M3: EasyOCR baca tanggal dari crop
- [ ] M5: Agent logic + date comparison
- [ ] Test end-to-end di notebook: foto → verdict

### Minggu 2 — Lengkapi + Frontend (M1 + M4 + UI)
- [ ] M1: CNN classifier plat/bukan plat
- [ ] M4: LLM report (lokal → gemini fallback)
- [ ] Wrap semua ke FastAPI POST /check
- [ ] Claude Code via MCP konversi Stitch screens → Next.js components
- [ ] Connect frontend ke backend

### Minggu 3 — Polish + Deploy + Laporan
- [ ] Testing edge cases (foto gelap, miring, jauh)
- [ ] Switch LLM_MODE ke "gemini"
- [ ] Deploy backend → Railway
- [ ] Deploy frontend → Vercel (+ PWA config)
- [ ] Tulis laporan 10–15 halaman
- [ ] Siapkan demo 5 menit

---

## Pembagian Kerja (3 Orang)

| Anggota | Tugas |
|---------|-------|
| Orang 1 | M2 (YOLO) + M1 (CNN) |
| Orang 2 | M3 (OCR) + M5 (agent) + FastAPI |
| Orang 3 | M4 (LLM) + Frontend + Deploy |

---

## Cara Run

```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000

# LM Studio (terpisah) → port 1234 → Qwen2.5-Coder-7B

# Frontend
cd frontend && npm run dev → localhost:3000
```

## Cara Deploy

```bash
# Sebelum deploy: set LLM_MODE = "gemini" di config.py
cd backend && railway up
cd frontend && vercel deploy
```

---

## Kesesuaian Modul Capstone

- [x] M1: CNN classifier (plat valid / bukan)
- [x] M2: YOLOv8 object detection (plat + stiker)
- [x] M3: EasyOCR transformer (baca tanggal)
- [x] M4: LLM generative (laporan status)
- [x] M5: Agent decision loop (detect → OCR → compare → verdict → report)
