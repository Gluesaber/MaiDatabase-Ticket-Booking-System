import { useState, useEffect } from 'react';
import type { Showtime, VenueLayout, SeatInfo } from '../types';
import { api } from '../services/ApiService';

interface Props {
  showtime: Showtime;
  onConfirm: (tickets: { tierId: number; seatCode: string }[]) => void;
  onCancel: () => void;
}

export function SeatSelection({ showtime, onConfirm, onCancel }: Props) {
  const [layout, setLayout] = useState<VenueLayout | null>(null);
  const [selected, setSelected] = useState<SeatInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getVenueLayout(showtime.venue.venueId, showtime.showtimeId)
      .then(setLayout)
      .catch(() => setError('Failed to load seat map'))
      .finally(() => setLoading(false));
  }, [showtime]);

  const maxSeats = showtime.ticketPerPerson;

  function toggle(seat: SeatInfo) {
    if (!seat.available) return;
    setSelected(prev => {
      const already = prev.find(s => s.seatCode === seat.seatCode);
      if (already) return prev.filter(s => s.seatCode !== seat.seatCode);
      if (prev.length >= maxSeats) return prev;
      return [...prev, seat];
    });
  }

  const tierColorMap: Record<string, string> = {
    VIP: 'bg-yellow-400',
    Standard: 'bg-blue-400',
    Economy: 'bg-green-400',
  };

  function seatColor(seat: SeatInfo) {
    const isSelected = selected.some(s => s.seatCode === seat.seatCode);
    if (isSelected) return 'bg-indigo-600 text-white';
    if (!seat.available) return 'bg-gray-300 text-gray-400 cursor-not-allowed';
    return `${tierColorMap[seat.tierName] ?? 'bg-gray-200'} hover:opacity-80 cursor-pointer`;
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading seat map...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!layout) return null;

  const grouped = layout.seats.reduce<Record<string, SeatInfo[]>>((acc, s) => {
    const row = s.seatCode.split('-')[0];
    if (!acc[row]) acc[row] = [];
    acc[row].push(s);
    return acc;
  }, {});

  const tierAvailableCount = layout.seats.reduce<Record<number, number>>((acc, s) => {
    if (s.available) acc[s.tierId] = (acc[s.tierId] ?? 0) + 1;
    return acc;
  }, {});

  const total = selected.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{showtime.event.title}</h2>
          <p className="text-sm text-gray-500">{showtime.venue.name} · {new Date(showtime.showSchedules).toLocaleString('en-TH')}</p>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-3 mb-6">
            {showtime.tiers.map(t => (
              <div key={t.tierId} className="flex items-center gap-2 text-sm">
                <span className={`w-4 h-4 rounded ${tierColorMap[t.tierName] ?? 'bg-gray-200'}`} />
                <span>{t.tierName} — ฿{t.price.toLocaleString()} ({tierAvailableCount[t.tierId] ?? 0} left)</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-sm">
              <span className="w-4 h-4 rounded bg-indigo-600" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-4 h-4 rounded bg-gray-300" />
              <span>Unavailable</span>
            </div>
          </div>

          <div className="mb-2 text-center text-xs text-gray-400 uppercase tracking-widest">Stage</div>
          <div className="h-1 bg-gray-200 rounded mb-6 mx-auto w-48" />

          <div className="space-y-2 mb-6">
            {Object.entries(grouped).map(([row, seats]) => (
              <div key={row} className="flex items-center gap-2 justify-center flex-wrap">
                <span className="text-xs text-gray-400 w-6 text-right">{row}</span>
                {seats.map(seat => (
                  <button
                    key={seat.seatCode}
                    onClick={() => toggle(seat)}
                    disabled={!seat.available}
                    className={`w-8 h-8 rounded text-xs font-medium transition-all ${seatColor(seat)}`}
                    title={`${seat.seatCode} — ${seat.tierName} ฿${seat.price}`}
                  >
                    {seat.seatCode.split('-')[1] ?? ''}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 text-center mb-4">
            Select up to {maxSeats} seat{maxSeats > 1 ? 's' : ''} · {selected.length} selected
          </p>

          {selected.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4 text-sm">
              {selected.map(s => (
                <div key={s.seatCode} className="flex justify-between">
                  <span>{s.seatCode} ({s.tierName})</span>
                  <span>฿{s.price.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>฿{total.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => selected.length > 0 && onConfirm(selected.map(s => ({ tierId: s.tierId, seatCode: s.seatCode })))}
              disabled={selected.length === 0}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Book {selected.length} Seat{selected.length !== 1 ? 's' : ''} — ฿{total.toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
