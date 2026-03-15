export type Role = 'admin' | 'doctor' | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string;
  address: string;
  lastVisit?: string;
  medicalHistory?: string;
  status?: 'Outpatient' | 'Inpatient' | 'Discharged';
  admittedDate?: string;
  bedId?: string;
}

export interface Bed {
  id: string;
  number: string;
  type: 'General' | 'Semi-Private' | 'Private' | 'ICU' | 'Standard';
  ward: string;
  status: 'Available' | 'Occupied' | 'Maintenance';
  patientId?: string;
}

export interface IPDRecord {
  id: string;
  patientId: string;
  bedId: string;
  admissionDate: string;
  diagnosis: string;
  status: 'Admitted' | 'Discharged';
}

export interface Bill {
  id: string;
  patientId: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending';
  description?: string;
  items?: {
    description: string;
    amount: number;
  }[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  phone: string;
  email: string;
  availability: string[]; // Days of week
  image: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  reason: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  shift: 'Morning' | 'Evening' | 'Night';
}

export interface BloodDonor {
  id: string;
  name: string;
  bloodGroup: string;
  lastDonation: string;
  phone: string;
  status: 'Eligible' | 'Pending' | 'Ineligible';
}

export interface PharmacyItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  expiryDate: string;
}

export interface LabTest {
  id: string;
  patientId: string;
  testName: string;
  date: string;
  status: 'Pending' | 'Completed';
  result?: string;
}

export interface CanteenItem {
  id: string;
  name: string;
  price: number;
  category: 'Meal' | 'Snack' | 'Drink';
  available: boolean;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  floor: string;
  contact: string;
}
