'use client';

export type StepStatus = 'done' | 'active' | 'pending';

export interface ProcessingStep {
  label: string;
  status: StepStatus;
}

interface ProcessingScreenProps {
  progress: number;
  steps?: ProcessingStep[];
  thumbnailUrl?: string;
}

const DEFAULT_STEPS: ProcessingStep[] = [
  { label: 'Deteksi plat', status: 'done' },
  { label: 'Validasi gambar', status: 'active' },
  { label: 'Baca tanggal', status: 'pending' },
  { label: 'Analisis status', status: 'pending' },
];

export default function ProcessingScreen({ progress, steps = DEFAULT_STEPS, thumbnailUrl }: ProcessingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col antialiased" style={{ background: 'var(--bg-primary)', fontFamily: 'Inter, sans-serif' }}>
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
        <h1 className="font-semibold" style={{ fontSize: '17px', color: 'var(--blue)' }}>Menganalisis...</h1>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-md mx-auto pt-24 pb-8 px-4 flex flex-col items-center gap-8">
        {/* Thumbnail */}
        {thumbnailUrl && (
          <div className="glass-card w-[120px] h-[72px] rounded-[16px] overflow-hidden relative flex-shrink-0">
            <div className="absolute top-0 inset-x-0 h-[1px] z-10" style={{ background: 'rgba(255,255,255,0.9)' }} />
            <img src={thumbnailUrl} alt="Foto plat" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full max-w-[280px] flex flex-col items-center gap-2">
          <span className="font-semibold" style={{ fontSize: '24px', color: 'var(--blue)' }}>{progress}%</span>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: 'var(--blue)' }}
            />
          </div>
        </div>

        {/* Steps card */}
        <div className="w-full glass-card rounded-[20px] p-4 relative">
          <div className="absolute top-0 inset-x-0 h-[1px] rounded-t-[20px]" style={{ background: 'rgba(255,255,255,0.9)' }} />
          <div className="flex flex-col gap-4">
            {steps.map((step, idx) => (
              <div key={step.label}>
                <div className="flex items-center gap-3">
                  {step.status === 'done' && (
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--green)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                  {step.status === 'active' && (
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px', color: 'var(--blue)' }}>sync</span>
                  )}
                  {step.status === 'pending' && (
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--label-tertiary)' }}>radio_button_unchecked</span>
                  )}
                  <div className="flex-1">
                    <p
                      style={{
                        fontSize: '15px',
                        color: step.status === 'pending' ? 'var(--label-secondary)' : 'var(--label-primary)',
                        fontWeight: step.status === 'active' ? 500 : 400,
                      }}
                    >
                      {step.label}
                    </p>
                  </div>
                  {step.status === 'done' && (
                    <span style={{ fontSize: '13px', color: 'var(--green)' }}>Selesai</span>
                  )}
                  {step.status === 'active' && (
                    <span style={{ fontSize: '13px', color: 'var(--blue)' }}>Memproses...</span>
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div className="h-[0.5px] mt-4 ml-8" style={{ background: 'var(--glass-border)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center mt-auto pb-4" style={{ fontSize: '13px', color: 'var(--label-secondary)' }}>
          Harap jangan tutup halaman ini
        </p>
      </main>
    </div>
  );
}
