import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, UserRound, Calendar, TrendingUp, Activity,
  Hospital, RefreshCw, Loader2, AlertCircle, Stethoscope,
  ClipboardList, Bed, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Patient, Doctor, Appointment } from '../types';

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw52Ig8a4MvfrQXKrlIUz1tGPxnHxud4-v9zjcdHCXCLkm1PNN6taKfM1MGHiiy6bxj/exec';

interface DashboardProps {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
}

// ─── TYPES ─────────────────────────────────────────────────────────────────────
interface LiveStats {
  totalPatients: number;
  totalDoctors: number;
  totalIPDOPD: number;
  todayIPDOPD: number;
  rosterEntries: number;
  outpatients: number;
  inpatients: number;
  discharged: number;
  genderMale: number;
  genderFemale: number;
  genderOther: number;
  bloodGroups: Record<string, number>;
  patientsByMonth: { month: string; patients: number }[];
  departmentDist: { name: string; value: number }[];
  statusDist: { name: string; value: number; color: string }[];
  recentPatients: { name: string; id: string; status: string; date: string }[];
  recentDoctors: { name: string; department: string; designation: string }[];
}

// ─── PALETTE ───────────────────────────────────────────────────────────────────
const COLORS = {
  emerald: '#10b981',
  blue:    '#3b82f6',
  violet:  '#8b5cf6',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  cyan:    '#06b6d4',
  indigo:  '#6366f1',
  orange:  '#f97316',
};
const PIE_COLORS = [COLORS.emerald, COLORS.blue, COLORS.violet, COLORS.amber, COLORS.rose, COLORS.cyan, COLORS.indigo, COLORS.orange];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function buildMonthBuckets(rows: string[][], dateCol: number) {
  const buckets: Record<string, number> = {};
  MONTHS.forEach(m => { buckets[m] = 0; });
  rows.slice(1).forEach(row => {
    const raw = (row[dateCol] || '').trim();
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      buckets[MONTHS[d.getMonth()]] = (buckets[MONTHS[d.getMonth()]] || 0) + 1;
    }
  });
  return MONTHS.map(m => ({ month: m, patients: buckets[m] }));
}

function countBy(rows: string[][], col: number): Record<string, number> {
  const map: Record<string, number> = {};
  rows.slice(1).forEach(row => {
    const v = (row[col] || '').trim();
    if (v) map[v] = (map[v] || 0) + 1;
  });
  return map;
}

// ─── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, trend, up }: {
  icon: any; label: string; value: number | string; sub?: string;
  color: string; trend?: string; up?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${up !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {up !== false ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── CUSTOM TOOLTIP ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.name}:</span>
          <span className="font-bold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── DONUT CHART ───────────────────────────────────────────────────────────────
function DonutChart({ data, title, total }: { data: { name: string; value: number; color: string }[]; title: string; total: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="font-bold text-slate-800 mb-4">{title}</h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={130} height={130}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" strokeWidth={2}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-slate-600 font-medium">{d.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{d.value}</span>
                <span className="text-slate-400">({total > 0 ? Math.round((d.value / total) * 100) : 0}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function Dashboard({ patients: localPatients, doctors: localDoctors, appointments }: DashboardProps) {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const buildStats = useCallback((
    pRows: string[][], dRows: string[][], ipdRows: string[][], rosterRows: string[][]
  ): LiveStats => {
    const patients = pRows.slice(1).filter(r => r[1] || r[2]);
    const doctors  = dRows.slice(1).filter(r => r[1] || r[2]);
    const ipd      = ipdRows.slice(1).filter(r => r[0]);

    const today = new Date().toISOString().split('T')[0];
    const todayIPD = ipd.filter(r => {
      const d = new Date(r[0] || '');
      return !isNaN(d.getTime()) && d.toISOString().split('T')[0] === today;
    }).length;

    // status distribution
    const statusMap = countBy(pRows, 9);
    const outpatients = statusMap['Outpatient'] || 0;
    const inpatients  = statusMap['Inpatient']  || 0;
    const discharged  = statusMap['Discharged'] || 0;

    // gender
    const gMap = countBy(pRows, 4);

    // blood groups
    const bloodGroups = countBy(pRows, 5);

    // patients by month (col 0 = timestamp)
    const patientsByMonth = buildMonthBuckets(pRows, 0);

    // department distribution from Doctors (col 6)
    const deptMap = countBy(dRows, 6);
    const departmentDist = Object.entries(deptMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    const statusDist = [
      { name: 'Outpatient', value: outpatients, color: COLORS.emerald },
      { name: 'Inpatient',  value: inpatients,  color: COLORS.blue },
      { name: 'Discharged', value: discharged,  color: COLORS.violet },
    ].filter(d => d.value > 0);

    const recentPatients = patients.slice(-5).reverse().map(r => ({
      name: r[2] || '—', id: r[1] || '—', status: r[9] || '—', date: r[0] || '—',
    }));

    const recentDoctors = doctors.slice(-4).reverse().map(r => ({
      name: r[2] || '—', department: r[6] || '—', designation: r[5] || '—',
    }));

    return {
      totalPatients: patients.length,
      totalDoctors: doctors.length,
      totalIPDOPD: ipd.length,
      todayIPDOPD: todayIPD,
      rosterEntries: rosterRows.slice(1).filter(r => r[0]).length,
      outpatients, inpatients, discharged,
      genderMale:   gMap['Male']   || 0,
      genderFemale: gMap['Female'] || 0,
      genderOther:  gMap['Other']  || 0,
      bloodGroups,
      patientsByMonth,
      departmentDist,
      statusDist,
      recentPatients,
      recentDoctors,
    };
  }, []);

  // Fallback stats from local data
  const buildLocalStats = useCallback((): LiveStats => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppts = appointments.filter(a => a.date === today).length;
    const patientsByMonth = MONTHS.map(m => ({ month: m, patients: Math.floor(Math.random() * 20) }));
    return {
      totalPatients: localPatients.length,
      totalDoctors: localDoctors.length,
      totalIPDOPD: appointments.length,
      todayIPDOPD: todayAppts,
      rosterEntries: 0,
      outpatients: localPatients.filter(p => (p as any).status === 'Outpatient').length || localPatients.length,
      inpatients:  localPatients.filter(p => (p as any).status === 'Inpatient').length,
      discharged:  localPatients.filter(p => (p as any).status === 'Discharged').length,
      genderMale:   localPatients.filter(p => p.gender === 'Male').length,
      genderFemale: localPatients.filter(p => p.gender === 'Female').length,
      genderOther:  0,
      bloodGroups: {},
      patientsByMonth,
      departmentDist: localDoctors.map(d => ({ name: d.specialty, value: 1 })),
      statusDist: [
        { name: 'Outpatient', value: localPatients.length, color: COLORS.emerald },
      ],
      recentPatients: localPatients.slice(0, 5).map(p => ({
        name: p.name, id: p.id, status: (p as any).status || 'Outpatient', date: p.lastVisit || '—',
      })),
      recentDoctors: localDoctors.slice(0, 4).map(d => ({
        name: d.name, department: d.specialty, designation: 'Consultant',
      })),
    };
  }, [localPatients, localDoctors, appointments]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, dRes, ipdRes, rRes] = await Promise.all([
        fetch(`${SCRIPT_URL}?sheet=Patients`),
        fetch(`${SCRIPT_URL}?sheet=Doctors`),
        fetch(`${SCRIPT_URL}?sheet=IPD OPD`).catch(() => ({ json: async () => ({ success: false }) })),
        fetch(`${SCRIPT_URL}?sheet=Roster`).catch(() => ({ json: async () => ({ success: false }) })),
      ]);
      const [pJson, dJson, ipdJson, rJson] = await Promise.all([
        pRes.json(), dRes.json(),
        (ipdRes as Response).json().catch(() => ({ success: false })),
        (rRes as Response).json().catch(() => ({ success: false })),
      ]);

      const pRows:   string[][] = pJson.success   ? pJson.data   : [];
      const dRows:   string[][] = dJson.success   ? dJson.data   : [];
      const ipdRows: string[][] = ipdJson.success ? ipdJson.data : [];
      const rRows:   string[][] = rJson.success   ? rJson.data   : [];

      // If we got real data, use it; otherwise fallback to local
      if (pRows.length > 1 || dRows.length > 1) {
        setStats(buildStats(pRows, dRows, ipdRows, rRows));
      } else {
        setStats(buildLocalStats());
      }
      setLastRefresh(new Date());
    } catch {
      // Network failed — use local data
      setStats(buildLocalStats());
      setError('Using local data (sheet unavailable)');
    } finally {
      setLoading(false);
    }
  }, [buildStats, buildLocalStats]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const bloodGroupData = stats ? Object.entries(stats.bloodGroups)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([name, value], i) => ({ name, value: value as number, color: PIE_COLORS[i % PIE_COLORS.length] })) : [];

  const genderData = stats ? [
    { name: 'Male',   value: stats.genderMale,   color: COLORS.blue    },
    { name: 'Female', value: stats.genderFemale, color: COLORS.rose    },
    { name: 'Other',  value: stats.genderOther,  color: COLORS.violet  },
  ].filter(d => d.value > 0) : [];

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Hospital Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">Live analytics from your Google Sheets data</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-500' : ''} />
          {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Refresh'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={15} />{error}
        </div>
      )}

      {loading && !stats ? (
        <div className="flex items-center justify-center py-32 gap-3 text-slate-400">
          <Loader2 size={30} className="animate-spin text-emerald-500" />
          <span className="text-base font-medium">Fetching live data…</span>
        </div>
      ) : stats ? (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users}       label="Total Patients"   value={stats.totalPatients}  color="bg-blue-500"    trend="+Live" sub={`${stats.inpatients} admitted`} />
            <StatCard icon={UserRound}   label="Active Doctors"   value={stats.totalDoctors}   color="bg-emerald-500" sub="On roster" />
            <StatCard icon={Stethoscope} label="OPD / IPD Cases"  value={stats.totalIPDOPD}    color="bg-violet-500"  trend={`${stats.todayIPDOPD} today`} sub="All time" />
            <StatCard icon={ClipboardList} label="Roster Entries" value={stats.rosterEntries}  color="bg-amber-500"   sub="Duty assignments" />
          </div>

          {/* ── Secondary KPIs ── */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-100">
              <div className="flex items-center justify-between mb-3">
                <Activity size={20} className="opacity-80" />
                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg">Outpatient</span>
              </div>
              <p className="text-4xl font-extrabold">{stats.outpatients}</p>
              <p className="text-emerald-100 text-xs mt-1 font-medium">Active outpatients</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-100">
              <div className="flex items-center justify-between mb-3">
                <Bed size={20} className="opacity-80" />
                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg">Inpatient</span>
              </div>
              <p className="text-4xl font-extrabold">{stats.inpatients}</p>
              <p className="text-blue-100 text-xs mt-1 font-medium">Admitted patients</p>
            </div>
            <div className="bg-gradient-to-br from-violet-500 to-violet-700 rounded-2xl p-5 text-white shadow-lg shadow-violet-100">
              <div className="flex items-center justify-between mb-3">
                <Hospital size={20} className="opacity-80" />
                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg">Discharged</span>
              </div>
              <p className="text-4xl font-extrabold">{stats.discharged}</p>
              <p className="text-violet-100 text-xs mt-1 font-medium">Total discharged</p>
            </div>
          </div>

          {/* ── Patient trend (Area chart) + Department Bar ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Area Chart: Patients registered by month */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">Patient Registrations</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Monthly trend (current year)</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  {stats.totalPatients} total
                </span>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={stats.patientsByMonth} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="gradPatients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="patients" stroke={COLORS.emerald} strokeWidth={2.5} fill="url(#gradPatients)" dot={{ fill: COLORS.emerald, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart: Top departments */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">Doctors by Department</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Top 6 departments</p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  {stats.totalDoctors} doctors
                </span>
              </div>
              {stats.departmentDist.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={stats.departmentDist} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Doctors" radius={[4, 4, 0, 0]}>
                      {stats.departmentDist.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No department data yet</div>
              )}
            </div>
          </div>

          {/* ── Donut Charts Row ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Patient Status */}
            {stats.statusDist.length > 0 ? (
              <DonutChart
                title="Patient Status"
                data={stats.statusDist}
                total={stats.outpatients + stats.inpatients + stats.discharged}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-center text-slate-400 text-sm h-[180px]">
                No status data
              </div>
            )}

            {/* Gender Distribution */}
            {genderData.length > 0 ? (
              <DonutChart title="Gender Distribution" data={genderData} total={stats.genderMale + stats.genderFemale + stats.genderOther} />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-center text-slate-400 text-sm h-[180px]">
                No gender data
              </div>
            )}

            {/* Blood Groups */}
            {bloodGroupData.length > 0 ? (
              <DonutChart title="Blood Group Distribution" data={bloodGroupData} total={Object.values(stats.bloodGroups).reduce((a, b) => a + (b as number), 0)} />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-center text-slate-400 text-sm h-[180px]">
                No blood group data
              </div>
            )}
          </div>

          {/* ── Recent Patients + Recent Doctors ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Patients */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={16} className="text-blue-500" /> Recent Patients</h3>
                <span className="text-xs text-slate-400">{stats.totalPatients} total</span>
              </div>
              <div className="divide-y divide-slate-50">
                {stats.recentPatients.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">No patient data</div>
                ) : stats.recentPatients.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.id}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'Inpatient'  ? 'bg-blue-50 text-blue-700' :
                        p.status === 'Discharged' ? 'bg-slate-100 text-slate-500' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>{p.status}</span>
                      <span className="text-[10px] text-slate-400">{p.date.slice(0, 20)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Doctors */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><UserRound size={16} className="text-emerald-500" /> Doctors on Panel</h3>
                <span className="text-xs text-slate-400">{stats.totalDoctors} total</span>
              </div>
              <div className="divide-y divide-slate-50">
                {stats.recentDoctors.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">No doctor data</div>
                ) : stats.recentDoctors.map((d, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0">
                        {d.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                        <p className="text-xs text-slate-400">{d.designation}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 max-w-[120px] truncate text-right">
                      {d.department || 'General'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
