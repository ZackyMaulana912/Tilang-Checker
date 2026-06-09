'use client';

interface HomeScreenProps {
  onStartScan: () => void;
  onViewHistory: () => void;
}

export default function HomeScreen({ onStartScan, onViewHistory }: HomeScreenProps) {
  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'var(--bg-secondary)' }}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[80px]" style={{ background: 'rgba(0,122,255,0.12)' }} />
        <div className="absolute bottom-1/4 -right-24 w-72 h-72 rounded-full blur-[60px]" style={{ background: 'rgba(0,122,255,0.08)' }} />
      </div>

      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center justify-between px-4 h-16"
        style={{
          background: 'var(--glass-white)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '0.5px solid var(--glass-border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <button className="p-2 rounded-full active:scale-95 transition-transform" style={{ color: 'var(--label-secondary)' }}>
          <span className="material-symbols-outlined">account_circle</span>
        </button>
        <h1 className="font-semibold text-lg" style={{ color: 'var(--blue)' }}>Tilang Checker</h1>
        <button className="p-2 rounded-full active:scale-95 transition-transform" style={{ color: 'var(--label-secondary)' }}>
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      {/* Main */}
      <main className="relative z-10 pt-32 pb-32 px-4 flex flex-col items-center min-h-screen">
        {/* App Icon */}
        <div
          className="w-24 h-24 rounded-[22px] flex items-center justify-center mb-8 relative overflow-hidden hover:scale-105 transition-transform duration-300"
          style={{ background: 'var(--blue)', boxShadow: '0 16px 32px rgba(0,122,255,0.24)' }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top right, rgba(0,0,0,0.1), transparent)' }} />
          <span className="material-symbols-outlined text-white" style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}>shield</span>
        </div>

        {/* Title */}
        <h2 className="font-bold text-center mb-2" style={{ fontSize: '34px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--label-primary)' }}>
          TILANG CHECKER
        </h2>
        <p className="text-center max-w-[260px] mb-12" style={{ fontSize: '15px', color: 'var(--label-secondary)' }}>
          Sistem Deteksi Masa Berlaku STNK
        </p>

        {/* Feature Pills */}
        <div className="flex flex-row flex-wrap justify-center gap-2 mb-auto w-full max-w-sm">
          {[
            { icon: 'photo_camera', label: 'Scan Plat', filled: false },
            { icon: 'bolt', label: 'Hasil Instan', filled: true },
            { icon: 'lock', label: 'Akses Resmi', filled: false },
          ].map(({ icon, label, filled }) => (
            <div
              key={label}
              className="glass-card flex items-center gap-2 px-4 py-2.5"
              style={{ borderRadius: '9999px' }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '18px', color: filled ? 'var(--blue)' : 'var(--label-secondary)', fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm flex flex-col items-center mt-12 gap-2">
          <button
            onClick={onStartScan}
            className="w-full py-4 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-white"
            style={{ fontSize: '17px', background: 'var(--blue)', borderRadius: 'var(--radius-btn)', boxShadow: '0 8px 24px rgba(0,122,255,0.3)' }}
          >
            <span className="material-symbols-outlined">document_scanner</span>
            Mulai Scan
          </button>
          <button
            onClick={onViewHistory}
            className="w-full py-4 font-medium active:scale-[0.98] transition-transform"
            style={{ fontSize: '16px', color: 'var(--blue)', borderRadius: 'var(--radius-btn)', background: 'rgba(0,122,255,0.06)' }}
          >
            Lihat Riwayat
          </button>
          <p className="mt-4 text-center" style={{ fontSize: '12px', color: 'var(--label-tertiary)' }}>
            Khusus penggunaan petugas resmi
          </p>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] flex justify-around items-center py-3 px-6 z-50"
        style={{
          background: 'var(--glass-white)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid var(--glass-border)',
          borderRadius: '9999px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <button className="flex flex-col items-center font-semibold" style={{ color: 'var(--blue)' }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>Beranda</span>
        </button>
        <button onClick={onStartScan} className="flex flex-col items-center" style={{ color: 'var(--label-secondary)' }}>
          <span className="material-symbols-outlined">photo_camera</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>Scan</span>
        </button>
        <button onClick={onViewHistory} className="flex flex-col items-center" style={{ color: 'var(--label-secondary)' }}>
          <span className="material-symbols-outlined">history</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>Riwayat</span>
        </button>
      </nav>
    </div>
  );
}
