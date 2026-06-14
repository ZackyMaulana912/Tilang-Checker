'use client';

import { useState } from 'react';
import HomeScreen from '@/components/HomeScreen';
import CaptureScreen from '@/components/CaptureScreen';
import ProcessingScreen from '@/components/ProcessingScreen';
import HistoryScreen from '@/components/HistoryScreen';
import ResultAktif from '@/components/ResultAktif';
import ResultMati from '@/components/ResultMati';
import ResultVerifikasi from '@/components/ResultVerifikasi';
import { checkPlateBase64, type CheckResult } from '@/lib/api';
import { saveHistory, type HistoryItem } from '@/lib/storage';

type Screen =
  | { name: 'home' }
  | { name: 'capture' }
  | { name: 'processing'; thumbnailUrl: string }
  | { name: 'history' }
  | { name: 'result-aktif';      result: CheckResult; thumbnailUrl: string }
  | { name: 'result-mati';       result: CheckResult; thumbnailUrl: string }
  | { name: 'result-verifikasi'; result: CheckResult; thumbnailUrl: string };

function todayLabel(): string {
  return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

const BULAN_ID: Record<number, string> = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
  5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
  9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember',
};

function resultFromHistory(item: HistoryItem): CheckResult {
  const bulan = item.expiry_month ? BULAN_ID[item.expiry_month] : null;
  const tahun = item.expiry_year;
  let report = '';
  if (item.status === 'AKTIF') {
    report = `STNK kendaraan ${item.plate_text} masih aktif hingga ${bulan} ${tahun}.`;
  } else if (item.status === 'MATI') {
    report = `STNK kendaraan ${item.plate_text} sudah kadaluarsa sejak ${bulan} ${tahun}.`;
  } else {
    report = 'Data STNK tidak dapat terbaca dari foto. Lakukan pengecekan manual.';
  }
  return {
    status:         item.status,
    plate_text:     item.plate_text,
    expiry_month:   item.expiry_month,
    expiry_year:    item.expiry_year,
    days_remaining: item.days_remaining,
    report,
    confidence:     0,
  };
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  async function handleCapture(imageBase64: string) {
    const thumbnailUrl = `data:image/jpeg;base64,${imageBase64}`;
    setScreen({ name: 'processing', thumbnailUrl });

    try {
      const result = await checkPlateBase64(imageBase64);
      // Simpan ke riwayat (sekali per scan, hanya saat sukses)
      saveHistory({
        plate_text:     result.plate_text,
        status:         result.status,
        expiry_month:   result.expiry_month,
        expiry_year:    result.expiry_year,
        days_remaining: result.days_remaining,
        vehicle_type:   'car',
      });
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
    return <ProcessingScreen thumbnailUrl={screen.thumbnailUrl} />;
  }

  if (screen.name === 'history') {
    return (
      <HistoryScreen
        onStartScan={() => setScreen({ name: 'capture' })}
        onNavigateHome={() => setScreen({ name: 'home' })}
        onSelectItem={(item) => {
          const result = resultFromHistory(item);
          if (item.status === 'AKTIF') setScreen({ name: 'result-aktif',      result, thumbnailUrl: '' });
          else if (item.status === 'MATI') setScreen({ name: 'result-mati',   result, thumbnailUrl: '' });
          else setScreen({ name: 'result-verifikasi', result, thumbnailUrl: '' });
        }}
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
        onSave={() => setScreen({ name: 'history' })}
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
        onSave={() => setScreen({ name: 'history' })}
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
