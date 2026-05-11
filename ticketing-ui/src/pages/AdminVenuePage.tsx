import { useEffect, useState } from 'react';
import { api } from '../services/ApiService';
import type { VenueDetail } from '../types';
import { VenueFormModal } from '../components/VenueFormModal';
import { useAuth } from '../context/AuthContext';

interface Props {
  onNavigate: (page: string) => void;
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
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-indigo-600">🎫 NoLife Ticket</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hi, {user?.firstName}</span>
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-sm text-indigo-600 hover:underline"
            >
              Dashboard
            </button>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Venue Management</h2>
          <button
            onClick={openCreate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            + New Venue
          </button>
        </div>

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-20">Loading…</p>
        ) : venues.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400 text-lg mb-3">No venues yet</p>
            <button onClick={openCreate} className="text-indigo-600 hover:underline text-sm">
              Create your first venue
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {venues.map(v => (
              <div
                key={v.venueId}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">{v.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Capacity:{' '}
                    <span className="font-medium text-gray-700">
                      {v.capacity.toLocaleString()} seats
                    </span>
                  </p>
                  {formatAddress(v) && (
                    <p className="text-xs text-gray-400 mt-0.5">{formatAddress(v)}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(v)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200
                               px-3 py-1.5 rounded-lg hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(v)}
                    className="text-sm text-red-600 hover:text-red-800 border border-red-200
                               px-3 py-1.5 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
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


