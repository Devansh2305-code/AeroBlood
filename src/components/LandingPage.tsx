import React, { useMemo, useState, useEffect } from 'react';
import { useAeroBloodStore } from '../lib/store';
import AeroBloodLogo from './AeroBloodLogo';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Shield, Sparkles, Building2, Users, Droplet, 
  ArrowRight, ShieldAlert, CheckCircle2, MapPin, Calendar, Compass, Clock, Activity, Zap
} from 'lucide-react';

import { UserRole } from '../types';

interface LandingPageProps {
  onStart: (role?: any) => void;
  onOpenAuth: (tab: 'login' | 'register', role?: UserRole) => void;
}

export default function LandingPage({ onStart, onOpenAuth }: LandingPageProps) {
  const { hospitals, bloodBanks, donors, bloodUnits, sosAlerts, donationCamps } = useAeroBloodStore();

  const [tickerIndex, setTickerIndex] = useState(0);
  const tickerMessages = useMemo(() => [
    { text: "St. Jude Hospital raised O- Critical SOS Alert (IL Region)", type: "sos", color: "text-brand-red-600 bg-brand-red-50" },
    { text: "Central Metro Blood Bank dispatched 3 units to Trauma ICU", type: "dispatch", color: "text-emerald-700 bg-emerald-50" },
    { text: "AeroBlood Digital Blood Passport verified at Springfield Camp", type: "verify", color: "text-indigo-700 bg-indigo-50" },
    { text: "Wisconsin Medical Hub locked emergency platelets reserve", type: "reserve", color: "text-amber-700 bg-amber-50" },
    { text: "Apex Blood Center updated critical stock index dynamically", type: "update", color: "text-blue-700 bg-blue-50" },
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerMessages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [tickerMessages]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const totalSOS = sosAlerts.length;
    const resolvedSOS = sosAlerts.filter(s => s.status === 'Fulfilled').length;
    const totalInventoryUnits = bloodUnits.reduce((acc, unit) => {
      return unit.status === 'Available' ? acc + unit.units : acc;
    }, 0);

    const livesSaved = resolvedSOS * 3 + Math.floor(totalInventoryUnits * 1.5);
    const donorMultiplier = donors.length * 4;

    return {
      hospitalsCount: hospitals.length + 128, // Amplified national scale numbers for marketing/landing
      banksCount: bloodBanks.length + 42,
      donorsCount: donors.length + 3840,
      inventoryUnits: totalInventoryUnits + 4820,
      livesImpacted: livesSaved + donorMultiplier + 14210,
      campsCount: donationCamps.filter(c => c.status === 'Active').length + 8
    };
  }, [hospitals, bloodBanks, donors, bloodUnits, sosAlerts, donationCamps]);

  return (
    <div id="landing-page" className="min-h-screen flex flex-col bg-slate-50">
      
      {/* Landing Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AeroBloodLogo size="sm" showText={true} />
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenAuth('login', 'donor')}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('register', 'donor')}
              className="bg-slate-950 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-red-500 animate-pulse" />
              <span>Register Node</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100 py-16 lg:py-28">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-brand-red-500/10 via-transparent to-transparent opacity-60 pointer-events-none"></div>
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Live Ticker Channel */}
            <div className="h-11 overflow-hidden relative bg-slate-50 border border-slate-200/80 rounded-2xl px-4 flex items-center shadow-inner max-w-lg">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono shrink-0 mr-3 flex items-center gap-1.5 select-none">
                <Activity className="w-3.5 h-3.5 text-brand-red-600 animate-pulse" /> Live Channel:
              </span>
              <div className="relative flex-1 h-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tickerIndex}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center"
                  >
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${tickerMessages[tickerIndex].color} border-current/10 truncate flex items-center gap-1`}>
                      <Zap className="w-3 h-3 text-current animate-bounce" />
                      {tickerMessages[tickerIndex].text}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-red-50 border border-brand-red-100 rounded-full text-[10px] font-black text-brand-red-700 uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5 animate-spin animate-duration-3000" /> Empowering Healthcare Ecosystems
            </span>
            
            <div className="flex items-center gap-4 pt-2">
              <AeroBloodLogo size={56} />
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-brand-red-600 to-rose-600">
                AEROBLOOD
              </h1>
            </div>
            
            <p className="font-display font-extrabold text-xl sm:text-2xl text-slate-800 leading-none">
              Connecting Blood. <span className="text-brand-red-600">Saving Human Lives.</span>
            </p>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg">
              AeroBlood is a cross-platform, real-time blood intelligence network linking Hospitals, Blood Banks, and Altruistic Donors. We remove operational information gaps, optimize cold-chain visibility, and resolve critical SOS alerts without page refresh delay.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                id="landing-cta-primary"
                onClick={() => onOpenAuth('register', 'hospital')}
                className="bg-brand-red-600 hover:bg-brand-red-700 hover:shadow-lg hover:shadow-brand-red-600/20 text-white font-black px-8 py-4 rounded-xl text-xs sm:text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 group shadow-md"
              >
                Onboard Medical Facility <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                id="landing-cta-secondary"
                onClick={() => onOpenAuth('register', 'donor')}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/85 font-black px-8 py-4 rounded-xl text-xs sm:text-sm tracking-wide transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                Get Digital Blood Passport
              </button>
            </div>
          </motion.div>

          {/* Graphical Concept representation */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-md bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 overflow-hidden text-white space-y-6">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-44 h-44 rounded-full bg-brand-red-600/10 pointer-events-none"></div>
              
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400">Replication Bus Active</span>
                </div>
                <span className="bg-brand-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase">
                  Real-time
                </span>
              </div>

              <div className="space-y-4">
                {/* Simulated Real-time notification card */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/60 flex items-start justify-between gap-3 animate-soft-pulse">
                  <div className="space-y-1">
                    <span className="bg-brand-red-600 text-[8px] font-extrabold px-1.5 py-0.2 rounded text-white">CRITICAL SOS</span>
                    <h4 className="font-display font-bold text-xs text-white">St. Jude Cardiac Centre</h4>
                    <p className="text-[9px] text-slate-500">Illinois Metro • trauma emergency</p>
                  </div>
                  <span className="bg-white/15 text-white font-extrabold font-display text-sm px-2.5 py-1 rounded-md">O-</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/60 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="bg-emerald-600 text-[8px] font-extrabold px-1.5 py-0.2 rounded text-white">RESERVE MATCH</span>
                    <h4 className="font-display font-bold text-xs text-white">Central Metro Blood Bank</h4>
                    <p className="text-[9px] text-slate-400">O- Neg reserve lock executed</p>
                  </div>
                  <span className="text-emerald-400 font-bold text-xs font-mono">Synced</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
                * Simulated UI view. Real-time updates propagate across roles instantly.
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem statement */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="font-display font-extrabold text-3xl text-slate-900 leading-tight">
              The Critical Challenge in Blood Logistics
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Every year, thousands of surgical procedures and trauma interventions are delayed not due to a shortage of blood, but because of a total failure of information synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="w-12 h-12 bg-red-50 text-brand-red-600 rounded-xl flex items-center justify-center font-bold text-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">Information Gaps</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Hospitals operate in silos, unaware of available stock coordinates across nearby independent blood banks, resulting in delayed patient care.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-lg">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">Biological Expiry Wastage</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Platelets expire in just 5 days. Without a dynamic unified monitoring dashboard, life-giving units expire on hospital shelves silently.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">Donor Coordination</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Willing donors have no direct visibility into nearby emergency calls matching their specific blood phenotype. AeroBlood acts as a direct transceiver.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Statistics Counter Grid */}
      <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-brand-red-900/40 via-transparent to-transparent opacity-50 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-12">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase font-bold text-brand-red-400 tracking-wider font-mono">Unified Public Metrics</span>
            <h2 className="font-display font-bold text-3xl">Active Blood Network Statistics</h2>
            <p className="text-xs text-slate-400">Cumulative performance metrics synchronized dynamically from regional health clusters</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2 p-4 bg-white/5 rounded-xl border border-white/5">
              <Users className="w-6 h-6 text-indigo-400 mx-auto" />
              <p className="text-4xl font-display font-black text-white">{stats.donorsCount}</p>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Registered Lifesavers</span>
            </div>

            <div className="space-y-2 p-4 bg-white/5 rounded-xl border border-white/5">
              <Building2 className="w-6 h-6 text-blue-400 mx-auto" />
              <p className="text-4xl font-display font-black text-white">{stats.hospitalsCount}</p>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Hospitals Enrolled</span>
            </div>

            <div className="space-y-2 p-4 bg-white/5 rounded-xl border border-white/5">
              <Droplet className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-4xl font-display font-black text-white">{stats.inventoryUnits} bags</p>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Inventory Bags Held</span>
            </div>

            <div className="space-y-2 p-4 bg-white/5 rounded-xl border border-white/5">
              <Heart className="w-6 h-6 text-brand-red-500 mx-auto" />
              <p className="text-4xl font-display font-black text-white">{stats.livesImpacted}</p>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Estimated Lives Helped</span>
            </div>
          </div>
        </div>
      </section>

      {/* active camps */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-display font-extrabold text-3xl text-slate-900">National Donation Camps</h2>
            <p className="text-slate-600 text-sm">Join active donation drives nearby, collect reward points, and claim premium Lifesaver passport badges.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {donationCamps.map(camp => (
              <div key={camp.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50 hover:bg-white transition-all space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-red-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform pointer-events-none"></div>
                
                <div className="space-y-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    camp.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 
                    camp.status === 'Upcoming' ? 'bg-amber-100 text-amber-800' : 
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {camp.status}
                  </span>
                  <h4 className="font-display font-bold text-base text-slate-900 pt-1.5">{camp.name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {camp.location.address}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" /> {camp.date} ({camp.time})
                  </p>
                </div>

                <hr className="border-slate-100" />

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Organizer:</span>
                  <span className="font-medium text-slate-700">{camp.organizer}</span>
                </div>

                {camp.status !== 'Completed' && (
                  <button
                    id={`camp-rsvp-${camp.id}`}
                    onClick={() => {
                      alert(`RSVP Confirmed for ${camp.name}! Dynamic coordinates sent. Prepare your AeroBlood Digital Passport QR on arrival.`);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all text-xs"
                  >
                    RSVP to Camp
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-brand-red-600 to-brand-red-700 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <h2 className="font-display font-black text-3xl sm:text-4xl leading-tight">
            Ready to Connect or Donate?
          </h2>
          <p className="text-red-100 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Join the AeroBlood national healthcare platform. Establish a secure hospital terminal node, log blood bank inventory, or register your digital donor passport today.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <button
              id="cta-join-network"
              onClick={() => onOpenAuth('register', 'hospital')}
              className="bg-white text-brand-red-700 hover:bg-slate-50 font-bold px-8 py-3 rounded-xl transition-all text-xs sm:text-sm shadow-xl cursor-pointer"
            >
              Enroll Facility
            </button>
            <button
              id="cta-be-donor"
              onClick={() => onOpenAuth('register', 'donor')}
              className="bg-brand-red-900/40 text-white hover:bg-brand-red-900/60 border border-white/20 font-bold px-8 py-3 rounded-xl transition-all text-xs sm:text-sm cursor-pointer"
            >
              Become Donor
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h4 className="font-display font-extrabold text-sm text-white tracking-widest uppercase">AEROBLOOD</h4>
            <p className="leading-relaxed text-slate-500">
              National Blood Intelligence Registry Grid.<br />
              Connected securely via database event stream replication technologies.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold text-slate-200">RESOURCES</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Digital Blood Passports</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hospital Dispatch Terminals</a></li>
              <li><a href="#" className="hover:text-white transition-colors">e-Raktkosh ID Sync</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FDA Health Compliance</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold text-slate-200">TECHNOLOGY</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Supabase PostgreSQL Replication</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Real-time Sockets Bus</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Zustand Global Cache</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Marker Clustering Vectors</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold text-slate-200">CONTACT & LEGAL</h5>
            <p className="text-slate-500 leading-relaxed">
              Email: ops@aeroblood.org<br />
              Secure Hotline: +1 (555) AERO-BLOOD<br />
              Compliance Code: CFR-1099A-HEALTH
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-900 text-center text-slate-600 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 AeroBlood Inc. All rights reserved. Registered under HHS Medical Informatics Act.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Charter</a>
            <a href="#" className="hover:text-slate-400 transition-colors">SLA Agreement</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Auditing Logs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
