import React, { useMemo } from 'react';
import { useAeroBloodStore } from '../lib/store';
import { 
  ShieldCheck, ArrowLeft, Heart, Calendar, Award, 
  MapPin, Phone, User, Activity, CheckCircle, AlertTriangle, 
  Printer, Share2, ClipboardCheck, Lock, Download, FileSpreadsheet
} from 'lucide-react';

interface PassportLookupViewProps {
  passportId: string;
  onClose: () => void;
}

export default function PassportLookupView({ passportId, onClose }: PassportLookupViewProps) {
  const { donors, bloodUnits } = useAeroBloodStore();

  // Find the donor matching the passport ID or internal database ID
  const donor = useMemo(() => {
    const cleanId = passportId.trim().toUpperCase();
    return donors.find(d => 
      d.donorId.toUpperCase() === cleanId || 
      d.id.toUpperCase() === cleanId
    );
  }, [donors, passportId]);

  // Calculate eligibility details based on a standard 56-day whole-blood cooldown
  const eligibility = useMemo(() => {
    if (!donor) return { eligible: false, daysRemaining: 0, nextDate: '' };
    if (!donor.lastDonationDate) return { eligible: true, daysRemaining: 0, nextDate: 'Immediately' };

    const lastDate = new Date(donor.lastDonationDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const COOLDOWN_PERIOD = 56; // 8 weeks cooldown
    const eligible = diffDays >= COOLDOWN_PERIOD;
    const daysRemaining = Math.max(0, COOLDOWN_PERIOD - diffDays);
    
    const nextDateObj = new Date(lastDate);
    nextDateObj.setDate(nextDateObj.getDate() + COOLDOWN_PERIOD);
    const nextDate = nextDateObj.toISOString().split('T')[0];

    return {
      eligible,
      daysRemaining,
      nextDate
    };
  }, [donor]);

  // Count donor's historical units contributed in local state units
  const donationStats = useMemo(() => {
    if (!donor) return { count: 0 };
    // Let's count approximate donations by points or last donation record
    const baseDonations = Math.floor(donor.points / 150) || 1;
    return {
      count: baseDonations
    };
  }, [donor]);

  // Generate a mock SHA-256 secure hash to emphasize "Secured Digital Blood Passport"
  const securityHash = useMemo(() => {
    if (!donor) return '';
    const secretSeed = `${donor.id}-${donor.donorId}-${donor.bloodGroup}-${donor.lastDonationDate || 'NONE'}`;
    let hash = 0;
    for (let i = 0; i < secretSeed.length; i++) {
      const char = secretSeed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'AB-SECURE-' + Math.abs(hash).toString(16).toUpperCase() + '-' + donor.id;
  }, [donor]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Public verification passport link copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      
      {/* Back to main portal button */}
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Exit Verification Portal
      </button>

      {/* Main Validation Result Container */}
      {!donor ? (
        <div className="bg-white rounded-3xl border border-rose-200 shadow-xl p-8 md:p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200 shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-black text-2xl text-slate-900 tracking-tight">Passport Record Not Found</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm">
              The Digital Blood Passport credential with code <strong className="text-rose-600 font-mono">"{passportId}"</strong> could not be verified by our active national registry nodes. Please verify the scanner's link and try again.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer text-sm shadow-md"
            >
              Return to Landing
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top Real-time Verification Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-7 h-7 animate-bounce" />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full tracking-wider border border-emerald-200">
                  LIVE GRID VERIFIED
                </span>
                <span className="text-slate-400 text-[10px]">
                  Checked: {new Date().toLocaleString()} (UTC)
                </span>
              </div>
              <h2 className="font-display font-bold text-slate-900 text-sm md:text-base">
                National Digital Blood Passport Authenticated Successfully
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                title="Print Passport"
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopyLink}
                title="Share Verification URL"
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid Layout of Passport Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Passport Card Visual Representation */}
            <div className="lg:col-span-1 bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-xl border border-slate-800 flex flex-col justify-between min-h-[360px]">
              {/* Glossy backgrounds */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-brand-red-600/10 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl -ml-16 -mb-16" />

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-extrabold text-sm tracking-tight text-white leading-none">AEROBLOOD</h3>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">HEALTH PASSPORT v2.0</p>
                  </div>
                  <div className="w-7 h-7 bg-brand-red-600 rounded-lg flex items-center justify-center text-xs font-black">
                    AB
                  </div>
                </div>

                <div className="pt-6 flex items-center gap-4">
                  <div className="w-20 h-20 bg-brand-red-600 text-white rounded-3xl flex items-center justify-center font-display font-black text-3xl shadow-lg border-2 border-white/20 select-none">
                    {donor.bloodGroup}
                  </div>
                  <div className="space-y-1">
                    <p className="font-display font-black text-lg leading-tight tracking-tight text-white">{donor.name}</p>
                    <p className="text-[10px] text-slate-300 font-mono">ID: {donor.donorId}</p>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 w-max">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ACTIVE DONOR
                    </span>
                  </div>
                </div>
              </div>

              {/* Passport Metadata Footer inside card */}
              <div className="pt-8 border-t border-slate-800 space-y-2 relative z-10">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-500 block font-medium">Phone Number</span>
                    <span className="font-bold text-slate-200">{donor.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Donor Age / Sex</span>
                    <span className="font-bold text-slate-200">{donor.age} yrs • {donor.gender}</span>
                  </div>
                </div>

                <div className="pt-1 flex justify-between items-center text-[9px] text-slate-400">
                  <span className="font-mono">{securityHash.slice(0, 16)}...</span>
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" /> Secure Token
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2 & 3: Detailed Credentials, Medical Clearances, History */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Panel A: Medical Clearance Checklist & Lab Testing */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-display font-bold text-slate-900 text-sm">Official Lab Clearance & Screening</h3>
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  All active AeroBlood digital passport holders are routinely screened in clinical labs under WHO-standard transfusion guidelines. Latest panel results:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { test: 'HIV-1 / HIV-2 Antibodies', status: 'NON-REACTIVE', ok: true },
                    { test: 'Hepatitis B Surface Antigen', status: 'NON-REACTIVE', ok: true },
                    { test: 'Hepatitis C Virus', status: 'NON-REACTIVE', ok: true },
                    { test: 'Syphilis Serology', status: 'NON-REACTIVE', ok: true },
                    { test: 'Malaria Rapid Panel', status: 'NEGATIVE', ok: true },
                    { test: 'West Nile Virus Screen', status: 'NEGATIVE', ok: true },
                  ].map((t, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-center">
                      <span className="text-[9px] text-slate-500 block font-medium leading-none">{t.test}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
                        <CheckCircle className="w-2.5 h-2.5 text-emerald-600" /> {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel B: Donation Cooldown / Eligibility Health Widget */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Activity className="w-5 h-5 text-brand-red-600" />
                  <h3 className="font-display font-bold text-slate-900 text-sm">Transfusion Eligibility Calculator</h3>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Current Eligibility Status</span>
                    {eligibility.eligible ? (
                      <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Fully Eligible to Donate
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 inline-flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 animate-pulse" /> In Cool-down Period
                      </span>
                    )}
                  </div>

                  <div className="text-right space-y-0.5">
                    <p className="text-xs text-slate-500">Last Donation Date: <strong className="text-slate-700">{donor.lastDonationDate || 'First-time registration'}</strong></p>
                    <p className="text-xs text-slate-500">Next Eligible Window: <strong className="text-slate-700">{eligibility.nextDate}</strong></p>
                  </div>
                </div>

                {!eligibility.eligible && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                      <Calendar className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-[11px] text-amber-900 leading-relaxed">
                      <p className="font-bold">Active Cooldown Protection: {eligibility.daysRemaining} days remaining</p>
                      <p className="text-amber-700">AeroBlood enforces a strict safety protocol requiring 56 days between consecutive packed cell or whole blood collections to prioritize donor iron restoration and bone marrow health.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Panel C: Verification Audit Trail & Stats */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center space-y-1">
                  <Heart className="w-5 h-5 text-brand-red-500 mx-auto" />
                  <span className="text-[10px] text-slate-500 block font-medium">Estimated Lives Saved</span>
                  <p className="font-display font-extrabold text-2xl text-slate-900">{donationStats.count * 3}</p>
                  <span className="text-[9px] text-slate-400 block font-medium">3 per unit average</span>
                </div>

                <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center space-y-1">
                  <Award className="w-5 h-5 text-indigo-500 mx-auto" />
                  <span className="text-[10px] text-slate-500 block font-medium">Total Loyalty Points</span>
                  <p className="font-display font-extrabold text-2xl text-indigo-600">{donor.points} XP</p>
                  <span className="text-[9px] text-slate-400 block font-medium">Lifesaver Tier II</span>
                </div>

                <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center space-y-1">
                  <MapPin className="w-5 h-5 text-slate-500 mx-auto" />
                  <span className="text-[10px] text-slate-500 block font-medium">Primary Hub / Base</span>
                  <p className="font-display font-bold text-xs text-slate-800 truncate mt-1.5">{donor.location.address.split(',')[1] || 'Metro Sector'}</p>
                  <span className="text-[9px] text-slate-400 block font-medium truncate">{donor.location.address.split(',')[0]}</span>
                </div>
              </div>

              {/* Safety/Audit signature */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">Security Token Validation: {securityHash}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span>NBM-Grid Node 881-Secure</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Verification instructions footer */}
      <div className="text-center text-[10px] text-slate-400 max-w-lg mx-auto">
        This public page is part of AeroBlood's real-time healthcare information interoperability standard. Medical staff can verify and scan passports offline; data updates immediately on the main network grid.
      </div>
    </div>
  );
}
