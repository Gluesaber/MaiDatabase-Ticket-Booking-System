import { useState, type FormEvent, type ChangeEvent } from 'react';
import { api } from '../services/ApiService';
import type { VenueDetail } from '../types';

interface Props {
  initial: VenueDetail | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_FORM = {
  name: '', capacity: '',
  addressLine: '', street: '', subDistrict: '', district: '', province: '', postalCode: '',
};

type FormState = typeof EMPTY_FORM;

function Field({
  label, ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
        {...props}
      />
    </div>
  );
}

export function VenueFormModal({ initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          name: initial.name,
          capacity: String(initial.capacity),
          addressLine: initial.address.addressLine ?? '',
          street: initial.address.street ?? '',
          subDistrict: initial.address.subDistrict ?? '',
          district: initial.address.district ?? '',
          province: initial.address.province ?? '',
          postalCode: initial.address.postalCode ?? '',
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function set(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const payload = {
      name: form.name,
      capacity: Number(form.capacity),
      addressLine: form.addressLine,
      street: form.street,
      subDistrict: form.subDistrict,
      district: form.district,
      province: form.province,
      postalCode: form.postalCode,
    };
    try {
      if (initial) {
        await api.updateVenue(initial.venueId, payload);
      } else {
        await api.createVenue(payload as any);
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 my-4">
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          {initial ? 'Edit Venue' : 'New Venue'}
        </h2>

        <form onSubmit={submit} className="space-y-3">
          <Field label="Venue Name *" value={form.name} onChange={set('name')} required />
          <Field
            label="Max Capacity *"
            type="number"
            min={1}
            value={form.capacity}
            onChange={set('capacity')}
            required
          />

          <hr className="border-gray-200 my-1" />
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Address</p>

          <Field label="Address Line" value={form.addressLine} onChange={set('addressLine')} />
          <Field label="Street" value={form.street} onChange={set('street')} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sub-district" value={form.subDistrict} onChange={set('subDistrict')} />
            <Field label="District" value={form.district} onChange={set('district')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Province" value={form.province} onChange={set('province')} />
            <Field label="Postal Code" value={form.postalCode} onChange={set('postalCode')} />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
