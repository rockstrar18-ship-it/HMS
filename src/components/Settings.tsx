import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Edit2, Trash2, X, Save, RefreshCw,
  Search, CheckCircle, AlertCircle, Loader2, ShieldCheck,
  Eye, EyeOff, Settings as SettingsIcon,
} from 'lucide-react';

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw52Ig8a4MvfrQXKrlIUz1tGPxnHxud4-v9zjcdHCXCLkm1PNN6taKfM1MGHiiy6bxj/exec';
const SHEET_NAME = 'Login';

// All available pages — must match route keys in App.tsx / Login.tsx mapping
const ALL_PAGES = [
  { value: 'Dashboard',       label: 'Dashboard' },
  { value: 'Patients',        label: 'Patients' },
  { value: 'Doctors',         label: 'Doctors' },
  { value: 'OPD / IPD',       label: 'OPD / IPD' },
  { value: 'Wards & Beds',    label: 'Wards & Beds' },
  { value: 'Appointments',    label: 'Appointments' },
  { value: 'Billing',         label: 'Billing' },
  { value: 'Pharmacy',        label: 'Pharmacy' },
  { value: 'Blood Bank',      label: 'Blood Bank' },
  { value: 'Laboratory',      label: 'Laboratory' },
  { value: 'Staff Management',label: 'Staff Management' },
  { value: 'Canteen',         label: 'Canteen' },
  { value: 'Departments',     label: 'Departments' },
  { value: 'Analytics',       label: 'Analytics' },
  { value: 'Duty Roster',     label: 'Duty Roster' },
  { value: 'Settings',        label: 'Settings' },
];

const ROLE_OPTIONS = ['admin', 'user', 'doctor', 'nurse', 'receptionist', 'pharmacist'];

// ─── TYPES ─────────────────────────────────────────────────────────────────────
interface UserRecord {
  rowIndex: number;
  userName: string;
  id: string;
  pass: string;
  role: string;
  pages: string; // comma-separated string as stored in sheet
}

interface UserForm {
  userName: string;
  id: string;
  pass: string;
  role: string;
  selectedPages: string[]; // array for checkbox UI
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function rowToRecord(row: string[], rowIndex: number): UserRecord {
  return {
    rowIndex,
    userName: row[0] || '',
    id:       row[1] || '',
    pass:     row[2] || '',
    role:     row[3] || '',
    pages:    row[4] || '',
  };
}

function emptyForm(): UserForm {
  return { userName: '', id: '', pass: '', role: '', selectedPages: [] };
}

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white transition-all';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide';

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function Settings() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<UserRecord | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm());
  const [showPass, setShowPass] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'users'>('users');

  // ── Toast ──
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch users ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch(`${SCRIPT_URL}?sheet=${SHEET_NAME}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch data');
      const rows: string[][] = json.data;
      const parsed: UserRecord[] = rows
        .slice(1)
        .map((row, i) => rowToRecord(row, i + 2))
        .filter(r => r.userName || r.id);
      setUsers(parsed);
    } catch (err: any) {
      setFetchError(err.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Open modals ──
  const openAddModal = () => {
    setForm(emptyForm());
    setEditRecord(null);
    setShowPass(false);
    setIsModalOpen(true);
  };

  const openEditModal = (rec: UserRecord) => {
    setForm({
      userName: rec.userName,
      id: rec.id,
      pass: rec.pass,
      role: rec.role,
      selectedPages: rec.pages
        ? rec.pages.split(',').map(p => p.trim()).filter(Boolean)
        : [],
    });
    setEditRecord(rec);
    setShowPass(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditRecord(null);
    setForm(emptyForm());
  };

  // ── Page checkbox toggle ──
  const togglePage = (pageValue: string) => {
    setForm(prev => ({
      ...prev,
      selectedPages: prev.selectedPages.includes(pageValue)
        ? prev.selectedPages.filter(p => p !== pageValue)
        : [...prev.selectedPages, pageValue],
    }));
  };

  const toggleAllPages = () => {
    if (form.selectedPages.length === ALL_PAGES.length) {
      setForm(prev => ({ ...prev, selectedPages: [] }));
    } else {
      setForm(prev => ({ ...prev, selectedPages: ALL_PAGES.map(p => p.value) }));
    }
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userName.trim()) { showToast('User Name is required.', 'error'); return; }
    if (!form.id.trim()) { showToast('User ID is required.', 'error'); return; }
    if (!form.pass.trim()) { showToast('Password is required.', 'error'); return; }
    if (!form.role.trim()) { showToast('Role is required.', 'error'); return; }
    if (form.selectedPages.length === 0) { showToast('Select at least one page.', 'error'); return; }

    setSubmitting(true);
    try {
      const pagesStr = form.selectedPages.join(', ');
      const rowData = [form.userName, form.id, form.pass, form.role, pagesStr];

      const body = new URLSearchParams();
      body.append('sheetName', SHEET_NAME);
      if (editRecord) {
        body.append('action', 'update');
        body.append('rowIndex', String(editRecord.rowIndex));
        body.append('rowData', JSON.stringify(rowData));
      } else {
        body.append('action', 'insert');
        body.append('rowData', JSON.stringify(rowData));
      }

      const res = await fetch(SCRIPT_URL, { method: 'POST', body });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Submission failed');

      showToast(editRecord ? 'User updated successfully!' : 'User added successfully!', 'success');
      closeModal();
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit data', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (rec: UserRecord) => {
    if (!window.confirm(`Delete user "${rec.userName}" (${rec.id})?`)) return;
    setDeleting(rec.rowIndex);
    try {
      const body = new URLSearchParams();
      body.append('sheetName', SHEET_NAME);
      body.append('action', 'delete');
      body.append('rowIndex', String(rec.rowIndex));

      const res = await fetch(SCRIPT_URL, { method: 'POST', body });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Delete failed');

      showToast('User deleted successfully!', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setDeleting(null);
    }
  };

  // ── Filter ──
  const filtered = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return !q ||
      u.userName.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q);
  });

  // ─── Role badge color ──────────────────────────────────────────────────────
  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin:        'bg-red-100 text-red-700',
      user:         'bg-blue-100 text-blue-700',
      doctor:       'bg-purple-100 text-purple-700',
      nurse:        'bg-pink-100 text-pink-700',
      receptionist: 'bg-amber-100 text-amber-700',
      pharmacist:   'bg-teal-100 text-teal-700',
    };
    return map[role.toLowerCase()] || 'bg-slate-100 text-slate-700';
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-medium transition-all
          ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200">
            <SettingsIcon size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage system configuration and users</p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSection('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
            activeSection === 'users'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={16} />
          User Management
        </button>
      </div>

      {/* ── USER MANAGEMENT SECTION ─── */}
      {activeSection === 'users' && (
        <div className="space-y-5">

          {/* Sub-header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-emerald-600" />
                User Management
              </h2>
              <p className="text-slate-500 text-sm">Manage system users and their permissions</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-100"
            >
              <Plus size={18} /> Add New User
            </button>
          </div>

          {/* Search + Refresh */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by name, ID or role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
                {filtered.length}/{users.length} users
              </span>
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-all"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {/* Error */}
          {fetchError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
              <AlertCircle size={18} />{fetchError}
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
                <Loader2 size={24} className="animate-spin" /><span>Loading users...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Users size={24} />
                </div>
                <p className="text-sm font-medium">No users found</p>
                <p className="text-xs">Try a different search or add a new user</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                      {['#', 'User Name', 'ID', 'Role', 'Pages Access', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3.5 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((rec, idx) => (
                      <tr key={rec.rowIndex} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="px-5 py-3.5 text-slate-400 text-xs font-medium">{idx + 1}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {rec.userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-800">{rec.userName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{rec.id}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${roleBadge(rec.role)}`}>
                            <ShieldCheck size={11} />
                            {rec.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 max-w-xs">
                          {rec.pages ? (
                            <div className="flex flex-wrap gap-1">
                              {rec.pages.split(',').map(p => p.trim()).filter(Boolean).map(pg => (
                                <span key={pg} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-medium border border-emerald-100">
                                  {pg}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No pages assigned</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(rec)}
                              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(rec)}
                              disabled={deleting === rec.rowIndex}
                              className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60"
                            >
                              {deleting === rec.rowIndex
                                ? <Loader2 size={12} className="animate-spin" />
                                : <Trash2 size={12} />}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL ─────────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-4">

            {/* Modal Header */}
            <div className="bg-emerald-700 px-6 py-5 flex items-center justify-between text-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold">
                  {editRecord ? 'Edit User' : 'Add New User'}
                </h2>
                <p className="text-emerald-200 text-sm mt-0.5">
                  {editRecord
                    ? `Editing ${editRecord.userName} (${editRecord.id})`
                    : 'Create a new system user with access permissions'}
                </p>
              </div>
              <button onClick={closeModal} className="text-white/80 hover:text-white p-1 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* Row 1: Name + ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>User Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Full name of user"
                    value={form.userName}
                    onChange={e => setForm(p => ({ ...p, userName: e.target.value }))}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>User ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Admin, U123"
                    value={form.id}
                    onChange={e => setForm(p => ({ ...p, id: e.target.value }))}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Pass + Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Set user password"
                      value={form.pass}
                      onChange={e => setForm(p => ({ ...p, pass: e.target.value }))}
                      className={`${inputCls} pr-10`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Role <span className="text-red-500">*</span></label>
                  <select
                    value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    className={inputCls}
                    required
                  >
                    <option value="">Select Role</option>
                    {ROLE_OPTIONS.map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pages Access */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelCls}>
                    Pages Access <span className="text-red-500">*</span>
                    <span className="text-slate-400 normal-case ml-1 font-normal">
                      ({form.selectedPages.length}/{ALL_PAGES.length} selected)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={toggleAllPages}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                  >
                    {form.selectedPages.length === ALL_PAGES.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  {ALL_PAGES.map(pg => {
                    const checked = form.selectedPages.includes(pg.value);
                    return (
                      <label
                        key={pg.value}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all border text-sm font-medium select-none ${
                          checked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40'
                        }`}
                        onClick={() => togglePage(pg.value)}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          checked ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'
                        }`}>
                          {checked && (
                            <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2">
                              <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className="truncate">{pg.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-60"
                >
                  {submitting
                    ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                    : <><Save size={16} /> {editRecord ? 'Update User' : 'Add User'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
