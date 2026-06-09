const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface CheckResult {
  status:         "AKTIF" | "MATI" | "PERLU_VERIFIKASI";
  plate_text:     string;
  expiry_month:   number | null;
  expiry_year:    number | null;
  days_remaining: number | null;
  report:         string;
  confidence:     number;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => {
      const result = reader.result as string;
      // strip "data:image/jpeg;base64," prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Resize gambar ke maksimal 1280px di sisi terpanjang (rasio dijaga) lalu
 * compress ke JPEG quality 85. Mengurangi ukuran upload & mempercepat OCR.
 * Pakai Canvas API browser — tidak butuh library tambahan.
 * Return base64 tanpa prefix "data:image/...;base64,".
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      const maxSize = 1280;
      let w = img.width;
      let h = img.height;
      if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
      else if (h > maxSize)     { w = (w * maxSize) / h; h = maxSize; }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function checkPlate(file: File): Promise<CheckResult> {
  const base64 = await fileToBase64(file);
  const res = await fetch(`${API_URL}/check`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ image: base64 }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<CheckResult>;
}

export async function checkPlateBase64(base64: string): Promise<CheckResult> {
  const res = await fetch(`${API_URL}/check`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ image: base64 }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<CheckResult>;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
