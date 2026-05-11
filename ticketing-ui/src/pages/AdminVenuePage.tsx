import { useEffect, useState } from 'react';
import { api } from '../services/ApiService';
import type { VenueDetail } from '../types';
import { VenueFormModal } from '../components/VenueFormModal';
import { useAuth } from '../context/AuthContext';

interface Props {
  onNavigate: (page: string) => void;
}

function SkeletonVenueCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4 animate-pulse">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-11 h-11 rounded-xl bg-gray-200 shrink-0" />
        <div className="space-y-2 min-w-0 flex-1">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-3 bg-gray-100 rounded w-56" />
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <div className="h-8 w-14 bg-gray-200 rounded-lg" />
        <div className="h-8 w-16 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export function AdminVenuePage({ onNavigate }: Props) {
  const { user, logout } = useAuth();
  const [venues, setVenues] = useState<VenueDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VenueDetail | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function reload() {
    setLoading(true);
    api.getVenues().then(setVenues).finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, []);

  async function handleDelete(venue: VenueDetail) {
    if (!confirm(`Delete "${venue.name}"? This cannot be undone.`)) return;
    setError('');
    try {
      await api.deleteVenue(venue.venueId);
      setSuccess(`"${venue.name}" deleted.`);
      setVenues(v => v.filter(x => x.venueId !== venue.venueId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  function openCreate() {
    setEditing(null);
    setShowForm(true);
    setSuccess('');
    setError('');
  }

  function openEdit(venue: VenueDetail) {
    setEditing(venue);
    setShowForm(true);
    setSuccess('');
    setError('');
  }

  function formatAddress(v: VenueDetail) {
    return [v.address.addressLine, v.address.district, v.address.province]
      .filter(Boolean)
      .join(', ');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 to-violet-700 shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">🎫 NoLife Ticket</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-400/30 text-red-100 border border-red-300/40">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-indigo-100">Hi, {user?.firstName}</span>
            <button onClick={() => onNavigate('admin-overview')} className="text-sm text-indigo-100 hover:text-white transition-colors">Overview</button>
            <button onClick={() => onNavigate('dashboard')} className="text-sm text-indigo-100 hover:text-white transition-colors">Events</button>
            <button onClick={() => onNavigate('admin-venues')} className="text-sm text-white font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
              Venues
            </button>
            <button onClick={() => onNavigate('admin-reports')} className="text-sm text-indigo-100 hover:text-white transition-colors">Reports</button>
            <button onClick={() => onNavigate('admin-users')} className="text-sm text-indigo-100 hover:text-white transition-colors">Users</button>
            <button onClick={() => onNavigate('events')} className="text-sm text-indigo-100 hover:text-white transition-colors">Browse</button>
            <button onClick={logout} className="text-sm text-indigo-300 hover:text-white transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Page title row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Venue Management</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? 'Loading…' : `${venues.length} venue${venues.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Venue
          </button>
        </div>

        {/* Banners */}
        {success && (
          <div className="mb-5 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Venue list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonVenueCard key={i} />)}
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-200">
            <div className="text-5xl mb-4">🏟️</div>
            <p className="text-gray-700 font-medium text-lg mb-1">No venues yet</p>
            <p className="text-sm text-gray-400 mb-5">Add a venue to host events and showtimes.</p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Create your first venue
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {venues.map(v => {
              const address = formatAddress(v);
              return (
                <div
                  key={v.venueId}
                  className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Icon placeholder */}
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-xl">
                      🏟️
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{v.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          <span className="font-medium text-gray-800">{v.capacity.toLocaleString()}</span> seats
                        </span>
                      </div>
                      {address && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-xs text-gray-400 truncate">{address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(v)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(v)}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showForm && (
        <VenueFormModal
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setSuccess(editing ? 'Venue updated.' : 'Venue created.');
            reload();
          }}
        />
      )}
    </div>
  );
}
