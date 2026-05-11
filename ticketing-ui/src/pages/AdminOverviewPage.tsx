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

function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-36" />
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-5 py-3 flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
            <div className="h-5 bg-gray-200 rounded-full w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
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
      <header className="bg-gradient-to-r from-indigo-700 to-violet-700 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">🎫 NoLife Ticket</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-400/30 text-red-100 border border-red-300/40">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-indigo-100">Hi, {user?.firstName}</span>
            <button onClick={() => onNavigate('admin-overview')} className="text-sm text-white font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
              Overview
            </button>
            <button onClick={() => onNavigate('dashboard')} className="text-sm text-indigo-100 hover:text-white transition-colors">Events</button>
            <button onClick={() => onNavigate('admin-venues')} className="text-sm text-indigo-100 hover:text-white transition-colors">Venues</button>
            <button onClick={() => onNavigate('admin-reports')} className="text-sm text-indigo-100 hover:text-white transition-colors">Reports</button>
            <button onClick={() => onNavigate('admin-users')} className="text-sm text-indigo-100 hover:text-white transition-colors">Users</button>
            <button onClick={() => onNavigate('events')} className="text-sm text-indigo-100 hover:text-white transition-colors">Browse</button>
            <button onClick={logout} className="text-sm text-indigo-300 hover:text-white transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Admin Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">Platform health at a glance</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          ) : data ? (
            <>
              <StatCard
                label="Total Revenue"
                value={fmtMoney(data.totalRevenue)}
                sub="all confirmed bookings"
                color="indigo"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Tickets This Month"
                value={data.ticketsSoldThisMonth.toLocaleString()}
                sub="confirmed tickets"
                color="green"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                }
              />
              <StatCard
                label="Active Bookings"
                value={data.activeBookings.toLocaleString()}
                sub="pending + confirmed"
                color="yellow"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
              <StatCard
                label="Total Users"
                value={data.totalUsers.toLocaleString()}
                sub="registered accounts"
                color="purple"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
            </>
          ) : null}
        </div>

        {/* Panels */}
        {loading ? (
          <div className="grid lg:grid-cols-2 gap-6">
            <SkeletonPanel />
            <SkeletonPanel />
          </div>
        ) : data && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Bookings */}
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Last 10</span>
              </div>
              <div className="divide-y divide-gray-50">
                {data.recentBookings.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-gray-400 text-center">No bookings yet</p>
                ) : (
                  data.recentBookings.map(b => (
                    <div key={b.bookingId} className="px-5 py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{b.customerName}</p>
                        <p className="text-xs text-gray-500 truncate">{b.eventTitle}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(b.bookedAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {b.status}
                        </span>
                        <span className="text-sm font-bold text-gray-800">{fmtMoney(b.totalAmount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Upcoming Showtimes */}
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Upcoming Showtimes</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Next 8</span>
              </div>
              <div className="divide-y divide-gray-50">
                {data.upcomingShowtimes.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-gray-400 text-center">No upcoming showtimes</p>
                ) : (
                  data.upcomingShowtimes.map(s => {
                    const pct = s.totalCapacity > 0 ? Math.round((s.bookedTickets / s.totalCapacity) * 100) : 0;
                    const barColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-indigo-400';
                    const pctLabel = pct >= 80
                      ? <span className="text-xs font-semibold text-green-600">{pct}%</span>
                      : pct >= 50
                      ? <span className="text-xs font-semibold text-yellow-600">{pct}%</span>
                      : <span className="text-xs font-semibold text-gray-500">{pct}%</span>;
                    return (
                      <div key={s.showtimeId} className="px-5 py-3.5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{s.eventTitle}</p>
                            <p className="text-xs text-gray-500 truncate">📍 {s.venueName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{fmt(s.showSchedules)}</p>
                          </div>
                          {pctLabel}
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                          <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400">
                          {s.bookedTickets.toLocaleString()} / {s.totalCapacity.toLocaleString()} seats booked
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, sub, color, icon }: StatCardProps) {
  const palette: Record<string, { wrap: string; icon: string }> = {
    indigo: { wrap: 'bg-indigo-50 border-indigo-100', icon: 'text-indigo-500 bg-indigo-100' },
    green:  { wrap: 'bg-green-50  border-green-100',  icon: 'text-green-500  bg-green-100'  },
    yellow: { wrap: 'bg-yellow-50 border-yellow-100', icon: 'text-yellow-500 bg-yellow-100' },
    purple: { wrap: 'bg-purple-50 border-purple-100', icon: 'text-purple-500 bg-purple-100' },
  };
  const p = palette[color] ?? palette.indigo;
  return (
    <div className={`rounded-xl border p-5 ${p.wrap}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <span className={`p-1.5 rounded-lg ${p.icon}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
