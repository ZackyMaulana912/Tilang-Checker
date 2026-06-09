from config import LLM_MODE, GEMINI_API_KEY, LOCAL_LLM_URL, LOCAL_LLM_MODEL
import requests

BULAN = {
    1:  "Januari",  2:  "Februari", 3:  "Maret",    4:  "April",
    5:  "Mei",      6:  "Juni",     7:  "Juli",      8:  "Agustus",
    9:  "September",10: "Oktober",  11: "November",  12: "Desember",
}

def _template(plate_text: str, expiry_month: int | None,
              expiry_year: int | None, status: str,
              days_remaining: int | None) -> str:
    bulan_str = BULAN.get(expiry_month, str(expiry_month)) if expiry_month else "?"
    tahun_str = str(expiry_year) if expiry_year else "?"
    tanggal   = f"{bulan_str} {tahun_str}"

    if status == "AKTIF":
        return (f"STNK kendaraan {plate_text} masih aktif hingga {tanggal}. "
                f"Sisa {days_remaining} hari lagi sebelum masa berlaku habis.")
    elif status == "MATI":
        lewat = abs(days_remaining) if days_remaining is not None else "?"
        return (f"STNK kendaraan {plate_text} sudah kadaluarsa sejak {tanggal}. "
                f"Lewat {lewat} hari — segera perpanjang agar tidak terkena tilang!")
    return ("Tidak dapat membaca data STNK dari foto. "
            "Mohon coba lagi dengan foto yang lebih jelas, pencahayaan cukup, "
            "dan stiker terlihat penuh.")

def generate_report(
    plate_text:     str,
    expiry_month:   int | None,
    expiry_year:    int | None,
    status:         str,
    days_remaining: int | None,
) -> str:
    base = _template(plate_text, expiry_month, expiry_year, status, days_remaining)

    if LLM_MODE == "local":
        return _call_local_llm(base) or base
    if LLM_MODE == "gemini" and GEMINI_API_KEY:
        return _call_gemini(base) or base
    return base


def _build_prompt(context: str) -> str:
    return (
        "Kamu adalah asisten pengecekan masa berlaku STNK kendaraan bermotor Indonesia. "
        "Tulis ulang laporan berikut menjadi 1-2 kalimat yang natural, informatif, dan sopan "
        "(bahasa Indonesia). Jangan tambah info yang tidak ada. Laporan:\n" + context
    )


def _call_local_llm(context: str) -> str | None:
    try:
        resp = requests.post(
            LOCAL_LLM_URL,
            json={
                "model":       LOCAL_LLM_MODEL,
                "messages":    [{"role": "user", "content": _build_prompt(context)}],
                "max_tokens":  120,
                "temperature": 0.3,
            },
            timeout=5,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


def _call_gemini(context: str) -> str | None:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(_build_prompt(context))
        return response.text.strip()
    except Exception:
        return None
