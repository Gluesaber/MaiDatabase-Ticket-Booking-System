import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../services/ApiService';
import type { TierFormRow, VenueDetail } from '../types';

interface Props {
  eventId: number;
  eventTitle: string;
  onClose: () => void;
  onSaved: () => void;
}

const BLANK_TIER: TierFormRow = { tierName: '', price: '', totalAmount: '' };

export function AddShowtimeModal({ eventId, eventTitle, onClose, onSaved }: Props) {
  const [venues, setVenues] = useState<VenueDetail[]>([]);
  const [venueId, setVenueId] = useState('');
  const [showSchedules, setShowSchedules] = useState('');
  const [ticketPerPerson, setTicketPerPerson] = useState('4');
  const [tiers, setTiers] = useState<TierFormRow[]>([{ ...BLANK_TIER }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getVenues().then(vs => {
      setVenues(vs);
      if (vs.length > 0) setVenueId(String(vs[0].venueId));
    });
  }, []);

  const selectedVenue = venues.find(v => v.venueId === Number(venueId));
  const venueCapacity = selectedVenue?.capacity ?? 0;
  const totalTierSeats = tiers.reduce((sum, t) => sum + (parseInt(t.totalAmount) || 0), 0);
  const capacityExceeded = venueCapacity > 0 && totalTierSeats > venueCapacity;
  const capacityRemaining = venueCapacity - totalTierSeats;
  const fillPct = venueCapacity > 0 ? Math.min((totalTierSeats / venueCapacity) * 100, 100) : 0;

  function setTierField(index: number, field: keyof TierFormRow, value: string) {
    setTiers(prev => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  function addTier() {
    setTiers(prev => [...prev, { ...BLANK_TIER }]);
  }

  function removeTier(index: number) {
    if (tiers.length === 1) return;
    setTiers(prev => prev.filter((_, i) => i !== index));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (capacityExceeded) {
      setError(`Total tier seats (${totalTierSeats}) exceeds venue capacity (${venueCapacity}).`);
      return;
    }
    if (tiers.some(t => !t.tierName.trim() || !t.price || !t.totalAmount)) {
      setError('All tier fields are required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createShowtime({
        eventId,
        venueId: Number(venueId),
        showSchedules: new Date(showSchedules).toISOString(),
        ticketPerPerson: Number(ticketPerPerson),
        tiers: tiers.map(t => ({
          tierName: t.tierName.trim(),
          price: parseFloat(t.price),
          totalAmount: parseInt(t.totalAmount),
        })),
      });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create showtime');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 my-4">
        <h2 className="text-lg font-bold text-gray-900 mb-0.5">Add Showtime</h2>
        <p className="text-gray-500 text-sm mb-5">{eventTitle}</p>

        <form onSubmit={submit} className="space-y-4">
          {/* Venue */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Venue *</label>
            {venues.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded">
                No venues available. An admin must create a venue first.
              </p>
            ) : (
              <select
                value={venueId}
                onChange={e => setVenueId(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {venues.map(v => (
                  <option key={v.venueId} value={v.venueId}>
                    {v.name} — capacity {v.capacity.toLocaleString()}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date/time + per-person limit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                value={showSchedules}
                onChange={e => setShowSchedules(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Max Tickets / Person *
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={ticketPerPerson}
                onChange={e => setTicketPerPerson(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Ticket Tiers */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Ticket Tiers *
              </label>
              <button
                type="button"
                onClick={addTier}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
              >
                + Add Tier
              </button>
            </div>

            {/* Column headers */}
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
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={tier.price}
                    onChange={e => setTierField(i, 'price', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={tier.totalAmount}
                    onChange={e => setTierField(i, 'totalAmount', e.target.value)}
                    className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      capacityExceeded ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    disabled={tiers.length === 1}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-20 text-xl leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Capacity meter */}
            {venueCapacity > 0 && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Seats allocated</span>
                  <span className={capacityExceeded ? 'text-red-600 font-bold' : 'text-gray-700'}>
                    {totalTierSeats.toLocaleString()} / {venueCapacity.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      capacityExceeded ? 'bg-red-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                {capacityExceeded ? (
                  <p className="text-red-600 text-xs mt-1">
                    Exceeds capacity by {(totalTierSeats - venueCapacity).toLocaleString()} seats
                  </p>
                ) : (
                  <p className="text-gray-400 text-xs mt-1">
                    {capacityRemaining.toLocaleString()} seats remaining
                  </p>
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || capacityExceeded || venues.length === 0}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating…' : 'Create Showtime'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
