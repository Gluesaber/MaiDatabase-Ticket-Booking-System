import { useState, useEffect } from 'react';
import { api } from '../services/ApiService';
import { useAuth } from '../context/AuthContext';

interface Props {
  onNavigate: (page: string) => void;
}

type OverviewData = Awaited<ReturnType<typeof api.getOverview>>;

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING:   'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED:   'bg-gray-100 text-gray-500',
};

function fmt(dt: string) {
  return new Date(dt).toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n);
}

export function AdminOverviewPage({ onNavigate }: Props) {
  const { user, logout } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getOverview()
      .then(setData)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load overview'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-indigo-600">🎫 NoLife Ticket</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">ADMIN</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hi, {user?.firstName}</span>
            <button onClick={() => onNavigate('dashboard')} className="text-sm text-indigo-600 hover:underline font-medium">
              Events
            </button>
            <button onClick={() => onNavigate('admin-venues')} className="text-sm text-indigo-600 hover:underline font-medium">
              Venues
            </button>
            <button onClick={() => onNavigate('admin-reports')} className="text-sm text-indigo-600 hover:underline font-medium">
              Reports
            </button>
            <button onClick={() => onNavigate('admin-users')} className="text-sm text-indigo-600 hover:underline font-medium">
              Users
            </button>
            <button onClick={() => onNavigate('events')} className="text-sm text-indigo-600 hover:underline">
              Browse
            </button>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Overview</h2>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {data && (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Revenue"
                value={fmtMoney(data.totalRevenue)}
                sub="all confirmed bookings"
                color="indigo"
              />
              <StatCard
                label="Tickets This Month"
                value={data.ticketsSoldThisMonth.toLocaleString()}
                sub="confirmed tickets"
                color="green"
              />
              <StatCard
                label="Active Bookings"
                value={data.activeBookings.toLocaleString()}
                sub="pending + confirmed"
                color="yellow"
              />
              <StatCard
                label="Total Users"
                value={data.totalUsers.toLocaleString()}
                sub="registered accounts"
                color="purple"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
                  <span className="text-xs text-gray-400">Last 10</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {data.recentBookings.length === 0 && (
                    <p className="px-5 py-6 text-sm text-gray-400 text-center">No bookings yet</p>
                  )}
                  {data.recentBookings.map(b => (
                    <div key={b.bookingId} className="px-5 py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{b.customerName}</p>
                        <p className="text-xs text-gray-500 truncate">{b.eventTitle}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(b.bookedAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {b.status}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{fmtMoney(b.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Upcoming Showtimes */}
              <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Upcoming Showtimes</h3>
                  <span className="text-xs text-gray-400">Next 8</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {data.upcomingShowtimes.length === 0 && (
                    <p className="px-5 py-6 text-sm text-gray-400 text-center">No upcoming showtimes</p>
                  )}
                  {data.upcomingShowtimes.map(s => {
                    const pct = s.totalCapacity > 0 ? Math.round((s.bookedTickets / s.totalCapacity) * 100) : 0;
                    const barColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-indigo-400';
                    return (
                      <div key={s.showtimeId} className="px-5 py-3">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{s.eventTitle}</p>
                            <p className="text-xs text-gray-500">{s.venueName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{fmt(s.showSchedules)}</p>
                          </div>
                          <span className="text-xs font-semibold text-gray-600 shrink-0">{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {s.bookedTickets} / {s.totalCapacity} seats
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    green:  'bg-green-50  border-green-100  text-green-700',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-60 mt-1">{sub}</p>
    </div>
  );
}


