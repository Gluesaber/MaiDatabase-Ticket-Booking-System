import { useEffect, useState } from 'react';
import { api } from '../services/ApiService';

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

const roleColor: Record<string, string> = {
  admin:     'bg-purple-100 text-purple-700',
  organizer: 'bg-blue-100 text-blue-700',
  customer:  'bg-green-100 text-green-700',
};

export function AdminUsersPage({ onNavigate }: Props) {
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
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => onNavigate('dashboard')} className="text-indigo-600 hover:underline text-sm">
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-20">Loading…</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Current Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleColor[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={updatingId === user.userId}
                        onChange={e => handleRoleChange(user, e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
