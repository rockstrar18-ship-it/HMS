import React from 'react';
import { Bed as BedIcon, CheckCircle2, AlertCircle, Hammer } from 'lucide-react';
import { Bed } from '../types';

interface BedsProps {
  beds: Bed[];
}

export default function Beds({ beds }: BedsProps) {
  const wards = Array.from(new Set(beds.map(b => b.ward)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wards & Bed Management</h1>
          <p className="text-slate-500 mt-1">Real-time bed availability and allocation tracking.</p>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-slate-600">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-slate-600">Occupied</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-slate-300"></div>
            <span className="text-sm text-slate-600">Maintenance</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {wards.map(ward => (
          <div key={ward} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <span className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg mr-2">
                <BedIcon size={18} />
              </span>
              {ward}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {beds.filter(b => b.ward === ward).map(bed => (
                <div 
                  key={bed.id} 
                  className={`p-4 rounded-2xl border transition-all ${
                    bed.status === 'Available' ? 'bg-white border-slate-100 hover:border-emerald-200' :
                    bed.status === 'Occupied' ? 'bg-red-50 border-red-100' :
                    'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{bed.id}</span>
                    {bed.status === 'Available' ? <CheckCircle2 size={14} className="text-emerald-500" /> :
                     bed.status === 'Occupied' ? <AlertCircle size={14} className="text-red-500" /> :
                     <Hammer size={14} className="text-slate-400" />}
                  </div>
                  <div className={`text-sm font-bold ${bed.status === 'Occupied' ? 'text-red-700' : 'text-slate-900'}`}>
                    {bed.type}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                    {bed.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
