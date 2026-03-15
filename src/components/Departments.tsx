import React, { useState } from 'react';
import { Layers, User, Phone, MapPin, Plus } from 'lucide-react';
import { Department } from '../types';

interface DepartmentsProps {
  departments: Department[];
  onAddDepartment: (dept: Omit<Department, 'id'>) => void;
}

export default function Departments({ departments, onAddDepartment }: DepartmentsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDept, setNewDept] = useState({
    name: '',
    head: '',
    floor: '',
    contact: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDepartment(newDept);
    setIsModalOpen(false);
    setNewDept({
      name: '',
      head: '',
      floor: '',
      contact: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Departments</h1>
          <p className="text-slate-500 mt-1">Overview of clinical and administrative departments.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Department</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                  <Layers size={24} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {dept.id}</span>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-900">{dept.name}</h3>
                <div className="flex items-center text-slate-500 text-sm mt-1">
                  <MapPin size={14} className="mr-1" />
                  <span>Floor: {dept.floor}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-50">
                <div className="flex items-center text-sm text-slate-600">
                  <User size={16} className="mr-2 text-slate-400" />
                  <span className="font-medium">Head:</span>
                  <span className="ml-2">{dept.head}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Phone size={16} className="mr-2 text-slate-400" />
                  <span className="font-medium">Contact:</span>
                  <span className="ml-2">{dept.contact}</span>
                </div>
              </div>

              <button className="w-full mt-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-emerald-600 hover:text-white transition-all">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add New Department</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Department Name</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newDept.name}
                  onChange={e => setNewDept({...newDept, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Department Head</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newDept.head}
                  onChange={e => setNewDept({...newDept, head: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Floor</label>
                  <input 
                    required
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newDept.floor}
                    onChange={e => setNewDept({...newDept, floor: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Contact Extension</label>
                  <input 
                    required
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newDept.contact}
                    onChange={e => setNewDept({...newDept, contact: e.target.value})}
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors mt-2"
              >
                Create Department
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
