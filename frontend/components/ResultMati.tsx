'use client';

const BULAN: Record<number, string> = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
  5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
  9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember',
};

interface ResultMatiProps {
  plateText: string;
  expiryMonth: number | null;
  expiryYear: number | null;
  daysOverdue: number;
  report: string;
  thumbnailUrl?: string;
  onBack: () => void;
  onCheckAgain: () => void;
  onSave: () => void;
}

export default function ResultMati({
  plateText,
  expiryMonth,
  expiryYear,
  daysOverdue,
  report,
  thumbnailUrl,
  onBack,
  onCheckAgain,
  onSave,
}: ResultMatiProps) {
  const expiryDate = expiryMonth && expiryYear
    ? `${BULAN[expiryMonth]} ${expiryYear}`
    : '—';
  return (
    <div className="min-h-screen antialiased" style={{ background: '#FFF5F5', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center justify-between px-4 h-16"
        style={{
          background: 'var(--glass-white)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid var(--glass-border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform"
          style={{ color: 'var(--blue)' }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-semibold" style={{ fontSize: '17px', color: 'var(--blue)' }}>
          Hasil Analisis
        </h1>
        <div className="w-10 h-10" />
      </header>

      {/* Main */}
      <main className="pt-24 pb-32 px-4 max-w-2xl mx-auto flex flex-col gap-4">
        {/* Thumbnail */}
        {thumbnailUrl && (
          <div className="glass-card w-full rounded-[20px] overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <div className="w-full h-full relative" style={{ background: 'var(--bg-secondary)' }}>
              <img src={thumbnailUrl} alt="Foto plat" className="w-full h-full object-cover" />
              <div
                className="absolute inset-4 rounded-lg"
                style={{ border: '2px solid rgba(255,59,48,0.5)', mixBlendMode: 'overlay' }}
              />
            </div>
          </div>
        )}

        {/* Status card — red glass */}
        <div
          className="rounded-[20px] p-8 flex flex-col items-center text-center"
          style={{
            background: 'var(--glass-red)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(255,59,48,0.5)',
            boxShadow: '0 8px 32px rgba(255,59,48,0.08)',
          }}
        >
          <span
            className="material-symbols-outlined mb-2"
            style={{ fontSize: '48px', color: 'var(--red)', fontVariationSettings: "'FILL' 1" }}
          >
            cancel
          </span>
          <h2
            className="font-bold tracking-tighter mb-1"
            style={{ fontSize: '34px', lineHeight: '41px', color: '#8B1E1E' }}
          >
            MATI
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--red)' }}>Masa berlaku sudah habis</p>
        </div>

        {/* Warning pill */}
        <div
          className="flex items-start gap-3 p-4 rounded-[12px]"
          style={{
            background: 'rgba(255,193,7,0.15)',
            backdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(255,193,7,0.4)',
            color: '#7D5A00',
          }}
        >
          <span className="material-symbols-outlined mt-1" style={{ fontSize: '20px' }}>error</span>
          <p style={{ fontSize: '13px', flex: 1 }}>
            Kendaraan ini dapat dikenakan tilang sesuai UU LLAJ Pasal 288.
          </p>
        </div>

        {/* Details card */}
        <div className="glass-card p-4 rounded-[20px]">
          <h3
            className="pb-2 mb-2"
            style={{ fontSize: '16px', color: 'var(--label-secondary)', borderBottom: '0.5px solid var(--glass-border)' }}
          >
            Rincian Kendaraan
          </h3>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex justify-between items-center py-2">
              <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Nomor Polisi</span>
              <span
                className="font-medium"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', letterSpacing: '0.5px', color: 'var(--label-primary)' }}
              >
                {plateText}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>Masa Berlaku Pajak</span>
              <span style={{ fontSize: '15px', color: 'var(--label-primary)' }}>{expiryDate}</span>
            </div>
            <div
              className="flex justify-between items-center py-2 -mx-4 px-4 rounded-lg"
              style={{ background: 'rgba(255,59,48,0.08)' }}
            >
              <span className="font-medium" style={{ fontSize: '13px', color: '#8B1E1E' }}>Sisa Hari</span>
              <span className="font-bold" style={{ fontSize: '22px', color: 'var(--red)' }}>
                -{daysOverdue} hari
              </span>
            </div>
          </div>
        </div>

        {/* Report */}
        {report && (
          <div className="glass-card p-4 rounded-[20px]">
            <h3
              className="pb-2 mb-2"
              style={{ fontSize: '16px', color: 'var(--label-secondary)', borderBottom: '0.5px solid var(--glass-border)' }}
            >
              Analisis AI
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--label-primary)', lineHeight: '1.6' }}>{report}</p>
          </div>
        )}
      </main>

      {/* Floating action buttons */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 pb-8"
        style={{ background: 'linear-gradient(to top, #FFF5F5, rgba(255,245,245,0.9), transparent)' }}
      >
        <div className="max-w-2xl mx-auto flex gap-4">
          <button
            onClick={onSave}
            className="flex-1 glass-card py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform font-medium"
            style={{ fontSize: '17px', color: 'var(--blue)', border: '1px solid rgba(0,122,255,0.3)' }}
          >
            <span className="material-symbols-outlined">bookmark</span>
            Simpan Hasil
          </button>
          <button
            onClick={onCheckAgain}
            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform font-medium text-white"
            style={{ fontSize: '17px', background: 'var(--blue)', boxShadow: '0 4px 16px rgba(0,122,255,0.2)' }}
          >
            <span className="material-symbols-outlined">refresh</span>
            Cek Lagi
          </button>
        </div>
      </div>
    </div>
  );
}
