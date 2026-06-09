'use client';

import { useState } from 'react';
import HomeScreen from '@/components/HomeScreen';
import CaptureScreen from '@/components/CaptureScreen';
import ProcessingScreen from '@/components/ProcessingScreen';
import HistoryScreen, { type HistoryGroup } from '@/components/HistoryScreen';
import ResultAktif from '@/components/ResultAktif';
import ResultMati from '@/components/ResultMati';
import ResultVerifikasi from '@/components/ResultVerifikasi';
import { checkPlateBase64, type CheckResult } from '@/lib/api';

type Screen =
  | { name: 'home' }
  | { name: 'capture' }
  | { name: 'processing' }
  | { name: 'history' }
  | { name: 'result-aktif';     result: CheckResult; thumbnailUrl: string }
  | { name: 'result-mati';      result: CheckResult; thumbnailUrl: string }
  | { name: 'result-verifikasi'; result: CheckResult; thumbnailUrl: string };

const SAMPLE_HISTORY: HistoryGroup[] = [
  {
    dateLabel: 'Hari Ini',
    items: [
      { id: '1', plateText: 'B 1234 ABC', status: 'AKTIF',           time: '14:20', vehicleType: 'car' },
      { id: '2', plateText: 'L 1478 XK',  status: 'MATI',            time: '09:15', vehicleType: 'car' },
    ],
  },
  {
    dateLabel: 'Kemarin',
    items: [
      { id: '3', plateText: 'D 4455 ZZ', status: 'PERLU_VERIFIKASI', time: '16:45', vehicleType: 'motorcycle' },
    ],
  },
];

function todayLabel(): string {
  return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  async function handleCapture(imageBase64: string) {
    const thumbnailUrl = `data:image/jpeg;base64,${imageBase64}`;
    setScreen({ name: 'processing' });

    try {
      const result = await checkPlateBase64(imageBase64);
      if (result.status === 'AKTIF') {
        setScreen({ name: 'result-aktif', result, thumbnailUrl });
      } else if (result.status === 'MATI') {
        setScreen({ name: 'result-mati', result, thumbnailUrl });
      } else {
        setScreen({ name: 'result-verifikasi', result, thumbnailUrl });
      }
    } catch {
      const fallback: CheckResult = {
        status: 'PERLU_VERIFIKASI',
        plate_text: 'UNKNOWN',
        expiry_month: null,
        expiry_year: null,
        days_remaining: null,
        report: 'Terjadi kesalahan koneksi ke server. Pastikan backend berjalan dan coba lagi.',
        confidence: 0,
      };
      setScreen({ name: 'result-verifikasi', result: fallback, thumbnailUrl });
    }
  }

  if (screen.name === 'home') {
    return (
      <HomeScreen
        onStartScan={() => setScreen({ name: 'capture' })}
        onViewHistory={() => setScreen({ name: 'history' })}
      />
    );
  }

  if (screen.name === 'capture') {
    return (
      <CaptureScreen
        onBack={() => setScreen({ name: 'home' })}
        onCapture={handleCapture}
        onPickFromGallery={handleCapture}
        onNavigateHome={() => setScreen({ name: 'home' })}
        onViewHistory={() => setScreen({ name: 'history' })}
      />
    );
  }

  if (screen.name === 'processing') {
    return <ProcessingScreen progress={60} />;
  }

  if (screen.name === 'history') {
    return (
      <HistoryScreen
        groups={SAMPLE_HISTORY}
        onSelectItem={() => setScreen({ name: 'home' })}
        onStartScan={() => setScreen({ name: 'capture' })}
        onNavigateHome={() => setScreen({ name: 'home' })}
      />
    );
  }

  if (screen.name === 'result-aktif') {
    const { result, thumbnailUrl } = screen;
    return (
      <ResultAktif
        plateText={result.plate_text}
        expiryMonth={result.expiry_month!}
        expiryYear={result.expiry_year!}
        daysRemaining={result.days_remaining!}
        checkDate={todayLabel()}
        report={result.report}
        confidence={result.confidence}
        thumbnailUrl={thumbnailUrl}
        onBack={() => setScreen({ name: 'home' })}
        onCheckAgain={() => setScreen({ name: 'capture' })}
        onSave={() => {}}
      />
    );
  }

  if (screen.name === 'result-mati') {
    const { result, thumbnailUrl } = screen;
    return (
      <ResultMati
        plateText={result.plate_text}
        expiryMonth={result.expiry_month}
        expiryYear={result.expiry_year}
        daysOverdue={Math.abs(result.days_remaining ?? 0)}
        report={result.report}
        thumbnailUrl={thumbnailUrl}
        onBack={() => setScreen({ name: 'home' })}
        onCheckAgain={() => setScreen({ name: 'capture' })}
        onSave={() => {}}
      />
    );
  }

  if (screen.name === 'result-verifikasi') {
    const { result, thumbnailUrl } = screen;
    return (
      <ResultVerifikasi
        detectedText={result.plate_text}
        confidence={result.confidence}
        report={result.report}
        thumbnailUrl={thumbnailUrl}
        onBack={() => setScreen({ name: 'home' })}
        onRetakePhoto={() => setScreen({ name: 'capture' })}
        onReport={() => {}}
      />
    );
  }

  return null;
}
