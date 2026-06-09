'use client';

interface ResultAktifProps {
  plateText: string;
  expiryMonth: number;
  expiryYear: number;
  daysRemaining: number;
  checkDate: string;
  report: string;
  confidence: number;
  thumbnailUrl?: string;
  onBack: () => void;
  onCheckAgain: () => void;
  onSave: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function ResultAktif({
  plateText,
  expiryMonth,
  expiryYear,
  daysRemaining,
  checkDate,
  report,
  thumbnailUrl,
  onBack,
  onCheckAgain,
  onSave,
}: ResultAktifProps) {
  return (
    <div
      className="min-h-screen pb-24 antialiased"
      style={{ background: '#F0FFF4', fontFamily: 'Inter, sans-serif' }}
    >
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
        <h1
          className="font-semibold absolute left-1/2 -translate-x-1/2"
          style={{ fontSize: '17px', color: 'var(--blue)' }}
        >
          Hasil Analisis
        </h1>
        <div className="w-10 h-10" />
      </header>

      {/* Main */}
      <main className="pt-24 px-4 pb-8 flex flex-col gap-4 max-w-md mx-auto">
        {/* Thumbnail */}
        {thumbnailUrl && (
          <div className="glass-card w-[160px] h-[90px] rounded-xl overflow-hidden relative flex-shrink-0 self-center">
            <img src={thumbnailUrl} alt="Plat nomor" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Status card — green glass */}
        <div
          className="w-full rounded-[20px] p-5 flex flex-col items-center text-center relative overflow-hidden"
          style={{
            background: 'var(--glass-green)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '0.5px solid var(--green)',
            boxShadow: '0 8px 32px rgba(52,199,89,0.1)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)' }} />
          <span
            className="material-symbols-outlined mb-2"
            style={{ fontSize: '32px', color: 'var(--green)', fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <h2
            className="font-bold uppercase tracking-wider mb-1"
            style={{ fontSize: '40px', lineHeight: '48px', color: '#1D6B38' }}
          >
            Aktif
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--green)' }}>Masa berlaku belum habis</p>
        </div>

        {/* Details card */}
        <div className="glass-card rounded-[20px] p-5 flex flex-col gap-4">
          <div
            className="flex flex-col items-center pb-4"
            style={{ borderBottom: '0.5px solid var(--glass-border)' }}
          >
            <span
              className="uppercase tracking-wider mb-2"
              style={{ fontSize: '12px', color: 'var(--label-secondary)' }}
            >
              Plat Nomor
            </span>
            <span
              className="font-semibold"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '28px',
                letterSpacing: '4px',
                color: 'var(--label-primary)',
              }}
            >
              {plateText}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '17px', color: 'var(--label-secondary)' }}>Masa Berlaku</span>
              <span className="font-semibold" style={{ fontSize: '17px', color: 'var(--label-primary)' }}>
                {MONTH_NAMES[expiryMonth - 1]} {expiryYear}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '17px', color: 'var(--label-secondary)' }}>Sisa Hari</span>
              <span className="font-bold" style={{ fontSize: '17px', color: 'var(--green)' }}>
                {daysRemaining} hari
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '17px', color: 'var(--label-secondary)' }}>Tanggal Cek</span>
              <span style={{ fontSize: '17px', color: 'var(--label-primary)' }}>{checkDate}</span>
            </div>
          </div>
        </div>

        {/* AI Report card */}
        <div className="glass-card rounded-[20px] relative overflow-hidden flex flex-col">
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'var(--orange)' }} />
          <div className="p-5 pl-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--orange)', fontSize: '18px' }}>✦</span>
              <h3 className="font-semibold" style={{ fontSize: '16px', color: 'var(--label-primary)' }}>Laporan AI</h3>
            </div>
            <p className="leading-relaxed" style={{ fontSize: '15px', color: 'var(--label-secondary)' }}>{report}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={onCheckAgain}
            className="w-full py-4 font-semibold flex items-center justify-center text-white active:scale-95 transition-transform"
            style={{ fontSize: '16px', background: 'var(--blue)', borderRadius: 'var(--radius-btn)', boxShadow: '0 4px 12px rgba(0,122,255,0.3)' }}
          >
            Cek Lagi
          </button>
          <button
            onClick={onSave}
            className="w-full py-4 font-semibold flex items-center justify-center active:scale-95 transition-transform"
            style={{
              fontSize: '16px',
              color: 'var(--blue)',
              borderRadius: 'var(--radius-btn)',
              background: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0,122,255,0.3)',
            }}
          >
            Simpan Hasil
          </button>
        </div>
      </main>
    </div>
  );
}
