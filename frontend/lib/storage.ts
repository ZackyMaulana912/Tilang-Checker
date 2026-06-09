// Penyimpanan riwayat pengecekan di localStorage (client-side, tanpa backend).

export interface HistoryItem {
  id: string;
  plate_text: string;
  status: "AKTIF" | "MATI" | "PERLU_VERIFIKASI";
  expiry_month: number | null;
  expiry_year: number | null;
  days_remaining: number | null;
  checked_at: string; // ISO timestamp
  vehicle_type: "car" | "motorcycle";
}

const KEY = "tilang_history";

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveHistory(item: Omit<HistoryItem, "id" | "checked_at">): void {
  if (typeof window === "undefined") return;
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: Date.now().toString(),
    checked_at: new Date().toISOString(),
  };
  history.unshift(newItem);
  // Simpan maksimal 50 item terakhir
  localStorage.setItem(KEY, JSON.stringify(history.slice(0, 50)));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
