import { create } from 'zustand';
import { 
  UserRole, 
  HospitalProfile, 
  BloodBankProfile, 
  DonorProfile, 
  BloodUnit, 
  SOSAlert, 
  DonationCamp, 
  SyncMessage,
  Location
} from '../types';

interface AeroBloodStore {
  // Authentication & Session
  currentRole: UserRole;
  currentHospitalId: string;
  currentBloodBankId: string;
  currentDonorId: string;
  
  // Data State
  hospitals: HospitalProfile[];
  bloodBanks: BloodBankProfile[];
  donors: DonorProfile[];
  bloodUnits: BloodUnit[];
  sosAlerts: SOSAlert[];
  donationCamps: DonationCamp[];
  syncMessages: SyncMessage[];
  
  // Actions
  setRole: (role: UserRole) => void;
  setCurrentHospital: (id: string) => void;
  setCurrentBloodBank: (id: string) => void;
  setCurrentDonor: (id: string) => void;
  
  // SOS Actions
  createSOS: (sos: Omit<SOSAlert, 'id' | 'createdAt' | 'status'>) => void;
  resolveSOS: (id: string) => void;
  cancelSOS: (id: string) => void;
  
  // Inventory Actions
  addBloodUnit: (unit: Omit<BloodUnit, 'id'>) => void;
  updateBloodUnitStatus: (id: string, status: BloodUnit['status']) => void;
  removeBloodUnit: (id: string) => void;
  
  // Donor Actions
  registerDonor: (donor: Omit<DonorProfile, 'id' | 'points' | 'donorId'>, customId?: string) => void;
  donateBlood: (donorId: string, locationName: string) => void;
  registerHospital: (hospital: Omit<HospitalProfile, 'id'>, customId?: string) => void;
  registerBloodBank: (bloodBank: Omit<BloodBankProfile, 'id'>, customId?: string) => void;
  
  // Camp Actions
  addDonationCamp: (camp: Omit<DonationCamp, 'id'>) => void;
  
  // Clear Messages
  clearSyncMessages: () => void;
}

// Helper to generate IDs
const genId = () => Math.random().toString(36).substring(2, 9).toUpperCase();

// Helper to get relative dates
const getRelativeDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

// INITIAL SEED DATA
const initialHospitals: HospitalProfile[] = [
  {
    id: 'HOSP-1',
    name: 'Metro General Hospital',
    location: { address: '742 Evergreen Terrace, Springfield, IL', lat: 39.7817, lng: -89.6501 },
    hospitalType: 'Government',
    emergencyContact: '+1 (555) 901-2345',
    hospitalIdType: 'National Health ID',
    hospitalIdNumber: 'NH-981273-A',
    resources: { bedCount: 450, totalDoctors: 120, icuCount: 48, roomCount: 310, opdAvailable: true }
  },
  {
    id: 'HOSP-2',
    name: 'St. Jude Cardiac Centre',
    location: { address: '1200 Medical Plaza, Chicago, IL', lat: 41.8781, lng: -87.6298 },
    hospitalType: 'Private',
    emergencyContact: '+1 (555) 304-9800',
    hospitalIdType: 'State Registration Code',
    hospitalIdNumber: 'SRC-45129-IL',
    resources: { bedCount: 180, totalDoctors: 65, icuCount: 30, roomCount: 110, opdAvailable: false }
  },
  {
    id: 'HOSP-3',
    name: 'Memorial Childrens Hospital',
    location: { address: '302 University Ave, Madison, WI', lat: 43.0731, lng: -89.4012 },
    hospitalType: 'Trust',
    emergencyContact: '+1 (555) 777-1234',
    hospitalIdType: 'Non-Profit Health Registry',
    hospitalIdNumber: 'NP-776100-W',
    resources: { bedCount: 220, totalDoctors: 88, icuCount: 22, roomCount: 160, opdAvailable: true }
  },
  {
    id: 'HOSP-4',
    name: 'Veterans Medical Hub',
    location: { address: '500 Patriot Way, St. Louis, MO', lat: 38.6270, lng: -90.1994 },
    hospitalType: 'Military',
    emergencyContact: '+1 (555) 444-5678',
    hospitalIdType: 'Federal Military Code',
    hospitalIdNumber: 'MIL-8891-MO',
    resources: { bedCount: 350, totalDoctors: 94, icuCount: 40, roomCount: 240, opdAvailable: true }
  }
];

const initialBloodBanks: BloodBankProfile[] = [
  {
    id: 'BANK-1',
    name: 'Central Metro Blood Bank',
    location: { address: '444 Red Cross Blvd, Chicago, IL', lat: 41.8902, lng: -87.6320 },
    bankType: 'Red Cross',
    emergencyContact: '+1 (555) 111-2222',
    eRaktkoshId: 'ER-IL-CH-8821'
  },
  {
    id: 'BANK-2',
    name: 'Springfield Community Blood Centre',
    location: { address: '12 Donor Way, Springfield, IL', lat: 39.7990, lng: -89.6430 },
    bankType: 'Government',
    emergencyContact: '+1 (555) 333-4444',
    eRaktkoshId: 'ER-IL-SP-9112'
  },
  {
    id: 'BANK-3',
    name: 'Apex Biotech Blood Bank',
    location: { address: '88 Tech Court, Madison, WI', lat: 43.0850, lng: -89.3820 },
    bankType: 'Private',
    emergencyContact: '+1 (555) 555-6666',
    eRaktkoshId: 'ER-WI-MA-0451'
  }
];

const initialDonors: DonorProfile[] = [
  {
    id: 'DONOR-1',
    name: 'Marcus Vance',
    phone: '+1 (555) 101-1122',
    bloodGroup: 'O-',
    age: 28,
    gender: 'Male',
    location: { address: '102 Lincoln Ave, Springfield, IL', lat: 39.7920, lng: -89.6580 },
    medicalHistory: { cancer: false, viralDisease: false, asthma: false, activeInfection: false, hiv: false, hepatitisB: false, hepatitisC: false, tuberculosis: false, leprosy: false },
    lastDonationDate: getRelativeDate(-95),
    points: 450,
    donorId: 'AB-2901-M'
  },
  {
    id: 'DONOR-2',
    name: 'Elena Rostova',
    phone: '+1 (555) 202-2233',
    bloodGroup: 'A+',
    age: 31,
    gender: 'Female',
    location: { address: '505 Wacker Dr, Chicago, IL', lat: 41.8885, lng: -87.6355 },
    medicalHistory: { cancer: false, viralDisease: false, asthma: true, activeInfection: false, hiv: false, hepatitisB: false, hepatitisC: false, tuberculosis: false, leprosy: false },
    lastDonationDate: getRelativeDate(-45),
    points: 210,
    donorId: 'AB-4452-E'
  },
  {
    id: 'DONOR-3',
    name: 'Kofi Mensah',
    phone: '+1 (555) 303-3344',
    bloodGroup: 'B+',
    age: 42,
    gender: 'Male',
    location: { address: '109 University Crescent, Madison, WI', lat: 43.0760, lng: -89.4120 },
    medicalHistory: { cancer: false, viralDisease: false, asthma: false, activeInfection: false, hiv: false, hepatitisB: false, hepatitisC: false, tuberculosis: false, leprosy: false },
    lastDonationDate: undefined,
    points: 50,
    donorId: 'AB-9012-K'
  },
  {
    id: 'DONOR-4',
    name: 'Claire Moreau',
    phone: '+1 (555) 404-4455',
    bloodGroup: 'AB-',
    age: 25,
    gender: 'Female',
    location: { address: '320 Grand Avenue, St. Louis, MO', lat: 38.6320, lng: -90.2220 },
    medicalHistory: { cancer: false, viralDisease: false, asthma: false, activeInfection: false, hiv: false, hepatitisB: false, hepatitisC: false, tuberculosis: false, leprosy: false },
    lastDonationDate: getRelativeDate(-120),
    points: 320,
    donorId: 'AB-5561-C'
  },
  {
    id: 'DONOR-5',
    name: 'Jackson Brooks',
    phone: '+1 (555) 505-5566',
    bloodGroup: 'O+',
    age: 35,
    gender: 'Male',
    location: { address: '48 Oak Ridge Rd, Madison, WI', lat: 43.0520, lng: -89.3410 },
    medicalHistory: { cancer: false, viralDisease: false, asthma: false, activeInfection: false, hiv: false, hepatitisB: false, hepatitisC: false, tuberculosis: false, leprosy: false },
    lastDonationDate: getRelativeDate(-10),
    points: 950,
    donorId: 'AB-1082-J'
  }
];

const initialBloodUnits: BloodUnit[] = [
  // BANK-1 (Central Metro Blood Bank, Chicago)
  { id: 'UNIT-1', bloodGroup: 'O-', componentType: 'Packed Red Cells', units: 3, collectionDate: getRelativeDate(-20), expiryDate: getRelativeDate(15), status: 'Available', bloodBankId: 'BANK-1', bloodBankName: 'Central Metro Blood Bank' },
  { id: 'UNIT-2', bloodGroup: 'O-', componentType: 'Whole Blood', units: 2, collectionDate: getRelativeDate(-32), expiryDate: getRelativeDate(3), status: 'Available', bloodBankId: 'BANK-1', bloodBankName: 'Central Metro Blood Bank' }, // Close to expiry (3 days remaining - Yellow/Orange)
  { id: 'UNIT-3', bloodGroup: 'AB-', componentType: 'Platelets', units: 5, collectionDate: getRelativeDate(-4), expiryDate: getRelativeDate(1), status: 'Available', bloodBankId: 'BANK-1', bloodBankName: 'Central Metro Blood Bank' },  // Close to expiry (1 day remaining - Red)
  { id: 'UNIT-4', bloodGroup: 'A+', componentType: 'Fresh Frozen Plasma', units: 8, collectionDate: getRelativeDate(-10), expiryDate: getRelativeDate(350), status: 'Available', bloodBankId: 'BANK-1', bloodBankName: 'Central Metro Blood Bank' },
  { id: 'UNIT-5', bloodGroup: 'A+', componentType: 'Packed Red Cells', units: 12, collectionDate: getRelativeDate(-12), expiryDate: getRelativeDate(23), status: 'Available', bloodBankId: 'BANK-1', bloodBankName: 'Central Metro Blood Bank' },
  
  // BANK-2 (Springfield Community Blood Centre)
  { id: 'UNIT-6', bloodGroup: 'O+', componentType: 'Whole Blood', units: 15, collectionDate: getRelativeDate(-5), expiryDate: getRelativeDate(30), status: 'Available', bloodBankId: 'BANK-2', bloodBankName: 'Springfield Community Blood Centre' },
  { id: 'UNIT-7', bloodGroup: 'B+', componentType: 'Packed Red Cells', units: 7, collectionDate: getRelativeDate(-25), expiryDate: getRelativeDate(10), status: 'Available', bloodBankId: 'BANK-2', bloodBankName: 'Springfield Community Blood Centre' },
  { id: 'UNIT-8', bloodGroup: 'B+', componentType: 'Platelets', units: 4, collectionDate: getRelativeDate(-3), expiryDate: getRelativeDate(2), status: 'Available', bloodBankId: 'BANK-2', bloodBankName: 'Springfield Community Blood Centre' }, // 2 days remaining (Yellow)
  { id: 'UNIT-9', bloodGroup: 'O-', componentType: 'Packed Red Cells', units: 1, collectionDate: getRelativeDate(-41), expiryDate: getRelativeDate(-6), status: 'Expired', bloodBankId: 'BANK-2', bloodBankName: 'Springfield Community Blood Centre' }, // Expired
  
  // BANK-3 (Apex Biotech Blood Bank, Madison)
  { id: 'UNIT-10', bloodGroup: 'AB+', componentType: 'Packed Red Cells', units: 10, collectionDate: getRelativeDate(-15), expiryDate: getRelativeDate(20), status: 'Available', bloodBankId: 'BANK-3', bloodBankName: 'Apex Biotech Blood Bank' },
  { id: 'UNIT-11', bloodGroup: 'O-', componentType: 'Fresh Frozen Plasma', units: 6, collectionDate: getRelativeDate(-18), expiryDate: getRelativeDate(342), status: 'Available', bloodBankId: 'BANK-3', bloodBankName: 'Apex Biotech Blood Bank' },
  { id: 'UNIT-12', bloodGroup: 'B-', componentType: 'Whole Blood', units: 3, collectionDate: getRelativeDate(-28), expiryDate: getRelativeDate(7), status: 'Available', bloodBankId: 'BANK-3', bloodBankName: 'Apex Biotech Blood Bank' }, // 7 days remaining (Yellow/Green)
  { id: 'UNIT-13', bloodGroup: 'A-', componentType: 'Packed Red Cells', units: 4, collectionDate: getRelativeDate(-22), expiryDate: getRelativeDate(13), status: 'Reserved', bloodBankId: 'BANK-3', bloodBankName: 'Apex Biotech Blood Bank' }
];

const initialSOSAlerts: SOSAlert[] = [
  {
    id: 'SOS-901',
    patientName: 'Robert Vance',
    bloodGroup: 'O-',
    componentType: 'Packed Red Cells',
    unitsRequired: 6,
    priority: 'Critical',
    hospitalId: 'HOSP-1',
    hospitalName: 'Metro General Hospital',
    location: { address: '742 Evergreen Terrace, Springfield, IL', lat: 39.7817, lng: -89.6501 },
    remarks: 'Severe arterial bleed from trauma. Patient in critical state.',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
    status: 'Active'
  },
  {
    id: 'SOS-902',
    patientName: 'Jane Dough',
    bloodGroup: 'AB-',
    componentType: 'Platelets',
    unitsRequired: 3,
    priority: 'High',
    hospitalId: 'HOSP-2',
    hospitalName: 'St. Jude Cardiac Centre',
    location: { address: '1200 Medical Plaza, Chicago, IL', lat: 41.8781, lng: -87.6298 },
    remarks: 'Open-heart bypass procedure. Immediate platelets deficit.',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(), // 10 mins ago
    status: 'Active'
  },
  {
    id: 'SOS-903',
    patientName: 'Baby Boy Austin',
    bloodGroup: 'O-',
    componentType: 'Whole Blood',
    unitsRequired: 2,
    priority: 'Critical',
    hospitalId: 'HOSP-3',
    hospitalName: 'Memorial Childrens Hospital',
    location: { address: '302 University Ave, Madison, WI', lat: 43.0731, lng: -89.4012 },
    remarks: 'Neonatal transfusion required for hemolytic disease.',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    status: 'Fulfilled'
  }
];

const initialCamps: DonationCamp[] = [
  {
    id: 'CAMP-101',
    name: 'Summer Lifesavers Camp Chicago',
    organizer: 'Central Metro Blood Bank & Red Cross',
    location: { address: 'Millennium Park Plaza, Chicago, IL', lat: 41.8827, lng: -87.6227 },
    date: getRelativeDate(2),
    time: '09:00 AM - 05:00 PM',
    contact: '+1 (555) 111-2222',
    status: 'Active'
  },
  {
    id: 'CAMP-102',
    name: 'State University Drive',
    organizer: 'Madison Student Health Club',
    location: { address: 'Bascom Hall, University of Wisconsin, Madison', lat: 43.0753, lng: -89.4042 },
    date: getRelativeDate(5),
    time: '10:00 AM - 04:00 PM',
    contact: '+1 (555) 555-6666',
    status: 'Upcoming'
  },
  {
    id: 'CAMP-103',
    name: 'Springfield Biotech Donation Fair',
    organizer: 'Springfield Community Blood Centre',
    location: { address: 'Convention Hall, Springfield, IL', lat: 39.7990, lng: -89.6430 },
    date: getRelativeDate(-3),
    time: '08:00 AM - 02:00 PM',
    contact: '+1 (555) 333-4444',
    status: 'Completed'
  }
];

export const useAeroBloodStore = create<AeroBloodStore>((set, get) => ({
  // Defaults
  currentRole: 'hospital',
  currentHospitalId: 'HOSP-1',
  currentBloodBankId: 'BANK-1',
  currentDonorId: 'DONOR-1',

  hospitals: initialHospitals,
  bloodBanks: initialBloodBanks,
  donors: initialDonors,
  bloodUnits: initialBloodUnits,
  sosAlerts: initialSOSAlerts,
  donationCamps: initialCamps,
  syncMessages: [
    {
      id: 'INIT-LOG',
      timestamp: new Date().toISOString(),
      senderRole: 'super_admin',
      senderName: 'System',
      messageType: 'CAMP_ADDED',
      payload: { message: 'AeroBlood National Intelligence System Initialized' }
    }
  ],

  setRole: (role) => set({ currentRole: role }),
  setCurrentHospital: (id) => set({ currentHospitalId: id }),
  setCurrentBloodBank: (id) => set({ currentBloodBankId: id }),
  setCurrentDonor: (id) => set({ currentDonorId: id }),

  // SOS SYSTEM
  createSOS: (sos) => {
    const newSOS: SOSAlert = {
      ...sos,
      id: 'SOS-' + genId(),
      createdAt: new Date().toISOString(),
      status: 'Active'
    };

    const log: SyncMessage = {
      id: 'SYNC-' + genId(),
      timestamp: new Date().toISOString(),
      senderRole: 'hospital',
      senderName: sos.hospitalName,
      messageType: 'SOS_CREATED',
      payload: newSOS
    };

    set((state) => ({
      sosAlerts: [newSOS, ...state.sosAlerts],
      syncMessages: [log, ...state.syncMessages]
    }));
  },

  resolveSOS: (id) => {
    const sos = get().sosAlerts.find(s => s.id === id);
    if (!sos) return;

    const log: SyncMessage = {
      id: 'SYNC-' + genId(),
      timestamp: new Date().toISOString(),
      senderRole: 'hospital',
      senderName: sos.hospitalName,
      messageType: 'SOS_FULFILLED',
      payload: { ...sos, status: 'Fulfilled' }
    };

    set((state) => ({
      sosAlerts: state.sosAlerts.map(s => s.id === id ? { ...s, status: 'Fulfilled' as const } : s),
      syncMessages: [log, ...state.syncMessages]
    }));
  },

  cancelSOS: (id) => {
    const sos = get().sosAlerts.find(s => s.id === id);
    if (!sos) return;

    set((state) => ({
      sosAlerts: state.sosAlerts.map(s => s.id === id ? { ...s, status: 'Cancelled' as const } : s)
    }));
  },

  // INVENTORY MODULE
  addBloodUnit: (unit) => {
    const newUnit: BloodUnit = {
      ...unit,
      id: 'UNIT-' + genId()
    };

    const log: SyncMessage = {
      id: 'SYNC-' + genId(),
      timestamp: new Date().toISOString(),
      senderRole: 'blood_bank',
      senderName: unit.bloodBankName,
      messageType: 'INVENTORY_UPDATED',
      payload: newUnit
    };

    set((state) => ({
      bloodUnits: [newUnit, ...state.bloodUnits],
      syncMessages: [log, ...state.syncMessages]
    }));
  },

  updateBloodUnitStatus: (id, status) => {
    const unit = get().bloodUnits.find(u => u.id === id);
    if (!unit) return;

    const updatedUnit = { ...unit, status };

    const log: SyncMessage = {
      id: 'SYNC-' + genId(),
      timestamp: new Date().toISOString(),
      senderRole: 'blood_bank',
      senderName: unit.bloodBankName,
      messageType: 'INVENTORY_UPDATED',
      payload: updatedUnit
    };

    set((state) => ({
      bloodUnits: state.bloodUnits.map(u => u.id === id ? updatedUnit : u),
      syncMessages: [log, ...state.syncMessages]
    }));
  },

  removeBloodUnit: (id) => {
    const unit = get().bloodUnits.find(u => u.id === id);
    if (!unit) return;

    set((state) => ({
      bloodUnits: state.bloodUnits.filter(u => u.id !== id)
    }));
  },

  // DONOR ACTIONS
  registerDonor: (donor, customId) => {
    const newDonor: DonorProfile = {
      ...donor,
      id: customId || ('DONOR-' + genId()),
      points: 100, // starting points
      donorId: 'AB-' + Math.floor(1000 + Math.random() * 9000) + '-' + donor.name.charAt(0).toUpperCase()
    };

    const log: SyncMessage = {
      id: 'SYNC-' + genId(),
      timestamp: new Date().toISOString(),
      senderRole: 'donor',
      senderName: donor.name,
      messageType: 'DONOR_REGISTERED',
      payload: newDonor
    };

    set((state) => ({
      donors: [newDonor, ...state.donors],
      syncMessages: [log, ...state.syncMessages],
      currentDonorId: newDonor.id,
      currentRole: 'donor'
    }));
  },

  registerHospital: (hospital, customId) => {
    const newHospital: HospitalProfile = {
      ...hospital,
      id: customId || ('HOSP-' + genId())
    };
    set((state) => ({
      hospitals: [newHospital, ...state.hospitals],
      currentHospitalId: newHospital.id,
      currentRole: 'hospital'
    }));
  },

  registerBloodBank: (bloodBank, customId) => {
    const newBloodBank: BloodBankProfile = {
      ...bloodBank,
      id: customId || ('BANK-' + genId())
    };
    set((state) => ({
      bloodBanks: [newBloodBank, ...state.bloodBanks],
      currentBloodBankId: newBloodBank.id,
      currentRole: 'blood_bank'
    }));
  },

  donateBlood: (donorId, locationName) => {
    const donor = get().donors.find(d => d.id === donorId);
    if (!donor) return;

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Create blood unit at St. Jude Hospital/Blood Bank or generic
    const randomBank = get().bloodBanks[Math.floor(Math.random() * get().bloodBanks.length)] || { id: 'BANK-1', name: 'Central Metro Blood Bank' };
    
    const expiryDate = new Date();
    // 42 days shelf life for packed red cells typically, 35 for whole blood
    expiryDate.setDate(expiryDate.getDate() + 42); 

    const newUnit: BloodUnit = {
      id: 'UNIT-' + genId(),
      bloodGroup: donor.bloodGroup,
      componentType: 'Packed Red Cells',
      units: 1,
      collectionDate: todayStr,
      expiryDate: expiryDate.toISOString().split('T')[0],
      status: 'Available',
      bloodBankId: randomBank.id,
      bloodBankName: randomBank.name
    };

    const log: SyncMessage = {
      id: 'SYNC-' + genId(),
      timestamp: new Date().toISOString(),
      senderRole: 'donor',
      senderName: donor.name,
      messageType: 'INVENTORY_UPDATED',
      payload: newUnit
    };

    set((state) => ({
      donors: state.donors.map(d => d.id === donorId ? { 
        ...d, 
        lastDonationDate: todayStr, 
        points: d.points + 150 
      } : d),
      bloodUnits: [newUnit, ...state.bloodUnits],
      syncMessages: [log, ...state.syncMessages]
    }));
  },

  // CAMP ACTIONS
  addDonationCamp: (camp) => {
    const newCamp: DonationCamp = {
      ...camp,
      id: 'CAMP-' + genId()
    };

    const log: SyncMessage = {
      id: 'SYNC-' + genId(),
      timestamp: new Date().toISOString(),
      senderRole: 'super_admin',
      senderName: 'National Admin',
      messageType: 'CAMP_ADDED',
      payload: newCamp
    };

    set((state) => ({
      donationCamps: [newCamp, ...state.donationCamps],
      syncMessages: [log, ...state.syncMessages]
    }));
  },

  clearSyncMessages: () => set({ syncMessages: [] })
}));

// Multi-Tab & Cross-Device Simulator Real-time Synchronizer
if (typeof window !== 'undefined') {
  const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('aeroblood-realtime-sync') : null;
  
  let isUpdatingFromSync = false;
  let lastSyncedPayloadStr = '';

  const getPayload = (state: any) => ({
    hospitals: state.hospitals,
    bloodBanks: state.bloodBanks,
    donors: state.donors,
    bloodUnits: state.bloodUnits,
    sosAlerts: state.sosAlerts,
    donationCamps: state.donationCamps,
    syncMessages: state.syncMessages,
  });

  // Listen to store changes, broadcast them, and upload to backend
  useAeroBloodStore.subscribe((state) => {
    if (isUpdatingFromSync) return;

    const payload = getPayload(state);
    const payloadStr = JSON.stringify(payload);
    
    if (payloadStr === lastSyncedPayloadStr) return;
    lastSyncedPayloadStr = payloadStr;

    // 1. Broadcast locally (for instant cross-tab sync in same browser)
    if (syncChannel) {
      try {
        syncChannel.postMessage(payload);
      } catch (err) {
        console.warn('Local broadcast failed:', err);
      }
    }

    // 2. Upload to server (for actual cross-device sync)
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payloadStr
    }).catch((err) => {
      console.warn('Failed to upload state to server:', err);
    });
  });

  // Receive live updates from other tabs (same-browser instant sync)
  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      const payload = event.data;
      if (payload && typeof payload === 'object') {
        const payloadStr = JSON.stringify(payload);
        if (payloadStr === lastSyncedPayloadStr) return;
        lastSyncedPayloadStr = payloadStr;

        isUpdatingFromSync = true;
        try {
          useAeroBloodStore.setState({
            hospitals: payload.hospitals || useAeroBloodStore.getState().hospitals,
            bloodBanks: payload.bloodBanks || useAeroBloodStore.getState().bloodBanks,
            donors: payload.donors || useAeroBloodStore.getState().donors,
            bloodUnits: payload.bloodUnits || useAeroBloodStore.getState().bloodUnits,
            sosAlerts: payload.sosAlerts || useAeroBloodStore.getState().sosAlerts,
            donationCamps: payload.donationCamps || useAeroBloodStore.getState().donationCamps,
            syncMessages: payload.syncMessages || useAeroBloodStore.getState().syncMessages,
          });
        } catch (err) {
          console.error('Error applying BroadcastChannel state:', err);
        } finally {
          isUpdatingFromSync = false;
        }
      }
    };
  }

  // Server-Side Cross-Device Polling & Initialization Engine
  const initAndPollServer = async () => {
    try {
      // Fetch current state from server
      const res = await fetch('/api/sync');
      const serverState = await res.json();

      if (serverState && typeof serverState === 'object' && Object.keys(serverState).length > 0) {
        // Server already has an initialized state! Let's load it
        const payloadStr = JSON.stringify(serverState);
        if (payloadStr !== lastSyncedPayloadStr) {
          lastSyncedPayloadStr = payloadStr;
          isUpdatingFromSync = true;
          useAeroBloodStore.setState({
            hospitals: serverState.hospitals || useAeroBloodStore.getState().hospitals,
            bloodBanks: serverState.bloodBanks || useAeroBloodStore.getState().bloodBanks,
            donors: serverState.donors || useAeroBloodStore.getState().donors,
            bloodUnits: serverState.bloodUnits || useAeroBloodStore.getState().bloodUnits,
            sosAlerts: serverState.sosAlerts || useAeroBloodStore.getState().sosAlerts,
            donationCamps: serverState.donationCamps || useAeroBloodStore.getState().donationCamps,
            syncMessages: serverState.syncMessages || useAeroBloodStore.getState().syncMessages,
          });
          isUpdatingFromSync = false;
        }
      } else {
        // Server has no state. Let's upload our client initial state to populate the server database!
        const initialPayload = getPayload(useAeroBloodStore.getState());
        const initialPayloadStr = JSON.stringify(initialPayload);
        lastSyncedPayloadStr = initialPayloadStr;
        
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: initialPayloadStr
        });
      }
    } catch (err) {
      console.warn('Failed to poll/initialize server state sync:', err);
    }
  };

  // Perform initial load immediately
  initAndPollServer();

  // Poll the server every 2 seconds for cross-device database changes
  setInterval(initAndPollServer, 2000);
}

