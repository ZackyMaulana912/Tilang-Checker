from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64

from pipeline.detect   import detect_plate
from pipeline.classify import is_valid_plate
from pipeline.ocr      import read_expiry_date
from pipeline.agent    import run_agent

app = FastAPI(title="Tilang Checker API")

app.add_middleware(
    CORSMiddleware,
    # localhost untuk dev; regex menutup SEMUA subdomain vercel.app & railway.app
    # (termasuk preview deploy yang prefix-nya acak). Wildcard string seperti
    # "https://*.vercel.app" TIDAK didukung Starlette — harus lewat regex.
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.(vercel\.app|up\.railway\.app)",
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)


class CheckRequest(BaseModel):
    image: str  # base64 string


class CheckResponse(BaseModel):
    status:         str
    plate_text:     str
    expiry_month:   int | None
    expiry_year:    int | None
    days_remaining: int | None
    report:         str
    confidence:     float


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/check", response_model=CheckResponse)
async def check_plate(req: CheckRequest):
    try:
        image_bytes = base64.b64decode(req.image)
    except Exception:
        raise HTTPException(400, "Invalid base64 image")

    # M2: Deteksi kendaraan / crop plat
    detect_result = detect_plate(image_bytes)

    # M1: Klasifikasi apakah crop valid plat kendaraan
    crop = detect_result.get("crop_bytes") or image_bytes
    classify_result = is_valid_plate(crop)
    if not classify_result["is_valid"]:
        detect_result["is_valid_plate"] = False

    # M3: OCR tanggal berlaku STNK
    ocr_result = read_expiry_date(crop)

    # M5: Agent decision loop
    agent_result = run_agent(detect_result, ocr_result)

    # M4: Generate laporan (import lazy agar LLM tidak block startup)
    from pipeline.report import generate_report
    report = generate_report(
        plate_text     = "UNKNOWN",
        expiry_month   = agent_result.get("expiry_month"),
        expiry_year    = agent_result.get("expiry_year"),
        status         = agent_result["status"],
        days_remaining = agent_result.get("days_remaining"),
    )

    return CheckResponse(
        status         = agent_result["status"],
        plate_text     = "UNKNOWN",
        expiry_month   = agent_result.get("expiry_month"),
        expiry_year    = agent_result.get("expiry_year"),
        days_remaining = agent_result.get("days_remaining"),
        report         = report,
        confidence     = agent_result["confidence"],
    )
