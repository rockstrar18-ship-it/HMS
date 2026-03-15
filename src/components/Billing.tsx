import React, { useState } from 'react';
import { Search, Download, Plus, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { Bill, Patient } from '../types';

interface BillingProps {
  bills: Bill[];
  patients: Patient[];
  onCreateInvoice: (billData: Omit<Bill, 'id'>) => void;
}

export default function Billing({ bills, patients, onCreateInvoice }: BillingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBill, setNewBill] = useState({
    patientId: '',
    consultationFees: 0,
    medicineCharges: 0,
    roomCharges: 0,
    labCharges: 0,
    description: '',
  });

  const filteredBills = bills.filter(b => {
    const patient = patients.find(p => p.id === b.patientId);
    return patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.includes(searchTerm);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to add bill would go here
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Invoices</h1>
          <p className="text-slate-500 mt-1">Manage patient payments and hospital revenue.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} />
          <span>Create New Invoice</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-3 text-emerald-600 mb-2">
            <CheckCircle2 size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Total Paid</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">$45,280.00</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-3 text-orange-600 mb-2">
            <Clock size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">$8,450.00</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-3 text-blue-600 mb-2">
            <CreditCard size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">$53,730.00</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by patient name or invoice ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Invoice ID</th>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Total Amount</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBills.map((bill) => {
                const patient = patients.find(p => p.id === bill.patientId);
                return (
                  <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">#{bill.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{patient?.name}</div>
                      <div className="text-xs text-slate-500">{patient?.phone}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">${bill.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{bill.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bill.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors">
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Generate Invoice</h2>
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
                  value={newBill.patientId}
                  onChange={e => setNewBill({...newBill, patientId: e.target.value})}
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Consultation Fees</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newBill.consultationFees}
                    onChange={e => setNewBill({...newBill, consultationFees: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Medicine Charges</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newBill.medicineCharges}
                    onChange={e => setNewBill({...newBill, medicineCharges: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Room Charges</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newBill.roomCharges}
                    onChange={e => setNewBill({...newBill, roomCharges: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Lab Charges</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newBill.labCharges}
                    onChange={e => setNewBill({...newBill, labCharges: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">Total:</span>
                <span className="text-2xl font-bold text-emerald-600">
                  ${(newBill.consultationFees + newBill.medicineCharges + newBill.roomCharges + newBill.labCharges).toFixed(2)}
                </span>
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors mt-2"
              >
                Generate & Save Invoice
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
