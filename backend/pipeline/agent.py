from datetime import date
from config import OCR_CONFIDENCE_THRESHOLD

def run_agent(detect_result: dict, ocr_result: dict) -> dict:
    """
    Plan → Act → Observe → Reflect loop.

    Step 1: Validasi deteksi plat
    Step 2: Validasi hasil OCR
    Step 3: Parse dan bandingkan tanggal
    Step 4: Return verdict final
    """

    # Step 1 — Cek deteksi
    if not detect_result.get("found"):
        return _verdict("PERLU_VERIFIKASI", "Plat tidak terdeteksi dalam foto", 0.0)
    if not detect_result.get("is_valid_plate"):
        return _verdict("PERLU_VERIFIKASI", "Objek bukan plat kendaraan", 0.0)

    # Step 2 — Cek OCR confidence
    confidence = ocr_result.get("confidence", 0.0)
    if confidence < OCR_CONFIDENCE_THRESHOLD:
        return _verdict("PERLU_VERIFIKASI",
                       f"Teks kurang jelas (confidence: {confidence:.0%})",
                       confidence)

    month = ocr_result.get("month")
    year  = ocr_result.get("year")
    if not month or not year:
        return _verdict("PERLU_VERIFIKASI", "Tanggal masa berlaku tidak terbaca", confidence)

    # Step 3 — Bandingkan dengan hari ini
    today  = date.today()
    expiry = date(year, month, 1)
    delta  = (expiry - today).days

    # Step 4 — Verdict
    status = "AKTIF" if delta > 0 else "MATI"
    reason = (f"Masa berlaku {expiry.strftime('%B %Y')}. "
              f"{'Masih aktif' if delta > 0 else 'Sudah mati'} "
              f"{abs(delta)} hari {'lagi' if delta > 0 else 'yang lalu'}.")

    return {
        "status":        status,
        "expiry_month":  month,
        "expiry_year":   year,
        "days_remaining": delta,
        "reason":        reason,
        "confidence":    confidence
    }

def _verdict(status: str, reason: str, confidence: float) -> dict:
    return {
        "status":        status,
        "expiry_month":  None,
        "expiry_year":   None,
        "days_remaining": None,
        "reason":        reason,
        "confidence":    confidence
    }
