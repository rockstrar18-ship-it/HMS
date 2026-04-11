import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login, { LoggedInUser } from './components/Login';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import Doctors from './components/Doctors';
import Appointments from './components/Appointments';
import Billing from './components/Billing';
import StaffManagement from './components/Staff';
import BloodBank from './components/BloodBank';
import Pharmacy from './components/Pharmacy';
import Laboratory from './components/Lab';
import Canteen from './components/Canteen';
import Departments from './components/Departments';
import IPDOPD from './components/IPDOPD';
import Beds from './components/Beds';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Roster from './components/Roster';
import { Patient, Doctor, Appointment, Bill, Staff, BloodDonor, PharmacyItem, LabTest, CanteenItem, Department, Bed } from './types';

// Mock Initial Data
const INITIAL_PATIENTS: Patient[] = [
  { id: 'P001', name: 'John Doe', age: 45, gender: 'Male', bloodGroup: 'O+', phone: '555-0101', address: '123 Pine St, NY', lastVisit: '2026-03-10' },
  { id: 'P002', name: 'Sarah Smith', age: 32, gender: 'Female', bloodGroup: 'A-', phone: '555-0102', address: '456 Oak Ave, LA', lastVisit: '2026-03-12' },
  { id: 'P003', name: 'Michael Brown', age: 28, gender: 'Male', bloodGroup: 'B+', phone: '555-0103', address: '789 Maple Rd, CHI', lastVisit: '2026-02-28' },
];

const INITIAL_DOCTORS: Doctor[] = [
  { id: 'D001', name: 'Dr. Emily Watson', specialty: 'Cardiologist', experience: '12 Years', phone: '555-0201', email: 'emily.w@medicare.com', availability: ['Mon', 'Wed', 'Fri'], image: 'https://picsum.photos/seed/doctor1/200/200' },
  { id: 'D002', name: 'Dr. James Wilson', specialty: 'Neurologist', experience: '15 Years', phone: '555-0202', email: 'james.w@medicare.com', availability: ['Tue', 'Thu'], image: 'https://picsum.photos/seed/doctor2/200/200' },
  { id: 'D003', name: 'Dr. Sofia Garcia', specialty: 'Pediatrician', experience: '8 Years', phone: '555-0203', email: 'sofia.g@medicare.com', availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], image: 'https://picsum.photos/seed/doctor3/200/200' },
];

const INITIAL_STAFF: Staff[] = [
  { id: 'S001', name: 'Alice Johnson', role: 'Head Nurse', department: 'Emergency', phone: '555-0301', email: 'alice.j@medicare.com', shift: 'Morning' },
  { id: 'S002', name: 'Robert Miller', role: 'Receptionist', department: 'Administration', phone: '555-0302', email: 'robert.m@medicare.com', shift: 'Evening' },
];

const INITIAL_DONORS: BloodDonor[] = [
  { id: 'BD001', name: 'Mark Evans', bloodGroup: 'O+', lastDonation: '2026-01-15', phone: '555-0401', status: 'Eligible' },
  { id: 'BD002', name: 'Lucy Heart', bloodGroup: 'AB-', lastDonation: '2026-02-20', phone: '555-0402', status: 'Pending' },
];

const INITIAL_PHARMACY: PharmacyItem[] = [
  { id: 'M001', name: 'Paracetamol', category: 'Analgesic', stock: 150, price: 5.50, expiryDate: '2027-12-01' },
  { id: 'M002', name: 'Amoxicillin', category: 'Antibiotic', stock: 15, price: 12.00, expiryDate: '2026-08-15' },
];

const INITIAL_LAB_TESTS: LabTest[] = [
  { id: 'LT001', patientId: 'P001', testName: 'Blood Sugar', date: '2026-03-14', status: 'Completed', result: '110 mg/dL' },
  { id: 'LT002', patientId: 'P002', testName: 'MRI Brain', date: '2026-03-15', status: 'Pending' },
];

const INITIAL_CANTEEN: CanteenItem[] = [
  { id: 'C001', name: 'Healthy Veggie Bowl', price: 8.50, category: 'Meal', available: true },
  { id: 'C002', name: 'Fresh Orange Juice', price: 3.00, category: 'Drink', available: true },
];

const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'DEP01', name: 'Cardiology', head: 'Dr. Emily Watson', floor: '3rd Floor', contact: 'Ext 101' },
  { id: 'DEP02', name: 'Neurology', head: 'Dr. James Wilson', floor: '4th Floor', contact: 'Ext 102' },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 'A001', patientId: 'P001', doctorId: 'D001', date: '2026-03-15', time: '10:30 AM', status: 'Scheduled', reason: 'Regular Checkup' },
  { id: 'A002', patientId: 'P002', doctorId: 'D002', date: '2026-03-15', time: '02:00 PM', status: 'Scheduled', reason: 'Migraine Follow-up' },
];

const INITIAL_BILLS: Bill[] = [
  { id: 'INV-1001', patientId: 'P001', amount: 150.00, date: '2026-03-10', status: 'Paid', description: 'Consultation Fee' },
];

export default function App() {
  // ── Auth State ──
  // Read saved session from localStorage so user stays logged in across refreshes.
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(() => {
    try {
      const saved = localStorage.getItem('hms_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleLogin = (user: LoggedInUser) => {
    setCurrentUser(user);
    // Navigate to first allowed page after login
    const first = user.allowedPages[0] || 'dashboard';
    setActiveTab(first);
  };

  const handleLogout = () => {
    localStorage.removeItem('hms_user');
    setCurrentUser(null);
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State with LocalStorage persistence
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('patients');
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('doctors');
    return saved ? JSON.parse(saved) : INITIAL_DOCTORS;
  });

  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [donors, setDonors] = useState<BloodDonor[]>(() => {
    const saved = localStorage.getItem('donors');
    return saved ? JSON.parse(saved) : INITIAL_DONORS;
  });

  const [inventory, setInventory] = useState<PharmacyItem[]>(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : INITIAL_PHARMACY;
  });

  const [labTests, setLabTests] = useState<LabTest[]>(() => {
    const saved = localStorage.getItem('labTests');
    return saved ? JSON.parse(saved) : INITIAL_LAB_TESTS;
  });

  const [canteenMenu, setCanteenMenu] = useState<CanteenItem[]>(() => {
    const saved = localStorage.getItem('canteenMenu');
    return saved ? JSON.parse(saved) : INITIAL_CANTEEN;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('departments');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('appointments');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem('bills');
    return saved ? JSON.parse(saved) : INITIAL_BILLS;
  });

  const [beds, setBeds] = useState<Bed[]>(() => {
    const saved = localStorage.getItem('beds');
    if (saved) return JSON.parse(saved);
    
    // Initial Beds
    const initialBeds: Bed[] = [];
    const wards = ['General Ward', 'ICU', 'Pediatrics', 'Maternity'];
    wards.forEach((ward, wIdx) => {
      for (let i = 1; i <= 5; i++) {
        initialBeds.push({
          id: `B-${wIdx + 1}${i}`,
          number: `${wIdx + 1}0${i}`,
          type: ward === 'ICU' ? 'ICU' : 'Standard',
          ward,
          status: 'Available'
        });
      }
    });
    return initialBeds;
  });

  // Persistence Effects
  useEffect(() => localStorage.setItem('patients', JSON.stringify(patients)), [patients]);
  useEffect(() => localStorage.setItem('beds', JSON.stringify(beds)), [beds]);
  useEffect(() => localStorage.setItem('doctors', JSON.stringify(doctors)), [doctors]);
  useEffect(() => localStorage.setItem('staff', JSON.stringify(staff)), [staff]);
  useEffect(() => localStorage.setItem('donors', JSON.stringify(donors)), [donors]);
  useEffect(() => localStorage.setItem('inventory', JSON.stringify(inventory)), [inventory]);
  useEffect(() => localStorage.setItem('labTests', JSON.stringify(labTests)), [labTests]);
  useEffect(() => localStorage.setItem('canteenMenu', JSON.stringify(canteenMenu)), [canteenMenu]);
  useEffect(() => localStorage.setItem('departments', JSON.stringify(departments)), [departments]);
  useEffect(() => localStorage.setItem('appointments', JSON.stringify(appointments)), [appointments]);
  useEffect(() => localStorage.setItem('bills', JSON.stringify(bills)), [bills]);

  // Handlers
  const handleAddPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: `P${String(patients.length + 1).padStart(3, '0')}`,
    };
    setPatients([...patients, newPatient]);
  };

  const handleAdmit = (patientId: string, bedId: string, diagnosis: string) => {
    setPatients(prev => prev.map(p => p.id === patientId ? {
      ...p,
      status: 'Inpatient',
      bedId,
      admittedDate: new Date().toISOString().split('T')[0],
      medicalHistory: p.medicalHistory + (p.medicalHistory ? ', ' : '') + diagnosis
    } : p));
    setBeds(prev => prev.map(b => b.id === bedId ? { ...b, status: 'Occupied', patientId } : b));
  };

  const handleDischarge = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient?.bedId) {
      setBeds(prev => prev.map(b => b.id === patient.bedId ? { ...b, status: 'Available', patientId: undefined } : b));
    }
    setPatients(prev => prev.map(p => p.id === patientId ? {
      ...p,
      status: 'Discharged',
      bedId: undefined,
    } : p));
  };

  const handleAddAppointment = (aptData: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = {
      ...aptData,
      id: `A${String(appointments.length + 1).padStart(3, '0')}`,
    };
    setAppointments([...appointments, newApt]);
  };

  const handleReschedule = (id: string, date: string, time: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, date, time, status: 'Scheduled' } : a));
  };

  const handleCancelAppointment = (id: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a));
  };

  const handleAddDoctor = (doctorData: Omit<Doctor, 'id'>) => {
    const newDoctor: Doctor = {
      ...doctorData,
      id: `D${String(doctors.length + 1).padStart(3, '0')}`,
    };
    setDoctors([...doctors, newDoctor]);
  };

  const handleAddStaff = (staffData: Omit<Staff, 'id'>) => {
    const newStaff: Staff = {
      ...staffData,
      id: `S${String(staff.length + 1).padStart(3, '0')}`,
    };
    setStaff([...staff, newStaff]);
  };

  const handleAddDonor = (donorData: Omit<BloodDonor, 'id'>) => {
    const newDonor: BloodDonor = {
      ...donorData,
      id: `BD${String(donors.length + 1).padStart(3, '0')}`,
    };
    setDonors([...donors, newDonor]);
  };

  const handleAddCanteenItem = (itemData: Omit<CanteenItem, 'id'>) => {
    const newItem: CanteenItem = {
      ...itemData,
      id: `C${String(canteenMenu.length + 1).padStart(3, '0')}`,
    };
    setCanteenMenu([...canteenMenu, newItem]);
  };

  const handleAddDepartment = (deptData: Omit<Department, 'id'>) => {
    const newDept: Department = {
      ...deptData,
      id: `DEP${String(departments.length + 1).padStart(2, '0')}`,
    };
    setDepartments([...departments, newDept]);
  };

  const handleCreateInvoice = (billData: Omit<Bill, 'id'>) => {
    const newBill: Bill = {
      ...billData,
      id: `INV-${1000 + bills.length + 1}`,
    };
    setBills([...bills, newBill]);
  };

  const handleSellMedicine = (id: string, quantity: number) => {
    setInventory(prev => prev.map(item => 
      item.id === id ? { ...item, stock: Math.max(0, item.stock - quantity) } : item
    ));
  };

  const handleRequestTest = (testData: Omit<LabTest, 'id'>) => {
    const newTest: LabTest = {
      ...testData,
      id: `LT${String(labTests.length + 1).padStart(3, '0')}`,
    };
    setLabTests([...labTests, newTest]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard patients={patients} doctors={doctors} appointments={appointments} />;
      case 'patients': return <Patients />;
      case 'doctors': return <Doctors />;
      case 'staff': return <StaffManagement staff={staff} onAddStaff={handleAddStaff} />;
      case 'appointments': return <Appointments 
        appointments={appointments} 
        patients={patients} 
        doctors={doctors} 
        onAddAppointment={handleAddAppointment}
        onReschedule={handleReschedule}
        onCancel={handleCancelAppointment}
      />;
      case 'billing': return <Billing bills={bills} patients={patients} onCreateInvoice={handleCreateInvoice} />;
      case 'ipdopd': return <IPDOPD />;
      case 'beds': return <Beds beds={beds} />;
      case 'reports': return <Reports />;
      case 'pharmacy': return <Pharmacy inventory={inventory} onSell={handleSellMedicine} />;
      case 'bloodbank': return <BloodBank donors={donors} onAddDonor={handleAddDonor} />;
      case 'lab': return <Laboratory tests={labTests} patients={patients} onRequestTest={handleRequestTest} />;
      case 'canteen': return <Canteen menu={canteenMenu} onAddItem={handleAddCanteenItem} />;
      case 'departments': return <Departments departments={departments} onAddDepartment={handleAddDepartment} />;
      case 'roster': return <Roster />;
      case 'settings': return <Settings />;
      default: return <Dashboard patients={patients} doctors={doctors} appointments={appointments} />;
    }
  };

  // Show login page if not authenticated
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
}
