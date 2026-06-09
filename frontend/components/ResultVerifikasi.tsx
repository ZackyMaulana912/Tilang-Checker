'use client';

interface ResultVerifikasiProps {
  detectedText: string;
  confidence: number;   // 0-1 float from API
  report: string;
  thumbnailUrl?: string;
  onBack: () => void;
  onRetakePhoto: () => void;
  onReport: () => void;
}

const TIPS = [
  { icon: 'straighten', text: 'Jarak ideal 40-60cm dari plat nomor.' },
  { icon: 'wb_sunny', text: 'Pastikan cahaya cukup dan tidak memantul.' },
  { icon: 'center_focus_strong', text: 'Posisi kamera tegak lurus dengan plat.' },
];

export default function ResultVerifikasi({
  detectedText,
  confidence,
  report,
  thumbnailUrl,
  onBack,
  onRetakePhoto,
  onReport,
}: ResultVerifikasiProps) {
  const confidencePct = Math.round(confidence * 100);
  const knownChars = detectedText.replace(/\s/g, '').length;
  const unknownCount = Math.max(0, 8 - knownChars);

  return (
    <div className="min-h-screen flex flex-col antialiased" style={{ background: 'var(--bg-primary)', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center justify-between px-4 h-16"
        style={{
          background: 'var(--glass-white)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid var(--glass-border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center p-2 rounded-full active:scale-95 transition-transform"
          style={{ color: 'var(--blue)' }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-semibold" style={{ fontSize: '17px', color: 'var(--blue)' }}>
          Hasil Analisis
        </h1>
        <div className="w-10" />
      </header>

      {/* Main */}
      <main className="flex-1 pt-24 px-4 pb-32 max-w-2xl mx-auto w-full flex flex-col gap-8">
        {/* Status card — amber glass */}
        <section
          className="rounded-[20px] p-6 flex flex-col items-center text-center gap-2"
          style={{
            background: 'var(--glass-amber)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(255,159,10,0.3)',
            boxShadow: '0 8px 32px rgba(255,159,10,0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        >
          <span
            className="material-symbols-outlined mb-2"
            style={{ fontSize: '48px', color: 'var(--amber)', fontVariationSettings: "'FILL' 1" }}
          >
            warning
          </span>
          <h2 className="font-bold" style={{ fontSize: '22px', color: '#7D5A00' }}>
            PERLU VERIFIKASI
          </h2>
          <p style={{ fontSize: '17px', color: 'var(--amber)' }}>Foto kurang jelas, periksa manual</p>
        </section>

        {/* OCR card */}
        <section className="glass-card rounded-[20px] p-6 flex flex-col gap-4 relative overflow-hidden">
          {thumbnailUrl && (
            <div
              className="absolute inset-0 -z-10 opacity-20 bg-cover bg-center"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
            />
          )}
          <div className="flex justify-between items-center w-full">
            <h3
              className="font-semibold uppercase tracking-wider"
              style={{ fontSize: '13px', color: 'var(--label-secondary)' }}
            >
              Teks Terdeteksi
            </h3>
            <div
              className="flex items-center gap-1 px-3 py-1 rounded-full"
              style={{ fontSize: '12px', background: 'var(--glass-amber)', color: '#7D5A00', border: '0.5px solid rgba(255,159,10,0.2)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>policy</span>
              CONFIDENCE: {confidencePct}%
            </div>
          </div>

          <div
            className="flex items-center gap-2 mt-2 p-4 rounded-xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}
          >
            <span
              className="font-medium px-3 py-2 rounded-lg bg-white shadow-sm"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '20px',
                color: 'var(--label-primary)',
                border: '1px solid var(--glass-border)',
              }}
            >
              {detectedText || '???'}
            </span>
            <div className="flex gap-2">
              {Array.from({ length: unknownCount }).map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-12 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(255,159,10,0.5)' }}
                >
                  <span className="material-symbols-outlined" style={{ color: 'var(--amber)' }}>question_mark</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Report card */}
        {report && (
          <section className="glass-card rounded-[20px] p-6 flex flex-col gap-2">
            <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: '15px', color: 'var(--label-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
              Keterangan
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--label-primary)', lineHeight: '1.6' }}>{report}</p>
          </section>
        )}

        {/* Tips card */}
        <section className="glass-card rounded-[20px] p-6 flex flex-col gap-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: '15px', color: 'var(--blue)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            Tips Foto
          </h3>
          <ul className="flex flex-col gap-3">
            {TIPS.map(({ icon, text }) => (
              <li key={icon} className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5" style={{ fontSize: '18px', color: 'var(--label-secondary)' }}>{icon}</span>
                <span style={{ fontSize: '17px', color: 'var(--label-secondary)' }}>{text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={onRetakePhoto}
            className="w-full py-4 font-medium text-white active:scale-[0.98] transition-transform shadow-md"
            style={{ fontSize: '17px', background: 'var(--blue)', borderRadius: 'var(--radius-btn)' }}
          >
            Foto Ulang
          </button>
          <button
            onClick={onReport}
            className="w-full glass-card py-4 font-medium active:scale-[0.98] transition-transform"
            style={{ fontSize: '17px', color: 'var(--blue)', border: '1px solid rgba(0,122,255,0.3)', borderRadius: 'var(--radius-btn)' }}
          >
            Laporkan
          </button>
        </div>
      </main>
    </div>
  );
}
