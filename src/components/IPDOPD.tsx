import React, { useState } from 'react';
import { Search, Plus, Stethoscope, Bed, LogOut, CheckCircle2, UserPlus } from 'lucide-react';
import { Patient, Bed as BedType, IPDRecord } from '../types';

interface IPDOPDProps {
  patients: Patient[];
  beds: BedType[];
  onAdmit: (patientId: string, bedId: string, diagnosis: string) => void;
  onDischarge: (patientId: string) => void;
}

export default function IPDOPD({ patients, beds, onAdmit, onDischarge }: IPDOPDProps) {
  const [activeSubTab, setActiveSubTab] = useState<'OPD' | 'IPD'>('OPD');
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [admitData, setAdmitData] = useState({
    patientId: '',
    bedId: '',
    diagnosis: '',
  });

  const opdPatients = patients.filter(p => p.status === 'Outpatient');
  const ipdPatients = patients.filter(p => p.status === 'Inpatient');

  const handleAdmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdmit(admitData.patientId, admitData.bedId, admitData.diagnosis);
    setIsAdmitModalOpen(false);
    setAdmitData({ patientId: '', bedId: '', diagnosis: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">OPD / IPD Management</h1>
          <p className="text-slate-500 mt-1">Manage outpatient registrations and inpatient admissions.</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveSubTab('OPD')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeSubTab === 'OPD' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-slate-600 border border-slate-100'
            }`}
          >
            OPD Panel
          </button>
          <button 
            onClick={() => setActiveSubTab('IPD')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeSubTab === 'IPD' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-slate-600 border border-slate-100'
            }`}
          >
            IPD Panel
          </button>
        </div>
      </div>

      {activeSubTab === 'OPD' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Outpatient Registration (OPD)</h2>
            <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700">
              <UserPlus size={18} />
              <span>New OPD Registration</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Patient</th>
                  <th className="px-6 py-4 font-medium">Last Visit</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {opdPatients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">ID: {p.id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.lastVisit || 'Today'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.phone}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => {
                          setAdmitData({ ...admitData, patientId: p.id });
                          setIsAdmitModalOpen(true);
                        }}
                        className="text-emerald-600 text-sm font-bold hover:underline"
                      >
                        Admit to IPD
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Inpatient Management (IPD)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Patient</th>
                  <th className="px-6 py-4 font-medium">Bed No.</th>
                  <th className="px-6 py-4 font-medium">Admitted Date</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ipdPatients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">ID: {p.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                        {p.bedId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.admittedDate}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => onDischarge(p.id)}
                        className="text-red-600 text-sm font-bold hover:underline"
                      >
                        Generate Discharge Summary
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admit Modal */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Patient Admission (IPD)</h2>
              <button onClick={() => setIsAdmitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleAdmitSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Patient</label>
                <div className="px-4 py-2 bg-slate-50 rounded-xl text-slate-900 font-medium">
                  {patients.find(p => p.id === admitData.patientId)?.name}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Select Bed</label>
                <select 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={admitData.bedId}
                  onChange={e => setAdmitData({...admitData, bedId: e.target.value})}
                >
                  <option value="">Choose an available bed...</option>
                  {beds.filter(b => b.status === 'Available').map(b => (
                    <option key={b.id} value={b.id}>{b.ward} - {b.id} ({b.type})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Diagnosis / Reason for Admission</label>
                <textarea 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                  value={admitData.diagnosis}
                  onChange={e => setAdmitData({...admitData, diagnosis: e.target.value})}
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors mt-2"
              >
                Confirm Admission
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
