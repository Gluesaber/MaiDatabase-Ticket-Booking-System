import { useState } from 'react';
import type { Showtime } from '../types';
import type { GroupedEvent } from './EventCard';

const DESCRIPTION_THRESHOLD = 300;

const TAG_COLORS: Record<string, string> = {
  Musical:    'bg-pink-100 text-pink-700',
  Concert:    'bg-blue-100 text-blue-700',
  Conference: 'bg-gray-100 text-gray-700',
  Sport:      'bg-green-100 text-green-700',
  Comedy:     'bg-yellow-100 text-yellow-700',
  Exhibition: 'bg-orange-100 text-orange-700',
  Other:      'bg-indigo-100 text-indigo-700',
};

interface Props {
  group: GroupedEvent;
  onBook: (showtime: Showtime) => void;
  onClose: () => void;
  isLoggedIn: boolean;
  isCustomer: boolean;
}

function fmtDate(dt: string) {
  const d = new Date(dt);
  return d.toLocaleDateString('en-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString('en-TH', { hour: '2-digit', minute: '2-digit' });
}

export function EventDetailsModal({ group, onBook, onClose, isLoggedIn, isCustomer }: Props) {
  const { event, showtimes } = group;
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [pickedShowtime, setPickedShowtime] = useState<Showtime | null>(null);

  const description = event.description ?? '';
  const isLong = description.length > DESCRIPTION_THRESHOLD;
  const displayedText = isLong && !expanded
    ? description.slice(0, DESCRIPTION_THRESHOLD).trimEnd() + '…'
    : description;

  const picked = pickedShowtime;
  const pickedAvailable = picked ? picked.tiers.reduce((s, t) => s + t.available, 0) : 0;
  const pickedMinPrice  = picked ? Math.min(...picked.tiers.map(t => t.price)) : 0;

  function handleBook() {
    if (!picked) return;
    if (!isLoggedIn) { onClose(); return; }
    if (!isCustomer) {
      alert('Only customers can book tickets. Use your Dashboard to manage events.');
      return;
    }
    onBook(picked);
  }

  const ctaLabel = !picked
    ? 'Select a Showtime'
    : pickedAvailable === 0
    ? 'Sold Out'
    : !isLoggedIn
    ? 'Sign in to Book'
    : 'Select Seats';

  const ctaDisabled = !picked || pickedAvailable === 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      {/* Modal — flex column, max 90vh, never scrolls as a whole */}
      <div
        className="bg-white rounded-2xl max-w-xl w-full flex flex-col shadow-xl"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto min-h-0 rounded-t-2xl">
          {/* Thumbnail */}
          {event.thumbnail && !imgError ? (
            <img
              src={event.thumbnail}
              alt={event.title}
              className="w-full h-52 object-cover rounded-t-2xl"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-52 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-t-2xl flex items-center justify-center">
              <span className="text-6xl">🎫</span>
            </div>
          )}

          <div className="p-6 pb-4">
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {event.tags.map(tag => (
                <span
                  key={tag.typeId}
                  className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${TAG_COLORS[tag.typeName] ?? 'bg-indigo-100 text-indigo-700'}`}
                >
                  {tag.typeName}
                </span>
              ))}
            </div>

            {/* Title + meta */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{event.title}</h2>
              <div className="flex items-center gap-2 shrink-0 text-sm text-gray-500">
                {event.rating && (
                  <span className="border border-gray-400 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded">
                    {event.rating}
                  </span>
                )}
                <span>{event.durationMinutes} min</span>
              </div>
            </div>

            {/* Description */}
            {description ? (
              <div className="mb-5">
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{displayedText}</p>
                {isLong && (
                  <button
                    onClick={() => setExpanded(e => !e)}
                    className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {expanded ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic mb-5">No description provided.</p>
            )}

            {/* Showtime list */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Select a Showtime
              </p>
              <div className="space-y-2">
                {showtimes.map(s => {
                  const available = s.tiers.reduce((sum, t) => sum + t.available, 0);
                  const soldOut   = available === 0;
                  const minPrice  = Math.min(...s.tiers.map(t => t.price));
                  const isPicked  = picked?.showtimeId === s.showtimeId;

                  return (
                    <button
                      key={s.showtimeId}
                      onClick={() => !soldOut && setPickedShowtime(s)}
                      disabled={soldOut}
                      className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                        soldOut
                          ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50'
                          : isPicked
                          ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400'
                          : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {fmtDate(s.showSchedules)}
                            <span className="text-indigo-600 ml-2">{fmtTime(s.showSchedules)}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">📍 {s.venue.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-indigo-600">
                            {soldOut ? 'Sold Out' : `฿${minPrice.toLocaleString()}`}
                          </p>
                          {!soldOut && (
                            <p className="text-xs text-gray-400">{available} left</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── STICKY FOOTER ── */}
        <div className="flex-none border-t border-gray-200 bg-white rounded-b-2xl p-4 space-y-3">
          {/* Tier panel — only visible once a showtime is picked */}
          {picked && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Ticket Tiers — {fmtDate(picked.showSchedules)} {fmtTime(picked.showSchedules)}
              </p>
              {picked.tiers.map(tier => (
                <div key={tier.tierId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">{tier.tierName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs">{tier.available} left</span>
                    <span className="text-indigo-600 font-bold">฿{tier.price.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-1.5 mt-1 flex items-center justify-between text-sm">
                <span className="text-gray-500">Starting from</span>
                <span className="text-indigo-700 font-bold">฿{pickedMinPrice.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* CTA row */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={handleBook}
              disabled={ctaDisabled}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
