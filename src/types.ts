export type UserRole = 'super_admin' | 'hospital' | 'blood_bank' | 'donor';

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface HospitalResources {
  bedCount: number;
  totalDoctors: number;
  icuCount: number;
  roomCount: number;
  opdAvailable: boolean;
}

export interface HospitalProfile {
  id: string;
  name: string;
  location: Location;
  hospitalType: 'Government' | 'Private' | 'Trust' | 'Military';
  emergencyContact: string;
  hospitalIdType: string;
  hospitalIdNumber: string;
  resources: HospitalResources;
}

export interface BloodBankProfile {
  id: string;
  name: string;
  location: Location;
  bankType: 'Red Cross' | 'Government' | 'Private' | 'Charity';
  emergencyContact: string;
  eRaktkoshId: string;
}

export interface MedicalHistory {
  cancer: boolean;
  viralDisease: boolean;
  asthma: boolean;
  activeInfection: boolean;
  hiv: boolean;
  hepatitisB: boolean;
  hepatitisC: boolean;
  tuberculosis: boolean;
  leprosy: boolean;
}

export interface DonorProfile {
  id: string;
  name: string;
  phone: string;
  bloodGroup: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  location: Location;
  medicalHistory: MedicalHistory;
  lastDonationDate?: string;
  points: number;
  donorId: string; // e.g. AB-10293
}

export interface BloodUnit {
  id: string;
  bloodGroup: string;
  componentType: 'Whole Blood' | 'Packed Red Cells' | 'Platelets' | 'Fresh Frozen Plasma';
  units: number; // in bags/units
  collectionDate: string;
  expiryDate: string;
  status: 'Available' | 'Reserved' | 'Used' | 'Expired';
  bloodBankId: string;
  bloodBankName: string;
}

export interface SOSAlert {
  id: string;
  patientName: string;
  bloodGroup: string;
  componentType: 'Whole Blood' | 'Packed Red Cells' | 'Platelets' | 'Fresh Frozen Plasma';
  unitsRequired: number;
  priority: 'Critical' | 'High' | 'Medium';
  hospitalId: string;
  hospitalName: string;
  location: Location;
  remarks: string;
  createdAt: string;
  status: 'Active' | 'Fulfilled' | 'Cancelled';
}

export interface DonationCamp {
  id: string;
  name: string;
  organizer: string;
  location: Location;
  date: string;
  time: string;
  contact: string;
  status: 'Upcoming' | 'Active' | 'Completed';
}

export interface SyncMessage {
  id: string;
  timestamp: string;
  senderRole: UserRole;
  senderName: string;
  messageType: 'SOS_CREATED' | 'SOS_FULFILLED' | 'INVENTORY_UPDATED' | 'CAMP_ADDED' | 'DONOR_REGISTERED';
  payload: any;
}
