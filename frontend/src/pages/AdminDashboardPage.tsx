import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, BookOpen, RefreshCw, AlertTriangle, Activity, CheckCircle, Trash2, Lock, Unlock } from 'lucide-react';
import { api } from '../services/api';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'books' | 'reports' | 'audit'>('stats');
  
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        const res = await api.getAdminStats();
        setStats(res);
      } else if (activeTab === 'users') {
        const res = await api.getAdminUsers();
        setUsers(res.users || []);
      } else if (activeTab === 'books') {
        const res = await api.getAdminBooks();
        setBooks(res.books || []);
      } else if (activeTab === 'reports') {
        const res = await api.getAdminReports();
        setReports(res.reports || []);
      } else if (activeTab === 'audit') {
        const res = await api.getAdminAuditLogs();
        setAuditLogs(res.logs || []);
      }
    } catch (e) {
      console.error('Failed loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspend = async (userId: string, currentSuspended: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentSuspended ? 'unsuspend' : 'suspend'} this account?`)) return;
    try {
      await api.toggleSuspendUser(userId, !currentSuspended, 'Admin dashboard action');
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    const reason = window.prompt('Reason for removing book listing:');
    if (!reason) return;
    try {
      await api.adminRemoveBook(bookId, reason);
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    const notes = window.prompt('Resolution notes:');
    try {
      await api.resolveReport(reportId, status, notes || 'Resolved');
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl">Admin Governance & Moderation</h1>
            <p className="text-slate-400 text-xs">Monitor users, moderate book listings, and handle safety reports</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { key: 'stats', label: 'Overview Metrics', icon: Activity },
          { key: 'users', label: 'User Accounts', icon: Users },
          { key: 'books', label: 'Book Moderation', icon: BookOpen },
          { key: 'reports', label: 'Safety Reports', icon: AlertTriangle },
          { key: 'audit', label: 'Audit Logs', icon: CheckCircle }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === t.key
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Users</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.stats.totalUsers}</div>
              <span className="text-emerald-600 text-[11px] font-semibold">{stats.stats.activeUsers} Active</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Books</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.stats.totalBooks}</div>
              <span className="text-amber-600 text-[11px] font-semibold">{stats.stats.availableBooks} Available</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Completed Swaps</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.stats.completedSwaps}</div>
              <span className="text-purple-600 text-[11px] font-semibold">{stats.stats.pendingSwaps} Pending</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Reports</span>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">{stats.stats.pendingReports}</div>
              <span className="text-rose-500 text-[11px] font-semibold">{stats.stats.suspendedUsers} Suspended Users</span>
            </div>
          </div>

          {/* Genre & City Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Popular Book Genres</h3>
              <div className="space-y-2">
                {stats.genreDistribution.map((g: any) => (
                  <div key={g.genre} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">{g.genre}</span>
                    <span className="font-bold text-amber-700">{g.count} books</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Active Cities</h3>
              <div className="space-y-2">
                {stats.cityDistribution.map((c: any) => (
                  <div key={c.city} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">{c.city}</span>
                    <span className="font-bold text-purple-700">{c.count} users</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700">Registered Users Management</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Books</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">
                      {u.name} <br />
                      <span className="text-[10px] font-normal text-slate-400">{u.email}</span>
                    </td>
                    <td className="p-3 text-slate-600">{u.city}, {u.country}</td>
                    <td className="p-3 font-bold text-amber-700">⭐ {u.rating ? u.rating.toFixed(1) : '5.0'}</td>
                    <td className="p-3 text-slate-700 font-medium">{u.books_count}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.is_suspended ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {u.is_suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleSuspend(u.id, !!u.is_suspended)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            u.is_suspended ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Books Tab */}
      {activeTab === 'books' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700">Platform Book Moderation</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-3">Title & Author</th>
                  <th className="p-3">Genre</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">
                      {b.title} <br />
                      <span className="text-[10px] font-normal text-slate-400">by {b.author}</span>
                    </td>
                    <td className="p-3 text-slate-600">{b.genre}</td>
                    <td className="p-3 text-slate-700">{b.owner_name}</td>
                    <td className="p-3 font-medium text-slate-800">{b.status}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRemoveBook(b.id)}
                        className="px-3 py-1 bg-rose-100 text-rose-800 hover:bg-rose-200 rounded-lg text-[11px] font-bold"
                      >
                        Remove Listing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              No pending safety reports.
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-600 text-xs">Reason: {r.reason}</span>
                  <span className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-700 text-xs font-medium">"{r.description}"</p>
                <div className="text-[11px] text-slate-500">
                  Reporter: {r.reporter_name} ({r.reporter_email})
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleResolveReport(r.id, 'RESOLVED')}
                    className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl"
                  >
                    Resolve & Warn User
                  </button>
                  <button
                    onClick={() => handleResolveReport(r.id, 'DISMISSED')}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl"
                  >
                    Dismiss Report
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">System Audit Stream</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl text-xs flex items-center justify-between border border-slate-100">
                <div>
                  <span className="font-bold text-slate-800">{log.action}: </span>
                  <span className="text-slate-600">{log.details}</span>
                </div>
                <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
