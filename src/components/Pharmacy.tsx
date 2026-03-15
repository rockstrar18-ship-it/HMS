import React, { useState } from 'react';
import { Search, Plus, Pill, AlertTriangle, Package, DollarSign } from 'lucide-react';
import { PharmacyItem } from '../types';

interface PharmacyProps {
  inventory: PharmacyItem[];
  onSell: (id: string, quantity: number) => void;
}

export default function Pharmacy({ inventory, onSell }: PharmacyProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Management</h1>
          <p className="text-slate-500 mt-1">Monitor medicine inventory and sales.</p>
        </div>
        <button className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors">
          <Plus size={20} />
          <span>Add New Stock</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Package size={24} /></div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Total Items</div>
            <div className="text-2xl font-bold text-slate-900">{inventory.length}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="bg-red-50 p-3 rounded-xl text-red-600"><AlertTriangle size={24} /></div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Low Stock</div>
            <div className="text-2xl font-bold text-slate-900">12</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><DollarSign size={24} /></div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Daily Sales</div>
            <div className="text-2xl font-bold text-slate-900">$1,240</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search medicines..."
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
                <th className="px-6 py-4 font-medium">Medicine Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Expiry</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.category}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.stock} Units</td>
                  <td className="px-6 py-4 text-sm text-slate-600">${item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className={new Date(item.expiryDate) < new Date() ? 'text-red-600 font-bold' : ''}>
                      {item.expiryDate}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.stock > 20 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {item.stock > 20 ? 'In Stock' : 'Low Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-emerald-600 text-sm font-bold hover:underline">
                      Sell
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
