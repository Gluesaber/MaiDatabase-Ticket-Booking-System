import { useState, useEffect, type FormEvent } from 'react';
import type { Showtime, TagDto } from '../types';
import { api } from '../services/ApiService';
import { useAuth } from '../context/AuthContext';
import { AddShowtimeModal } from '../components/AddShowtimeModal';
import { EditShowtimeModal } from '../components/EditShowtimeModal';
import { MultiTagSelect } from '../components/MultiTagSelect';

interface Props {
  onNavigate: (page: string) => void;
}

interface EventGroup {
  eventId: number;
  title: string;
  durationMinutes: number;
  rating: number;
  thumbnail: string;
  description: string;
  tags: { typeId: number; typeName: string }[];
  showtimes: Showtime[];
}

export function OrganizerDashboardPage({ onNavigate }: Props) {
  const { user, logout } = useAuth();
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<TagDto[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Create event state
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [form, setForm] = useState({ title: '', durationMinutes: '', rating: '', thumbnail: '', description: '' });
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit event state
  const [editingEvent, setEditingEvent] = useState<EventGroup | null>(null);
  const [editForm, setEditForm] = useState({ title: '', durationMinutes: '', rating: '', thumbnail: '', description: '' });
  const [editTagIds, setEditTagIds] = useState<number[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState('');

  // Showtime modal state
  const [addShowtimeFor, setAddShowtimeFor] = useState<EventGroup | null>(null);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);

  function reload() {
    setLoading(true);
    const fetch = user?.role === 'admin' ? api.getEvents() : api.getMyEvents();
    fetch.then(setEventGroups).finally(() => setLoading(false));
  }

  useEffect(() => {
    api.getTags().then(setAllTags);
    reload();
  }, []);

  async function handleDeleteEvent(group: EventGroup) {
    if (!confirm(`Delete "${group.title}" and all its showtimes? This cannot be undone.`)) return;
    setError('');
    try {
      await api.deleteEvent(group.eventId);
      setEventGroups(prev => prev.filter(g => g.eventId !== group.eventId));
      setSuccess(`"${group.title}" deleted.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function handleDeleteShowtime(showtimeId: number, eventId: number, label: string) {
    if (!confirm(`Delete showtime "${label}"? This cannot be undone.`)) return;
    setError('');
    try {
      await api.deleteShowtime(showtimeId);
      setEventGroups(prev =>
        prev.map(g =>
          g.eventId === eventId
            ? { ...g, showtimes: g.showtimes.filter(s => s.showtimeId !== showtimeId) }
            : g,
        ),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  function openEditEvent(group: EventGroup) {
    setEditingEvent(group);
    setEditForm({
      title: group.title,
      durationMinutes: String(group.durationMinutes),
      rating: String(group.rating),
      thumbnail: group.thumbnail ?? '',
      description: group.description ?? '',
    });
    setEditTagIds(group.tags.map(t => t.typeId));
    setEditFormError('');
    setSuccess('');
    setError('');
  }

  async function handleEditEvent(e: FormEvent) {
    e.preventDefault();
    if (!editingEvent) return;
    if (editTagIds.length === 0) { setEditFormError('Please select at least one tag.'); return; }
    setEditFormError('');
    setEditSubmitting(true);
    try {
      await api.updateEvent(editingEvent.eventId, {
        title: editForm.title,
        durationMinutes: Number(editForm.durationMinutes),
        rating: editForm.rating,
        thumbnail: editForm.thumbnail,
        description: editForm.description,
        tagIds: editTagIds,
      });
      setSuccess(`"${editForm.title}" updated!`);
      setEditingEvent(null);
      reload();
    } catch (err: unknown) {
      setEditFormError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setEditSubmitting(false);
    }
  }

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function setEditField(field: string, value: string) {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (selectedTagIds.length === 0) {
        setFormError('Please select at least one tag.');
        setSubmitting(false);
        return;
      }
      await api.createEvent({
        title: form.title,
        durationMinutes: Number(form.durationMinutes),
        rating: form.rating,
        thumbnail: form.thumbnail,
        description: form.description,
        tagIds: selectedTagIds,
      });
      setSuccess(`Event "${form.title}" created!`);
      setShowCreateEvent(false);
      setForm({ title: '', durationMinutes: '', rating: '', thumbnail: '', description: '' });
      setSelectedTagIds([]);
      reload();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-indigo-600">🎫 NoLife Ticket</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              user?.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Hi, {user?.firstName}</span>
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => onNavigate('admin-overview')}
                  className="text-sm text-indigo-600 hover:underline font-medium"
                >
                  Overview
                </button>
                <button
                  onClick={() => onNavigate('admin-venues')}
                  className="text-sm text-indigo-600 hover:underline font-medium"
                >
                  Venues
                </button>
                <button
                  onClick={() => onNavigate('admin-reports')}
                  className="text-sm text-indigo-600 hover:underline font-medium"
                >
                  Reports
                </button>
                <button
                  onClick={() => onNavigate('admin-users')}
                  className="text-sm text-indigo-600 hover:underline font-medium"
                >
                  Users
                </button>
              </>
            )}
            <button onClick={() => onNavigate('events')} className="text-sm text-indigo-600 hover:underline">
              Browse Events
            </button>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'Admin Dashboard' : 'Organizer Dashboard'}
          </h2>
          <button
            onClick={() => { setShowCreateEvent(true); setSuccess(''); setFormError(''); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            + Create Event
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

        {/* Create Event Modal */}
        {showCreateEvent && (
          <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 overflow-y-auto max-h-[90vh]">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Event</h3>
              {formError && (
                <p className="text-sm text-red-600 mb-3 bg-red-50 px-3 py-2 rounded">{formError}</p>
              )}
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" required value={form.title}
                    onChange={e => setField('title', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input type="number" required min={1} value={form.durationMinutes}
                    onChange={e => setField('durationMinutes', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags <span className="text-gray-400 font-normal">(select one or more)</span>
                  </label>
                  <MultiTagSelect options={allTags} selected={selectedTagIds} onChange={setSelectedTagIds} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Rating</label>
                  <select value={form.rating} onChange={e => setField('rating', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select rating…</option>
                    <option value="G">G — General Audiences</option>
                    <option value="PG">PG — Parental Guidance Suggested</option>
                    <option value="PG-13">PG-13 — Parents Strongly Cautioned</option>
                    <option value="R">R — Restricted</option>
                    <option value="NC-17">NC-17 — Adults Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                  <input type="url" value={form.thumbnail}
                    onChange={e => setField('thumbnail', e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={5}
                    maxLength={3000}
                    value={form.description}
                    onChange={e => setField('description', e.target.value)}
                    placeholder="Provide a detailed description of your event, including what attendees can expect, highlights, or special instructions…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  />
                  <p className="text-xs text-gray-400 mt-0.5 text-right">{form.description.length}/3000</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateEvent(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {submitting ? 'Creating…' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        {editingEvent && (
          <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 overflow-y-auto max-h-[90vh]">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Edit Event</h3>
              <p className="text-gray-500 text-sm mb-4">{editingEvent.title}</p>
              {editFormError && (
                <p className="text-sm text-red-600 mb-3 bg-red-50 px-3 py-2 rounded">{editFormError}</p>
              )}
              <form onSubmit={handleEditEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" required value={editForm.title}
                    onChange={e => setEditField('title', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input type="number" required min={1} value={editForm.durationMinutes}
                    onChange={e => setEditField('durationMinutes', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags <span className="text-gray-400 font-normal">(select one or more)</span>
                  </label>
                  <MultiTagSelect options={allTags} selected={editTagIds} onChange={setEditTagIds} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Rating</label>
                  <select value={editForm.rating} onChange={e => setEditField('rating', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select rating…</option>
                    <option value="G">G — General Audiences</option>
                    <option value="PG">PG — Parental Guidance Suggested</option>
                    <option value="PG-13">PG-13 — Parents Strongly Cautioned</option>
                    <option value="R">R — Restricted</option>
                    <option value="NC-17">NC-17 — Adults Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                  <input type="url" value={editForm.thumbnail}
                    onChange={e => setEditField('thumbnail', e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={5}
                    maxLength={3000}
                    value={editForm.description}
                    onChange={e => setEditField('description', e.target.value)}
                    placeholder="Provide a detailed description of your event, including what attendees can expect, highlights, or special instructions…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  />
                  <p className="text-xs text-gray-400 mt-0.5 text-right">{editForm.description.length}/3000</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditingEvent(null)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={editSubmitting}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {editSubmitting ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Event list */}
        {loading ? (
          <p className="text-center text-gray-400 py-20">Loading…</p>
        ) : eventGroups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400 text-lg mb-3">No events yet</p>
            <button onClick={() => setShowCreateEvent(true)} className="text-indigo-600 hover:underline text-sm">
              Create your first event
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {eventGroups.map(group => (
              <div key={group.eventId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Event header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{group.title}</span>
                    {group.tags.map(tag => (
                      <span key={tag.typeId} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {tag.typeName}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setAddShowtimeFor(group); setSuccess(''); setError(''); }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200
                                 px-3 py-1.5 rounded-lg hover:bg-indigo-50 font-medium"
                    >
                      + Add Showtime
                    </button>
                    <button
                      onClick={() => openEditEvent(group)}
                      className="text-xs text-gray-600 hover:text-gray-800 border border-gray-200
                                 px-3 py-1.5 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Edit
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDeleteEvent(group)}
                        className="text-xs text-red-600 hover:text-red-800 border border-red-200
                                   px-3 py-1.5 rounded-lg hover:bg-red-50 font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Showtimes list */}
                {group.showtimes.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">No showtimes yet.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {group.showtimes.map(s => (
                      <div key={s.showtimeId} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {s.venue.name} · {new Date(s.showSchedules).toLocaleString('en-TH')}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {s.tiers.map(t => `${t.tierName} ฿${t.price.toLocaleString()}`).join(' · ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">
                              {s.tiers.reduce((sum, t) => sum + t.available, 0).toLocaleString()} seats left
                            </p>
                            <p className="text-xs text-gray-400">
                              from ฿{Math.min(...s.tiers.map(t => t.price)).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => { setEditingShowtime(s); setSuccess(''); setError(''); }}
                            className="text-xs text-gray-600 hover:text-gray-800 border border-gray-200
                                       px-2.5 py-1 rounded-lg hover:bg-gray-50 font-medium shrink-0"
                          >
                            Edit
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleDeleteShowtime(
                                s.showtimeId,
                                group.eventId,
                                `${s.venue.name} · ${new Date(s.showSchedules).toLocaleString('en-TH')}`,
                              )}
                              className="text-xs text-red-500 hover:text-red-700 border border-red-200
                                         px-2.5 py-1 rounded-lg hover:bg-red-50 font-medium shrink-0"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Showtime Modal */}
      {addShowtimeFor && (
        <AddShowtimeModal
          eventId={addShowtimeFor.eventId}
          eventTitle={addShowtimeFor.title}
          onClose={() => setAddShowtimeFor(null)}
          onSaved={() => {
            setAddShowtimeFor(null);
            setSuccess('Showtime created!');
            reload();
          }}
        />
      )}

      {/* Edit Showtime Modal */}
      {editingShowtime && (
        <EditShowtimeModal
          showtime={editingShowtime}
          onClose={() => setEditingShowtime(null)}
          onSaved={() => {
            setEditingShowtime(null);
            setSuccess('Showtime updated!');
            reload();
          }}
        />
      )}
    </div>
  );
}


