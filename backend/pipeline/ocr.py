import easyocr
import re
import numpy as np
from PIL import Image, ImageEnhance, ImageOps, ImageFilter
import io

_reader = None

def _get_reader():
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(['id', 'en'], gpu=False)
    return _reader

def normalize_ocr(text: str) -> str:
    """Fix karakter OCR yang sering salah baca."""
    return (text.upper()
                .replace("O", "0")
                .replace("I", "1")
                .replace("L", "1")
                .replace("S", "5")
                .replace("B", "8")
                .replace("?", "1")   # misread titik atau angka
                .replace("·", ".")   # middle dot (·) unicode
                .replace("•", ".")   # bullet (•)
                .replace("・", ".")  # katakana middle dot
                # D dan J = OCR misread dari "·3" (titik tengah + digit 3 gabung jadi satu glyph)
                .replace("D", "3")
                .replace("J", "3")
                )

def parse_expiry(texts: list[str]) -> dict:
    """
    Cari pola bulan/tahun dari list teks OCR.

    Format stiker STNK Indonesia:
      - MM/YY, MM-YY, MM.YY, MM*YY, MM"YY → "04/22", "09-27", "04.20", "04*22"
      - MM YY (spasi)                       → "04 22"
      - MM[sep]D D (spasi dalam tahun)      → "08.2 9" → 8/29
      - G[M]·YY (prefix huruf, 1 digit)     → "G6·27", "G6 27" → 6/27
      - MMYY (tanpa separator)              → "0422"
    """
    def _clean_token(t: str) -> str:
        t = re.sub(r"^['\"`]+", '', t)           # strip leading OCR noise: "'2 9" → "2 9"
        t = re.sub(r'(\d)\s+(\d)', r'\1\2', t)  # rejoin split digits dalam satu token: "0 9" → "09"
        return t

    combined = " ".join(normalize_ocr(_clean_token(t)) for t in texts)

    # Separator yang dikenali.
    # " (double quote) = OCR sering baca * sebagai "
    # D dan J sudah dinormalisasi ke "3" di normalize_ocr
    SEP = r'[/\-.*,"]'

    patterns = [
        # 1. Dua digit bulan + separator + dua digit tahun: "04*22", "04.20"
        (
            rf'[A-Z]?(0[1-9]|1[0-2])\s*{SEP}\s*(\d{{2}})\b',
            lambda m: (int(m.group(1)), 2000 + int(m.group(2)))
        ),
        # 2. Dua digit bulan + spasi + dua digit tahun: "04 22"
        (
            r'\b(0[1-9]|1[0-2])\s+(\d{2})\b',
            lambda m: (int(m.group(1)), 2000 + int(m.group(2)))
        ),
        # 3. Dua digit bulan + separator + tahun terpisah spasi: "08.2 9" → 8/29
        (
            rf'[A-Z]?(0[1-9]|1[0-2])\s*{SEP}\s*(\d)\s+(\d)\b',
            lambda m: (int(m.group(1)), 2000 + int(m.group(2)) * 10 + int(m.group(3)))
        ),
        # 4. Prefix huruf (di awal kata) + satu digit bulan + separator + dua digit tahun: "G6.27"
        (
            rf'\b[A-Z]([1-9])\s*{SEP}\s*(\d{{2}})\b',
            lambda m: (int(m.group(1)), 2000 + int(m.group(2)))
        ),
        # 5. Prefix huruf (di awal kata) + satu digit bulan + spasi + dua digit tahun: "G6 27"
        (
            r'\b[A-Z]([1-9])\s+(\d{2})\b',
            lambda m: (int(m.group(1)), 2000 + int(m.group(2)))
        ),
        # 6. Prefix huruf + satu digit bulan + separator + tahun terpisah spasi
        (
            rf'\b[A-Z]([1-9])\s*{SEP}\s*(\d)\s+(\d)\b',
            lambda m: (int(m.group(1)), 2000 + int(m.group(2)) * 10 + int(m.group(3)))
        ),
        # 7. MMYY tanpa separator: "0422" (fallback)
        (
            r'\b(0[1-9]|1[0-2])(\d{2})\b',
            lambda m: (int(m.group(1)), 2000 + int(m.group(2)))
        ),
        # 8. MMNYY: 5 digit, digit tengah = separator yg salah baca jadi angka ("06216" → 06/16)
        (
            r'\b(0[1-9]|1[0-2])\d(\d{2})\b',
            lambda m: (int(m.group(1)), 2000 + int(m.group(2)))
        ),
    ]

    for pattern, handler in patterns:
        match = re.search(pattern, combined)
        if match:
            try:
                month, year = handler(match)
                if 1 <= month <= 12 and 2000 <= year <= 2050:
                    return {"month": month, "year": year, "raw": combined}
            except Exception:
                continue

    return {"month": None, "year": None, "raw": combined}


def parse_plate(texts: list[str]) -> str | None:
    """
    Rekonstruksi nomor plat Indonesia dari token OCR MENTAH.

    PENTING: jangan pakai teks yang sudah dinormalisasi (normalize_ocr),
    karena B->8, O->0, I->1 dll akan merusak huruf plat
    (mis. "B 537 RUM" jadi "8 537 RUM"). Pakai teks asli dari EasyOCR.

    Format plat: 1-2 huruf (kode area) + 1-4 angka + 1-3 huruf.
    Cover variasi spasi: "B 537 RUM", "B537RUM", "B 537RUM", "B537 RUM".
    """
    # Filter noise: kata panjang tanpa angka (nama kota, kelurahan, merk kendaraan)
    filtered = [t for t in texts if not re.match(r'^[A-Za-z]{5,}$', t.strip())]
    # Rejoin digit yang OCR pisah dalam satu token: "49 27" → "4927"
    raw = " ".join(re.sub(r'(\d)\s+(\d)', r'\1\2', t).upper() for t in filtered)
    # Buang karakter selain huruf/angka, sisakan spasi sebagai pemisah
    cleaned = re.sub(r"[^A-Z0-9 ]", " ", raw)

    # Format lengkap: prefix(1-2 huruf) + angka(1-4) + suffix(1-3 huruf)
    m = re.search(r"\b([A-Z]{1,2})\s*([0-9]{1,4})\s*([A-Z]{1,3})\b", cleaned)
    standard_result = f"{m.group(1)} {m.group(2)} {m.group(3)}" if m else None

    # Token-based assembly: kode area sering terbaca terpisah dari angka/suffix
    # Contoh: "L", "EP]", "1901" → "L 1901 EP"
    clean_tokens = [re.sub(r"[^A-Z0-9]", "", t.upper()) for t in filtered]
    single_letters = [t for t in clean_tokens if re.match(r'^[A-Z]$', t)]
    numbers        = [t for t in clean_tokens if re.match(r'^[0-9]{3,4}$', t)]
    suffixes       = [t for t in clean_tokens if re.match(r'^[A-Z]{2,3}$', t)]

    if single_letters and numbers and suffixes:
        token_result = f"{single_letters[0]} {numbers[0]} {suffixes[0]}"
        # Gunakan token_result jika standard tidak pakai single-letter area code tsb
        if standard_result is None or not standard_result.startswith(single_letters[0] + ' '):
            return token_result

    if standard_result:
        return standard_result

    # Fallback: angka + suffix tanpa prefix (kode area tidak terbaca OCR)
    m2 = re.search(r"\b([0-9]{3,4})\s+([A-Z]{2,3})\b", cleaned)
    if m2:
        return f"{m2.group(1)} {m2.group(2)}"

    return None


def _preprocess_variants(image: Image.Image) -> list[Image.Image]:
    """
    Buat beberapa varian gambar untuk dicoba OCR-nya.
    TRUE ORIGINAL selalu pertama agar tidak ter-overwrite oleh preprocessing.
    """
    arr = np.array(image)
    brightness = float(arr.mean())
    w, h = image.size

    # True original selalu pertama
    variants: list[Image.Image] = [image]

    # Upscale untuk gambar kecil — sebagai varian tambahan, BUKAN pengganti original
    if min(w, h) < 300:
        scale = max(2, 300 // min(w, h))
        upscaled = image.resize((w * scale, h * scale), Image.LANCZOS)
        base = upscaled
        variants.append(upscaled)
    else:
        base = image

    # Crop bagian bawah 45% — area stiker STNK sering ada di sini
    if h >= 300:
        bottom = image.crop((0, int(h * 0.55), w, h))
        if bottom.height >= 60:
            variants.append(bottom)

    # Sharpen — bantu OCR baca karakter kecil/buram
    variants.append(image.filter(ImageFilter.SHARPEN))

    if brightness < 100:
        # Foto gelap: boost brightness + contrast
        enhanced = ImageEnhance.Contrast(
            ImageEnhance.Brightness(base).enhance(2.5)
        ).enhance(2.0)
        variants.append(enhanced)
        variants.append(ImageOps.autocontrast(base, cutoff=2))
    elif brightness > 160:
        # Background terang (plat putih): invert agar teks jadi gelap
        variants.append(ImageOps.invert(base))
        variants.append(ImageOps.autocontrast(base, cutoff=2))
    else:
        variants.append(ImageOps.autocontrast(base, cutoff=2))
        if brightness < 130:
            variants.append(
                ImageEnhance.Contrast(
                    ImageEnhance.Brightness(base).enhance(1.8)
                ).enhance(1.5)
            )

    return variants


def read_expiry_date(image_bytes: bytes) -> dict:
    """
    Input : crop image bytes (JPEG atau PNG, RGBA ok)
    Output: {
        "month": int | None,
        "year": int | None,
        "confidence": float,
        "raw_text": str
    }
    """
    # Konversi RGBA → RGB
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode != "RGB":
        image = image.convert("RGB")

    variants = _preprocess_variants(image)

    best: dict = {"month": None, "year": None, "confidence": 0.0, "raw_text": ""}
    best_plate: str | None = None
    best_plate_conf = 0.0

    for variant in variants:
        img_array = np.array(variant)
        results = _get_reader().readtext(img_array)

        # Log mentah supaya kelihatan di Railway/HuggingFace logs saat debugging
        print("RAW OCR OUTPUT:", [(t, round(float(c), 2)) for _, t, c in results])

        if not results:
            continue

        texts    = [r[1] for r in results]
        conf_avg = sum(r[2] for r in results) / len(results)

        # Plat: ekstrak dari teks MENTAH (texts), JANGAN dari teks ternormalisasi.
        plate = parse_plate(texts)
        if plate and conf_avg > best_plate_conf:
            best_plate = plate
            best_plate_conf = conf_avg

        parsed   = parse_expiry(texts)

        current = {
            "month":      parsed["month"],
            "year":       parsed["year"],
            "confidence": conf_avg,
            "raw_text":   parsed["raw"],
        }

        # Coba semua varian, ambil yang terbaik:
        # - ada tanggal + confidence >= 0.15 (filter false-positive dari variant noise)
        # - jika tidak ada tanggal, ambil yang confidence tertinggi
        if current["month"] is not None and current["confidence"] >= 0.15:
            if best["month"] is None or current["confidence"] > best["confidence"]:
                best = current
        elif best["month"] is None and current["confidence"] > best["confidence"]:
            best = current

    best["plate_text"] = best_plate
    return best
