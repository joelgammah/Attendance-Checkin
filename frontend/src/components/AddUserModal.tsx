import React from 'react';

interface AddUserModalProps {
  onClose: () => void;
  onSuccess: (form: { name: string; email: string; password: string; roles: string[] }) => Promise<void>;
  loading: boolean;
  error: string;
}

export default function AddUserModal({ onClose, onSuccess, loading, error }: AddUserModalProps) {
  const [form, setForm] = React.useState({ name: '', email: '', password: '', roles: ['attendee'] });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleRoleChange(e) {
    setForm(f => ({ ...f, roles: [e.target.value] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    await onSuccess(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold mb-4">Add New User</h2>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            name="name"
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={form.name}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full border rounded px-3 py-2"
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Initial Password</label>
          <input
            name="password"
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            name="roles"
            className="w-full border rounded px-3 py-2"
            value={form.roles[0]}
            onChange={handleRoleChange}
          >
            <option value="attendee">Attendee</option>
            <option value="organizer">Organizer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-[#95866A] text-white font-medium"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </div>
      </form>
    </div>
  );
}
