import React, { useState } from 'react';
import { Search, Plus, Droplets, UserPlus, History } from 'lucide-react';
import { BloodDonor } from '../types';

interface BloodBankProps {
  donors: BloodDonor[];
  onAddDonor: (donor: Omit<BloodDonor, 'id'>) => void;
}

export default function BloodBank({ donors, onAddDonor }: BloodBankProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDonor, setNewDonor] = useState({
    name: '',
    bloodGroup: 'O+',
    phone: '',
    lastDonation: 'Never',
    status: 'Eligible' as const,
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDonor(newDonor);
    setIsModalOpen(false);
    setNewDonor({
      name: '',
      bloodGroup: 'O+',
      phone: '',
      lastDonation: 'Never',
      status: 'Eligible',
    });
  };

  const filteredDonors = donors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blood Bank</h1>
          <p className="text-slate-500 mt-1">Manage blood inventory and donor registrations.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
        >
          <UserPlus size={20} />
          <span>Register Donor</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {bloodGroups.map(group => (
          <div key={group} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center group hover:border-red-200 transition-colors">
            <div className="text-red-600 font-bold text-xl mb-1">{group}</div>
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              {donors.filter(d => d.bloodGroup === group).length * 2 + 4} Units
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Donor Directory</h2>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search donors..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Donor Name</th>
                <th className="px-6 py-4 font-medium">Blood Group</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Last Donation</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDonors.map((donor) => (
                <tr key={donor.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{donor.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700">
                      {donor.bloodGroup}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{donor.phone}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{donor.lastDonation}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      donor.status === 'Eligible' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      {donor.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Donor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Register New Donor</h2>
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
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  value={newDonor.name}
                  onChange={e => setNewDonor({...newDonor, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Blood Group</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    value={newDonor.bloodGroup}
                    onChange={e => setNewDonor({...newDonor, bloodGroup: e.target.value})}
                  >
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <input 
                    required
                    type="tel"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    value={newDonor.phone}
                    onChange={e => setNewDonor({...newDonor, phone: e.target.value})}
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors mt-2"
              >
                Register Donor
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
