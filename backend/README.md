---
title: Tilang Checker Backend
emoji: 🚗
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# Tilang Checker — Backend

API deteksi masa berlaku STNK dari foto plat kendaraan Indonesia.
Pipeline: YOLOv8 (detect) → MobileNetV2 (classify) → EasyOCR (baca tanggal)
→ agent logic → LLM report (Gemini).

## Endpoints

- `GET /health` → `{"status": "ok"}`
- `POST /check` → body `{ "image": "<base64>" }`, return status STNK
  (AKTIF / MATI / PERLU_VERIFIKASI) beserta tanggal & laporan.

## Secrets (set di Space → Settings → Repository secrets)

- `LLM_MODE=gemini`
- `GEMINI_API_KEY=<key kamu>`
