import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, Download, Edit2, X, Save, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw52Ig8a4MvfrQXKrlIUz1tGPxnHxud4-v9zjcdHCXCLkm1PNN6taKfM1MGHiiy6bxj/exec';
const SHEET_NAME = 'Patients';

// ─── TYPES ─────────────────────────────────────────────────────────────────────
interface PatientFormData {
  timestamp: string;
  patientId: string;
  name: string;
  age: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  address: string;
  medicalHistory: string;
  status: string;
}

interface PatientRecord extends PatientFormData {
  rowIndex: number;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function formatTimestamp(date: Date): string {
  const d = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const t = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${d}, ${t}`;
}

function generatePatientId(existingRecords: PatientRecord[]): string {
  const nums = existingRecords
    .map(r => parseInt(r.patientId.replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `P${String(max + 1).padStart(3, '0')}`;
}

function rowToRecord(row: string[], rowIndex: number): PatientRecord {
  return {
    rowIndex,
    timestamp:      row[0] || '',
    patientId:      row[1] || '',
    name:           row[2] || '',
    age:            row[3] || '',
    gender:         row[4] || '',
    bloodGroup:     row[5] || '',
    phone:          row[6] || '',
    address:        row[7] || '',
    medicalHistory: row[8] || '',
    status:         row[9] || '',
  };
}

const emptyForm = (): PatientFormData => ({
  timestamp: '',
  patientId: '',
  name: '',
  age: '',
  gender: 'Male',
  bloodGroup: 'O+',
  phone: '',
  address: '',
  medicalHistory: '',
  status: 'Outpatient',
});

// ─── STYLES ────────────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────────
export default function Patients() {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<PatientRecord | null>(null);
  const [form, setForm] = useState<PatientFormData>(emptyForm());
  const [searchTerm, setSearchTerm] = useState('');

  // ── Toast ──
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch from sheet ──
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch(`${SCRIPT_URL}?sheet=${SHEET_NAME}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch data');
      const rows: string[][] = json.data;
      const parsed: PatientRecord[] = rows
        .slice(1)
        .map((row, i) => rowToRecord(row, i + 2))
        .filter(r => r.patientId || r.name);
      setRecords(parsed.reverse());
    } catch (err: any) {
      setFetchError(err.message || 'Could not load records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // ── Open modals ──
  const openAddModal = () => {
    const now = new Date();
    setForm({
      ...emptyForm(),
      timestamp: formatTimestamp(now),
      patientId: generatePatientId(records),
    });
    setEditRecord(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rec: PatientRecord) => {
    setForm({ ...rec });
    setEditRecord(rec);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditRecord(null);
    setForm(emptyForm());
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast('Patient name is required.', 'error'); return; }
    setSubmitting(true);
    try {
      const rowData = [
        form.timestamp, form.patientId, form.name, form.age, form.gender,
        form.bloodGroup, form.phone, form.address, form.medicalHistory, form.status,
      ];

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

      showToast(editRecord ? 'Patient updated successfully!' : 'Patient registered successfully!', 'success');
      closeModal();
      fetchRecords();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit data', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── PDF ──
  const generatePDF = (patient: PatientRecord) => {
    const doc = new jsPDF();
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('MediCare Hospital', 20, 25);
    doc.setFontSize(10);
    doc.text('Patient Registration Details', 20, 32);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Patient Information', 20, 60);

    const details = [
      ['Patient ID:', patient.patientId],
      ['Full Name:', patient.name],
      ['Age:', `${patient.age} Years`],
      ['Gender:', patient.gender],
      ['Blood Group:', patient.bloodGroup],
      ['Phone:', patient.phone],
      ['Address:', patient.address],
      ['Status:', patient.status],
      ['Registered On:', patient.timestamp],
    ];

    autoTable(doc, {
      startY: 70,
      head: [['Field', 'Details']],
      body: details,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 11, cellPadding: 5 },
    });

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a computer-generated document.', 20, 280);
    doc.save(`Patient_${patient.patientId}_Details.pdf`);
  };

  // ── Filter ──
  const filtered = records.filter(r => {
    const q = searchTerm.toLowerCase();
    return !q ||
      r.name.toLowerCase().includes(q) ||
      r.patientId.toLowerCase().includes(q) ||
      r.phone.includes(q);
  });

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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients Directory</h1>
          <p className="text-slate-500 mt-1">Manage and view all registered patients.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-100"
        >
          <Plus size={18} />
          <span>Add New Patient</span>
        </button>
      </div>

      {/* Search & Refresh */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or phone..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={fetchRecords}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-all"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
        <button className="flex items-center justify-center space-x-2 px-4 py-2.5 text-slate-600 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-100">
          <Filter size={16} />
          <span>Filters</span>
        </button>
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
            <Loader2 size={24} className="animate-spin" /><span>Loading records...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center"><Search size={24} /></div>
            <p className="text-sm font-medium">No patients found</p>
            <p className="text-xs">Try a different search or add a new patient</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  {['Action', 'Patient ID', 'Name', 'Age', 'Gender', 'Blood Group', 'Contact', 'Address', 'Status', 'Registered On', 'PDF'].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditModal(rec)}
                        className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
                      >
                        <Edit2 size={12} />Edit
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-emerald-600 font-bold">{rec.patientId}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">{rec.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{rec.age}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{rec.gender}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        {rec.bloodGroup}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{rec.phone}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">{rec.address}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${rec.status === 'Inpatient' ? 'bg-blue-50 text-blue-700' :
                          rec.status === 'Discharged' ? 'bg-slate-100 text-slate-600' :
                          'bg-emerald-50 text-emerald-700'}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs">{rec.timestamp}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => generatePDF(rec)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Download Details PDF"
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-center">Showing {filtered.length} of {records.length} patients</p>
      )}

      {/* ── MODAL ───────────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-4">

            {/* Modal Header */}
            <div className="bg-emerald-700 px-6 py-5 flex items-center justify-between text-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold">{editRecord ? 'Edit Patient Record' : 'New Patient Registration'}</h2>
                <p className="text-emerald-200 text-sm mt-0.5">
                  {editRecord ? `Editing ${editRecord.patientId}` : 'Register a new patient'}
                </p>
              </div>
              <button onClick={closeModal} className="text-white/80 hover:text-white transition-colors p-1">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Auto-generated */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <Field label="Timestamp">
                  <input readOnly value={form.timestamp}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 cursor-not-allowed" />
                </Field>
                <Field label="Patient ID">
                  <input readOnly value={form.patientId}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-700 cursor-not-allowed" />
                </Field>
              </div>

              {/* Patient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Full Name *">
                    <input type="text" required placeholder="Full patient name" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <Field label="Age">
                  <input type="number" placeholder="Age in years" value={form.age}
                    onChange={e => setForm({ ...form, age: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Gender">
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className={inputCls}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
                <Field label="Phone Number">
                  <input type="tel" placeholder="10-digit mobile number" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Blood Group">
                  <select value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })} className={inputCls}>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                    <option value="Outpatient">Outpatient</option>
                    <option value="Inpatient">Inpatient</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address">
                    <input type="text" placeholder="Full address" value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Medical History">
                    <textarea rows={3} placeholder="Previous surgeries, allergies, chronic conditions..."
                      value={form.medicalHistory}
                      onChange={e => setForm({ ...form, medicalHistory: e.target.value })}
                      className={`${inputCls} resize-none`} />
                  </Field>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4 mt-2">
                <button type="button" onClick={closeModal}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-60">
                  {submitting
                    ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                    : <><Save size={16} /> {editRecord ? 'Update Patient' : 'Register Patient'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
