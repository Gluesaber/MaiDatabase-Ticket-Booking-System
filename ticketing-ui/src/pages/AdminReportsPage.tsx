import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { api } from '../services/ApiService';
import { useAuth } from '../context/AuthContext';

interface Props { onNavigate: (page: string) => void; }

// ── Peak Sales ────────────────────────────────────────────────────────────────
interface PeakSalesPoint {
  hour: number; label: string;
  sun: number; mon: number; tue: number; wed: number; thu: number; fri: number; sat: number;
}
const DAYS = [
  { key: 'mon', label: 'Mon', color: '#3b82f6' },
  { key: 'tue', label: 'Tue', color: '#10b981' },
  { key: 'wed', label: 'Wed', color: '#8b5cf6' },
  { key: 'thu', label: 'Thu', color: '#f59e0b' },
  { key: 'fri', label: 'Fri', color: '#ef4444' },
  { key: 'sat', label: 'Sat', color: '#ec4899' },
  { key: 'sun', label: 'Sun', color: '#f97316' },
] as const;
type DayKey = typeof DAYS[number]['key'];
function rowTotal(r: PeakSalesPoint) { return r.sun + r.mon + r.tue + r.wed + r.thu + r.fri + r.sat; }

// ── Other report types ────────────────────────────────────────────────────────
interface RegionPoint   { province: string; ticketsSold: number; totalIncome: number; }
interface CapacityPoint { eventTitle: string; venueName: string; showSchedules: string; totalCapacity: number; bookedTickets: number; fillRate: number; }
interface TopEventPoint { eventTitle: string; ticketsSold: number; totalIncome: number; }
interface EventOption   { eventId: number; title: string; }

const REPORT_TYPES = [
  { value: 'peak-sales',    label: 'Peak Sales Period' },
  { value: 'top-region',    label: 'Top-Selling Province' },
  { value: 'capacity',      label: 'Booking-to-Capacity' },
  { value: 'top-income',    label: 'Top Events by Income' },
  { value: 'top-tickets',   label: 'Top Events by Tickets Sold' },
];

const BAR_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#ec4899','#3b82f6','#8b5cf6','#f97316'];

export function AdminReportsPage({ onNavigate }: Props) {
  const { user, logout } = useAuth();
  const [reportType, setReportType] = useState('peak-sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [eventId, setEventId]     = useState<number | undefined>(undefined);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // per-report data
  const [peakData,     setPeakData]     = useState<PeakSalesPoint[]>([]);
  const [regionData,   setRegionData]   = useState<RegionPoint[]>([]);
  const [capacityData, setCapacityData] = useState<CapacityPoint[]>([]);
  const [incomeData,   setIncomeData]   = useState<TopEventPoint[]>([]);
  const [ticketsData,  setTicketsData]  = useState<TopEventPoint[]>([]);
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);

  useEffect(() => {
    api.getEvents().then(evs =>
      setEventOptions(evs.map(e => ({ eventId: e.eventId, title: e.title })))
    );
    load('peak-sales', '', '', undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(type: string, start: string, end: string, evId?: number) {
    setLoading(true);
    setError('');
    const f = { startDate: start || undefined, endDate: end || undefined };
    try {
      if (type === 'peak-sales')  setPeakData(await api.getPeakSales({ ...f, eventId: evId }));
      if (type === 'top-region')  setRegionData(await api.getTopRegion(f));
      if (type === 'capacity')    setCapacityData(await api.getCapacity(f));
      if (type === 'top-income')  setIncomeData(await api.getTopEventsByIncome(f));
      if (type === 'top-tickets') setTicketsData(await api.getTopEventsByTickets(f));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }

  function handleTypeChange(type: string) {
    setReportType(type);
    setEventId(undefined);
    load(type, startDate, endDate, undefined);
  }

  function handleApply() { load(reportType, startDate, endDate, eventId); }

  function handleClear() {
    setStartDate(''); setEndDate(''); setEventId(undefined);
    load(reportType, '', '', undefined);
  }

  // ── Peak Sales computed ──────────────────────────────────────────────────
  const grandTotal  = peakData.reduce((s, r) => s + rowTotal(r), 0);
  const colTotal    = (key: DayKey) => peakData.reduce((s, r) => s + r[key], 0);

  const isEmpty = {
    'peak-sales':  peakData.length === 0,
    'top-region':  regionData.length === 0,
    'capacity':    capacityData.length === 0,
    'top-income':  incomeData.length === 0,
    'top-tickets': ticketsData.length === 0,
  }[reportType] ?? true;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-indigo-600">🎫 Nugget Tickets</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">ADMIN</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hi, {user?.firstName}</span>
            <button onClick={() => onNavigate('dashboard')} className="text-sm text-indigo-600 hover:underline font-medium">Dashboard</button>
            <button onClick={() => onNavigate('admin-venues')} className="text-sm text-indigo-600 hover:underline">Venues</button>
            <button onClick={() => onNavigate('events')} className="text-sm text-indigo-600 hover:underline">Browse</button>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports</h2>

        {/* Controls */}
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={e => handleTypeChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {REPORT_TYPES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {reportType === 'peak-sales' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Filter by Event</label>
              <select
                value={eventId ?? ''}
                onChange={e => setEventId(e.target.value ? Number(e.target.value) : undefined)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Events</option>
                {eventOptions.map(e => (
                  <option key={e.eventId} value={e.eventId}>{e.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleApply}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              Apply
            </button>
            {(startDate || endDate || eventId) && (
              <button onClick={handleClear}
                className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                Clear
              </button>
            )}
          </div>
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading report…</div>
        ) : isEmpty ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400">No data found for the selected period.</p>
          </div>
        ) : (
          <>
            {/* ── Peak Sales ─────────────────────────────────────── */}
            {reportType === 'peak-sales' && (
              <>
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Ticket Sales by Hour &amp; Day of Week</h3>
                  <ResponsiveContainer width="100%" height={340}>
                    <LineChart data={peakData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip /><Legend />
                      {DAYS.map(d => (
                        <Line key={d.key} type="monotone" dataKey={d.key} name={d.label}
                          stroke={d.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h3 className="text-base font-semibold text-gray-800">Sales Volume by Hour — {grandTotal.toLocaleString()} tickets total</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">Hour</th>
                          {DAYS.map(d => <th key={d.key} className="text-center px-3 py-3 font-semibold" style={{ color: d.color }}>{d.label}</th>)}
                          <th className="text-center px-4 py-3 font-semibold text-gray-800">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {peakData.map(row => (
                          <tr key={row.hour} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 font-medium text-gray-700">{row.label}</td>
                            {DAYS.map(d => (
                              <td key={d.key} className="text-center px-3 py-2.5">
                                {row[d.key] > 0
                                  ? <span className="font-medium" style={{ color: d.color }}>{row[d.key]}</span>
                                  : <span className="text-gray-300">—</span>}
                              </td>
                            ))}
                            <td className="text-center px-4 py-2.5 font-semibold text-gray-900">{rowTotal(row)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-200">
                          <td className="px-4 py-3 font-semibold text-gray-700">Total</td>
                          {DAYS.map(d => <td key={d.key} className="text-center px-3 py-3 font-semibold text-gray-700">{colTotal(d.key)}</td>)}
                          <td className="text-center px-4 py-3 font-bold text-gray-900">{grandTotal}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ── Top Region ─────────────────────────────────────── */}
            {reportType === 'top-region' && (
              <>
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Revenue by Province</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={regionData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="province" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => `฿${Number(v).toLocaleString()}`} />
                      <Bar dataKey="totalIncome" name="Revenue (฿)" radius={[4,4,0,0]}>
                        {regionData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Province</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Tickets Sold</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {regionData.map((r, i) => (
                        <tr key={r.province} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            <span className="inline-block w-3 h-3 rounded-sm mr-2" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                            {r.province}
                          </td>
                          <td className="text-center px-4 py-3 text-gray-700">{r.ticketsSold.toLocaleString()}</td>
                          <td className="text-right px-4 py-3 font-semibold text-indigo-700">฿{Number(r.totalIncome).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Capacity Analysis ──────────────────────────────── */}
            {reportType === 'capacity' && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-800">Booking-to-Capacity per Showtime</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Event</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Venue</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Booked / Capacity</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 min-w-[160px]">Fill Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {capacityData.map((r, i) => {
                        const pct = Math.min(100, r.fillRate ?? 0);
                        const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#6366f1';
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{r.eventTitle}</td>
                            <td className="px-4 py-3 text-gray-600">{r.venueName}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(r.showSchedules).toLocaleString('en-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                            </td>
                            <td className="text-center px-4 py-3 text-gray-700">
                              {r.bookedTickets} / {r.totalCapacity}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-100 rounded-full h-2">
                                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} />
                                </div>
                                <span className="text-xs font-semibold w-12 text-right" style={{ color }}>{pct.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Top Events by Income ───────────────────────────── */}
            {reportType === 'top-income' && (
              <>
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Top Events by Revenue</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={incomeData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={v => `฿${Number(v).toLocaleString()}`} />
                      <YAxis type="category" dataKey="eventTitle" tick={{ fontSize: 12 }} width={120} />
                      <Tooltip formatter={(v: number) => [`฿${Number(v).toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="totalIncome" name="Revenue (฿)" radius={[0,4,4,0]}>
                        {incomeData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Rank</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Event</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Tickets Sold</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {incomeData.map((r, i) => (
                        <tr key={r.eventTitle} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-bold text-gray-400">#{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{r.eventTitle}</td>
                          <td className="text-center px-4 py-3 text-gray-700">{r.ticketsSold.toLocaleString()}</td>
                          <td className="text-right px-4 py-3 font-bold text-indigo-700">฿{Number(r.totalIncome).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Top Events by Tickets Sold ─────────────────────── */}
            {reportType === 'top-tickets' && (
              <>
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Top Events by Tickets Sold</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={ticketsData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="eventTitle" tick={{ fontSize: 12 }} width={120} />
                      <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Tickets']} />
                      <Bar dataKey="ticketsSold" name="Tickets Sold" radius={[0,4,4,0]}>
                        {ticketsData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Rank</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Event</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Tickets Sold</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ticketsData.map((r, i) => (
                        <tr key={r.eventTitle} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-bold text-gray-400">#{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{r.eventTitle}</td>
                          <td className="text-center px-4 py-3 font-bold text-indigo-700">{r.ticketsSold.toLocaleString()}</td>
                          <td className="text-right px-4 py-3 text-gray-700">฿{Number(r.totalIncome).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
