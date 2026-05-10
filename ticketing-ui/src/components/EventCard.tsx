import { useState } from 'react';
import type { Showtime } from '../types';

interface Props {
  showtime: Showtime;
  onSelect: (showtime: Showtime) => void;
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

export function EventCard({ showtime, onSelect }: Props) {
  const { event, venue, showSchedules, tiers } = showtime;
  const [imgError, setImgError] = useState(false);
  const date = new Date(showSchedules);
  const minPrice = Math.min(...tiers.map(t => t.price));
  const tagNames = event.tags.map(t => t.typeName);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
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
      <div className="p-4">
        {/* Tag pills */}
        <div className="flex flex-wrap gap-1 mb-2">
          {event.tags.length === 0 ? (
            <span className="text-xs text-gray-400 italic">No tags</span>
          ) : (
            event.tags.map(tag => (
              <span
                key={tag.typeId}
                className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                  TAG_COLORS[tag.typeName] ?? 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {tag.typeName}
              </span>
            ))
          )}
        </div>
        <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1">{event.title}</h3>
        <p className="text-sm text-gray-500 mb-1">{venue.name}</p>
        <p className="text-sm text-gray-500 mb-3">
          {date.toLocaleDateString('en-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '}
          {date.toLocaleTimeString('en-TH', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400">From</span>
            <p className="text-indigo-600 font-bold">฿{minPrice.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {event.rating && (
              <span className="border border-gray-400 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded">
                {event.rating}
              </span>
            )}
            <span>{event.durationMinutes} min</span>
          </div>
        </div>
        <button
          onClick={() => onSelect(showtime)}
          className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Select Seats
        </button>
      </div>
    </div>
  );
}
