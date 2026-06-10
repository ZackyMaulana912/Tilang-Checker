# Tilang Checker — Backend

FastAPI backend untuk deteksi masa berlaku STNK dari foto plat kendaraan Indonesia.

---

## Pipeline

Setiap request `POST /check` menjalankan 5 modul berurutan:

```
Foto (base64)
   │
   ▼
[M2] detect.py    YOLOv8 — deteksi kendaraan, crop area plat, CLAHE enhancement
   ▼
[M1] classify.py  MobileNetV2 — validasi apakah crop adalah plat (fallback rule-based)
   ▼
[M3] ocr.py       EasyOCR — baca bulan/tahun dari stiker STNK, normalisasi karakter
   ▼
[M5] agent.py     Logika — bandingkan tanggal dengan hari ini → AKTIF / MATI
   ▼
[M4] report.py    LLM (Gemini / lokal) — susun laporan, fallback ke template
```

---

## Setup Lokal

**Prasyarat:** Python 3.11

```bash
cd backend

# Buat virtual environment
python3.11 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Salin file env
cp .env.example .env             # lalu isi sesuai kebutuhan

# Jalankan server
uvicorn main:app --reload --port 8000
```

Cek server:
```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

> Saat request `/check` pertama, EasyOCR dan YOLO akan mengunduh model (~ratusan MB).
> Ini hanya terjadi sekali.

---

## Environment Variables

Buat file `backend/.env`:

```bash
LLM_MODE=local                              # "local" atau "gemini"
GEMINI_API_KEY=                             # isi jika LLM_MODE=gemini
LOCAL_LLM_URL=http://localhost:1234/v1/chat/completions
LOCAL_LLM_MODEL=lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF
```

Untuk production di HuggingFace, set via **Settings → Repository secrets**.

---

## API

### `GET /health`
```json
{ "status": "ok" }
```

### `POST /check`

**Request body:**
```json
{ "image": "<base64 tanpa prefix data:...;base64,>" }
```

**Response:**
```json
{
  "status": "AKTIF",
  "plate_text": "B 537 RUM",
  "expiry_month": 6,
  "expiry_year": 2027,
  "days_remaining": 386,
  "report": "Kendaraan B 537 RUM memiliki masa berlaku STNK Juni 2027...",
  "confidence": 0.91
}
```

`status` — salah satu dari:
- `AKTIF` — STNK masih berlaku
- `MATI` — STNK sudah habis
- `PERLU_VERIFIKASI` — OCR tidak bisa baca tanggal dengan yakin

**Contoh curl:**
```bash
curl -X POST http://localhost:8000/check \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$(base64 -i ../data/samples/test2.jpg)\"}"
```

---

## Struktur Folder

```
backend/
├── main.py              # FastAPI app — endpoint /health dan /check
├── config.py            # Baca env, konstanta threshold
├── requirements.txt
├── Dockerfile           # Untuk deploy ke HuggingFace Spaces (port 7860)
├── nixpacks.toml        # Untuk deploy ke Railway
├── railway.json
├── Procfile
├── runtime.txt
└── pipeline/
    ├── detect.py        # M2 — YOLOv8 + CLAHE preprocessing
    ├── classify.py      # M1 — MobileNetV2 plate validator
    ├── ocr.py           # M3 — EasyOCR + parser tanggal & plat
    ├── agent.py         # M5 — verdict AKTIF/MATI/PERLU_VERIFIKASI
    └── report.py        # M4 — generate laporan via LLM
```

---

## Deploy

### HuggingFace Spaces (Docker)
1. Push isi folder `backend/` ke HF Space repo
2. SDK: Docker, port: 7860
3. Set secrets: `LLM_MODE=gemini`, `GEMINI_API_KEY=<key>`

### Railway
1. Connect repo GitHub, root directory: `backend/`
2. Nixpacks sudah dikonfigurasi di `nixpacks.toml`
3. Set environment variable yang sama

---

## Catatan Teknis

- **CLAHE preprocessing** diterapkan sebelum YOLO dan OCR untuk foto gelap/redup
- **OCR digit rejoin** — EasyOCR kadang pisah `0 9` jadi dua token; pipeline menggabungnya per token
- **Token-based plate assembly** — kode area plat (`L`, `B`, dll.) yang terbaca terpisah dari nomor tetap bisa dirakit
- **Confidence threshold** — variant OCR dengan rata-rata confidence < 0.15 diabaikan untuk hindari false positive
- Model `yolov8n.pt` akan diunduh otomatis oleh Ultralytics jika belum ada
