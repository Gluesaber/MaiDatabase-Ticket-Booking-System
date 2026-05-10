import type { TagDto } from '../types';

interface Props {
  options: TagDto[];
  selected: number[];
  onChange: (ids: number[]) => void;
  /** When true renders compact pill-toggle style (for filter bars). Default is form style. */
  compact?: boolean;
}

export function MultiTagSelect({ options, selected, onChange, compact = false }: Props) {
  function toggle(id: number) {
    onChange(
      selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id],
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map(tag => (
          <button
            key={tag.typeId}
            type="button"
            onClick={() => toggle(tag.typeId)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selected.includes(tag.typeId)
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tag.typeName}
          </button>
        ))}
      </div>
    );
  }

  // Form variant — full-width grid of toggleable chips
  return (
    <div>
      {options.length === 0 ? (
        <p className="text-sm text-gray-400">Loading tags…</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map(tag => (
            <button
              key={tag.typeId}
              type="button"
              onClick={() => toggle(tag.typeId)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selected.includes(tag.typeId)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {selected.includes(tag.typeId) && (
                <span className="mr-1 text-xs">✓</span>
              )}
              {tag.typeName}
            </button>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          {selected.length} tag{selected.length > 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
