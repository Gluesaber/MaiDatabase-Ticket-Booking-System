import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../services/ApiService';
import type { Showtime, VenueDetail } from '../types';

interface Props {
  showtime: Showtime;
  onClose: () => void;
  onSaved: () => void;
}

interface TierRow {
  tierId?: number;
  tierName: string;
  price: string;
  totalAmount: string;
}

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditShowtimeModal({ showtime, onClose, onSaved }: Props) {
  const [venues, setVenues] = useState<VenueDetail[]>([]);
  const [venueId, setVenueId] = useState(String(showtime.venue.venueId));
  const [showSchedules, setShowSchedules] = useState(toLocalDatetime(showtime.showSchedules));
  const [ticketPerPerson, setTicketPerPerson] = useState(String(showtime.ticketPerPerson));
  const [tiers, setTiers] = useState<TierRow[]>(
    showtime.tiers.map(t => ({
      tierId: t.tierId,
      tierName: t.tierName,
      price: String(t.price),
      totalAmount: String(t.totalAmount),
    })),
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getVenues().then(setVenues);
  }, []);

  const selectedVenue = venues.find(v => v.venueId === Number(venueId));
  const venueCapacity = selectedVenue?.capacity ?? showtime.venue.capacity;
  const totalTierSeats = tiers.reduce((s, t) => s + (parseInt(t.totalAmount) || 0), 0);
  const capacityExceeded = venueCapacity > 0 && totalTierSeats > venueCapacity;
  const fillPct = venueCapacity > 0 ? Math.min((totalTierSeats / venueCapacity) * 100, 100) : 0;

  function setTierField(i: number, field: keyof TierRow, value: string) {
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  }

  function addTier() {
    setTiers(prev => [...prev, { tierName: '', price: '', totalAmount: '' }]);
  }

  function removeTier(i: number) {
    if (tiers.length === 1) return;
    setTiers(prev => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (capacityExceeded) { setError(`Total seats (${totalTierSeats}) exceeds venue capacity (${venueCapacity}).`); return; }
    if (tiers.some(t => !t.tierName.trim() || !t.price || !t.totalAmount)) { setError('All tier fields are required.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await api.updateShowtime(showtime.showtimeId, {
        venueId: Number(venueId),
        showSchedules: new Date(showSchedules).toISOString(),
        ticketPerPerson: Number(ticketPerPerson),
        tiers: tiers.map(t => ({
          ...(t.tierId !== undefined ? { tierId: t.tierId } : {}),
          tierName: t.tierName.trim(),
          price: parseFloat(t.price),
          totalAmount: parseInt(t.totalAmount),
        })),
      });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 my-4">
        <h2 className="text-lg font-bold text-gray-900 mb-0.5">Edit Showtime</h2>
        <p className="text-gray-500 text-sm mb-5">{showtime.event.title}</p>

        <form onSubmit={submit} className="space-y-4">
          {/* Venue */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Venue *</label>
            <select
              value={venueId}
              onChange={e => setVenueId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {venues.map(v => (
                <option key={v.venueId} value={v.venueId}>
                  {v.name} — capacity {v.capacity.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Date/time + per-person */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date &amp; Time *</label>
              <input
                type="datetime-local"
                value={showSchedules}
                onChange={e => setShowSchedules(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Max Tickets / Person *</label>
              <input
                type="number" min={1} max={20}
                value={ticketPerPerson}
                onChange={e => setTicketPerPerson(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Tiers */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ticket Tiers *</label>
              <button type="button" onClick={addTier} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                + Add Tier
              </button>
            </div>
            <div className="grid grid-cols-[1fr_110px_110px_32px] gap-2 mb-1 px-1">
              <span className="text-xs text-gray-400">Tier Name</span>
              <span className="text-xs text-gray-400">Price (฿)</span>
              <span className="text-xs text-gray-400">Seats</span>
              <span />
            </div>
            <div className="space-y-2">
              {tiers.map((tier, i) => (
                <div key={i} className="grid grid-cols-[1fr_110px_110px_32px] gap-2 items-center">
                  <input
                    placeholder="e.g. VIP"
                    value={tier.tierName}
                    onChange={e => setTierField(i, 'tierName', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number" min="0.01" step="0.01" placeholder="0.00"
                    value={tier.price}
                    onChange={e => setTierField(i, 'price', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number" min="1" placeholder="100"
                    value={tier.totalAmount}
                    onChange={e => setTierField(i, 'totalAmount', e.target.value)}
                    className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      capacityExceeded ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button" onClick={() => removeTier(i)} disabled={tiers.length === 1}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-20 text-xl leading-none"
                  >×</button>
                </div>
              ))}
            </div>

            {venueCapacity > 0 && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Seats allocated</span>
                  <span className={capacityExceeded ? 'text-red-600 font-bold' : 'text-gray-700'}>
                    {totalTierSeats.toLocaleString()} / {venueCapacity.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full transition-all ${capacityExceeded ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${fillPct}%` }} />
                </div>
                <p className={`text-xs mt-1 ${capacityExceeded ? 'text-red-600' : 'text-gray-400'}`}>
                  {capacityExceeded
                    ? `Exceeds capacity by ${(totalTierSeats - venueCapacity).toLocaleString()} seats`
                    : `${(venueCapacity - totalTierSeats).toLocaleString()} seats remaining`}
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting || capacityExceeded}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
