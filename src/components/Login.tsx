import React, { useState } from 'react';
import { Hospital, Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-react';

// Same Apps Script URL used across the app
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw52Ig8a4MvfrQXKrlIUz1tGPxnHxud4-v9zjcdHCXCLkm1PNN6taKfM1MGHiiy6bxj/exec';
const LOGIN_SHEET = 'Login';

export interface LoggedInUser {
  userName: string;
  id: string;
  role: string;
  allowedPages: string[]; // e.g. ['dashboard','patients','ipdopd',...]
}

// Map sheet page names → route keys used in App.tsx
const PAGE_NAME_TO_ROUTE: Record<string, string> = {
  'dashboard':        'dashboard',
  'patients':         'patients',
  'doctors':          'doctors',
  'staff management': 'staff',
  'staff':            'staff',
  'appointments':     'appointments',
  'billing':          'billing',
  'opd / ipd':        'ipdopd',
  'ipd / opd':        'ipdopd',
  'ipd/opd':          'ipdopd',
  'opd/ipd':          'ipdopd',
  'ipdopd':           'ipdopd',
  'beds':             'beds',
  'wards & beds':     'beds',
  'wards and beds':   'beds',
  'reports':          'reports',
  'analytics':        'reports',
  'pharmacy':         'pharmacy',
  'blood bank':       'bloodbank',
  'bloodbank':        'bloodbank',
  'laboratory':       'lab',
  'lab':              'lab',
  'canteen':          'canteen',
  'departments':      'departments',
};

function parsePages(pagesStr: string): string[] {
  return pagesStr
    .split(',')
    .map(p => p.trim().toLowerCase())
    .map(p => PAGE_NAME_TO_ROUTE[p] || p)
    .filter(Boolean);
}

interface LoginProps {
  onLogin: (user: LoggedInUser) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError('Please enter both ID and Password.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const url = `${SCRIPT_URL}?sheet=${LOGIN_SHEET}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch login data');

      const rows: string[][] = json.data;
      // Row 0 is header: User name | ID | Pass | Role | Pages
      const matched = rows.slice(1).find(row => {
        const sheetId   = (row[1] || '').trim();
        const sheetPass = (row[2] || '').trim();
        return sheetId === userId.trim() && sheetPass === password.trim();
      });

      if (!matched) {
        setError('Invalid ID or Password. Please try again.');
        setLoading(false);
        return;
      }

      const user: LoggedInUser = {
        userName:     matched[0] || '',
        id:           matched[1] || '',
        role:         matched[3] || '',
        allowedPages: parsePages(matched[4] || ''),
      };

      // Persist session in sessionStorage
      sessionStorage.setItem('hms_user', JSON.stringify(user));
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
              <Hospital size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">MediCare HMS</h1>
            <p className="text-emerald-200 text-sm mt-1">Hospital Management System</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm mb-6">Sign in with your credentials to continue</p>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  User ID
                </label>
                <input
                  type="text"
                  placeholder="Enter your ID"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  autoComplete="username"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                ) : (
                  <><LogIn size={18} /> Sign In</>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-slate-400">
              Access is managed by your administrator.<br />
              Contact admin if you need credentials.
            </p>
          </div>
        </div>

        {/* Bottom tag */}
        <p className="text-center text-xs text-slate-400 mt-5">
          © {new Date().getFullYear()} MediCare Hospital Management System
        </p>
      </div>
    </div>
  );
}
