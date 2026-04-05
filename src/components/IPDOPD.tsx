import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, X, Save, RefreshCw, Search, Calendar, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw52Ig8a4MvfrQXKrlIUz1tGPxnHxud4-v9zjcdHCXCLkm1PNN6taKfM1MGHiiy6bxj/exec';
const SHEET_NAME = 'IPD_Records';

// ─── DROPDOWN OPTIONS ──────────────────────────────────────────────────────────
const PAT_CATEGORY_OPTIONS = [
  'AYUSHMAN BHARAT',
  'AYUSHMAN BHARAT (GJAY)',
  'CGHS',
  'ESIC',
  'FHPL',
  'FUTURE GENERAL INDIA INSURANCE COMPANY',
  'GENINS',
  'GO DIGIT GENERAL INSURANCE LTD.',
  'HDFC ERGO GENERAL INSURANCE COMPANY',
  'HEALTH INSURANCE TPA OF INDIA LTD.',
];

const PATIENT_CASE_OPTIONS = ['Emergency', 'Routine', 'Follow-up', 'Surgery'];
const MEDICAL_SURGICAL_OPTIONS = ['Medical', 'Surgical', 'Non Surgical'];
const BED_TARIFF_OPTIONS = ['Standard', 'Premium', 'VIP'];

// ─── TYPES ─────────────────────────────────────────────────────────────────────
interface IPDFormData {
  // Auto-generated
  timestamp: string;
  ipdNumber: string;
  admissionNo: string;
  // Patient Information
  patientName: string;
  phoneNumber: string;
  fatherHusband: string;
  whatsappNo: string;
  admissionPurpose: string;
  dob: string;
  age: string;
  gender: string;
  // Address Information
  houseStreet: string;
  areaColony: string;
  landmark: string;
  state: string;
  city: string;
  pincode: string;
  country: string;
  // Medical Information
  department: string;
  referByDr: string;
  consultantDr: string;
  patCategory: string;
  patientCase: string;
  medicalSurgical: string;
  healthCardNo: string;
  // Location & Bed Details
  floor: string;
  ward: string;
  room: string;
  bedNo: string;
  bedLocation: string;
  wardType: string;
  bedTariff: string;
}

interface IPDRecord extends IPDFormData {
  rowIndex: number;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function formatTimestamp(date: Date): string {
  const d = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const t = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${d}, ${t}`;
}

function generateIPDNumber(existingRecords: IPDRecord[]): string {
  const nums = existingRecords
    .map(r => parseInt(r.ipdNumber.replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 5300;
  return `IPD-${max + 1}`;
}

function generateAdmissionNo(existingRecords: IPDRecord[]): string {
  const nums = existingRecords
    .map(r => parseInt(r.admissionNo.replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 5300;
  return `ADM-${max + 1}`;
}

function calculateAge(dob: string): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? String(age) : '';
}

// Column order matches the sheet (A→...) — extend as needed
function rowToRecord(row: string[], rowIndex: number): IPDRecord {
  return {
    rowIndex,
    timestamp:        row[0]  || '',
    ipdNumber:        row[1]  || '',
    admissionNo:      row[2]  || '',
    patientName:      row[3]  || '',
    phoneNumber:      row[4]  || '',
    fatherHusband:    row[5]  || '',
    whatsappNo:       row[6]  || '',
    admissionPurpose: row[7]  || '',
    dob:              row[8]  || '',
    age:              row[9]  || '',
    gender:           row[10] || '',
    houseStreet:      row[11] || '',
    areaColony:       row[12] || '',
    landmark:         row[13] || '',
    state:            row[14] || '',
    city:             row[15] || '',
    pincode:          row[16] || '',
    country:          row[17] || '',
    department:       row[18] || '',
    referByDr:        row[19] || '',
    consultantDr:     row[20] || '',
    patCategory:      row[21] || '',
    patientCase:      row[22] || '',
    medicalSurgical:  row[23] || '',
    healthCardNo:     row[24] || '',
    floor:            row[25] || '',
    ward:             row[26] || '',
    room:             row[27] || '',
    bedNo:            row[28] || '',
    bedLocation:      row[29] || '',
    wardType:         row[30] || '',
    bedTariff:        row[31] || '',
  };
}

// ─── EMPTY FORM ────────────────────────────────────────────────────────────────
const emptyForm = (): IPDFormData => ({
  timestamp: '', ipdNumber: '', admissionNo: '',
  patientName: '', phoneNumber: '', fatherHusband: '', whatsappNo: '',
  admissionPurpose: '', dob: '', age: '', gender: '',
  houseStreet: '', areaColony: '', landmark: '', state: '', city: '', pincode: '', country: 'India',
  department: '', referByDr: '', consultantDr: '',
  patCategory: '', patientCase: '', medicalSurgical: '', healthCardNo: '',
  floor: '', ward: '', room: '', bedNo: '', bedLocation: '', wardType: '', bedTariff: '',
});

// ─── REUSABLE FIELD COMPONENTS ────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';
const sectionCls = 'text-sm font-bold text-slate-700 mb-3 mt-5 border-b border-slate-100 pb-2';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────────
export default function IPDOPD() {
  const [records, setRecords] = useState<IPDRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<IPDRecord | null>(null);
  const [form, setForm] = useState<IPDFormData>(emptyForm());

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

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
      const parsed: IPDRecord[] = rows
        .slice(1)
        .map((row, i) => rowToRecord(row, i + 2))
        .filter(r => r.ipdNumber || r.patientName);
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
      ipdNumber: generateIPDNumber(records),
      admissionNo: generateAdmissionNo(records),
    });
    setEditRecord(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rec: IPDRecord) => {
    setForm({ ...rec });
    setEditRecord(rec);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditRecord(null);
    setForm(emptyForm());
  };

  // ── Field change ──
  const handleChange = (field: keyof IPDFormData, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'dob') updated.age = calculateAge(value);
      return updated;
    });
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName.trim()) { showToast('Patient name is required.', 'error'); return; }
    setSubmitting(true);
    try {
      const rowData = [
        form.timestamp, form.ipdNumber, form.admissionNo,
        form.patientName, form.phoneNumber, form.fatherHusband, form.whatsappNo,
        form.admissionPurpose, form.dob, form.age, form.gender,
        form.houseStreet, form.areaColony, form.landmark, form.state, form.city, form.pincode, form.country,
        form.department, form.referByDr, form.consultantDr,
        form.patCategory, form.patientCase, form.medicalSurgical, form.healthCardNo,
        form.floor, form.ward, form.room, form.bedNo, form.bedLocation, form.wardType, form.bedTariff,
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

      showToast(editRecord ? 'Record updated successfully!' : 'Record added successfully!', 'success');
      closeModal();
      fetchRecords();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit data', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filter ──
  const filtered = records.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q ||
      r.patientName.toLowerCase().includes(q) ||
      r.phoneNumber.includes(q) ||
      r.ipdNumber.toLowerCase().includes(q) ||
      r.admissionNo.toLowerCase().includes(q);
    const matchDate = !filterDate ||
      r.timestamp.includes(new Date(filterDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
    return matchQ && matchDate;
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
          <h1 className="text-2xl font-bold text-slate-900">IPD Patient Admission</h1>
          <p className="text-slate-500 mt-1">Manage in-patient admissions and records.</p>
        </div>
        <button onClick={openAddModal}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100">
          <Plus size={18} /><span>Patient Admission</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by name, phone, admission no..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
        </div>
        <div className="relative">
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
        </div>
        <button onClick={fetchRecords}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-all">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh
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
            <p className="text-sm font-medium">No records found</p>
            <p className="text-xs">Try a different search or add a new admission</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  {['Action','Timestamp','IPD Number','Admission No','Patient Name','Phone Number',
                    'Father/Husband','WhatsApp No','Adm. Purpose','DOB','Age','Gender',
                    'Pat. Category','Patient Case','Med/Surgical','Bed No','Ward','Floor'].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => openEditModal(rec)}
                        className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all">
                        <Edit2 size={12} />Edit
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{rec.timestamp}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className="text-emerald-600 font-bold">{rec.ipdNumber}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">{rec.admissionNo}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">{rec.patientName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{rec.phoneNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{rec.fatherHusband}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{rec.whatsappNo}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 max-w-[140px] truncate">{rec.admissionPurpose}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{rec.dob}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{rec.age}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{rec.gender}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 max-w-[140px] truncate">{rec.patCategory}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{rec.patientCase}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{rec.medicalSurgical}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {rec.bedNo && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">{rec.bedNo}</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{rec.ward}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{rec.floor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-center">Showing {filtered.length} of {records.length} records</p>
      )}

      {/* ── MODAL ─────────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-4">

            {/* Modal Header */}
            <div className="bg-emerald-700 px-6 py-5 flex items-center justify-between text-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold">{editRecord ? 'Edit IPD Record' : 'IPD Patient Admission'}</h2>
                <p className="text-emerald-200 text-sm mt-0.5">
                  {editRecord ? `Editing ${editRecord.ipdNumber}` : 'Register a new IPD patient admission'}
                </p>
              </div>
              <button onClick={closeModal} className="text-white/80 hover:text-white transition-colors p-1"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-1">

              {/* ── Auto-generated ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                <Field label="Timestamp">
                  <input readOnly value={form.timestamp}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 cursor-not-allowed" />
                </Field>
                <Field label="IPD Number">
                  <input readOnly value={form.ipdNumber}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-700 cursor-not-allowed" />
                </Field>
                <Field label="Admission No">
                  <input readOnly value={form.admissionNo}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 cursor-not-allowed" />
                </Field>
              </div>

              {/* ── Patient Information ── */}
              <h3 className={sectionCls}>Patient Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Patient Name *">
                  <input type="text" required placeholder="Full patient name" value={form.patientName}
                    onChange={e => handleChange('patientName', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Father / Husband Name">
                  <input type="text" placeholder="S/O, W/O, D/O..." value={form.fatherHusband}
                    onChange={e => handleChange('fatherHusband', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Phone Number">
                  <input type="tel" placeholder="10-digit mobile number" value={form.phoneNumber}
                    onChange={e => handleChange('phoneNumber', e.target.value)} className={inputCls} />
                </Field>
                <Field label="WhatsApp No">
                  <input type="tel" placeholder="WhatsApp number" value={form.whatsappNo}
                    onChange={e => handleChange('whatsappNo', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Date of Birth">
                  <input type="date" value={form.dob}
                    onChange={e => handleChange('dob', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Age">
                  <input type="number" placeholder="Auto-calculated from DOB" value={form.age}
                    onChange={e => handleChange('age', e.target.value)} className={inputCls} />
                </Field>
                <SelectField label="Gender" value={form.gender} onChange={v => handleChange('gender', v)}
                  options={['Male', 'Female', 'Other']} placeholder="Select Gender" />
                <div className="sm:col-span-2">
                  <Field label="Admission Purpose">
                    <textarea rows={2} placeholder="Reason for admission / diagnosis..." value={form.admissionPurpose}
                      onChange={e => handleChange('admissionPurpose', e.target.value)}
                      className={`${inputCls} resize-none`} />
                  </Field>
                </div>
              </div>

              {/* ── Address Information ── */}
              <h3 className={sectionCls}>Address Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="House No. / Street">
                  <input type="text" placeholder="House No., Street" value={form.houseStreet}
                    onChange={e => handleChange('houseStreet', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Area / Colony">
                  <input type="text" placeholder="Area or Colony" value={form.areaColony}
                    onChange={e => handleChange('areaColony', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Landmark">
                  <input type="text" placeholder="Nearby landmark" value={form.landmark}
                    onChange={e => handleChange('landmark', e.target.value)} className={inputCls} />
                </Field>
                <Field label="State">
                  <input type="text" placeholder="Enter state" value={form.state}
                    onChange={e => handleChange('state', e.target.value)} className={inputCls} />
                </Field>
                <Field label="City">
                  <input type="text" placeholder="Enter city" value={form.city}
                    onChange={e => handleChange('city', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Pincode">
                  <input type="text" placeholder="6-digit pincode" value={form.pincode}
                    onChange={e => handleChange('pincode', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Country">
                  <input type="text" value={form.country}
                    onChange={e => handleChange('country', e.target.value)} className={inputCls} />
                </Field>
              </div>

              {/* ── Medical Information ── */}
              <h3 className={sectionCls}>Medical Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Department">
                  <input type="text" placeholder="Search or select department" value={form.department}
                    onChange={e => handleChange('department', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Refer By Dr.">
                  <input type="text" placeholder="Enter referring doctor name" value={form.referByDr}
                    onChange={e => handleChange('referByDr', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Consultant Dr.">
                  <input type="text" placeholder="Search or select doctor" value={form.consultantDr}
                    onChange={e => handleChange('consultantDr', e.target.value)} className={inputCls} />
                </Field>
                <SelectField label="Pat. Category" value={form.patCategory} onChange={v => handleChange('patCategory', v)}
                  options={PAT_CATEGORY_OPTIONS} placeholder="Select Category" />
                <SelectField label="Patient Case" value={form.patientCase} onChange={v => handleChange('patientCase', v)}
                  options={PATIENT_CASE_OPTIONS} placeholder="Select Case" />
                <SelectField label="Medical / Surgical" value={form.medicalSurgical} onChange={v => handleChange('medicalSurgical', v)}
                  options={MEDICAL_SURGICAL_OPTIONS} placeholder="Select Type" />
                <Field label="Health Card No.">
                  <input type="text" placeholder="Health card number" value={form.healthCardNo}
                    onChange={e => handleChange('healthCardNo', e.target.value)} className={inputCls} />
                </Field>
              </div>

              {/* ── Location & Bed Details ── */}
              <h3 className={sectionCls}>Location &amp; Bed Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Floor">
                  <input type="text" placeholder="Floor number" value={form.floor}
                    onChange={e => handleChange('floor', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Ward">
                  <input type="text" placeholder="Ward name" value={form.ward}
                    onChange={e => handleChange('ward', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Room">
                  <input type="text" placeholder="Room number" value={form.room}
                    onChange={e => handleChange('room', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Bed No.">
                  <input type="text" placeholder="e.g. B-101" value={form.bedNo}
                    onChange={e => handleChange('bedNo', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Bed Location">
                  <input type="text" placeholder="Bed location" value={form.bedLocation}
                    onChange={e => handleChange('bedLocation', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Ward Type">
                  <input type="text" placeholder="Ward type" value={form.wardType}
                    onChange={e => handleChange('wardType', e.target.value)} className={inputCls} />
                </Field>
                <SelectField label="Bed Tariff" value={form.bedTariff} onChange={v => handleChange('bedTariff', v)}
                  options={BED_TARIFF_OPTIONS} placeholder="Select Tariff" />
              </div>

              {/* ── Buttons ── */}
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-5 mt-4">
                <button type="button" onClick={closeModal}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-60">
                  {submitting
                    ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                    : <><Save size={16} /> {editRecord ? 'Update Record' : 'Save Admission'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
