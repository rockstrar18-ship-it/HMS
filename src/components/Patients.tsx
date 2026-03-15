import React, { useState } from 'react';
import { Search, Plus, MoreVertical, Filter, UserPlus, Download } from 'lucide-react';
import { Patient } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface PatientsProps {
  patients: Patient[];
  onAddPatient: (patient: Omit<Patient, 'id'>) => void;
}

export default function Patients({ patients, onAddPatient }: PatientsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: 0,
    gender: 'Male' as const,
    bloodGroup: 'O+',
    phone: '',
    address: '',
    medicalHistory: '',
    status: 'Outpatient' as const,
  });

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  const generatePDF = (patient: Patient) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('MediCare Hospital', 20, 25);
    doc.setFontSize(10);
    doc.text('Patient Registration Details', 20, 32);

    // Patient Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Patient Information', 20, 60);
    
    doc.setFontSize(12);
    const details = [
      ['Patient ID:', patient.id],
      ['Full Name:', patient.name],
      ['Age:', `${patient.age} Years`],
      ['Gender:', patient.gender],
      ['Blood Group:', patient.bloodGroup],
      ['Phone:', patient.phone],
      ['Address:', patient.address],
      ['Registration Date:', new Date().toLocaleDateString()],
    ];

    (doc as any).autoTable({
      startY: 70,
      head: [['Field', 'Details']],
      body: details,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 11, cellPadding: 5 }
    });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a computer-generated document.', 20, 280);
    
    doc.save(`Patient_${patient.id}_Details.pdf`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPatient(newPatient);
    setIsModalOpen(false);
    // Note: In a real app, we'd get the ID back from the handler
    // For this demo, we'll just show the latest patient added
    setNewPatient({
      name: '',
      age: 0,
      gender: 'Male',
      bloodGroup: '',
      phone: '',
      address: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients Directory</h1>
          <p className="text-slate-500 mt-1">Manage and view all registered patients.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add New Patient</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center space-x-2 px-4 py-2 text-slate-600 bg-slate-50 rounded-xl text-sm font-medium hover:bg-slate-100">
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Patient Name</th>
                <th className="px-6 py-4 font-medium">Age/Gender</th>
                <th className="px-6 py-4 font-medium">Blood Group</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Last Visit</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{patient.name}</div>
                    <div className="text-xs text-slate-500">ID: {patient.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">{patient.age} Yrs, {patient.gender}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                      {patient.bloodGroup}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">{patient.phone}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[150px]">{patient.address}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {patient.lastVisit || 'No visits yet'}
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => generatePDF(patient)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Download Details PDF"
                    >
                      <Download size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">New Patient Registration</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newPatient.name}
                  onChange={e => setNewPatient({...newPatient, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Age</label>
                  <input 
                    required
                    type="number"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newPatient.age}
                    onChange={e => setNewPatient({...newPatient, age: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Gender</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newPatient.gender}
                    onChange={e => setNewPatient({...newPatient, gender: e.target.value as any})}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Phone Number</label>
                  <input 
                    required
                    type="tel"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newPatient.phone}
                    onChange={e => setNewPatient({...newPatient, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Blood Group</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newPatient.bloodGroup}
                    onChange={e => setNewPatient({...newPatient, bloodGroup: e.target.value})}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Address</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newPatient.address}
                  onChange={e => setNewPatient({...newPatient, address: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Medical History</label>
                <textarea 
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-20 resize-none"
                  value={newPatient.medicalHistory}
                  onChange={e => setNewPatient({...newPatient, medicalHistory: e.target.value})}
                  placeholder="Previous surgeries, allergies, chronic conditions..."
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors mt-2"
              >
                Register Patient
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
