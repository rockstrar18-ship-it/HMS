import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hospital Analytics & Reports</h1>
        <p className="text-slate-500 mt-1">Comprehensive data insights for hospital management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={20} />
            </div>
            <div className="flex items-center text-emerald-600 text-xs font-bold">
              <ArrowUpRight size={14} className="mr-1" />
              12%
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Patient Growth</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">1,240</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={20} />
            </div>
            <div className="flex items-center text-emerald-600 text-xs font-bold">
              <ArrowUpRight size={14} className="mr-1" />
              8.4%
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">$54,230</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
              <Calendar size={20} />
            </div>
            <div className="flex items-center text-red-600 text-xs font-bold">
              <ArrowDownRight size={14} className="mr-1" />
              2.1%
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Avg. Stay Duration</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">4.2 Days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-6 flex items-center">
            <BarChart3 size={18} className="mr-2 text-emerald-600" />
            Monthly Admissions
          </h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {[45, 62, 58, 75, 90, 82, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-slate-50 rounded-t-lg relative group">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-t-lg transition-all group-hover:bg-emerald-600" 
                  style={{ height: `${h}%` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-slate-400 font-medium">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-6 flex items-center">
            <PieChartIcon size={18} className="mr-2 text-emerald-600" />
            Department Distribution
          </h2>
          <div className="space-y-4">
            {[
              { name: 'Cardiology', value: 35, color: 'bg-blue-500' },
              { name: 'Neurology', value: 25, color: 'bg-emerald-500' },
              { name: 'Pediatrics', value: 20, color: 'bg-violet-500' },
              { name: 'General', value: 20, color: 'bg-orange-500' },
            ].map(dept => (
              <div key={dept.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">{dept.name}</span>
                  <span className="text-slate-900 font-bold">{dept.value}%</span>
                </div>
                <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                  <div className={`h-full ${dept.color}`} style={{ width: `${dept.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
