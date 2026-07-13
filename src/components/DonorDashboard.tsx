import React, { useState, useMemo } from 'react';
import { useAeroBloodStore } from '../lib/store';
import { DonorProfile, MedicalHistory } from '../types';
import QRCodeDisplay from './QRCodeDisplay';
import { 
  Heart, Calendar, MapPin, Award, CheckCircle2, AlertCircle, 
  QrCode, User, Phone, Sparkles, HelpCircle, Activity, Info
} from 'lucide-react';

export default function DonorDashboard() {
  const { 
    currentDonorId, 
    donors, 
    sosAlerts, 
    donateBlood, 
    donationCamps,
    registerDonor
  } = useAeroBloodStore();

  // Selected Donor profile
  const donor = useMemo(() => {
    return donors.find(d => d.id === currentDonorId) || donors[0];
  }, [donors, currentDonorId]);

  // States
  const [showQRModal, setShowQRModal] = useState(false);
  const [isDonatingLoading, setIsDonatingLoading] = useState(false);
  const [successDonate, setSuccessDonate] = useState(false);
  const [donorRegSuccess, setDonorRegSuccess] = useState(false);

  // Profile creation state (in case user wants to register a new donor on-the-fly)
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBlood, setRegBlood] = useState('O-');
  const [regAge, setRegAge] = useState(25);
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regAddress, setRegAddress] = useState('100 Maple Rd, Chicago, IL');
  const [regHistory, setRegHistory] = useState<MedicalHistory>({
    cancer: false, viralDisease: false, asthma: false, activeInfection: false,
    hiv: false, hepatitisB: false, hepatitisC: false, tuberculosis: false, leprosy: false
  });

  // Calculate Eligibility based on medical history and last donation date
  const eligibility = useMemo(() => {
    if (!donor) return { eligible: false, reasons: ['Profile not found'] };
    
    const reasons: string[] = [];
    let eligible = true;

    // 1. Age check (18 - 65 typically)
    if (donor.age < 18) {
      eligible = false;
      reasons.push('Minimum age requirement is 18 years');
    } else if (donor.age > 65) {
      eligible = false;
      reasons.push('Donor age exceeds standard maximum guidelines (65 years)');
    }

    // 2. Last donation time check (standard 56 days for whole blood/packed cells)
    if (donor.lastDonationDate) {
      const lastDate = new Date(donor.lastDonationDate);
      const today = new Date();
      const diffTime = today.getTime() - lastDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 56) {
        eligible = false;
        reasons.push(`Minimum 56 days interval required. Wait another ${56 - diffDays} days.`);
      }
    }

    // 3. Medical History checks
    const history = donor.medicalHistory;
    if (history.hiv) { eligible = false; reasons.push('Pre-existing condition: Permanent HIV deferral'); }
    if (history.cancer) { eligible = false; reasons.push('Pre-existing condition: Permanent Cancer deferral'); }
    if (history.hepatitisB || history.hepatitisC) { eligible = false; reasons.push('Pre-existing condition: Permanent Hepatitis deferral'); }
    if (history.activeInfection) { eligible = false; reasons.push('Active localized or systemic infection'); }
    if (history.tuberculosis) { eligible = false; reasons.push('History of active Tuberculosis'); }
    if (history.leprosy) { eligible = false; reasons.push('History of Leprosy'); }

    return { eligible, reasons };
  }, [donor]);

  // Filter SOS matching donor's specific blood group
  const matchingSOS = useMemo(() => {
    if (!donor) return [];
    return sosAlerts.filter(
      s => s.status === 'Active' && (s.bloodGroup === donor.bloodGroup || donor.bloodGroup === 'O-')
    );
  }, [sosAlerts, donor]);

  // Gamification achievements badges based on points
  const achievements = useMemo(() => {
    if (!donor) return [];
    const badges = [];
    
    // First badge always awarded for registering
    badges.push({ title: 'First Blood', desc: 'Registered in the AeroBlood national directory', icon: '🩸', unlocked: true });
    
    // Bronze
    badges.push({ 
      title: 'Life Saver Bronze', 
      desc: 'Accrued more than 150 points', 
      icon: '🥉', 
      unlocked: donor.points >= 150 
    });

    // Silver
    badges.push({ 
      title: 'Vanguard Guard', 
      desc: 'Accrued more than 300 points', 
      icon: '🥈', 
      unlocked: donor.points >= 300 
    });

    // Gold
    badges.push({ 
      title: 'Pinnacle Patron', 
      desc: 'AeroBlood elite donor (500+ points)', 
      icon: '👑', 
      unlocked: donor.points >= 500 
    });

    return badges;
  }, [donor]);

  // Quick donate button logic
  const handleQuickDonate = () => {
    if (!eligibility.eligible) {
      alert('Cannot donate at this time due to safety deferral markers.');
      return;
    }
    setIsDonatingLoading(true);
    setTimeout(() => {
      donateBlood(donor.id, 'Central Metro Blood Bank');
      setIsDonatingLoading(false);
      setSuccessDonate(true);
      setTimeout(() => {
        setSuccessDonate(false);
      }, 3000);
    }, 1500);
  };

  const handleRegisterDonorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;

    registerDonor({
      name: regName,
      phone: regPhone,
      bloodGroup: regBlood,
      age: Number(regAge),
      gender: regGender,
      location: { address: regAddress, lat: 41.8781, lng: -87.6298 },
      medicalHistory: regHistory
    });

    setRegName('');
    setRegPhone('');
    setDonorRegSuccess(true);
    setTimeout(() => {
      setDonorRegSuccess(false);
    }, 2500);
  };

  return (
    <div id="donor-portal" className="space-y-6">
      
      {/* Upper split: Blood passport card vs Live stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Digital Passport Card */}
        <div id="blood-passport-card" className="relative md:col-span-1 rounded-2xl bg-gradient-to-br from-slate-900 via-brand-red-900 to-slate-950 p-6 text-white border border-slate-800 shadow-xl overflow-hidden group">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-44 h-44 rounded-full bg-brand-red-600/10 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
          
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold tracking-widest text-brand-red-400 font-mono">
                AEROBLOOD SYSTEM CARD
              </span>
              <h3 className="font-display font-extrabold text-lg text-slate-100">Blood Passport</h3>
            </div>
            
            {/* Blood group indicator badge */}
            <div className="bg-brand-red-600 border border-brand-red-400 text-white font-display font-black text-xl px-3 py-1.5 rounded-xl shadow-lg leading-none animate-soft-pulse">
              {donor.bloodGroup}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/10 rounded-full text-slate-300">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Cardholder Name</p>
                <p className="text-sm font-bold text-white">{donor.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-[9px] text-slate-400">Passport ID</p>
                  <p className="text-xs font-bold font-mono text-slate-200">{donor.donorId}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div>
                  <p className="text-[9px] text-slate-400">Mobile Verified</p>
                  <p className="text-xs font-bold text-slate-200">{donor.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Scan Actions */}
          <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Activity className="w-3.5 h-3.5 text-brand-red-500 animate-pulse" /> Verified Holder Registry
            </div>

            <button
              id="qr-modal-btn"
              onClick={() => setShowQRModal(true)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all shadow-md flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <QrCode className="w-4 h-4" /> QR Passport
            </button>
          </div>
        </div>

        {/* Impact counter and donor metrics */}
        <div className="md:col-span-2 flex flex-col justify-between gap-4">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Donations Registered</span>
              <p className="text-3xl font-display font-extrabold text-slate-900 mt-1">
                {donor.lastDonationDate ? '4 times' : '0 times'}
              </p>
              <span className="text-[10px] text-slate-500 block mt-1">
                Last date: <strong>{donor.lastDonationDate || 'First drive pending'}</strong>
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Human Lives Impacted</span>
              <p className="text-3xl font-display font-extrabold text-emerald-600 mt-1">
                {donor.lastDonationDate ? '12 lives' : '0 lives'}
              </p>
              <span className="text-[10px] text-slate-500 block mt-1">1 bag typically helps 3 patients</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-indigo-600 block">Reward Points Earned</span>
              <p className="text-3xl font-display font-extrabold text-indigo-600 mt-1">{donor.points} XP</p>
              <span className="text-[10px] text-indigo-600 block mt-1 font-medium">150 XP per donation</span>
            </div>
          </div>

          {/* Quick donation logging option */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="font-display font-bold text-slate-900 text-sm">Did you donate blood today?</h4>
              <p className="text-xs text-slate-500 mt-0.5">Quick-log your contribution at Central Metro Blood Bank to refresh the system stock and claim reward badges.</p>
            </div>

            {successDonate ? (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4" /> Points Issued Successfully!
              </span>
            ) : (
              <button
                id="btn-quick-donate"
                onClick={handleQuickDonate}
                disabled={isDonatingLoading || !eligibility.eligible}
                className={`font-bold px-5 py-2.5 rounded-lg text-xs transition-colors shadow ${
                  eligibility.eligible 
                    ? 'bg-brand-red-600 hover:bg-brand-red-700 text-white' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                }`}
              >
                {isDonatingLoading ? 'Syncing...' : 'Log Quick Donation (+150 XP)'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Check eligibility & badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Eligibility Checker */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-display font-bold text-slate-900 text-sm">FDA & Red Cross Donation Eligibility</h3>
            <p className="text-xs text-slate-500">Live evaluation against medical health questionnaires</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status indicator */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center col-span-1 ${
              eligibility.eligible 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {eligibility.eligible ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mb-2" />
                  <span className="font-display font-extrabold text-base">Eligible to Donate</span>
                  <p className="text-[10px] text-emerald-600 mt-1 leading-relaxed">No active medical deferrals found on profile.</p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-12 h-12 text-brand-red-600 mb-2" />
                  <span className="font-display font-extrabold text-base">Deferred Status</span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Safety metrics restrict active whole blood collections.</p>
                </>
              )}
            </div>

            {/* Reasons/Details */}
            <div className="md:col-span-2 space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500">Medical Deferrals Auditing Log</span>
              
              {eligibility.reasons.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                  ✔ Passed standard FDA questionnaires checking HIV, Cancer, Tuberculosis, Hep-B, active infection and weight margins.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {eligibility.reasons.map((reason, idx) => (
                    <div key={idx} className="p-2.5 bg-red-50/50 border border-red-100/60 rounded-lg text-brand-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 bg-slate-100/50 rounded-lg border border-slate-200/40 text-[10px] text-slate-500">
                * Note: Standard whole blood deferral limits require 56 days between single bag collections to preserve red blood cell iron concentrations.
              </div>
            </div>
          </div>
        </div>

        {/* Gamified Badges block */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-display font-bold text-slate-900 text-sm">Achievements & Badges</h3>
            <p className="text-xs text-slate-500">Unlocks gamified badges as you save lives</p>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto">
            {achievements.map((badge, idx) => (
              <div key={idx} className={`p-3 border rounded-xl flex items-center justify-between gap-3 ${
                badge.unlocked ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50 border-slate-200 opacity-50'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl leading-none">{badge.icon}</span>
                  <div>
                    <h4 className="font-display font-bold text-xs text-slate-800">{badge.title}</h4>
                    <p className="text-[10px] text-slate-500">{badge.desc}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold ${badge.unlocked ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {badge.unlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Localized SOS Alerts seeking their blood group */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="font-display font-bold text-slate-900 text-sm">Nearby SOS Needing {donor.bloodGroup}</h3>
          <p className="text-xs text-slate-500">Your blood group can immediately help these emergency calls</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matchingSOS.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-slate-400 text-xs">No matching emergency SOS alerts found nearby. Great news!</div>
          ) : (
            matchingSOS.map(sos => (
              <div key={sos.id} className="p-4 border border-brand-red-100 bg-brand-red-50/10 rounded-xl hover:border-brand-red-200 transition-all flex flex-col justify-between gap-3 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-brand-red-600 rounded-full animate-ping"></span>
                      <h4 className="font-display font-bold text-slate-900">{sos.hospitalName}</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {sos.location.address}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Units: <strong>{sos.unitsRequired} units ({sos.componentType})</strong>
                    </p>
                    <div className="bg-brand-red-100/60 text-brand-red-700 px-2 py-0.5 rounded font-bold w-max mt-2">
                      Priority: {sos.priority}
                    </div>
                  </div>

                  <span className="bg-brand-red-600 text-white font-display font-extrabold text-base px-3 py-1 rounded-lg">
                    {sos.bloodGroup}
                  </span>
                </div>

                <button
                  id={`pledge-btn-${sos.id}`}
                  onClick={() => {
                    alert(`Pledge submitted. AeroBlood hospital dashboard at ${sos.hospitalName} has been updated in real-time with your profile, contact, and arrival route.`);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg transition-colors"
                >
                  Pledge & Navigate Route
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Register a new donor (for simulation purposes) */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <h3 className="font-display font-bold">Simulator: Register a New Donor</h3>
          <p className="text-xs text-slate-400">Quickly add a brand-new donor profile to see them propagate across all maps and search radar modules.</p>
        </div>

        {donorRegSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
            ✔ Registered successfully! Your active dashboard session has been switched to the new donor.
          </div>
        )}

        <form onSubmit={handleRegisterDonorSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-400">Donor Name</label>
            <input
              type="text"
              required
              placeholder="e.g. David Hassel"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-400">Phone</label>
            <input
              type="text"
              required
              placeholder="e.g. +1 (555) 888-0011"
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-400">Blood Group</label>
            <select
              value={regBlood}
              onChange={(e) => setRegBlood(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="O-">O-</option>
              <option value="O+">O+</option>
              <option value="A+">A+</option>
              <option value="B+">B+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <button
            type="submit"
            id="register-donor-btn"
            className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-2 px-4 rounded-lg mt-auto self-end"
          >
            Register & Switched Session
          </button>
        </form>
      </div>

      {/* QR Passport Scanner Dialog */}
      {showQRModal && (
        <div id="qr-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden text-center p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-slate-900 text-sm">QR DIGITAL PASSPORT</h3>
              <button 
                id="close-qr-modal"
                onClick={() => setShowQRModal(false)} 
                className="text-slate-400 hover:text-slate-900 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mx-auto flex justify-center pb-2">
              <QRCodeDisplay 
                value={`${window.location.origin}${window.location.pathname}?passport=${donor.donorId}`} 
                size={180} 
              />
            </div>
            <div className="text-[9px] text-slate-400 font-mono break-all max-w-[260px] mx-auto bg-slate-50 p-1.5 rounded border border-slate-100">
              {window.location.origin}{window.location.pathname}?passport={donor.donorId}
            </div>

            <div className="space-y-1">
              <p className="font-display font-extrabold text-base text-slate-900">{donor.name}</p>
              <p className="text-xs text-slate-500">ID: <strong className="text-slate-700">{donor.donorId}</strong> • Verified</p>
              <p className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 w-max mx-auto font-medium">
                Blood Group: {donor.bloodGroup}
              </p>
            </div>

            <p className="text-[10px] text-slate-400">
              Scannable by hospitals, blood bank managers, and camp logistics coordinators to verify identity and load previous donation cycles instantly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
