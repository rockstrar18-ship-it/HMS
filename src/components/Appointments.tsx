import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Appointment, Patient, Doctor } from '../types';

interface AppointmentsProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  onAddAppointment: (apt: Omit<Appointment, 'id'>) => void;
  onReschedule: (id: string, date: string, time: string) => void;
  onCancel: (id: string) => void;
}

export default function Appointments({ 
  appointments, 
  patients, 
  doctors, 
  onAddAppointment,
  onReschedule,
  onCancel
}: AppointmentsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
  const [newApt, setNewApt] = useState({
    patientId: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    reason: '',
    status: 'Scheduled' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAppointment(newApt);
    setIsModalOpen(false);
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAptId) {
      onReschedule(selectedAptId, rescheduleData.date, rescheduleData.time);
      setIsRescheduleModalOpen(false);
      setSelectedAptId(null);
    }
  };

  const openRescheduleModal = (apt: Appointment) => {
    setSelectedAptId(apt.id);
    setRescheduleData({ date: apt.date, time: apt.time });
    setIsRescheduleModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 mt-1">Schedule and manage patient visits.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} />
          <span>Book Appointment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar View Placeholder */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">March 2026</h3>
              <div className="flex space-x-1">
                <button className="p-1 hover:bg-slate-50 rounded"><ChevronLeft size={18} /></button>
                <button className="p-1 hover:bg-slate-50 rounded"><ChevronRight size={18} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-slate-400 font-medium">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: 31 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`py-2 text-sm rounded-lg cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 transition-colors ${
                    i + 1 === 15 ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Today's Visits</span>
                <span className="text-sm font-bold text-slate-900">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Pending</span>
                <span className="text-sm font-bold text-slate-900 text-orange-600">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Completed</span>
                <span className="text-sm font-bold text-slate-900 text-emerald-600">8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-3 space-y-4">
          {appointments.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
              <CalendarIcon className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="text-lg font-medium text-slate-900">No appointments scheduled</h3>
              <p className="text-slate-500 mt-1">Book a new appointment to get started.</p>
            </div>
          ) : (
            appointments.map((apt) => {
              const patient = patients.find(p => p.id === apt.patientId);
              const doctor = doctors.find(d => d.id === apt.doctorId);
              return (
                <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-emerald-200 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <CalendarIcon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{patient?.name}</h4>
                      <p className="text-sm text-slate-500">with <span className="text-emerald-600 font-medium">{doctor?.name}</span></p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center text-xs text-slate-400">
                          <CalendarIcon size={14} className="mr-1" />
                          {apt.date}
                        </div>
                        <div className="flex items-center text-xs text-slate-400">
                          <Clock size={14} className="mr-1" />
                          {apt.time}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      apt.status === 'Scheduled' ? 'bg-blue-50 text-blue-700' :
                      apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {apt.status}
                    </span>
                    {apt.status === 'Scheduled' && (
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => openRescheduleModal(apt)}
                          className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50" 
                          title="Reschedule"
                        >
                          <Clock size={18} />
                        </button>
                        <button 
                          onClick={() => onCancel(apt.id)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50" 
                          title="Cancel"
                        >
                          <Plus className="rotate-45" size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Book Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Book Appointment</h2>
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
                  value={newApt.patientId}
                  onChange={e => setNewApt({...newApt, patientId: e.target.value})}
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Select Doctor</label>
                <select 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newApt.doctorId}
                  onChange={e => setNewApt({...newApt, doctorId: e.target.value})}
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Date</label>
                  <input 
                    required
                    type="date"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newApt.date}
                    onChange={e => setNewApt({...newApt, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Time</label>
                  <input 
                    required
                    type="time"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newApt.time}
                    onChange={e => setNewApt({...newApt, time: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Reason for Visit</label>
                <textarea 
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                  value={newApt.reason}
                  onChange={e => setNewApt({...newApt, reason: e.target.value})}
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors mt-2"
              >
                Schedule Appointment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Reschedule Appointment</h2>
              <button onClick={() => setIsRescheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">New Date</label>
                  <input 
                    required
                    type="date"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={rescheduleData.date}
                    onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">New Time</label>
                  <input 
                    required
                    type="time"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={rescheduleData.time}
                    onChange={e => setRescheduleData({...rescheduleData, time: e.target.value})}
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors mt-2"
              >
                Update Appointment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
