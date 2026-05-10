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

function EventPlaceholder({ tags, title }: { tags: string[]; title: string }) {
  const emoji = tags.length > 0 ? (TAG_EMOJI[tags[0]] ?? '🎫') : '🎫';
  return (
    <div className="w-full h-48 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 select-none">
      <span className="text-5xl mb-2">{emoji}</span>
      <span className="text-xs text-indigo-400 font-medium text-center px-4 line-clamp-1">{title}</span>
    </div>
  );
}

export function EventCard({ group, onViewDetails }: Props) {
  const { event, showtimes } = group;
  const [imgError, setImgError] = useState(false);
  const tagNames = event.tags.map(t => t.typeName);
  const showtimeCount = showtimes.length;
  const allSoldOut = showtimes.every(s => s.tiers.every(t => t.available === 0));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Thumbnail */}
      {event.thumbnail && !imgError ? (
        <img
          src={event.thumbnail}
          alt={event.title}
          className="w-full h-48 object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <EventPlaceholder tags={tagNames} title={event.title} />
      )}

      <div className="p-4 flex flex-col flex-1">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {event.tags.length === 0 ? (
            <span className="text-xs text-gray-400 italic">No tags</span>
          ) : (
            event.tags.map(tag => (
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
        <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1">{event.title}</h3>

        {/* Rating + duration */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          {event.rating && (
            <span className="border border-gray-400 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded">
              {event.rating}
            </span>
          )}
          <span>{event.durationMinutes} min</span>
          <span className="ml-auto text-xs text-indigo-600 font-medium">
            {showtimeCount} showtime{showtimeCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Description preview */}
        {event.description ? (
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-3">{event.description}</p>
        ) : (
          <p className="text-sm text-gray-400 italic mb-3">No description.</p>
        )}

        {/* CTA */}
        <button
          onClick={() => onViewDetails(group)}
          disabled={allSoldOut}
          className="mt-auto w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {allSoldOut ? 'Sold Out' : 'View Details'}
        </button>
      </div>
    </div>
  );
}
