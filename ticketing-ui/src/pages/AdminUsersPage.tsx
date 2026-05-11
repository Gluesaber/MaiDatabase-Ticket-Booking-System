import { useEffect, useState } from 'react';
import { api } from '../services/ApiService';
import { useAuth } from '../context/AuthContext';

interface UserRow {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Props {
  onNavigate: (page: string) => void;
}

const ROLES = ['admin', 'organizer', 'customer'];

const ROLE_STYLE: Record<string, string> = {
  admin:     'bg-purple-100 text-purple-700 border-purple-200',
  organizer: 'bg-blue-100 text-blue-700 border-blue-200',
  customer:  'bg-green-100 text-green-700 border-green-200',
};

const AVATAR_COLOR: Record<string, string> = {
  admin:     'bg-purple-100 text-purple-600',
  organizer: 'bg-blue-100 text-blue-600',
  customer:  'bg-green-100 text-green-600',
};

function SkeletonUserRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-100 rounded w-40" />
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
      <td className="px-5 py-3.5"><div className="h-8 bg-gray-200 rounded-lg w-28" /></td>
    </tr>
  );
}

export function AdminUsersPage({ onNavigate }: Props) {
  const { user: me, logout } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    api.getUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(user: UserRow, newRole: string) {
    if (newRole === user.role) return;
    if (!confirm(`Change ${user.firstName} ${user.lastName}'s role from "${user.role}" to "${newRole}"?`)) return;
    setUpdatingId(user.userId);
    setError('');
    try {
      const updated = await api.updateUserRole(user.userId, newRole);
      setUsers(prev => prev.map(u => u.userId === user.userId ? { ...u, role: updated.role } : u));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
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
            <span className="text-sm text-indigo-100">Hi, {me?.firstName}</span>
            <button onClick={() => onNavigate('admin-overview')} className="text-sm text-indigo-100 hover:text-white transition-colors">Overview</button>
            <button onClick={() => onNavigate('dashboard')} className="text-sm text-indigo-100 hover:text-white transition-colors">Events</button>
            <button onClick={() => onNavigate('admin-venues')} className="text-sm text-indigo-100 hover:text-white transition-colors">Venues</button>
            <button onClick={() => onNavigate('admin-reports')} className="text-sm text-indigo-100 hover:text-white transition-colors">Reports</button>
            <button onClick={() => onNavigate('admin-users')} className="text-sm text-white font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
              Users
            </button>
            <button onClick={() => onNavigate('events')} className="text-sm text-indigo-100 hover:text-white transition-colors">Browse</button>
            <button onClick={logout} className="text-sm text-indigo-300 hover:text-white transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${users.length} registered account${users.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">User</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Current Role</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonUserRow key={i} />)
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-16 text-center text-gray-400">No users found.</td>
                </tr>
              ) : (
                users.map(user => {
                  const isUpdating = updatingId === user.userId;
                  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
                  return (
                    <tr key={user.userId} className={`hover:bg-gray-50 transition-colors ${isUpdating ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${AVATAR_COLOR[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block border px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_STYLE[user.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role}
                            disabled={isUpdating}
                            onChange={e => handleRoleChange(user, e.target.value)}
                            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {ROLES.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          {isUpdating && (
                            <svg className="w-4 h-4 text-indigo-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
