import React, { useState } from 'react';
import { Search, Plus, Mail, Phone, Calendar as CalendarIcon, Trash2, Edit2, Clock } from 'lucide-react';
import { Doctor } from '../types';

interface DoctorsProps {
  doctors: Doctor[];
  onAddDoctor: (doctor: Omit<Doctor, 'id'>) => void;
}

export default function Doctors({ doctors, onAddDoctor }: DoctorsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specialty: '',
    experience: '',
    phone: '',
    email: '',
    availability: [] as string[],
    image: 'https://picsum.photos/seed/doctor/200/200',
  });

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDoctor(newDoctor);
    setIsModalOpen(false);
    setNewDoctor({
      name: '',
      specialty: '',
      experience: '',
      phone: '',
      email: '',
      availability: [],
      image: 'https://picsum.photos/seed/doctor/200/200',
    });
  };

  const toggleDay = (day: string) => {
    setNewDoctor(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Management</h1>
          <p className="text-slate-500 mt-1">Manage doctor profiles, schedules, and department assignments.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add New Doctor</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Search by name, specialty, or department..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="h-32 bg-emerald-600 relative">
              <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white/20 backdrop-blur-md text-white rounded-lg hover:bg-white/30">
                  <Edit2 size={16} />
                </button>
                <button className="p-2 bg-white/20 backdrop-blur-md text-white rounded-lg hover:bg-red-500/50">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="absolute -bottom-10 left-6">
                <img 
                  src={doctor.image} 
                  alt={doctor.name} 
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-sm"
                />
              </div>
            </div>
            <div className="pt-12 p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{doctor.name}</h3>
                  <p className="text-emerald-600 font-medium text-sm">{doctor.specialty}</p>
                </div>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg uppercase">
                  Available
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-slate-500 text-sm">
                  <CalendarIcon size={16} className="mr-2" />
                  <span>{doctor.experience} Experience</span>
                </div>
                <div className="flex items-center text-slate-500 text-sm">
                  <Clock size={16} className="mr-2" />
                  <span>09:00 AM - 05:00 PM</span>
                </div>
                <div className="flex items-center text-slate-500 text-sm">
                  <Phone size={16} className="mr-2" />
                  <span>{doctor.phone}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Schedule</div>
                <div className="flex flex-wrap gap-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                    <span 
                      key={day}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                        doctor.availability.includes(day) 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-slate-50 text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              <button className="w-full mt-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
                View Full Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add New Doctor</h2>
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
                  value={newDoctor.name}
                  onChange={e => setNewDoctor({...newDoctor, name: e.target.value})}
                  placeholder="Dr. John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Specialization</label>
                  <input 
                    required
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newDoctor.specialty}
                    onChange={e => setNewDoctor({...newDoctor, specialty: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Experience</label>
                  <input 
                    required
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newDoctor.experience}
                    onChange={e => setNewDoctor({...newDoctor, experience: e.target.value})}
                    placeholder="e.g. 10 Years"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <input 
                    required
                    type="tel"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newDoctor.phone}
                    onChange={e => setNewDoctor({...newDoctor, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input 
                    required
                    type="email"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newDoctor.email}
                    onChange={e => setNewDoctor({...newDoctor, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Availability Days</label>
                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        newDoctor.availability.includes(day)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors mt-2"
              >
                Add Doctor
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
