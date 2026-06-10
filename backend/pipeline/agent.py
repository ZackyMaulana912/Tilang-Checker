import calendar
import re
from datetime import date
from config import OCR_CONFIDENCE_THRESHOLD


def extract_plate_text(ocr_results: list) -> str:
    """
    Parse nomor plat dari raw EasyOCR output.
    Filter noise (nama kota, tanggal, merk kendaraan) sebelum match.
    """
    all_texts = []
    for item in ocr_results:
        if isinstance(item, (list, tuple)):
            text = item[1] if len(item) > 1 else str(item[0])
        else:
            text = str(item)
        all_texts.append(text.upper().strip())

    noise_patterns = [
        r'^[A-Z]{5,}$',       # kata panjang tanpa angka (nama kota/kelurahan)
        r'^\d{2}\.\d{2}$',    # format tanggal MM.YY
        r'^\d{2}/\d{2}$',     # format tanggal MM/YY
        r'^HONDA$', r'^YAMAHA$', r'^SUZUKI$', r'^KAWASAKI$',
    ]

    filtered = []
    for text in all_texts:
        clean = re.sub(r'\s+', '', text)
        if not any(re.match(p, clean) for p in noise_patterns):
            filtered.append(text)

    combined = ' '.join(filtered)
    m = re.search(r'([A-Z]{1,2})\s*(\d{1,4})\s*([A-Z]{1,3})', combined)
    if m:
        return f"{m.group(1)} {m.group(2)} {m.group(3)}"
    return "UNKNOWN"


def extract_expiry(ocr_results: list) -> tuple[int, int] | None:
    """
    Parse tanggal kadaluarsa STNK dari raw EasyOCR output.
    Support format MM.YY, MM/YY, MM-YY.
    """
    all_texts = []
    for item in ocr_results:
        if isinstance(item, (list, tuple)):
            text = item[1] if len(item) > 1 else str(item[0])
        else:
            text = str(item)
        all_texts.append(text.strip())

    combined = ' '.join(all_texts)
    m = re.search(r'(\d{2})[.\-/](\d{2})', combined)
    if m:
        month = int(m.group(1))
        year  = 2000 + int(m.group(2))
        if 1 <= month <= 12 and year >= 2020:
            return month, year
    return None

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

    # Step 2 — Cek tanggal STNK + confidence
    # Cek tanggal dulu: kalau sudah terbaca, confidence avg tidak relevan
    # (avg bisa rendah karena token noise di gambar, padahal tanggal valid)
    month      = ocr_result.get("month")
    year       = ocr_result.get("year")
    confidence = ocr_result.get("confidence", 0.0)

    if not month or not year:
        if confidence < OCR_CONFIDENCE_THRESHOLD:
            return _verdict("PERLU_VERIFIKASI",
                           f"Teks kurang jelas (confidence: {confidence:.0%})",
                           confidence)
        return _verdict("PERLU_VERIFIKASI", "Tanggal masa berlaku tidak terbaca", confidence)

    # Step 3 — Bandingkan dengan hari ini.
    # STNK berlaku hingga AKHIR bulan, jadi pakai tanggal terakhir bulan tsb,
    # bukan tanggal 1 (kalau pakai tanggal 1, kendaraan yang masih sah di bulan
    # berjalan bisa salah dinyatakan MATI sampai ~30 hari lebih awal).
    today    = date.today()
    last_day = calendar.monthrange(year, month)[1]
    expiry   = date(year, month, last_day)
    delta    = (expiry - today).days

    # Step 4 — Verdict (delta == 0 berarti expiry hari ini → masih AKTIF)
    status = "AKTIF" if delta >= 0 else "MATI"
    reason = (f"Masa berlaku {expiry.strftime('%B %Y')}. "
              f"{'Masih aktif' if delta >= 0 else 'Sudah mati'} "
              f"{abs(delta)} hari {'lagi' if delta >= 0 else 'yang lalu'}.")

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
