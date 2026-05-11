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

const TAG_EMOJI: Record<string, string> = {
  Musical:    '🎭',
  Concert:    '🎵',
  Conference: '💼',
  Sport:      '🥊',
  Comedy:     '😂',
  Exhibition: '🖼️',
};

const PLACEHOLDER_GRADIENT: Record<string, string> = {
  Musical:    'from-pink-500 to-rose-600',
  Concert:    'from-blue-500 to-indigo-600',
  Conference: 'from-slate-500 to-gray-700',
  Sport:      'from-emerald-500 to-green-600',
  Comedy:     'from-amber-400 to-orange-500',
  Exhibition: 'from-orange-500 to-red-600',
};

interface Props {
  group: GroupedEvent;
  onBook: (showtime: Showtime) => void;
  onClose: () => void;
  isLoggedIn: boolean;
  isCustomer: boolean;
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString('en-TH', { hour: '2-digit', minute: '2-digit' });
}

function AvailabilityBadge({ available, total }: { available: number; total: number }) {
  if (available === 0) return null;
  const pct = total > 0 ? available / total : 1;
  if (pct <= 0.1)
    return <span className="text-xs font-semibold text-red-500">⚡ {available} left</span>;
  if (pct <= 0.3)
    return <span className="text-xs font-medium text-amber-500">{available} left</span>;
  return <span className="text-xs text-gray-400">{available} seats</span>;
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

  const tagNames = event.tags.map(t => t.typeName);
  const emoji = tagNames.length > 0 ? (TAG_EMOJI[tagNames[0]] ?? '🎫') : '🎫';
  const gradient = tagNames.length > 0
    ? (PLACEHOLDER_GRADIENT[tagNames[0]] ?? 'from-indigo-500 to-violet-600')
    : 'from-indigo-500 to-violet-600';

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
    : 'Select Seats →';

  const ctaDisabled = !picked || pickedAvailable === 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-xl w-full flex flex-col shadow-2xl"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto min-h-0 rounded-t-2xl">

          {/* Hero image / placeholder */}
          <div className="relative">
            {event.thumbnail && !imgError ? (
              <img
                src={event.thumbnail}
                alt={event.title}
                className="w-full h-56 object-cover rounded-t-2xl"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className={`w-full h-56 bg-gradient-to-br ${gradient} rounded-t-2xl flex flex-col items-center justify-center`}>
                <span className="text-7xl mb-2">{emoji}</span>
                <span className="text-sm text-white/70 font-medium px-6 text-center line-clamp-1">{event.title}</span>
              </div>
            )}
            {/* Bottom fade for image readability */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent rounded-t-2xl pointer-events-none" />
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 pb-4">
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {event.tags.map(tag => (
                <span
                  key={tag.typeId}
                  className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-medium ${TAG_COLORS[tag.typeName] ?? 'bg-indigo-100 text-indigo-700'}`}
                >
                  {tag.typeName}
                </span>
              ))}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{event.title}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
              {event.rating && (
                <span className="border border-gray-300 text-gray-500 text-xs font-bold px-1.5 py-0.5 rounded">
                  {event.rating}
                </span>
              )}
              <span>{event.durationMinutes} min</span>
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Available Showtimes
              </p>
              <div className="space-y-2">
                {showtimes.map(s => {
                  const available = s.tiers.reduce((sum, t) => sum + t.available, 0);
                  const total     = s.tiers.reduce((sum, t) => sum + t.totalAmount, 0);
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
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {fmtDate(s.showSchedules)}
                            <span className="text-indigo-600 ml-2">{fmtTime(s.showSchedules)}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">📍 {s.venue.name}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!soldOut && <AvailabilityBadge available={available} total={total} />}
                          <div className="text-right min-w-[4rem]">
                            {soldOut ? (
                              <p className="text-xs font-semibold text-gray-400">Sold Out</p>
                            ) : (
                              <p className="text-sm font-bold text-indigo-600">฿{minPrice.toLocaleString()}</p>
                            )}
                          </div>
                          {isPicked ? (
                            <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <div className="w-5 h-5 shrink-0" />
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
        <div className="flex-none border-t border-gray-100 bg-white rounded-b-2xl p-4 space-y-3">
          {/* Tier breakdown — only when a showtime is picked */}
          {picked && (
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Ticket Tiers
              </p>
              <div className="space-y-2">
                {picked.tiers.map(tier => (
                  <div key={tier.tierId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 font-medium">{tier.tierName}</span>
                      {tier.available === 0 && (
                        <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">Sold out</span>
                      )}
                      {tier.available > 0 && tier.available <= 10 && (
                        <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Only {tier.available} left</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-indigo-600">฿{tier.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-2 pt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">Starting from</span>
                <span className="text-base font-bold text-indigo-700">฿{pickedMinPrice.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleBook}
              disabled={ctaDisabled}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
