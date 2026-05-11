import { useState, useEffect } from 'react';
import type { Showtime, BookingResponse, TagDto, VenueDetail } from '../types';
import { api } from '../services/ApiService';
import { EventCard } from '../components/EventCard';
import type { GroupedEvent } from '../components/EventCard';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { SeatSelection } from '../components/SeatSelection';
import { PaymentCountdownBanner } from '../components/PaymentCountdownBanner';
import { FilterBar, EMPTY_FILTERS } from '../components/FilterBar';
import type { FilterValues } from '../components/FilterBar';
import { useAuth } from '../context/AuthContext';

interface Props {
  onNavigate: (page: string) => void;
}

type Stage = 'list' | 'details' | 'seats' | 'payment' | 'success';

function groupByEvent(showtimes: Showtime[]): GroupedEvent[] {
  const map = new Map<number, GroupedEvent>();
  for (const s of showtimes) {
    const id = s.event.eventId;
    if (!map.has(id)) map.set(id, { event: s.event, showtimes: [] });
    map.get(id)!.showtimes.push(s);
  }
  return [...map.values()];
}

function parseFiltersFromUrl(): FilterValues {
  const p = new URLSearchParams(window.location.search);
  const tagParam    = p.get('tags');
  const ratingParam = p.get('ratings');
  const venueParam  = p.get('venueIds');
  return {
    title:     p.get('title') ?? '',
    tagIds:    tagParam    ? tagParam.split(',').map(Number).filter(Boolean)   : [],
    ratings:   ratingParam ? ratingParam.split(',').filter(Boolean)            : [],
    venueIds:  venueParam  ? venueParam.split(',').map(Number).filter(Boolean) : [],
    minPrice:  p.get('minPrice')  ?? '',
    maxPrice:  p.get('maxPrice')  ?? '',
    startDate: p.get('startDate') ?? '',
    endDate:   p.get('endDate')   ?? '',
  };
}

function filtersToSearch(f: FilterValues): string {
  const p = new URLSearchParams();
  if (f.title)              p.set('title',    f.title);
  if (f.tagIds.length > 0)  p.set('tags',     f.tagIds.join(','));
  if (f.ratings.length > 0) p.set('ratings',  f.ratings.join(','));
  if (f.venueIds.length > 0) p.set('venueIds', f.venueIds.join(','));
  if (f.minPrice)           p.set('minPrice', f.minPrice);
  if (f.maxPrice)           p.set('maxPrice', f.maxPrice);
  if (f.startDate)          p.set('startDate', f.startDate);
  if (f.endDate)            p.set('endDate',   f.endDate);
  const qs = p.toString();
  return qs ? `?${qs}` : window.location.pathname;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded-full w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-9 bg-gray-200 rounded-lg mt-2" />
      </div>
    </div>
  );
}

export function EventListPage({ onNavigate }: Props) {
  const { user, logout } = useAuth();
  const [eventGroups, setEventGroups] = useState<GroupedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>(parseFiltersFromUrl);
  const [allTags, setAllTags] = useState<TagDto[]>([]);
  const [allVenues, setAllVenues] = useState<VenueDetail[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupedEvent | null>(null);
  const [selected, setSelected] = useState<Showtime | null>(null);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [stage, setStage] = useState<Stage>('list');
  const [payMethod, setPayMethod] = useState('CREDIT_CARD');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  function loadShowtimes(f: FilterValues) {
    setLoading(true);
    api.searchEvents({
      title:    f.title    || undefined,
      tagIds:   f.tagIds.length   > 0 ? f.tagIds   : undefined,
      ratings:  f.ratings.length  > 0 ? f.ratings  : undefined,
      venueIds: f.venueIds.length > 0 ? f.venueIds : undefined,
      minPrice: f.minPrice || undefined,
      maxPrice: f.maxPrice || undefined,
      startDate: f.startDate || undefined,
      endDate:   f.endDate   || undefined,
    })
      .then(data => setEventGroups(groupByEvent(data)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    api.getTags().then(setAllTags);
    api.getVenues().then(setAllVenues);
    loadShowtimes(filters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleApply(newFilters: FilterValues) {
    setFilters(newFilters);
    window.history.replaceState({}, '', filtersToSearch(newFilters));
    loadShowtimes(newFilters);
  }

  async function handleBook(tickets: { tierId: number; seatCode: string }[]) {
    if (!selected) return;
    try {
      const res = await api.createBooking(selected.showtimeId, tickets);
      setBooking(res);
      setStage('payment');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Booking failed');
    }
  }

  async function handlePay() {
    if (!booking) return;
    setPaying(true);
    setPayError('');
    try {
      await api.processPayment(booking.bookingId, payMethod, booking.totalAmount);
      setStage('success');
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  }

  function reset() {
    setSelectedGroup(null);
    setSelected(null);
    setBooking(null);
    setStage('list');
    setPayError('');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {stage === 'payment' && booking && (
        <PaymentCountdownBanner expiresAt={booking.expiresAt} onExpired={reset} />
      )}

      <header className="bg-gradient-to-r from-indigo-700 to-violet-700 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">🎫 NoLife Ticket</h1>
            <p className="text-indigo-200 text-xs mt-0.5">Find and book events near you</p>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-indigo-100">Hi, {user.firstName}</span>
                {(user.role === 'organizer' || user.role === 'admin') && (
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="text-sm text-white font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Dashboard
                  </button>
                )}
                {user.role === 'customer' && (
                  <button
                    onClick={() => onNavigate('history')}
                    className="text-sm text-indigo-100 hover:text-white transition-colors"
                  >
                    My Bookings
                  </button>
                )}
                <button onClick={logout} className="text-sm text-indigo-300 hover:text-white transition-colors">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="text-sm text-indigo-100 hover:text-white transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="text-sm bg-white text-indigo-700 font-semibold px-4 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <FilterBar allTags={allTags} allVenues={allVenues} initial={filters} onApply={handleApply} />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : eventGroups.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium text-gray-700 mb-1">No events found</p>
            <p className="text-sm text-gray-400">Try adjusting or clearing the filters.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">
              {eventGroups.length} event{eventGroups.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventGroups.map(g => (
                <EventCard
                  key={g.event.eventId}
                  group={g}
                  onViewDetails={group => {
                    setSelectedGroup(group);
                    setStage('details');
                  }}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {stage === 'details' && selectedGroup && (
        <EventDetailsModal
          group={selectedGroup}
          isLoggedIn={!!user}
          isCustomer={user?.role === 'customer'}
          onBook={showtime => { setSelected(showtime); setStage('seats'); }}
          onClose={reset}
        />
      )}

      {stage === 'seats' && selected && (
        <SeatSelection
          showtime={selected}
          onConfirm={handleBook}
          onCancel={reset}
        />
      )}

      {stage === 'payment' && booking && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 pt-12">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Payment</h2>
            <div className="space-y-2 mb-4 text-sm">
              {booking.tickets.map(t => (
                <div key={t.ticketId} className="flex justify-between text-gray-700">
                  <span>{t.seatCode} ({t.tierName})</span>
                  <span>฿{Number(t.price).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-900 border-t pt-2 mt-2">
                <span>Total</span>
                <span>฿{Number(booking.totalAmount).toLocaleString()}</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment method</label>
              <select
                value={payMethod}
                onChange={e => setPayMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="QR_CODE">QR Code</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="WALLET">Wallet</option>
              </select>
            </div>
            {payError && <p className="text-sm text-red-600 mb-3">{payError}</p>}
            <div className="flex gap-3">
              <button onClick={reset} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={paying}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {paying ? 'Processing…' : `Pay ฿${Number(booking.totalAmount).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === 'success' && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-500 text-sm mb-6">Your tickets are confirmed. Check your bookings history.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { reset(); onNavigate('history'); }}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
              >
                View My Bookings
              </button>
              <button onClick={reset} className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">
                Browse More Events
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


