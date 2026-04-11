import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, RefreshCw, AlertCircle, CheckCircle, Loader2,
  User, X, Save, Calendar, ChevronLeft, ChevronRight,
  Clock, Stethoscope, Building2, Plus, Trash2, ClipboardList,
} from 'lucide-react';

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbw52Ig8a4MvfrQXKrlIUz1tGPxnHxud4-v9zjcdHCXCLkm1PNN6taKfM1MGHiiy6bxj/exec';
const DOCTORS_SHEET = 'Doctors';
const ROSTER_SHEET  = 'Roster';

// ─── SHIFTS ────────────────────────────────────────────────────────────────────
const SHIFTS = [
  { id: 'A', label: 'Shift A', time: '8:00 AM – 2:00 PM',  color: 'blue'   },
  { id: 'B', label: 'Shift B', time: '2:00 PM – 8:00 PM',  color: 'amber'  },
  { id: 'C', label: 'Shift C', time: '8:00 PM – 8:00 AM',  color: 'purple' },
] as const;
type ShiftId = 'A' | 'B' | 'C';

// ─── WARDS ─────────────────────────────────────────────────────────────────────
const DEFAULT_WARDS = [
  'Male General Ward',
  'Female General Ward',
  'ICU',
  'Pediatrics',
  'Maternity',
  'Emergency',
  'OT',
  'Labour Room',
  'Post-Op Ward',
];

// ─── TYPES ─────────────────────────────────────────────────────────────────────
interface StaffMember {
  name: string;
  designation: string;
  department: string;
}

// assignment: ward → shiftId → list of staff names
type RosterAssignment = Record<string, Record<ShiftId, string[]>>;

// a saved roster row
interface RosterRow {
  rowIndex: number;
  timestamp: string;
  date: string;
  ward: string;
  shiftA: string;
  shiftB: string;
  shiftC: string;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function formatDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function isoDate(d: Date) {
  return d.toISOString().split('T')[0];
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function formatTimestamp(date: Date) {
  const d = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const t = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${d}, ${t}`;
}

// shift colour mappings
const SHIFT_STYLES: Record<ShiftId, { pill: string; header: string; tag: string }> = {
  A: { pill: 'bg-blue-100 text-blue-700 border-blue-200',   header: 'text-blue-700 bg-blue-50',   tag: 'bg-blue-50 border-blue-200 text-blue-700' },
  B: { pill: 'bg-amber-100 text-amber-700 border-amber-200', header: 'text-amber-700 bg-amber-50', tag: 'bg-amber-50 border-amber-200 text-amber-700' },
  C: { pill: 'bg-purple-100 text-purple-700 border-purple-200', header: 'text-purple-700 bg-purple-50', tag: 'bg-purple-50 border-purple-200 text-purple-700' },
};

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white';

// build empty assignment for given wards
function emptyAssignment(wards: string[]): RosterAssignment {
  const obj: RosterAssignment = {};
  wards.forEach(w => { obj[w] = { A: [], B: [], C: [] }; });
  return obj;
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────────
export default function Roster() {
  // ── Staff from Doctors sheet ──
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

  // ── Saved Roster rows ──
  const [rosterRows, setRosterRows] = useState<RosterRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  // ── Month navigation ──
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // ── Active date (selected day) ──
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // ── Wards ──
  const [wards, setWards] = useState<string[]>(DEFAULT_WARDS);
  const [newWard, setNewWard] = useState('');

  // ── Assignment state ──
  const [assignment, setAssignment] = useState<RosterAssignment>(() => emptyAssignment(DEFAULT_WARDS));

  // ── Drag state ──
  const [dragging, setDragging] = useState<{ name: string } | null>(null);
  const [dragOver, setDragOver] = useState<{ ward: string; shift: ShiftId } | null>(null);

  // ── Search & filter ──
  const [search, setSearch] = useState('');

  // ── Submit ──
  const [submitting, setSubmitting] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ── View tab ──
  const [viewTab, setViewTab] = useState<'create' | 'history'>('create');

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch staff (doctors) ──
  const fetchStaff = useCallback(async () => {
    setStaffLoading(true);
    setStaffError('');
    try {
      const res = await fetch(`${SCRIPT_URL}?sheet=${DOCTORS_SHEET}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch staff');
      const rows: string[][] = json.data;
      const parsed: StaffMember[] = rows
        .slice(1)
        .map(r => ({ name: r[2] || '', designation: r[5] || '', department: r[6] || '' }))
        .filter(s => s.name);
      setStaff(parsed);
    } catch (err: any) {
      setStaffError(err.message || 'Could not load staff');
    } finally {
      setStaffLoading(false);
    }
  }, []);

  // ── Fetch saved roster rows ──
  const fetchRoster = useCallback(async () => {
    setRosterLoading(true);
    try {
      const res = await fetch(`${SCRIPT_URL}?sheet=${ROSTER_SHEET}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed');
      const rows: string[][] = json.data;
      const parsed: RosterRow[] = rows
        .slice(1)
        .map((r, i) => ({
          rowIndex: i + 2,
          timestamp: r[0] || '',
          date:      r[1] || '',
          ward:      r[2] || '',
          shiftA:    r[3] || '',
          shiftB:    r[4] || '',
          shiftC:    r[5] || '',
        }))
        .filter(r => r.date || r.ward);
      setRosterRows(parsed.reverse());
    } catch { /* silent */ } finally {
      setRosterLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); fetchRoster(); }, [fetchStaff, fetchRoster]);

  // ── When wards change, keep existing assignments ──
  useEffect(() => {
    setAssignment(prev => {
      const next: RosterAssignment = {};
      wards.forEach(w => {
        next[w] = prev[w] || { A: [], B: [], C: [] };
      });
      return next;
    });
  }, [wards]);

  // ── Filtered staff (sidebar) ──
  const assignedNames = new Set(
    wards.flatMap(w => (['A', 'B', 'C'] as ShiftId[]).flatMap(s => assignment[w]?.[s] || []))
  );
  const filteredStaff = staff.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.designation.toLowerCase().includes(q) || s.department.toLowerCase().includes(q);
  });

  // ── Drag handlers ──
  const onDragStart = (name: string) => setDragging({ name });
  const onDragEnd   = () => { setDragging(null); setDragOver(null); };
  const onDragOver  = (e: React.DragEvent, ward: string, shift: ShiftId) => {
    e.preventDefault();
    setDragOver({ ward, shift });
  };
  const onDrop = (e: React.DragEvent, ward: string, shift: ShiftId) => {
    e.preventDefault();
    if (!dragging) return;
    const name = dragging.name;
    setAssignment(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as RosterAssignment;
      if (next[ward][shift].includes(name)) return prev;
      next[ward][shift] = [...next[ward][shift], name];
      return next;
    });
    setDragging(null);
    setDragOver(null);
  };

  const removeFromShift = (ward: string, shift: ShiftId, name: string) => {
    setAssignment(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as RosterAssignment;
      next[ward][shift] = next[ward][shift].filter(n => n !== name);
      return next;
    });
  };

  // ── Clear all ──
  const clearAll = () => {
    setAssignment(emptyAssignment(wards));
    showToast('All assignments cleared.', 'success');
  };

  // ── Total assignment count ──
  const totalAssigned = wards.reduce((acc, w) =>
    acc + (['A', 'B', 'C'] as ShiftId[]).reduce((a2, s) => a2 + (assignment[w]?.[s]?.length || 0), 0), 0);

  // ── Add custom ward ──
  const addWard = () => {
    const ward = newWard.trim();
    if (!ward || wards.includes(ward)) return;
    setWards(prev => [...prev, ward]);
    setNewWard('');
  };

  const removeWard = (ward: string) => {
    setWards(prev => prev.filter(w => w !== ward));
  };

  // ── Save Roster to sheet ──
  // Sends one INSERT per ward row (compatible with the existing Apps Script)
  const handleSave = async () => {
    const dateStr = isoDate(selectedDate);
    const ts = formatTimestamp(new Date());

    const rows: string[][] = wards.map(ward => ([
      ts,
      dateStr,
      ward,
      (assignment[ward]?.A || []).join(', '),
      (assignment[ward]?.B || []).join(', '),
      (assignment[ward]?.C || []).join(', '),
    ]));

    const nonEmpty = rows.filter(r => r[3] || r[4] || r[5]); // only wards with at least one assignment
    if (nonEmpty.length === 0) { showToast('Assign at least one staff member before saving.', 'error'); return; }

    setSubmitting(true);
    let saved = 0;
    try {
      for (const rowData of nonEmpty) {
        const body = new URLSearchParams();
        body.append('sheetName', ROSTER_SHEET);
        body.append('action', 'insert');
        body.append('rowData', JSON.stringify(rowData));
        const res = await fetch(SCRIPT_URL, { method: 'POST', body });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Save failed');
        saved++;
      }
      showToast(`Roster saved! ${saved} ward(s) submitted for ${formatDate(selectedDate)}.`, 'success');
      fetchRoster();
    } catch (err: any) {
      showToast(`Saved ${saved}/${nonEmpty.length} rows. Error: ${err.message || 'Unknown'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Calendar helpers ──
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200">
            <ClipboardList size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Duty Roster</h1>
            <p className="text-slate-500 text-sm mt-0.5">Assign staff shifts for wards and departments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewTab('create')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${viewTab === 'create' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Create Roster
          </button>
          <button
            onClick={() => { setViewTab('history'); fetchRoster(); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${viewTab === 'history' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            History
          </button>
        </div>
      </div>

      {/* ═══════════════════════ CREATE ROSTER TAB ═══════════════════════ */}
      {viewTab === 'create' && (
        <div className="flex flex-col xl:flex-row gap-6">

          {/* ── LEFT: Available Staff ──────────────────────────────────── */}
          <div className="xl:w-64 shrink-0 space-y-4">

            {/* Staff panel */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-slate-800 text-sm">Available Staff</span>
                  <span className="text-xs text-slate-400">{staff.length} total</span>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  />
                </div>
              </div>

              {staffLoading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                  <Loader2 size={18} className="animate-spin" /><span className="text-xs">Loading...</span>
                </div>
              ) : staffError ? (
                <div className="px-4 py-4 text-xs text-red-600 flex gap-2"><AlertCircle size={14} />{staffError}</div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                  {filteredStaff.map((s, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => onDragStart(s.name)}
                      onDragEnd={onDragEnd}
                      className={`flex items-center gap-2.5 px-4 py-3 cursor-grab active:cursor-grabbing hover:bg-emerald-50/50 transition-colors select-none
                        ${assignedNames.has(s.name) ? 'opacity-50' : ''}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <User size={13} className="text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{s.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{s.designation || s.department || '—'}</p>
                      </div>
                      <span className="ml-auto text-[9px] text-slate-300 font-medium shrink-0">DRAG</span>
                    </div>
                  ))}
                  {filteredStaff.length === 0 && (
                    <div className="px-4 py-8 text-center text-xs text-slate-400">No staff found</div>
                  )}
                </div>
              )}

              <div className="px-4 py-3 border-t border-slate-50 flex justify-end">
                <button onClick={fetchStaff} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors">
                  <RefreshCw size={12} className={staffLoading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {/* Ward management */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Manage Wards</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add new ward..."
                  value={newWard}
                  onChange={e => setNewWard(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addWard()}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button onClick={addWard} className="px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                {wards.map(w => (
                  <div key={w} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl group">
                    <span className="text-xs text-slate-700 font-medium truncate">{w}</span>
                    <button onClick={() => removeWard(w)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 ml-2 shrink-0">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── CENTER: Roster Grid ────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Date & controls bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-emerald-600" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Roster Date</p>
                    <p className="text-base font-bold text-slate-900">{formatDate(selectedDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg font-medium">{totalAssigned} assignments</span>
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all border border-red-100"
                  >
                    <Trash2 size={13} /> Clear All
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={submitting || totalAssigned === 0}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 disabled:opacity-60"
                  >
                    {submitting ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : <><Save size={13} /> Save Roster</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Shift header */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Shift labels */}
              <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '180px 1fr 1fr 1fr' }}>
                <div className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-50 border-r border-slate-100">
                  Ward / Department
                </div>
                {SHIFTS.map(shift => (
                  <div key={shift.id} className={`px-4 py-3 text-center border-r border-slate-100 last:border-r-0 ${SHIFT_STYLES[shift.id].header}`}>
                    <p className="text-xs font-bold">{shift.label}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">{shift.time}</p>
                  </div>
                ))}
              </div>

              {/* Ward rows */}
              <div className="divide-y divide-slate-50">
                {wards.map(ward => (
                  <div key={ward} className="grid" style={{ gridTemplateColumns: '180px 1fr 1fr 1fr' }}>
                    {/* Ward name */}
                    <div className="px-4 py-3 flex items-center gap-2 bg-slate-50/50 border-r border-slate-100 min-h-[80px]">
                      <Building2 size={14} className="text-slate-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-700 leading-snug">{ward}</span>
                    </div>

                    {/* Shift cells */}
                    {(['A', 'B', 'C'] as ShiftId[]).map(shift => {
                      const isOver = dragOver?.ward === ward && dragOver?.shift === shift;
                      const assignedHere = assignment[ward]?.[shift] || [];
                      return (
                        <div
                          key={shift}
                          onDragOver={e => onDragOver(e, ward, shift)}
                          onDrop={e => onDrop(e, ward, shift)}
                          onDragLeave={() => setDragOver(null)}
                          className={`px-3 py-2.5 border-r border-slate-100 last:border-r-0 min-h-[80px] transition-colors
                            ${isOver ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-300' : 'hover:bg-slate-50/50'}`}
                        >
                          <div className="flex flex-wrap gap-1.5">
                            {assignedHere.map(name => (
                              <span
                                key={name}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border ${SHIFT_STYLES[shift].tag}`}
                              >
                                {name}
                                <button onClick={() => removeFromShift(ward, shift, name)} className="ml-0.5 hover:opacity-70 transition-opacity">
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                            {assignedHere.length === 0 && !isOver && (
                              <span className="text-[10px] text-slate-300 italic select-none pt-0.5">Drop staff here</span>
                            )}
                            {isOver && (
                              <span className="text-[10px] text-emerald-500 font-medium animate-pulse">Release to assign</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Mini Calendar ────────────────────────────────────── */}
          <div className="xl:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sticky top-4">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentDate(addDays(currentDate, -30))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <ChevronLeft size={16} className="text-slate-500" />
                </button>
                <p className="text-sm font-bold text-slate-800">
                  {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
                <button onClick={() => setCurrentDate(addDays(currentDate, 30))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <ChevronRight size={16} className="text-slate-500" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const d = new Date(year, month, day);
                  const isToday = isoDate(d) === isoDate(today);
                  const isSel  = isoDate(d) === isoDate(selectedDate);
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(d)}
                      className={`aspect-square flex items-center justify-center text-xs rounded-lg font-medium transition-all
                        ${isSel ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' :
                          isToday ? 'bg-emerald-100 text-emerald-700 font-bold' :
                          'hover:bg-slate-100 text-slate-700'}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1 font-medium">Roster key</p>
                {SHIFTS.map(s => (
                  <div key={s.id} className="flex items-center gap-2 py-1">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      s.id === 'A' ? 'bg-blue-500' : s.id === 'B' ? 'bg-amber-500' : 'bg-purple-500'
                    }`} />
                    <span className="text-[11px] text-slate-600 font-medium">{s.label}: {s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ HISTORY TAB ════════════════════════════ */}
      {viewTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList size={18} className="text-emerald-600" /> Saved Roster Records
            </h2>
            <button onClick={fetchRoster} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-all">
              <RefreshCw size={14} className={rosterLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {rosterLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
              <Loader2 size={22} className="animate-spin" /><span className="text-sm">Loading history...</span>
            </div>
          ) : rosterRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <ClipboardList size={26} />
              </div>
              <p className="text-sm font-medium">No saved rosters yet</p>
              <p className="text-xs">Create a roster and save it to see history</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                    {['#', 'Saved On', 'Date', 'Ward / Dept', 'Shift A', 'Shift B', 'Shift C'].map(h => (
                      <th key={h} className="px-5 py-3.5 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rosterRows.map((row, idx) => (
                    <tr key={row.rowIndex} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{row.timestamp}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                          <Calendar size={11} />{row.date}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                          <Building2 size={13} className="text-slate-400" />{row.ward}
                        </span>
                      </td>
                      <td className="px-5 py-3 max-w-[160px]">
                        {row.shiftA ? (
                          <div className="flex flex-wrap gap-1">
                            {row.shiftA.split(',').map(n => n.trim()).filter(Boolean).map(n => (
                              <span key={n} className={`px-2 py-0.5 text-[11px] font-medium rounded-lg border ${SHIFT_STYLES.A.tag}`}>{n}</span>
                            ))}
                          </div>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3 max-w-[160px]">
                        {row.shiftB ? (
                          <div className="flex flex-wrap gap-1">
                            {row.shiftB.split(',').map(n => n.trim()).filter(Boolean).map(n => (
                              <span key={n} className={`px-2 py-0.5 text-[11px] font-medium rounded-lg border ${SHIFT_STYLES.B.tag}`}>{n}</span>
                            ))}
                          </div>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3 max-w-[160px]">
                        {row.shiftC ? (
                          <div className="flex flex-wrap gap-1">
                            {row.shiftC.split(',').map(n => n.trim()).filter(Boolean).map(n => (
                              <span key={n} className={`px-2 py-0.5 text-[11px] font-medium rounded-lg border ${SHIFT_STYLES.C.tag}`}>{n}</span>
                            ))}
                          </div>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
