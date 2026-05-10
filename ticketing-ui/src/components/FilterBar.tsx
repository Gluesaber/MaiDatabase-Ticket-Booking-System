import { useState, useEffect } from 'react';
import type { TagDto } from '../types';
import { MultiTagSelect } from './MultiTagSelect';

export interface FilterValues {
  tagIds: number[];
  minPrice: string;
  maxPrice: string;
  startDate: string;
  endDate: string;
}

export const EMPTY_FILTERS: FilterValues = {
  tagIds: [], minPrice: '', maxPrice: '', startDate: '', endDate: '',
};

interface Props {
  allTags: TagDto[];
  initial: FilterValues;
  onApply: (filters: FilterValues) => void;
}

export function FilterBar({ allTags, initial, onApply }: Props) {
  const [tagIds, setTagIds] = useState(initial.tagIds);
  const [minPrice, setMinPrice] = useState(initial.minPrice);
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);

  useEffect(() => {
    setTagIds(initial.tagIds);
    setMinPrice(initial.minPrice);
    setMaxPrice(initial.maxPrice);
    setStartDate(initial.startDate);
    setEndDate(initial.endDate);
  }, [initial]);

  function handleTagChange(ids: number[]) {
    setTagIds(ids);
    onApply({ tagIds: ids, minPrice, maxPrice, startDate, endDate });
  }

  function handleApply() {
    onApply({ tagIds, minPrice, maxPrice, startDate, endDate });
  }

  function handleClear() {
    setTagIds([]);
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
    onApply(EMPTY_FILTERS);
  }

  const hasAnyFilter = tagIds.length > 0 || minPrice || maxPrice || startDate || endDate;

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6 space-y-3">
      {/* Tag pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => handleTagChange([])}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            tagIds.length === 0
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <MultiTagSelect options={allTags} selected={tagIds} onChange={handleTagChange} compact />
      </div>

      {/* Price + Date row */}
      <div className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Min Price (฿)</label>
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            placeholder="0"
            className="w-28 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Max Price (฿)</label>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            placeholder="any"
            className="w-28 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Apply
          </button>
          {hasAnyFilter && (
            <button
              onClick={handleClear}
              className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
