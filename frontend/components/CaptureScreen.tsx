'use client';

import { useRef } from 'react';
import { compressImage } from '@/lib/api';

interface CaptureScreenProps {
  onBack: () => void;
  onCapture: (imageBase64: string) => void;
  onPickFromGallery: (imageBase64: string) => void;
  onNavigateHome: () => void;
  onViewHistory: () => void;
}

export default function CaptureScreen({ onBack, onCapture, onPickFromGallery, onNavigateHome, onViewHistory }: CaptureScreenProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, callback: (b64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Compress + resize sebelum dikirim ke backend (lebih cepat upload & OCR)
    const base64 = await compressImage(file);
    callback(base64);
  };

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col" style={{ background: 'var(--bg-secondary)', fontFamily: 'Inter, sans-serif' }}>
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
        <button onClick={onBack} className="p-2 rounded-full active:scale-95 transition-transform" style={{ color: 'var(--blue)' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-semibold" style={{ fontSize: '17px', color: 'var(--blue)' }}>Scan Plat</h1>
        <button className="p-2 rounded-full" style={{ color: 'var(--blue)' }}>
          <span className="material-symbols-outlined">shield</span>
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 mt-16 relative flex flex-col items-center justify-center p-4">
        {/* Viewfinder */}
        <div
          className="glass-card w-full max-w-sm rounded-[20px] flex flex-col items-center justify-center p-6 mb-8 relative"
          style={{ aspectRatio: '3/4' }}
        >
          {/* Corner brackets */}
          <div className="absolute inset-4 pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8" style={{ borderTop: '4px solid var(--blue)', borderLeft: '4px solid var(--blue)', borderTopLeftRadius: '12px' }} />
            <div className="absolute top-0 right-0 w-8 h-8" style={{ borderTop: '4px solid var(--blue)', borderRight: '4px solid var(--blue)', borderTopRightRadius: '12px' }} />
            <div className="absolute bottom-0 left-0 w-8 h-8" style={{ borderBottom: '4px solid var(--blue)', borderLeft: '4px solid var(--blue)', borderBottomLeftRadius: '12px' }} />
            <div className="absolute bottom-0 right-0 w-8 h-8" style={{ borderBottom: '4px solid var(--blue)', borderRight: '4px solid var(--blue)', borderBottomRightRadius: '12px' }} />
          </div>

          {/* Guide text */}
          <div className="text-center flex flex-col items-center gap-2 z-10">
            <span className="material-symbols-outlined mb-2" style={{ fontSize: '48px', color: 'var(--label-tertiary)' }}>center_focus_strong</span>
            <p style={{ fontSize: '15px', color: 'var(--label-secondary)' }}>Arahkan ke area stiker STNK</p>
            <p style={{ fontSize: '13px', color: 'var(--label-tertiary)' }}>Pastikan angka bulan/tahun terlihat jelas</p>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-center gap-8 w-full max-w-sm px-6 pb-24">
          {/* Gallery */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleFileChange(e, onPickFromGallery)}
          />
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="glass-card w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ color: 'var(--blue)' }}
          >
            <span className="material-symbols-outlined">photo_library</span>
          </button>

          {/* Capture */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => handleFileChange(e, onCapture)}
          />
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="glass-card w-[72px] h-[72px] rounded-full flex items-center justify-center p-1 active:scale-90 transition-transform"
          >
            <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center" style={{ background: 'var(--blue)' }}>
              <span className="material-symbols-outlined text-white" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
            </div>
          </button>

          {/* Flash */}
          <button
            className="glass-card w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ color: 'var(--blue)' }}
          >
            <span className="material-symbols-outlined">flash_on</span>
          </button>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav
        className="bottom-nav fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] flex justify-around items-center py-3 px-6 z-50"
        style={{
          background: 'var(--glass-white)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid var(--glass-border)',
          borderRadius: '9999px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <button onClick={onNavigateHome} className="flex flex-col items-center" style={{ color: 'var(--label-secondary)' }}>
          <span className="material-symbols-outlined">home</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>Beranda</span>
        </button>
        <button className="flex flex-col items-center font-semibold relative" style={{ color: 'var(--blue)' }}>
          <div className="absolute -top-1 w-1 h-1 rounded-full" style={{ background: 'var(--blue)' }} />
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
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
