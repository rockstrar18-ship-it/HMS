import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Phone, Mail, Edit2, X, Save, RefreshCw,
  AlertCircle, CheckCircle, Loader2, Upload, User, Stethoscope,
} from 'lucide-react';

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbw52Ig8a4MvfrQXKrlIUz1tGPxnHxud4-v9zjcdHCXCLkm1PNN6taKfM1MGHiiy6bxj/exec';
const SHEET_NAME = 'Doctors';
const DRIVE_FOLDER_ID = '1ClGkFmOHMWBfdKRdKZeiHQA_MaU4qS3d';

// ─── DROPDOWN OPTIONS ──────────────────────────────────────────────────────────
const DESIGNATION_OPTIONS = [
  'Consultant',
  'Senior Consultant',
  'Junior Consultant',
  'Resident Doctor',
  'House Officer',
  'Medical Officer',
  'Surgeon',
  'Senior Surgeon',
  'Specialist',
  'Associate Professor',
  'Professor',
  'HOD',
  'Director',
];

const DEPARTMENT_OPTIONS = [
  'General Medicine',
  'General Surgery',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Gynecology & Obstetrics',
  'Dermatology',
  'Ophthalmology',
  'ENT',
  'Radiology',
  'Pathology',
  'Anesthesiology',
  'Emergency Medicine',
  'Psychiatry',
  'Oncology',
  'Nephrology',
  'Urology',
  'Pulmonology',
  'Gastroenterology',
  'Endocrinology',
  'Rheumatology',
  'ICU / Critical Care',
  'Physiotherapy',
  'Dental',
];

// ─── TYPES ─────────────────────────────────────────────────────────────────────
interface DoctorFormData {
  timestamp: string;
  doctorId: string;
  name: string;
  phone: string;
  email: string;
  designation: string;
  department: string;
  experience: string;
  imageUrl: string;
}

interface DoctorRecord extends DoctorFormData {
  rowIndex: number;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function formatTimestamp(date: Date): string {
  const d = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const t = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${d}, ${t}`;
}

function generateDoctorId(existing: DoctorRecord[]): string {
  const nums = existing
    .map(r => parseInt(r.doctorId.replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `DR${String(max + 1).padStart(3, '0')}`;
}

/**
 * Converts any Google Drive sharing/view URL to a direct-embed URL.
 * Accepts:
 *   - https://drive.google.com/file/d/FILE_ID/view?...
 *   - https://drive.google.com/open?id=FILE_ID
 *   - https://drive.google.com/uc?id=FILE_ID  (pass-through)
 *   - a raw FILE_ID string (no slashes/dots)
 * Always returns: https://drive.google.com/uc?export=view&id=FILE_ID
 */
function toDriveEmbedUrl(raw: string): string {
  if (!raw) return '';
  // Already a direct embed URL
  if (raw.includes('uc?') && raw.includes('export=view')) return raw;
  // Extract file ID from /file/d/<id>/
  const fileMatch = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  // Extract from ?id= or &id=
  const idMatch = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
  // Treat the whole string as a raw file ID (no slashes/dots)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(raw.trim())) {
    return `https://drive.google.com/uc?export=view&id=${raw.trim()}`;
  }
  // Unknown format – return as-is
  return raw;
}

function rowToRecord(row: string[], rowIndex: number): DoctorRecord {
  return {
    rowIndex,
    timestamp:   row[0] || '',
    doctorId:    row[1] || '',
    name:        row[2] || '',
    phone:       row[3] || '',
    email:       row[4] || '',
    designation: row[5] || '',
    department:  row[6] || '',
    experience:  row[7] || '',
    imageUrl:    toDriveEmbedUrl(row[8] || ''),
  };
}

const emptyForm = (): DoctorFormData => ({
  timestamp: '',
  doctorId: '',
  name: '',
  phone: '',
  email: '',
  designation: '',
  department: '',
  experience: '',
  imageUrl: '',
});

// ─── STYLES ────────────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────────
export default function Doctors() {
  const [records, setRecords] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<DoctorRecord | null>(null);
  const [form, setForm] = useState<DoctorFormData>(emptyForm());
  const [searchTerm, setSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const parsed: DoctorRecord[] = rows
        .slice(1)
        .map((row, i) => rowToRecord(row, i + 2))
        .filter(r => r.doctorId || r.name);
      setRecords(parsed.reverse());
    } catch (err: any) {
      setFetchError(err.message || 'Could not load records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // ── Image upload to Google Drive ──
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      // Show local preview immediately
      const reader = new FileReader();
      reader.onload = e => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Apps Script reads e.parameter → must use URLSearchParams (form-encoded)
      // Apps Script action name is 'uploadFile' and it strips 'base64,' prefix itself
      const fullDataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
      });

      const body = new URLSearchParams();
      body.append('action', 'uploadFile');          // ← matches Apps Script action
      body.append('fileName', file.name);
      body.append('mimeType', file.type);
      body.append('base64Data', fullDataUrl);        // ← Apps Script strips 'base64,' prefix
      body.append('folderId', DRIVE_FOLDER_ID);

      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        body,                                        // ← URLSearchParams → e.parameter
      });

      const text = await res.text();
      let json: any = {};
      try { json = JSON.parse(text); } catch { throw new Error('Invalid response: ' + text.slice(0, 120)); }

      if (!json.success) {
        throw new Error(json.error || json.message || 'Image upload failed');
      }

      // Apps Script returns { success: true, fileUrl: "https://drive.google.com/uc?export=view&id=..." }
      const rawUrl =
        json.fileUrl ||
        json.url ||
        json.driveUrl ||
        json.publicUrl ||
        json.fileId ||
        json.id ||
        '';

      if (!rawUrl) {
        throw new Error('No URL returned. Full response: ' + JSON.stringify(json));
      }

      const embedUrl = toDriveEmbedUrl(rawUrl);
      setForm(prev => ({ ...prev, imageUrl: embedUrl }));
      setImagePreview(embedUrl);
      showToast('Image uploaded successfully!', 'success');
    } catch (err: any) {
      console.error('[ImageUpload Error]', err);
      showToast('Upload failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:mime;base64, prefix
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
    });
  }

  // ── Open modals ──
  const openAddModal = () => {
    const now = new Date();
    setForm({ ...emptyForm(), timestamp: formatTimestamp(now), doctorId: generateDoctorId(records) });
    setEditRecord(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const openEditModal = (rec: DoctorRecord) => {
    setForm({ ...rec });
    setEditRecord(rec);
    setImagePreview(rec.imageUrl || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditRecord(null);
    setForm(emptyForm());
    setImagePreview('');
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast('Doctor name is required.', 'error'); return; }
    setSubmitting(true);
    try {
      const rowData = [
        form.timestamp, form.doctorId, form.name, form.phone,
        form.email, form.designation, form.department, form.experience, form.imageUrl,
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

      showToast(editRecord ? 'Doctor updated successfully!' : 'Doctor added successfully!', 'success');
      closeModal();
      fetchRecords();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filter ──
  const filtered = records.filter(r => {
    const q = searchTerm.toLowerCase();
    return !q ||
      r.name.toLowerCase().includes(q) ||
      r.designation.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
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
          <h1 className="text-2xl font-bold text-slate-900">Doctor Management</h1>
          <p className="text-slate-500 mt-1">Manage doctor profiles, schedules, and department assignments.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-100"
        >
          <Plus size={18} /><span>Add New Doctor</span>
        </button>
      </div>

      {/* Search & Refresh */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, designation, department..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
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
      </div>

      {/* Error */}
      {fetchError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
          <AlertCircle size={18} />{fetchError}
        </div>
      )}

      {/* Doctor Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
          <Loader2 size={28} className="animate-spin" /><span className="text-sm">Loading doctors...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
            <Stethoscope size={32} />
          </div>
          <p className="text-sm font-medium">No doctors found</p>
          <p className="text-xs">Add a new doctor to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doctor, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              {/* Card Banner */}
              <div className="h-28 bg-gradient-to-br from-emerald-500 to-emerald-700 relative">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(doctor)}
                    className="p-2 bg-white/20 backdrop-blur-md text-white rounded-lg hover:bg-white/30 transition-all"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>
                {/* Avatar */}
                <div className="absolute -bottom-10 left-5">
                  {doctor.imageUrl ? (
                    <img
                      src={doctor.imageUrl}
                      alt={doctor.name}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-sm"
                      onError={e => { (e.target as HTMLImageElement).src = ''; }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-sm bg-slate-100 flex items-center justify-center">
                      <User size={30} className="text-slate-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="pt-12 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">{doctor.name}</h3>
                    <p className="text-emerald-600 font-semibold text-xs mt-0.5">{doctor.designation || '—'}</p>
                  </div>
                  {doctor.department && (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg">
                      {doctor.department}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-sm text-slate-500">
                  {doctor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="flex-shrink-0" />
                      <span>{doctor.phone}</span>
                    </div>
                  )}
                  {doctor.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="flex-shrink-0" />
                      <span className="truncate">{doctor.email}</span>
                    </div>
                  )}
                  {doctor.experience && (
                    <div className="flex items-center gap-2">
                      <Stethoscope size={14} className="flex-shrink-0" />
                      <span>{doctor.experience} Experience</span>
                    </div>
                  )}
                </div>

                <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-50">
                  ID: <span className="font-bold text-slate-600">{doctor.doctorId}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-center">Showing {filtered.length} of {records.length} doctors</p>
      )}

      {/* ── MODAL ───────────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-4">

            {/* Modal Header */}
            <div className="bg-emerald-700 px-6 py-5 flex items-center justify-between text-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold">{editRecord ? 'Edit Doctor' : 'Add New Doctor'}</h2>
                <p className="text-emerald-200 text-sm mt-0.5">
                  {editRecord ? `Editing ${editRecord.doctorId}` : 'Register a new doctor profile'}
                </p>
              </div>
              <button onClick={closeModal} className="text-white/80 hover:text-white transition-colors p-1">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* Auto-generated info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <Field label="Timestamp">
                  <input readOnly value={form.timestamp}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 cursor-not-allowed" />
                </Field>
                <Field label="Doctor ID">
                  <input readOnly value={form.doctorId}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 cursor-not-allowed" />
                </Field>
              </div>

              {/* Photo Upload */}
              <Field label="Doctor Photo">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group overflow-hidden"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <p className="text-white text-sm font-medium">Click to change photo</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {uploadingImage ? (
                        <><Loader2 size={28} className="animate-spin text-emerald-500 mb-2" /><p className="text-sm text-slate-500">Uploading...</p></>
                      ) : (
                        <>
                          <Upload size={28} className="text-slate-300 mb-2 group-hover:text-emerald-500 transition-colors" />
                          <p className="text-sm text-slate-400 group-hover:text-emerald-600 transition-colors font-medium">Click to upload photo</p>
                          <p className="text-xs text-slate-300 mt-1">JPG, PNG up to 5MB</p>
                        </>
                      )}
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
                {/* Status row */}
                <div className="flex items-center justify-between mt-2">
                  {form.imageUrl ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                      <CheckCircle size={13} /> Image URL saved
                    </span>
                  ) : (
                    <span className="text-xs text-amber-500 font-medium">No image URL yet</span>
                  )}
                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => { setForm(prev => ({ ...prev, imageUrl: '' })); setImagePreview(''); }}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Clear photo
                    </button>
                  )}
                </div>
                {/* Manual URL fallback */}
                <div className="mt-2">
                  <p className="text-[11px] text-slate-400 mb-1">Or paste a Google Drive / image URL manually:</p>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/..."
                    value={form.imageUrl}
                    onChange={e => {
                      const url = toDriveEmbedUrl(e.target.value.trim());
                      setForm(prev => ({ ...prev, imageUrl: url || e.target.value.trim() }));
                      if (url || e.target.value.trim()) setImagePreview(url || e.target.value.trim());
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-slate-600"
                  />
                </div>
              </Field>

              {/* Doctor Name */}
              <Field label="Doctor Name *">
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Phone Number */}
              <Field label="Phone Number" hint="Optional - 10 digits only">
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="Enter 10-digit phone number"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    maxLength={10}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>

              {/* Email Address */}
              <Field label="Email Address" hint="Optional">
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>

              {/* Designation */}
              <Field label="Designation">
                <select
                  value={form.designation}
                  onChange={e => setForm({ ...form, designation: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Select Designation</option>
                  {DESIGNATION_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>

              {/* Department */}
              <Field label="Department">
                <select
                  value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENT_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>

              {/* Experience */}
              <Field label="Experience">
                <input
                  type="text"
                  placeholder="e.g. 10 Years"
                  value={form.experience}
                  onChange={e => setForm({ ...form, experience: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Buttons */}
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-60"
                >
                  {submitting
                    ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                    : <><Save size={16} /> {editRecord ? 'Update Doctor' : 'Add Doctor'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
