import { useState } from 'react';
import type { EventInfo, Showtime } from '../types';

export interface GroupedEvent {
  event: EventInfo;
  showtimes: Showtime[];
}

interface Props {
  group: GroupedEvent;
  onViewDetails: (group: GroupedEvent) => void;
}

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function EventPlaceholder({ tags, title }: { tags: string[]; title: string }) {
  const emoji = tags.length > 0 ? (TAG_EMOJI[tags[0]] ?? '🎫') : '🎫';
  const gradient = tags.length > 0
    ? (PLACEHOLDER_GRADIENT[tags[0]] ?? 'from-indigo-500 to-violet-600')
    : 'from-indigo-500 to-violet-600';
  return (
    <div className={`w-full h-48 flex flex-col items-center justify-center bg-gradient-to-br ${gradient} select-none`}>
      <span className="text-5xl mb-2">{emoji}</span>
      <span className="text-xs text-white/80 font-medium text-center px-4 line-clamp-1">{title}</span>
    </div>
  );
}

export function EventCard({ group, onViewDetails }: Props) {
  const { event, showtimes } = group;
  const [imgError, setImgError] = useState(false);
  const tagNames = event.tags.map(t => t.typeName);
  const allSoldOut = showtimes.every(s => s.tiers.every(t => t.available === 0));

  const minPrice = showtimes
    .flatMap(s => s.tiers)
    .filter(t => t.available > 0)
    .reduce((min, t) => Math.min(min, t.price), Infinity);

  const nextShowtime = [...showtimes]
    .sort((a, b) => new Date(a.showSchedules).getTime() - new Date(b.showSchedules).getTime())[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col group">
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        {event.thumbnail && !imgError ? (
          <img
            src={event.thumbnail}
            alt={event.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <EventPlaceholder tags={tagNames} title={event.title} />
        )}
        {allSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {event.tags.length === 0 ? (
            <span className="text-xs text-gray-400 italic">No tags</span>
          ) : (
            event.tags.slice(0, 3).map(tag => (
              <span
                key={tag.typeId}
                className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${TAG_COLORS[tag.typeName] ?? 'bg-indigo-100 text-indigo-700'}`}
              >
                {tag.typeName}
              </span>
            ))
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 line-clamp-2">{event.title}</h3>

        {/* Date + Venue */}
        {nextShowtime && (
          <div className="space-y-1 mb-3 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(nextShowtime.showSchedules)}</span>
              {showtimes.length > 1 && (
                <span className="text-indigo-500 font-medium">+{showtimes.length - 1} more</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{nextShowtime.venue.name}</span>
            </div>
          </div>
        )}

        {/* Rating + duration */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          {event.rating && (
            <span className="border border-gray-300 text-gray-500 font-bold px-1.5 py-0.5 rounded">
              {event.rating}
            </span>
          )}
          <span>{event.durationMinutes} min</span>
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="text-sm">
            {!allSoldOut && isFinite(minPrice) && (
              <span className="font-medium text-gray-600">
                From <span className="text-indigo-600 font-semibold">฿{minPrice.toLocaleString()}</span>
              </span>
            )}
          </div>
          <button
            onClick={() => onViewDetails(group)}
            disabled={allSoldOut}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
