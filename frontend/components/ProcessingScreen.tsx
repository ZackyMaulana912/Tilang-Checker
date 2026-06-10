'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { label: 'Deteksi plat',    icon: 'search'          },
  { label: 'Validasi gambar', icon: 'verified'        },
  { label: 'Baca tanggal',    icon: 'calendar_today'  },
  { label: 'Analisis status', icon: 'analytics'       },
];

// Waktu (ms) setelah mount masing-masing step menjadi aktif
const STEP_DELAYS   = [0, 900, 2100, 3600];
// Persentase progress saat step tsb aktif
const STEP_PROGRESS = [12, 35, 62, 85];

interface ProcessingScreenProps {
  thumbnailUrl?: string;
  // progress prop dibiarkan agar page.tsx tidak perlu diubah
  progress?: number;
}

export default function ProcessingScreen({ thumbnailUrl }: ProcessingScreenProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress]     = useState(5);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEP_DELAYS.forEach((delay, idx) => {
      timers.push(
        setTimeout(() => {
          setActiveStep(idx);
          setProgress(STEP_PROGRESS[idx]);
        }, delay),
      );
    });

    // Setelah step terakhir aktif, creep perlahan ke 94% sambil tunggu API
    timers.push(setTimeout(() => setProgress(94), 5200));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col antialiased"
      style={{ background: 'var(--bg-primary)', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 flex items-center justify-center h-16"
        style={{
          background: 'var(--glass-white)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid var(--glass-border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <h1 className="font-semibold" style={{ fontSize: '17px', color: 'var(--blue)' }}>
          Menganalisis...
        </h1>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-md mx-auto pt-24 pb-8 px-4 flex flex-col items-center gap-8">
        {/* Thumbnail */}
        {thumbnailUrl && (
          <div className="glass-card w-[120px] h-[72px] rounded-[16px] overflow-hidden relative flex-shrink-0">
            <div
              className="absolute top-0 inset-x-0 h-[1px] z-10"
              style={{ background: 'rgba(255,255,255,0.9)' }}
            />
            <img src={thumbnailUrl} alt="Foto plat" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full max-w-[280px] flex flex-col items-center gap-2">
          <span className="font-semibold" style={{ fontSize: '24px', color: 'var(--blue)' }}>
            {progress}%
          </span>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'var(--blue)',
                transition: 'width 0.8s ease-out',
              }}
            />
          </div>
        </div>

        {/* Steps card */}
        <div className="w-full glass-card rounded-[20px] p-4 relative">
          <div
            className="absolute top-0 inset-x-0 h-[1px] rounded-t-[20px]"
            style={{ background: 'rgba(255,255,255,0.9)' }}
          />
          <div className="flex flex-col gap-4">
            {STEPS.map((step, idx) => {
              const isDone    = idx < activeStep;
              const isActive  = idx === activeStep;
              const isPending = idx > activeStep;

              return (
                <div key={step.label}>
                  <div className="flex items-center gap-3">
                    {isDone && (
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '20px', color: 'var(--green)', fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    )}
                    {isActive && (
                      <span
                        className="material-symbols-outlined animate-spin"
                        style={{ fontSize: '20px', color: 'var(--blue)' }}
                      >
                        sync
                      </span>
                    )}
                    {isPending && (
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '20px', color: 'var(--label-tertiary)' }}
                      >
                        radio_button_unchecked
                      </span>
                    )}

                    <p
                      style={{
                        flex: 1,
                        fontSize: '15px',
                        fontWeight: isActive ? 500 : 400,
                        color: isPending ? 'var(--label-secondary)' : 'var(--label-primary)',
                      }}
                    >
                      {step.label}
                    </p>

                    {isDone && (
                      <span style={{ fontSize: '13px', color: 'var(--green)' }}>Selesai</span>
                    )}
                    {isActive && (
                      <span style={{ fontSize: '13px', color: 'var(--blue)' }}>Memproses...</span>
                    )}
                  </div>

                  {idx < STEPS.length - 1 && (
                    <div
                      className="h-[0.5px] mt-4 ml-8"
                      style={{ background: 'var(--glass-border)' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <p
          className="text-center mt-auto pb-4"
          style={{ fontSize: '13px', color: 'var(--label-secondary)' }}
        >
          Harap jangan tutup halaman ini
        </p>
      </main>
    </div>
  );
}
