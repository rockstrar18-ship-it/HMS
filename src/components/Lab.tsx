import React, { useState } from 'react';
import { Search, Plus, FlaskConical, CheckCircle2, Clock, FileText } from 'lucide-react';
import { LabTest, Patient } from '../types';

interface LabProps {
  tests: LabTest[];
  patients: Patient[];
  onRequestTest: (testData: Omit<LabTest, 'id'>) => void;
}

export default function Laboratory({ tests, patients, onRequestTest }: LabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    patientId: '',
    testName: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Pending' as const,
  });

  const filteredTests = tests.filter(test => {
    const patient = patients.find(p => p.id === test.patientId);
    return patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) || test.testName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestTest(newTest);
    setIsModalOpen(false);
    setNewTest({
      patientId: '',
      testName: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratory Management</h1>
          <p className="text-slate-500 mt-1">Manage diagnostic tests and patient reports.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} />
          <span>New Test Request</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {['Blood Test', 'X-Ray', 'MRI', 'CT Scan'].map(test => (
          <div key={test} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FlaskConical size={18} />
            </div>
            <span className="text-sm font-bold text-slate-700">{test}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search tests or patients..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 ml-4">
            <button className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100">
              Upload Report
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Test Name</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Result</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTests.map((test) => {
                const patient = patients.find(p => p.id === test.patientId);
                return (
                  <tr key={test.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{patient?.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{test.testName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{test.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        test.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {test.status === 'Completed' ? <CheckCircle2 size={12} className="mr-1" /> : <Clock size={12} className="mr-1" />}
                        {test.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">
                      {test.result || 'Pending...'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {test.status === 'Completed' && (
                        <button className="text-emerald-600 hover:text-emerald-700 p-2 rounded-lg hover:bg-emerald-50">
                          <FileText size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Test Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Request New Test</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Select Patient</label>
                <select 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newTest.patientId}
                  onChange={e => setNewTest({...newTest, patientId: e.target.value})}
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Test Name</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newTest.testName}
                  onChange={e => setNewTest({...newTest, testName: e.target.value})}
                  placeholder="e.g. CBC, Lipid Profile"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Date</label>
                <input 
                  required
                  type="date"
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newTest.date}
                  onChange={e => setNewTest({...newTest, date: e.target.value})}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors mt-2"
              >
                Request Test
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
