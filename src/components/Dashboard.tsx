import React from 'react';
import { 
  Users, 
  Calendar, 
  UserRound, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Hospital
} from 'lucide-react';
import { Patient, Doctor, Appointment } from '../types';

interface DashboardProps {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
}

const StatCard = ({ icon: Icon, label, value, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-medium">
          <TrendingUp size={12} />
          <span>{trend}</span>
        </div>
      )}
    </div>
    <div className="mt-4">
      <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  </div>
);

export default function Dashboard({ patients, doctors, appointments }: DashboardProps) {
  const upcomingAppointments = appointments
    .filter(a => a.status === 'Scheduled')
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hospital Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          label="Total Patients" 
          value={patients.length} 
          color="bg-blue-500" 
          trend="+12%"
        />
        <StatCard 
          icon={UserRound} 
          label="Active Doctors" 
          value={doctors.length} 
          color="bg-emerald-500" 
        />
        <StatCard 
          icon={Calendar} 
          label="Today's Appointments" 
          value={appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length} 
          color="bg-violet-500" 
          trend="+4"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Monthly Revenue" 
          value="$12,450" 
          color="bg-orange-500" 
          trend="+8.2%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Appointments */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Upcoming Appointments</h2>
            <button className="text-emerald-600 text-sm font-medium hover:text-emerald-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Patient</th>
                  <th className="px-6 py-4 font-medium">Doctor</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {upcomingAppointments.map((apt) => {
                  const patient = patients.find(p => p.id === apt.patientId);
                  const doctor = doctors.find(d => d.id === apt.doctorId);
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{patient?.name}</div>
                        <div className="text-xs text-slate-500">{patient?.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{doctor?.name}</td>
                      <td className="px-6 py-4 text-slate-600">{apt.time}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4">Doctor Availability</h2>
            <div className="space-y-4">
              {doctors.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={doc.image} alt={doc.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{doc.name}</div>
                      <div className="text-xs text-slate-500">{doc.specialty}</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-600 p-6 rounded-2xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg">Need Help?</h3>
              <p className="text-emerald-100 text-sm mt-1">Check out the system documentation or contact support.</p>
              <button className="mt-4 bg-white text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors">
                Contact Support
              </button>
            </div>
            <Hospital className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500/20 rotate-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
