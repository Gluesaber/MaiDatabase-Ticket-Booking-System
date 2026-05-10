import { useEffect, useState } from 'react';
import type { BookingHistoryItem } from '../types';
import { api } from '../services/ApiService';
import { usePaymentCountdown } from '../hooks/usePaymentCountdown';

interface Props {
  onNavigate: (page: string) => void;
}

const statusColor: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING:   'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED:   'bg-gray-100 text-gray-600',
};

function BookingCountdown({ expiresAt, onExpired }: { expiresAt: string; onExpired: () => void }) {
  const { minutes, seconds, expired } = usePaymentCountdown(expiresAt);

  useEffect(() => {
    if (expired) onExpired();
  }, [expired, onExpired]);

  if (expired) return null;

  const urgent = minutes === 0;
  return (
    <p className={`text-xs font-semibold mt-1 ${urgent ? 'text-red-600' : 'text-orange-500'}`}>
      Pay within {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </p>
  );
}

export function BookingHistoryPage({ onNavigate }: Props) {
  const [items, setItems] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Payment modal state
  const [payingBooking, setPayingBooking] = useState<BookingHistoryItem | null>(null);
  const [payMethod, setPayMethod] = useState('CREDIT_CARD');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    api.getBookingHistory()
      .then(setItems)
      .catch(() => setError('Failed to load booking history'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(bookingId: number, eventTitle: string) {
    if (!confirm(`Cancel your booking for "${eventTitle}"? This cannot be undone.`)) return;
    setCancellingId(bookingId);
    try {
      await api.cancelBooking(bookingId);
      setItems(prev => prev.map(item =>
        item.bookingId === bookingId ? { ...item, status: 'CANCELLED' } : item,
      ));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setCancellingId(null);
    }
  }

  async function handlePay() {
    if (!payingBooking) return;
    setPaying(true);
    setPayError('');
    try {
      await api.processPayment(payingBooking.bookingId, payMethod, payingBooking.totalAmount);
      setItems(prev => prev.map(item =>
        item.bookingId === payingBooking.bookingId ? { ...item, status: 'CONFIRMED' } : item,
      ));
      setPayingBooking(null);
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  }

  function markExpired(bookingId: number) {
    setItems(prev => prev.map(item =>
      item.bookingId === bookingId && item.status === 'PENDING'
        ? { ...item, status: 'EXPIRED' }
        : item,
    ));
    if (payingBooking?.bookingId === bookingId) setPayingBooking(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => onNavigate('events')} className="text-indigo-600 hover:underline text-sm">← Back to Events</button>
          <h1 className="text-xl font-bold text-gray-900">My Bookings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading && <p className="text-center text-gray-400 py-20">Loading…</p>}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No bookings yet</p>
            <button onClick={() => onNavigate('events')} className="text-indigo-600 hover:underline">Browse events</button>
          </div>
        )}
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.bookingId} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.eventTitle}</h3>
                  <p className="text-sm text-gray-500">{item.venueName}</p>
                  <p className="text-sm text-gray-500">{new Date(item.showSchedules).toLocaleString('en-TH')}</p>
                  {item.status === 'PENDING' && item.expiresAt && (
                    <BookingCountdown
                      expiresAt={item.expiresAt}
                      onExpired={() => markExpired(item.bookingId)}
                    />
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {item.status}
                  </span>
                  <div className="flex gap-2">
                    {item.status === 'PENDING' && (
                      <button
                        onClick={() => { setPayingBooking(item); setPayError(''); }}
                        className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-lg font-medium"
                      >
                        Pay
                      </button>
                    )}
                    {(item.status === 'PENDING' || item.status === 'CONFIRMED') && (
                      <button
                        onClick={() => handleCancel(item.bookingId, item.eventTitle)}
                        disabled={cancellingId === item.bookingId}
                        className="text-xs text-red-600 hover:text-red-800 border border-red-200 px-2.5 py-1
                                   rounded-lg hover:bg-red-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingId === item.bookingId ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 mt-3 space-y-1">
                {item.tickets.map(t => (
                  <div key={t.ticketId} className="flex justify-between text-sm text-gray-700">
                    <span>{t.seatCode} ({t.tierName})</span>
                    <span>฿{Number(t.price).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 mt-2">
                  <span>Total</span>
                  <span>฿{Number(item.totalAmount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Payment modal */}
      {payingBooking && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Complete Payment</h2>
            <p className="text-sm text-gray-500 mb-4">{payingBooking.eventTitle}</p>

            {payingBooking.expiresAt && (
              <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-sm text-orange-700 font-medium text-center">
                <BookingCountdown
                  expiresAt={payingBooking.expiresAt}
                  onExpired={() => markExpired(payingBooking.bookingId)}
                />
              </div>
            )}

            <div className="space-y-2 mb-4 text-sm">
              {payingBooking.tickets.map(t => (
                <div key={t.ticketId} className="flex justify-between text-gray-700">
                  <span>{t.seatCode} ({t.tierName})</span>
                  <span>฿{Number(t.price).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-900 border-t pt-2 mt-2">
                <span>Total</span>
                <span>฿{Number(payingBooking.totalAmount).toLocaleString()}</span>
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
              <button
                onClick={() => setPayingBooking(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handlePay}
                disabled={paying}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                {paying ? 'Processing…' : `Pay ฿${Number(payingBooking.totalAmount).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
