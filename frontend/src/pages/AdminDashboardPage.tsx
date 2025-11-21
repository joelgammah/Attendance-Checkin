import React from 'react';
import { getActiveRole, logout } from '../api/auth';
import AdminNav from '../components/AdminNav';
import AddUserModal from '../components/AddUserModal';
import {
  getAllUsers,
  promoteUser,
  revokeOrganizer,
  deleteUser as apiDeleteUser,
  UserOut,
  createUser,
} from '../api/users';
import { getEventAttendees, getAllEvents, deleteEvent, downloadAttendanceCsv } from '../api/events';
import { getAuditLogs } from '../api/logs';

export default function AdminDashboardPage() {
  const [showAddUserModal, setShowAddUserModal] = React.useState(false);
  const [addUserLoading, setAddUserLoading] = React.useState(false);
  const [addUserError, setAddUserError] = React.useState('');
  const [tab, setTab] = React.useState<'users' | 'events' | 'logs'>('users');
  const [users, setUsers] = React.useState<UserOut[]>([]);
  const [events, setEvents] = React.useState<EventOut[]>([]);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showNotification, setShowNotification] = React.useState(false);
  const [notificationMessage, setNotificationMessage] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState<number | null>(null);
  const [confirm, setConfirm] = React.useState<{ type: string, id: number | null, name?: string } | null>(null);
  const role = getActiveRole();

  // Show notification and auto-hide after 5 seconds
  const showSuccessNotification = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 7000);
  };

  React.useEffect(() => {
    (async () => {
      if (role !== 'admin') {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        if (tab === 'users') {
          const users = await getAllUsers();
          setUsers(users);
        } else if (tab === 'events') {
          // Use getAllEvents for admin to show all events
          const allEvents = await getAllEvents();
          // Sort by id descending (latest first)
          const sortedEvents = allEvents.slice().sort((a, b) => (b.id || 0) - (a.id || 0));
          setEvents(sortedEvents);
        } else if (tab === 'logs') {
          const logs = await getAuditLogs();
          setLogs(logs);
        }
      } catch (e) {
        setNotificationMessage('Failed to load data');
        setShowNotification(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [role, tab]);


  // User actions
  const handlePromote = async (userId: number) => {
    setActionLoading(userId);
    try {
      await promoteUser(userId);
      setUsers(users => users.map(u => u.id === userId ? { ...u, roles: [...u.roles, 'organizer'] } : u));
      showSuccessNotification('User promoted to organizer!');
    } catch {
      showSuccessNotification('Failed to promote user');
    } finally {
      setActionLoading(null);
      setConfirm(null);
    }
  };

  const handleRevoke = async (userId: number) => {
    setActionLoading(userId);
    try {
      await revokeOrganizer(userId);
      setUsers(users => users.map(u => u.id === userId ? { ...u, roles: u.roles.filter(r => r !== 'organizer') } : u));
      showSuccessNotification('Organizer role revoked!');
    } catch {
      showSuccessNotification('Failed to revoke organizer');
    } finally {
      setActionLoading(null);
      setConfirm(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setActionLoading(userId);
    try {
      await apiDeleteUser(userId);
      setUsers(users => users.filter(u => u.id !== userId));
      showSuccessNotification('User deleted!');
    } catch {
      showSuccessNotification('Failed to delete user');
    } finally {
      setActionLoading(null);
      setConfirm(null);
    }
  };

  // Event actions
  const handleDeleteEvent = async (eventId: number) => {
    setActionLoading(eventId);
    try {
      await deleteEvent(eventId);
      setEvents(events => events.filter(e => e.id !== eventId));
      showSuccessNotification('Event deleted!');
    } catch {
      showSuccessNotification('Failed to delete event');
    } finally {
      setActionLoading(null);
      setConfirm(null);
    }
  };


  if (loading) {
    return (
      <div>
  <AdminNav />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin w-6 h-6" style={{color: '#95866A'}} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }


  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-2xl font-bold mb-2">Forbidden</h2>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav onAddUser={() => setShowAddUserModal(true)} />
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center space-x-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-xl" style={{backgroundColor: 'rgba(149, 134, 106, 0.1)'}}>
            <svg className="w-8 h-8" style={{color: '#95866A'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
                Welcome {localStorage.getItem('user_email')?.split('@')[0] || 'Organizer'}!
            </h1>
            <p className="mt-2 text-gray-600">Manage users, roles, events, and audit logs</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setTab('users')}
            className={`px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${tab === 'users' ? 'bg-[#95866A] text-white' : 'bg-gray-200 text-[#95866A]'}`}
          >
            Users
          </button>
          <button
            onClick={() => setTab('events')}
            className={`px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${tab === 'events' ? 'bg-[#95866A] text-white' : 'bg-gray-200 text-[#95866A]'}`}
          >
            Events
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${tab === 'logs' ? 'bg-[#95866A] text-white' : 'bg-gray-200 text-[#95866A]'}`}
          >
            Audit Logs
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'users' && (
          <>
            <table className="min-w-full bg-gray-50 border rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Name</th>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Email</th>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Roles</th>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b last:border-b-0">
                    <td className="px-4 py-2 text-left">{user.name}</td>
                    <td className="px-4 py-2 text-left">{user.email}</td>
                    <td className="px-4 py-2 text-left">{user.roles.join(', ')}</td>
                    <td className="px-4 py-2 space-x-2 text-left">
                      {user.roles.includes('organizer') ? (
                        <button
                          disabled={actionLoading === user.id}
                          onClick={() => setConfirm({ type: 'revoke', id: user.id, name: user.email })}
                          className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Revoke Organizer
                        </button>
                      ) : (
                        <button
                          disabled={actionLoading === user.id}
                          onClick={() => setConfirm({ type: 'promote', id: user.id, name: user.email })}
                          className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Promote to Organizer
                        </button>
                      )}
                      <button
                        disabled={actionLoading === user.id}
                        onClick={() => setConfirm({ type: 'deleteUser', id: user.id, name: user.email })}
                        className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      {/* Add User Modal (always available) */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onSuccess={async (form: { name: string; email: string; password: string; roles: string[] }) => {
            setAddUserLoading(true);
            setAddUserError('');
            try {
              const user = await createUser(form);
              setUsers(users => [...users, user]);
              setShowAddUserModal(false);
              showSuccessNotification('User added!');
            } catch (err) {
              if (err && typeof err === 'object' && 'message' in err) {
                setAddUserError((err as Error).message);
              } else {
                setAddUserError(String(err) || 'Failed to add user');
              }
            } finally {
              setAddUserLoading(false);
            }
          }}
          loading={addUserLoading}
          error={addUserError}
        />
      )}

        {tab === 'events' && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-50 border rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Name</th>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Organizer</th>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Start–End</th>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Location</th>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Attendance</th>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Status</th>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => {
                  // Organizer: event.organizer_name or event.organizer?.name (adjust as per your EventOut type)
                  // Attendance: event.attendance_count or event.attendance (adjust as per your EventOut type)
                  // Status: based on current time vs event.start_time/end_time
                  const start = new Date(event.start_time);
                  const end = new Date(event.end_time);
                  const now = new Date();
                  let status = 'Upcoming';
                  if (now > end) status = 'Past';
                  else if (now >= start && now <= end) status = 'Ongoing';
                  return (
                    <tr key={event.id} className="border-b last:border-b-0">
                      <td className="px-4 py-2 text-left">{event.name}</td>
                      <td className="px-4 py-2 text-left">{event.organizer_name || (event.organizer && event.organizer.name) || '—'}</td>
                      <td className="px-4 py-2 text-left">{start.toLocaleString()}<br/>–<br/>{end.toLocaleString()}</td>
                      <td className="px-4 py-2 text-left">{event.location}</td>
                      <td className="px-4 py-2 text-left">{event.attendance_count ?? event.attendance ?? '—'}</td>
                      <td className="px-4 py-2 text-left">{status}</td>
                      <td className="px-4 py-2 text-left">
                        <div className="flex flex-col space-y-2">
                          <button
                            disabled={actionLoading === event.id}
                            onClick={() => setConfirm({ type: 'deleteEvent', id: event.id, name: event.name })}
                            className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              if (status !== 'Upcoming') downloadAttendanceCsv(event.id, event.name);
                            }}
                            disabled={status === 'Upcoming'}
                            className={`px-3 py-1 rounded font-medium transition-colors duration-200 ${
                              status === 'Upcoming'
                                ? 'bg-gray-300 text-gray-400'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            Download CSV
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-50 border rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Timestamp</th>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">User</th>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Action</th>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Details</th>
                  <th className="px-4 py-2 bg-gray-100 text-[#95866A] font-semibold text-left">Comments</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b last:border-b-0">
                    <td className="px-4 py-2 text-left">{log.timestamp}</td>
                    <td className="px-4 py-2 text-left">{log.user_email}</td>
                    <td className="px-4 py-2 text-left">{log.action}</td>
                    <td className="px-4 py-2 text-left">{log.details}</td>
                    <td className="px-4 py-2 text-left"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h2 className="text-lg font-bold mb-2">Are you sure?</h2>
              <p className="mb-4 text-gray-700">
                {confirm.type === 'deleteUser' && `This will permanently delete the user: ${confirm.name}. This cannot be undone.`}
                {confirm.type === 'deleteEvent' && `This will permanently delete the event: ${confirm.name}. This cannot be undone.`}
                {confirm.type === 'promote' && `Promote user ${confirm.name} to Organizer?`}
                {confirm.type === 'revoke' && `Revoke Organizer status from user ${confirm.name}?`}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium"
                  onClick={() => setConfirm(null)}
                >
                  Cancel
                </button>
                {confirm.type === 'deleteUser' && (
                  <button
                    className="px-4 py-2 rounded bg-red-600 text-white font-medium"
                    onClick={() => handleDeleteUser(confirm.id!)}
                  >
                    Delete
                  </button>
                )}
                {confirm.type === 'deleteEvent' && (
                  <button
                    className="px-4 py-2 rounded bg-red-600 text-white font-medium"
                    onClick={() => handleDeleteEvent(confirm.id!)}
                  >
                    Delete
                  </button>
                )}
                {confirm.type === 'promote' && (
                  <button
                    className="px-4 py-2 rounded bg-green-600 text-white font-medium"
                    onClick={() => handlePromote(confirm.id!)}
                  >
                    Promote
                  </button>
                )}
                {confirm.type === 'revoke' && (
                  <button
                    className="px-4 py-2 rounded bg-yellow-600 text-white font-medium"
                    onClick={() => handleRevoke(confirm.id!)}
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Notification Toast */}
        {showNotification && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-sm">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)'}}>
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{notificationMessage}</p>
              </div>
              <button 
                onClick={() => setShowNotification(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="Close notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

