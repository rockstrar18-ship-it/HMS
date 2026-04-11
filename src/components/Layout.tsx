import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserRound, 
  Calendar, 
  CreditCard, 
  LogOut,
  Hospital,
  Menu,
  X,
  Briefcase,
  Droplets,
  Pill,
  FlaskConical,
  Utensils,
  Layers,
  Bed,
  Stethoscope,
  BarChart3,
  ShieldCheck,
  Settings,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LoggedInUser } from './Login';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: LoggedInUser;
  onLogout: () => void;
}

const ALL_MENU_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'patients',    label: 'Patients',         icon: Users },
  { id: 'doctors',     label: 'Doctors',          icon: UserRound },
  { id: 'ipdopd',      label: 'OPD / IPD',        icon: Stethoscope },
  { id: 'beds',        label: 'Wards & Beds',     icon: Bed },
  { id: 'appointments',label: 'Appointments',     icon: Calendar },
  { id: 'billing',     label: 'Billing',          icon: CreditCard },
  { id: 'pharmacy',    label: 'Pharmacy',         icon: Pill },
  { id: 'bloodbank',   label: 'Blood Bank',       icon: Droplets },
  { id: 'lab',         label: 'Laboratory',       icon: FlaskConical },
  { id: 'staff',       label: 'Staff',            icon: Briefcase },
  { id: 'roster',      label: 'Duty Roster',      icon: ClipboardList },
  { id: 'canteen',     label: 'Canteen',          icon: Utensils },
  { id: 'departments', label: 'Departments',      icon: Layers },
  { id: 'reports',     label: 'Analytics',        icon: BarChart3 },
  { id: 'settings',    label: 'Settings',          icon: Settings },
];

export default function Layout({ children, activeTab, setActiveTab, user, onLogout }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Filter menu items to only those the user has access to
  const menuItems = ALL_MENU_ITEMS.filter(item =>
    user.allowedPages.includes(item.id)
  );

  const NavButton = ({ item, onClick }: { item: typeof ALL_MENU_ITEMS[0]; onClick?: () => void }) => (
    <button
      key={item.id}
      onClick={() => { setActiveTab(item.id); onClick?.(); }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        activeTab === item.id
          ? 'bg-emerald-50 text-emerald-600 font-bold shadow-sm shadow-emerald-100'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <item.icon size={20} className={activeTab === item.id ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'} />
      <span className="text-sm">{item.label}</span>
      {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600" />}
    </button>
  );

  const UserCard = () => (
    <div className="px-4 py-3 bg-slate-50 rounded-xl mb-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {user.userName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{user.userName}</p>
          <div className="flex items-center gap-1">
            <ShieldCheck size={11} className="text-emerald-500 shrink-0" />
            <p className="text-xs text-slate-500 capitalize truncate">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-full">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-50">
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <Hospital size={24} />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">MediCare</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {menuItems.map(item => (
            <div key={item.id}><NavButton item={item} /></div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <UserCard />
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg text-white">
            <Hospital size={20} />
          </div>
          <span className="text-lg font-bold text-slate-900">MediCare</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 p-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-center space-x-3 mb-6 px-2">
                <div className="bg-emerald-600 p-2 rounded-lg text-white"><Hospital size={24} /></div>
                <span className="text-xl font-bold text-slate-900">MediCare</span>
              </div>
              <UserCard />
              <nav className="space-y-1 flex-1 overflow-y-auto mt-2">
                {menuItems.map(item => (
                  <div key={item.id}>
                    <NavButton item={item} onClick={() => setIsMobileMenuOpen(false)} />
                  </div>
                ))}
              </nav>
              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
