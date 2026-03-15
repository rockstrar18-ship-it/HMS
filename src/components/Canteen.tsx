import React, { useState } from 'react';
import { Search, Plus, Utensils, Coffee, Pizza, CheckCircle2 } from 'lucide-react';
import { CanteenItem } from '../types';

interface CanteenProps {
  menu: CanteenItem[];
  onAddItem: (item: Omit<CanteenItem, 'id'>) => void;
}

export default function Canteen({ menu, onAddItem }: CanteenProps) {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Meal' | 'Snack' | 'Drink'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Meal' as const,
    price: 0,
    available: true,
  });

  const filteredMenu = menu.filter(item => 
    activeCategory === 'All' || item.category === activeCategory
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddItem(newItem);
    setIsModalOpen(false);
    setNewItem({
      name: '',
      category: 'Meal',
      price: 0,
      available: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Canteen</h1>
          <p className="text-slate-500 mt-1">Manage food menu and patient dietary orders.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Menu Item</span>
        </button>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['All', 'Meal', 'Snack', 'Drink'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              activeCategory === cat 
                ? 'bg-emerald-600 text-white' 
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenu.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                {item.category === 'Meal' ? <Pizza size={24} /> : item.category === 'Drink' ? <Coffee size={24} /> : <Utensils size={24} />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{item.name}</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{item.category}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-600">${item.price.toFixed(2)}</div>
              <div className={`text-[10px] font-bold uppercase ${item.available ? 'text-emerald-500' : 'text-red-500'}`}>
                {item.available ? 'Available' : 'Out of Stock'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Menu Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add New Menu Item</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Item Name</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value as any})}
                  >
                    <option value="Meal">Meal</option>
                    <option value="Snack">Snack</option>
                    <option value="Drink">Drink</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Price ($)</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newItem.price}
                    onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="available"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={newItem.available}
                  onChange={e => setNewItem({...newItem, available: e.target.checked})}
                />
                <label htmlFor="available" className="text-sm font-medium text-slate-700">Available for Order</label>
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors mt-2"
              >
                Add Item
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
