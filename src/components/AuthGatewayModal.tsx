import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Lock, ShieldAlert, CheckCircle2, Building2, 
  Droplet, Users, MapPin, Phone, HelpCircle, 
  Sparkles, ShieldCheck, ClipboardCheck, ArrowRight, Activity, Heart,
  Mail, Key, Loader2
} from 'lucide-react';
import { useAeroBloodStore } from '../lib/store';
import { UserRole, HospitalProfile, BloodBankProfile, DonorProfile } from '../types';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';

interface AuthGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  defaultTab?: 'login' | 'register';
  onSuccess?: () => void;
}

export default function AuthGatewayModal({ isOpen, onClose, defaultRole = 'donor', defaultTab = 'login', onSuccess }: AuthGatewayModalProps) {
  const { 
    hospitals, 
    bloodBanks, 
    donors,
    currentRole,
    currentHospitalId,
    currentBloodBankId,
    currentDonorId,
    setRole,
    setCurrentHospital,
    setCurrentBloodBank,
    setCurrentDonor,
    registerDonor,
    registerHospital,
    registerBloodBank
  } = useAeroBloodStore();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole === 'super_admin' ? 'hospital' : defaultRole);

  // Sync state with props when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setSelectedRole(defaultRole === 'super_admin' ? 'hospital' : defaultRole);
      setLoginSearchId('');
      setLoginError(null);
    }
  }, [isOpen, defaultTab, defaultRole]);

  // Success Feedback Toast
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- FIREBASE AUTHENTICATION STATE ---
  const [useEmailAuth, setUseEmailAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // --- LOGIN STATE ---
  const [loginSearchId, setLoginSearchId] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // --- HOSPITAL REGISTRATION FORM STATE ---
  const [hospName, setHospName] = useState('');
  const [hospType, setHospType] = useState<'Government' | 'Private' | 'Trust' | 'Military'>('Private');
  const [hospAddress, setHospAddress] = useState('');
  const [hospContact, setHospContact] = useState('');
  const [hospIdType, setHospIdType] = useState('National Health ID');
  const [hospIdNumber, setHospIdNumber] = useState('');
  const [hospBeds, setHospBeds] = useState(150);
  const [hospDoctors, setHospDoctors] = useState(40);
  const [hospIcu, setHospIcu] = useState(15);
  const [hospRooms, setHospRooms] = useState(100);
  const [hospOpd, setHospOpd] = useState(true);

  // --- BLOOD BANK REGISTRATION FORM STATE ---
  const [bankName, setBankName] = useState('');
  const [bankType, setBankType] = useState<'Red Cross' | 'Government' | 'Private' | 'Charity'>('Red Cross');
  const [bankAddress, setBankAddress] = useState('');
  const [bankContact, setBankContact] = useState('');
  const [bankRaktkosh, setBankRaktkosh] = useState('');

  // --- DONOR REGISTRATION FORM STATE ---
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorBloodGroup, setDonorBloodGroup] = useState('O-');
  const [donorAge, setDonorAge] = useState(25);
  const [donorGender, setDonorGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [donorAddress, setDonorAddress] = useState('');
  const [medicalHistory, setMedicalHistory] = useState({
    cancer: false,
    viralDisease: false,
    asthma: false,
    activeInfection: false,
    hiv: false,
    hepatitisB: false,
    hepatitisC: false,
    tuberculosis: false,
    leprosy: false,
  });

  if (!isOpen) return null;

  // Helper to generate coordinates in Midwest area
  const generateMidwestCoords = () => {
    // Generate around Chicago/Springfield bounding box
    const lat = 39.0 + Math.random() * 4.0; 
    const lng = -90.5 + Math.random() * 3.5;
    return { lat, lng };
  };

  // Handle Login Submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const searchStr = loginSearchId.trim().toUpperCase();

    if (!searchStr) {
      setLoginError("Please enter your Node Identification Code.");
      return;
    }

    if (selectedRole === 'hospital') {
      const match = hospitals.find(
        h => h.id.toUpperCase() === searchStr || h.hospitalIdNumber.toUpperCase() === searchStr
      );
      if (match) {
        setCurrentHospital(match.id);
        setRole('hospital');
        triggerSuccess(`Logged in as Terminal: ${match.name}`);
      } else {
        setLoginError(`No active hospital match found for ID/License: "${searchStr}"`);
      }
    } else if (selectedRole === 'blood_bank') {
      const match = bloodBanks.find(
        b => b.id.toUpperCase() === searchStr || b.eRaktkoshId.toUpperCase() === searchStr
      );
      if (match) {
        setCurrentBloodBank(match.id);
        setRole('blood_bank');
        triggerSuccess(`Logged in as Node: ${match.name}`);
      } else {
        setLoginError(`No e-Raktkosh registry found for: "${searchStr}"`);
      }
    } else if (selectedRole === 'donor') {
      const match = donors.find(
        d => d.donorId.toUpperCase() === searchStr || d.phone === searchStr || d.id.toUpperCase() === searchStr
      );
      if (match) {
        setCurrentDonor(match.id);
        setRole('donor');
        triggerSuccess(`Blood Passport unlocked for: ${match.name}`);
      } else {
        setLoginError(`No Digital Passport matching ID or Phone number: "${searchStr}"`);
      }
    } else if (selectedRole === 'super_admin') {
      if (searchStr === 'ADMIN' || searchStr === 'GRID') {
        setRole('super_admin');
        triggerSuccess("Authorized National Grid Access!");
      } else {
        setLoginError("Invalid Security Clearance Token.");
      }
    }
  };

  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setAuthLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;

      if (selectedRole === 'hospital') {
        const match = hospitals.find(h => h.id === uid);
        if (match) {
          setCurrentHospital(match.id);
          setRole('hospital');
          triggerSuccess(`Secure Firebase Login: ${match.name}`);
        } else {
          setLoginError(`Firebase account logged in, but no Hospital profile was found matching this account.`);
        }
      } else if (selectedRole === 'blood_bank') {
        const match = bloodBanks.find(b => b.id === uid);
        if (match) {
          setCurrentBloodBank(match.id);
          setRole('blood_bank');
          triggerSuccess(`Secure Firebase Login: ${match.name}`);
        } else {
          setLoginError(`Firebase account logged in, but no Blood Bank profile was found matching this account.`);
        }
      } else if (selectedRole === 'donor') {
        const match = donors.find(d => d.id === uid);
        if (match) {
          setCurrentDonor(match.id);
          setRole('donor');
          triggerSuccess(`Secure Passport unlocked: ${match.name}`);
        } else {
          setLoginError(`Firebase account logged in, but no Donor Passport profile was found matching this account.`);
        }
      } else if (selectedRole === 'super_admin') {
        setLoginError(`Super Admin accounts must use physical hardware token handshake.`);
      }
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || "Failed to authenticate with Firebase.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Fast Login Bypass from Quick Sandbox Selection
  const handleQuickSandboxLogin = (id: string, role: UserRole) => {
    setLoginError(null);
    if (role === 'hospital') {
      setCurrentHospital(id);
      setRole('hospital');
      const name = hospitals.find(h => h.id === id)?.name || id;
      triggerSuccess(`Sandbox Secure Handshake: ${name}`);
    } else if (role === 'blood_bank') {
      setCurrentBloodBank(id);
      setRole('blood_bank');
      const name = bloodBanks.find(b => b.id === id)?.name || id;
      triggerSuccess(`Sandbox Secure Handshake: ${name}`);
    } else if (role === 'donor') {
      setCurrentDonor(id);
      setRole('donor');
      const name = donors.find(d => d.id === id)?.name || id;
      triggerSuccess(`Passport Handshake: ${name}`);
    }
  };

  // Trigger brief success popup and close modal
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
      if (onSuccess) onSuccess();
    }, 1500);
  };

  // Form Submissions for Registrations
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please provide an email and password for secure Firebase Authentication registration.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setAuthLoading(true);
    try {
      const coords = generateMidwestCoords();

      if (selectedRole === 'hospital') {
        if (!hospName.trim() || !hospAddress.trim() || !hospIdNumber.trim()) {
          alert("Please fill in all mandatory Hospital terminal fields.");
          setAuthLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCredential.user.uid;

        registerHospital({
          name: hospName.trim(),
          location: { address: hospAddress.trim(), ...coords },
          hospitalType: hospType,
          emergencyContact: hospContact.trim() || '+1 (555) 000-1111',
          hospitalIdType: hospIdType,
          hospitalIdNumber: hospIdNumber.trim().toUpperCase(),
          resources: {
            bedCount: Number(hospBeds) || 50,
            totalDoctors: Number(hospDoctors) || 10,
            icuCount: Number(hospIcu) || 4,
            roomCount: Number(hospRooms) || 30,
            opdAvailable: hospOpd
          }
        }, uid);
        triggerSuccess(`Hospital Node registered and live with Firebase Auth! Terminal: ${hospName}`);
      } else if (selectedRole === 'blood_bank') {
        if (!bankName.trim() || !bankAddress.trim() || !bankRaktkosh.trim()) {
          alert("Please fill in all mandatory Blood Bank registration fields.");
          setAuthLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCredential.user.uid;

        registerBloodBank({
          name: bankName.trim(),
          location: { address: bankAddress.trim(), ...coords },
          bankType: bankType,
          emergencyContact: bankContact.trim() || '+1 (555) 000-2222',
          eRaktkoshId: bankRaktkosh.trim().toUpperCase()
        }, uid);
        triggerSuccess(`Blood Bank online with Firebase Auth! Node: ${bankName}`);
      } else if (selectedRole === 'donor') {
        if (!donorName.trim() || !donorPhone.trim() || !donorAddress.trim()) {
          alert("Please complete the required Digital Passport profile fields.");
          setAuthLoading(false);
          return;
        }
        if (donorAge < 18 || donorAge > 65) {
          alert("Donors must be between 18 and 65 years of age to register under current regulations.");
          setAuthLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCredential.user.uid;

        registerDonor({
          name: donorName.trim(),
          phone: donorPhone.trim(),
          bloodGroup: donorBloodGroup,
          age: Number(donorAge),
          gender: donorGender,
          location: { address: donorAddress.trim(), ...coords },
          medicalHistory: medicalHistory
        }, uid);
        triggerSuccess(`Blood Passport and Firebase account issued! Welcome, ${donorName}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Registration failed: " + (err.message || "Unknown error creating Firebase account."));
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal content box */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-brand-red-600 p-2 rounded-xl text-white">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-base tracking-wide uppercase">
                  AeroBlood Security Gateway
                </h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                  Secure Socket Handshake • Peer-to-Peer Grid
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Toast Overlay inside modal */}
          {successMsg && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 text-white animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-4 animate-bounce">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <p className="text-lg font-display font-bold tracking-tight text-emerald-400">{successMsg}</p>
              <p className="text-xs text-slate-400 font-mono mt-2">Synchronizing with peer networks in 1.5s...</p>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex border-b border-slate-100 bg-slate-50 p-1">
            <button
              onClick={() => { setActiveTab('login'); setLoginError(null); }}
              className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'login' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Secure Sign In (Terminal Access)
            </button>
            <button
              onClick={() => { setActiveTab('register'); setLoginError(null); }}
              className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'register' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Dynamic Registration (New Node)
            </button>
          </div>

          {/* Main Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Sector / Role Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                Select Your Operation Sector
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('hospital')}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    selectedRole === 'hospital' 
                      ? 'border-blue-600 bg-blue-50/40 text-blue-900' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Building2 className={`w-5 h-5 mb-1.5 ${selectedRole === 'hospital' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <p className="font-bold text-xs">Hospital</p>
                  <p className="text-[10px] opacity-75">Medical Center</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('blood_bank')}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    selectedRole === 'blood_bank' 
                      ? 'border-emerald-600 bg-emerald-50/40 text-emerald-900' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Droplet className={`w-5 h-5 mb-1.5 ${selectedRole === 'blood_bank' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <p className="font-bold text-xs">Blood Bank</p>
                  <p className="text-[10px] opacity-75">Inventory Facility</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('donor')}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    selectedRole === 'donor' 
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Users className={`w-5 h-5 mb-1.5 ${selectedRole === 'donor' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <p className="font-bold text-xs">Donor</p>
                  <p className="text-[10px] opacity-75">Altruistic Citizen</p>
                </button>
              </div>
            </div>

            {/* TAB 1: SIGN IN */}
            {activeTab === 'login' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">Authentication Mode</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUseEmailAuth(!useEmailAuth);
                      setLoginError(null);
                    }}
                    className="text-xs text-brand-red-600 hover:text-brand-red-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {useEmailAuth ? "Use Access Code Lookup" : "Use Firebase Email/Password"}
                  </button>
                </div>

                {useEmailAuth ? (
                  <form onSubmit={handleFirebaseLogin} className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Account Email Address *</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="node@aeroblood.org"
                            className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-red-500 bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Account Password *</label>
                        <div className="relative">
                          <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-red-500 bg-slate-50"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Authorizing Terminal...
                          </>
                        ) : (
                          <>
                            Sign In with Firebase Auth <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {loginError && (
                        <p className="text-xs text-brand-red-600 font-medium flex items-center gap-1.5 pt-1">
                          <ShieldAlert className="w-4 h-4 shrink-0" /> {loginError}
                        </p>
                      )}
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        {selectedRole === 'hospital' && 'Hospital Code / National License ID'}
                        {selectedRole === 'blood_bank' && 'e-Raktkosh Registry Identifier'}
                        {selectedRole === 'donor' && 'Digital Blood Passport ID or Registered Phone'}
                        {selectedRole === 'super_admin' && 'National System Clearance Token'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={loginSearchId}
                          onChange={(e) => setLoginSearchId(e.target.value)}
                          placeholder={
                            selectedRole === 'hospital' ? 'e.g. HOSP-1 or NH-981273-A' :
                            selectedRole === 'blood_bank' ? 'e.g. BANK-1 or ER-IL-CH-8821' :
                            selectedRole === 'donor' ? 'e.g. DONOR-1 or +1 (555) 888-9999' :
                            'Enter clearance token...'
                          }
                          className="w-full pl-3 pr-24 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-red-500 font-mono uppercase bg-slate-50"
                        />
                        <button
                          type="submit"
                          className="absolute right-1.5 top-1.5 bottom-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          Handshake <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      {loginError && (
                        <p className="text-xs text-brand-red-600 font-medium flex items-center gap-1.5 pt-1">
                          <ShieldAlert className="w-4 h-4 shrink-0" /> {loginError}
                        </p>
                      )}
                    </div>
                  </form>
                )}

                {/* Quick Sandboxes list for ease of simulation */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-brand-red-500 animate-pulse" /> Sandbox Quick-Connect
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">1-Click Terminal Authentication</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200/60 rounded-lg bg-white divide-y divide-slate-100">
                    {selectedRole === 'hospital' && hospitals.map(h => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => handleQuickSandboxLogin(h.id, 'hospital')}
                        className="w-full text-left p-2.5 hover:bg-blue-50/30 flex items-center justify-between text-xs transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{h.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase">{h.id} • {h.hospitalIdNumber}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase shrink-0">
                          Connect Terminal
                        </span>
                      </button>
                    ))}

                    {selectedRole === 'blood_bank' && bloodBanks.map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleQuickSandboxLogin(b.id, 'blood_bank')}
                        className="w-full text-left p-2.5 hover:bg-emerald-50/30 flex items-center justify-between text-xs transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{b.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase">{b.id} • {b.eRaktkoshId}</p>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase shrink-0">
                          Connect Node
                        </span>
                      </button>
                    ))}

                    {selectedRole === 'donor' && donors.map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleQuickSandboxLogin(d.id, 'donor')}
                        className="w-full text-left p-2.5 hover:bg-indigo-50/30 flex items-center justify-between text-xs transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{d.name} ({d.bloodGroup})</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase">{d.donorId} • {d.phone}</p>
                        </div>
                        <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase shrink-0">
                          Unlock Passport
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: REGISTER/SIGN UP */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                
                {/* FIREBASE ACCOUNT SECURITY DETAILS */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <h5 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs border-b border-slate-200 pb-1.5">
                    <Lock className="w-4 h-4 text-brand-red-600 shrink-0" /> Firebase Auth Security Clearance
                  </h5>
                  <p className="text-[10px] text-slate-500 font-mono leading-tight">These credentials secure your profile on the national network and allow you to log in from any node terminal.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Security Account Email *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. administrator@aeroblood.org"
                          className="w-full border border-slate-300 rounded-lg p-2 pl-8 bg-white focus:outline-none focus:ring-1 focus:ring-brand-red-500 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Access Password (6+ characters) *</label>
                      <div className="relative">
                        <Key className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full border border-slate-300 rounded-lg p-2 pl-8 bg-white focus:outline-none focus:ring-1 focus:ring-brand-red-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* HOSPITAL REGISTRATION FORM */}
                {selectedRole === 'hospital' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50/80 border border-blue-100 p-3 rounded-xl flex gap-2 text-blue-900">
                      <ClipboardCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold">Register Primary Hospital Node</h4>
                        <p className="text-[10px] text-blue-700 leading-normal mt-0.5">Enrolls your medical center on the national digital dispatch system, giving you access to real-time blood inventory checks and live SOS alerts broadcast.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Hospital/Facility Name *</label>
                        <input
                          type="text"
                          required
                          value={hospName}
                          onChange={(e) => setHospName(e.target.value)}
                          placeholder="e.g. Chicago Emergency Trauma Care"
                          className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Classification Type *</label>
                        <select
                          value={hospType}
                          onChange={(e) => setHospType(e.target.value as any)}
                          className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Private">Private Facility</option>
                          <option value="Government">Government / State</option>
                          <option value="Trust">Trust / Non-Profit</option>
                          <option value="Military">Military Medical Command</option>
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="font-bold text-slate-700">Location Address * (Midwest IL/MO/WI for simulation live-mapping)</label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            required
                            value={hospAddress}
                            onChange={(e) => setHospAddress(e.target.value)}
                            placeholder="e.g. 550 N St Clair St, Chicago, IL"
                            className="w-full border border-slate-300 rounded-lg p-2 pl-8 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Emergency Dispatch Contact *</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            required
                            value={hospContact}
                            onChange={(e) => setHospContact(e.target.value)}
                            placeholder="e.g. +1 (555) 234-5678"
                            className="w-full border border-slate-300 rounded-lg p-2 pl-8 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">License ID Number *</label>
                        <input
                          type="text"
                          required
                          value={hospIdNumber}
                          onChange={(e) => setHospIdNumber(e.target.value)}
                          placeholder="e.g. NH-229103-B"
                          className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                        />
                      </div>
                    </div>

                    {/* Resources Fields */}
                    <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 space-y-3">
                      <h5 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs border-b border-slate-100 pb-1.5">
                        <Activity className="w-4 h-4 text-blue-600" /> Current Hospital Bed & Critical Care Capacity
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold block">Total Beds</label>
                          <input
                            type="number"
                            value={hospBeds}
                            onChange={(e) => setHospBeds(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold block">ICU Count</label>
                          <input
                            type="number"
                            value={hospIcu}
                            onChange={(e) => setHospIcu(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold block">Total Doctors</label>
                          <input
                            type="number"
                            value={hospDoctors}
                            onChange={(e) => setHospDoctors(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold block">Rooms</label>
                          <input
                            type="number"
                            value={hospRooms}
                            onChange={(e) => setHospRooms(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1.5">
                        <input
                          type="checkbox"
                          id="hospOpd"
                          checked={hospOpd}
                          onChange={(e) => setHospOpd(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="hospOpd" className="font-bold text-slate-700 cursor-pointer text-[11px]">
                          24/7 Outpatient Department (OPD) Active and Operational
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* BLOOD BANK REGISTRATION FORM */}
                {selectedRole === 'blood_bank' && (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex gap-2 text-emerald-900">
                      <Droplet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold">Register Blood Bank Inventory Center</h4>
                        <p className="text-[10px] text-emerald-700 leading-normal mt-0.5">Enrolls your inventory storehouse. Connect e-Raktkosh data systems to dispatch critical whole blood, plasma, or platelets securely.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Blood Bank/Center Name *</label>
                        <input
                          type="text"
                          required
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. Metro Biotech Blood Reserves"
                          className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Organization Type *</label>
                        <select
                          value={bankType}
                          onChange={(e) => setBankType(e.target.value as any)}
                          className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Red Cross">Red Cross Center</option>
                          <option value="Government">Government Regional Bank</option>
                          <option value="Private">Private Lab / Biotech</option>
                          <option value="Charity">Charity / Trust Bank</option>
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="font-bold text-slate-700">Location Address * (Midwest area for GIS markers mapping)</label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            required
                            value={bankAddress}
                            onChange={(e) => setBankAddress(e.target.value)}
                            placeholder="e.g. 100 Red Cross Lane, Springfield, IL"
                            className="w-full border border-slate-300 rounded-lg p-2 pl-8 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Direct Contact Hot-line *</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            required
                            value={bankContact}
                            onChange={(e) => setBankContact(e.target.value)}
                            placeholder="e.g. +1 (555) 765-4321"
                            className="w-full border border-slate-300 rounded-lg p-2 pl-8 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">e-Raktkosh ID (National Registry Code) *</label>
                        <input
                          type="text"
                          required
                          value={bankRaktkosh}
                          onChange={(e) => setBankRaktkosh(e.target.value)}
                          placeholder="e.g. ER-IL-SP-3344"
                          className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* DONOR REGISTRATION FORM */}
                {selectedRole === 'donor' && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex gap-2 text-indigo-900">
                      <Users className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold">Issue AeroBlood Digital Blood Passport</h4>
                        <p className="text-[10px] text-indigo-700 leading-normal mt-0.5">Registers you in the national list. Instantly matches you with SOS demands matching your phenotype, gives you QR checkins, and awards lifesaver points.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Your Full Name *</label>
                        <input
                          type="text"
                          required
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                          placeholder="e.g. Amanda Clarke"
                          className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Mobile Phone Number *</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="tel"
                            required
                            value={donorPhone}
                            onChange={(e) => setDonorPhone(e.target.value)}
                            placeholder="e.g. +1 (555) 456-7890"
                            className="w-full border border-slate-300 rounded-lg p-2 pl-8 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Blood Group / Phenotype *</label>
                        <select
                          value={donorBloodGroup}
                          onChange={(e) => setDonorBloodGroup(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold"
                        >
                          <option value="O-">O- Negative (Universal Red Blood)</option>
                          <option value="O+">O+ Positive</option>
                          <option value="A-">A- Negative</option>
                          <option value="A+">A+ Positive</option>
                          <option value="B-">B- Negative</option>
                          <option value="B+">B+ Positive</option>
                          <option value="AB-">AB- Negative</option>
                          <option value="AB+">AB+ Positive (Universal Plasma)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Age (18-65) *</label>
                          <input
                            type="number"
                            required
                            min={18}
                            max={65}
                            value={donorAge}
                            onChange={(e) => setDonorAge(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Gender *</label>
                          <select
                            value={donorGender}
                            onChange={(e) => setDonorGender(e.target.value as any)}
                            className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="font-bold text-slate-700">Home Location Address *</label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            required
                            value={donorAddress}
                            onChange={(e) => setDonorAddress(e.target.value)}
                            placeholder="e.g. 710 Madison Ave, Covington, KY"
                            className="w-full border border-slate-300 rounded-lg p-2 pl-8 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Medical Checklist */}
                    <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 space-y-3">
                      <h5 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs border-b border-slate-100 pb-1.5">
                        <Heart className="w-4 h-4 text-indigo-600 animate-pulse" /> Health & Blood Donation Eligibility Questionnaire
                      </h5>
                      <p className="text-[10px] text-slate-400 font-mono leading-none">Please check any conditions that apply to you. To ensure blood supply safety, donors must declare history truthfully.</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1.5">
                        {Object.keys(medicalHistory).map((key) => (
                          <div key={key} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`history-${key}`}
                              checked={medicalHistory[key as keyof typeof medicalHistory]}
                              onChange={(e) => setMedicalHistory({
                                ...medicalHistory,
                                [key]: e.target.checked
                              })}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label 
                              htmlFor={`history-${key}`} 
                              className="text-[10.5px] text-slate-600 font-medium capitalize cursor-pointer select-none"
                            >
                              {key.replace(/([A-Z])/g, ' $1')}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 px-4 font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Provisioning Node Credentials...
                    </>
                  ) : (
                    <>
                      Confirm Registration & Launch Node <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

          {/* Footer */}
          <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>REGULATION: CFR-1099-HHS</span>
            <span>SECURE CRYPTO HANDSHAKE (AES-256)</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
