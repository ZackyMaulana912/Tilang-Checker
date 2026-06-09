'use client';

import { useState } from 'react';

export type CheckStatus = 'AKTIF' | 'MATI' | 'PERLU_VERIFIKASI';

export interface HistoryItem {
  id: string;
  plateText: string;
  status: CheckStatus;
  time: string;
  thumbnailUrl?: string;
  vehicleType?: 'car' | 'motorcycle';
}

export interface HistoryGroup {
  dateLabel: string;
  items: HistoryItem[];
}

interface HistoryScreenProps {
  groups: HistoryGroup[];
  onSelectItem: (item: HistoryItem) => void;
  onStartScan: () => void;
  onNavigateHome: () => void;
}

type FilterKey = CheckStatus | 'ALL';

const STATUS_LABELS: Record<CheckStatus, string> = {
  AKTIF: 'Aktif',
  MATI: 'Mati',
  PERLU_VERIFIKASI: 'Perlu Verifikasi',
};

const STATUS_COLORS: Record<CheckStatus, string> = {
  AKTIF: 'var(--green)',
  MATI: 'var(--red)',
  PERLU_VERIFIKASI: 'var(--orange)',
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'AKTIF', label: 'Aktif' },
  { key: 'MATI', label: 'Mati' },
  { key: 'PERLU_VERIFIKASI', label: 'Perlu Verifikasi' },
];

export default function HistoryScreen({ groups, onSelectItem, onStartScan, onNavigateHome }: HistoryScreenProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('ALL');

  const filteredGroups = groups
    .map(g => ({
      ...g,
      items: g.items.filter(item => {
        const matchSearch = item.plateText.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'ALL' || item.status === filter;
        return matchSearch && matchFilter;
      }),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen pb-32 antialiased" style={{ background: 'var(--bg-secondary)', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 py-4"
        style={{
          background: 'var(--glass-white)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid var(--glass-border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ color: 'var(--blue)', fontVariationSettings: "'FILL' 1" }}>security</span>
          <h1 className="font-semibold" style={{ fontSize: '22px', color: 'var(--blue)' }}>Riwayat</h1>
        </div>
        <button style={{ color: 'var(--label-secondary)' }}>
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      {/* Main */}
      <main className="pt-[88px] px-4 flex flex-col gap-4 max-w-md mx-auto">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-full"
          style={{ background: 'rgba(242,242,247,0.8)', border: '1px solid rgba(255,255,255,0.5)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--label-tertiary)' }}>search</span>
          <input
            type="text"
            placeholder="Cari plat nomor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full"
            style={{ fontSize: '15px', color: 'var(--label-primary)' }}
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="whitespace-nowrap px-4 py-2 rounded-full snap-start transition-colors flex-shrink-0"
              style={{
                fontSize: '15px',
                ...(filter === f.key
                  ? { background: 'var(--blue)', color: '#fff', boxShadow: '0 4px 12px rgba(0,122,255,0.3)' }
                  : { background: 'rgba(255,255,255,0.6)', color: 'var(--label-secondary)', border: '0.5px solid var(--glass-border)' }),
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* History list */}
        <div className="flex flex-col gap-8 mt-2">
          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ opacity: 0.6 }}>
              <div
                className="w-24 h-24 mb-4 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.8)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--label-tertiary)' }}>history</span>
              </div>
              <p style={{ fontSize: '17px', color: 'var(--label-secondary)' }} className="text-center">
                Belum ada riwayat pemindaian
              </p>
            </div>
          ) : (
            filteredGroups.map(group => (
              <section key={group.dateLabel}>
                <h2 className="font-semibold mb-2 ml-1" style={{ fontSize: '15px', color: 'var(--label-secondary)' }}>
                  {group.dateLabel}
                </h2>
                <div className="flex flex-col gap-2">
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className="glass-card rounded-[20px] p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <div
                        className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'var(--bg-secondary)' }}
                      >
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--label-tertiary)' }}>
                            {item.vehicleType === 'motorcycle' ? 'motorcycle' : 'directions_car'}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col">
                        <span
                          className="font-medium mb-1"
                          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', letterSpacing: '0.5px', color: 'var(--label-primary)' }}
                        >
                          {item.plateText}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[item.status] }} />
                          <span style={{ fontSize: '12px', color: STATUS_COLORS[item.status] }}>{STATUS_LABELS[item.status]}</span>
                          <span style={{ fontSize: '12px', color: 'var(--label-tertiary)', margin: '0 4px' }}>•</span>
                          <span style={{ fontSize: '12px', color: 'var(--label-secondary)' }}>{item.time}</span>
                        </div>
                      </div>

                      <span className="material-symbols-outlined" style={{ color: 'var(--label-tertiary)' }}>chevron_right</span>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
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
        <button onClick={onNavigateHome} className="flex flex-col items-center" style={{ color: 'var(--label-secondary)' }}>
          <span className="material-symbols-outlined">home</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>Beranda</span>
        </button>
        <button
          onClick={onStartScan}
          className="flex flex-col items-center -translate-y-4 px-4 py-2 rounded-full"
          style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.8)' }}
        >
          <span className="material-symbols-outlined" style={{ color: 'var(--blue)' }}>document_scanner</span>
          <span className="font-medium" style={{ fontSize: '12px', marginTop: '4px', color: 'var(--label-primary)' }}>Scan</span>
        </button>
        <button className="flex flex-col items-center" style={{ color: 'var(--blue)' }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
          <span className="font-semibold" style={{ fontSize: '12px', marginTop: '4px' }}>Riwayat</span>
        </button>
      </nav>
    </div>
  );
}
