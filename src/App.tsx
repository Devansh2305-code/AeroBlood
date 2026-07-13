import React, { useState, useEffect } from 'react';
import { useAeroBloodStore } from './lib/store';
import { UserRole } from './types';
import LandingPage from './components/LandingPage';
import NotificationBanner from './components/NotificationBanner';
import LiveNetworkMap from './components/LiveNetworkMap';
import NationalDashboard from './components/NationalDashboard';
import HospitalDashboard from './components/HospitalDashboard';
import BloodBankDashboard from './components/BloodBankDashboard';
import DonorDashboard from './components/DonorDashboard';
import AeroBloodLogo from './components/AeroBloodLogo';
import PassportLookupView from './components/PassportLookupView';
import AuthGatewayModal from './components/AuthGatewayModal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, Building2, Droplet, Users, LayoutDashboard, 
  Tv, MonitorDot, Sparkles, AlertCircle, HelpCircle, ArrowRight, Lock
} from 'lucide-react';

export default function App() {
  const { currentRole, setRole, syncMessages } = useAeroBloodStore();
  const [showLanding, setShowLanding] = useState(true);
  const [lookupPassportId, setLookupPassportId] = useState<string | null>(null);

  // Authentication & Onboarding overlays
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<UserRole>('donor');
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login');
  
  // Dual-screen simulator state (to show real-time synchronization visually)
  const [dualScreenMode, setDualScreenMode] = useState(false);
  const [leftRole, setLeftRole] = useState<UserRole>('hospital');
  const [rightRole, setRightRole] = useState<UserRole>('blood_bank');

  // Change page title dynamically and check URL for passport lookup
  useEffect(() => {
    document.title = "AeroBlood - Connecting Blood. Saving Lives.";
    
    const params = new URLSearchParams(window.location.search);
    const passport = params.get('passport') || params.get('lookup');
    if (passport) {
      setLookupPassportId(passport);
      setShowLanding(false); // bypass landing to load lookup page immediately
    }
  }, []);

  // Quick navigation helper
  const handleStartPortal = (roleSelection?: UserRole) => {
    if (roleSelection) {
      setRole(roleSelection);
      if (roleSelection === 'hospital') setLeftRole('hospital');
      if (roleSelection === 'donor') setRightRole('donor');
    }
    setShowLanding(false);
  };

  if (showLanding) {
    return (
      <>
        <LandingPage 
          onStart={handleStartPortal} 
          onOpenAuth={(tab, role) => {
            setAuthDefaultTab(tab);
            if (role) setAuthDefaultRole(role);
            setIsAuthOpen(true);
          }} 
        />
        <AuthGatewayModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
          defaultRole={authDefaultRole}
          defaultTab={authDefaultTab}
          onSuccess={() => setShowLanding(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* Real-time sync notifications banner at very top */}
      <NotificationBanner />

      {/* Main Navigation Header */}
      <header className="bg-white border-b border-slate-200 shadow-xs px-4 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo & Tagline */}
          <div className="cursor-pointer" onClick={() => {
            if (lookupPassportId) {
              setLookupPassportId(null);
              window.history.replaceState({}, '', window.location.pathname);
            }
            setShowLanding(true);
          }}>
            <AeroBloodLogo size="md" showText={true} />
          </div>

          {lookupPassportId ? (
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-[11px] font-bold text-indigo-700 font-mono shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse animate-duration-1000" />
              SECURE PORTAL VERIFICATION GATEWAY
            </div>
          ) : (
            <>
              {/* Sandbox mode instructions / badge */}
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/60 px-3 py-1.5 rounded-xl text-[11px] font-medium text-slate-600">
                <Sparkles className="w-4 h-4 text-brand-red-600" />
                <span>Interactive Simulator Mode</span>
              </div>

              {/* Primary workspace layout switchers */}
              <div className="flex items-center gap-3">
                <button
                  id="header-gateway-btn"
                  onClick={() => {
                    setAuthDefaultTab('login');
                    setAuthDefaultRole(currentRole);
                    setIsAuthOpen(true);
                  }}
                  className="px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Open secure login & registration gateway"
                >
                  <Lock className="w-3.5 h-3.5 text-brand-red-500 animate-pulse" />
                  <span>Secure Handshake</span>
                </button>

                <button
                  id="toggle-dual-mode"
                  onClick={() => setDualScreenMode(!dualScreenMode)}
                  className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    dualScreenMode 
                      ? 'bg-slate-900 text-white border-slate-900 shadow' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Split screen layout to observe instant real-time synchronization between portals"
                >
                  <Tv className="w-4 h-4" />
                  <span>{dualScreenMode ? 'Single Screen View' : 'Split Sandbox (Realtime Demo)'}</span>
                </button>

                <button
                  id="back-to-landing-btn"
                  onClick={() => setShowLanding(true)}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Portal Exit
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Role Navigation and Controller (Only shown in single view mode, and not in public lookup) */}
      {!dualScreenMode && !lookupPassportId && (
        <div className="bg-slate-100/80 border-b border-slate-200 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Select Portal Node:</span>
            
            <div className="flex flex-wrap gap-1.5">
              <button
                id="portal-switch-national"
                onClick={() => setRole('super_admin')}
                className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentRole === 'super_admin' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> National Grid & Map
              </button>

              <button
                id="portal-switch-hospital"
                onClick={() => setRole('hospital')}
                className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentRole === 'hospital' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" /> Hospital Terminal
              </button>

              <button
                id="portal-switch-bank"
                onClick={() => setRole('blood_bank')}
                className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentRole === 'blood_bank' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <Droplet className="w-4 h-4" /> Blood Bank Manager
              </button>

              <button
                id="portal-switch-donor"
                onClick={() => setRole('donor')}
                className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentRole === 'donor' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" /> Donor Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {lookupPassportId ? (
          <PassportLookupView 
            passportId={lookupPassportId} 
            onClose={() => {
              setLookupPassportId(null);
              window.history.replaceState({}, '', window.location.pathname);
            }} 
          />
        ) : dualScreenMode ? (
          /* Split Screen Real-time Synchronization Sandbox Layout */
          <div className="space-y-6">
            
            {/* Sandbox explanation bar */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3 text-xs text-indigo-900 shadow-xs">
              <MonitorDot className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="font-bold">Real-time Dual Device Synchronization Environment</h4>
                <p className="text-indigo-700 mt-1 leading-relaxed">
                  Try raising an <strong>Emergency SOS</strong> from the Hospital Panel on the Left. Watch it instantly propagate to the Blood Bank inventories, Donor pledges, maps, and system logs on the Right. No page refresh is required!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              
              {/* Left Screen Device Column */}
              <div id="sandbox-left-device" className="bg-slate-100 p-4 rounded-2xl border-4 border-slate-800 shadow-2xl relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 bg-slate-800 text-white text-[9px] font-bold px-4 py-0.5 rounded-b-md tracking-widest uppercase z-10">
                  DEVICE ALPHA
                </div>
                
                {/* Left Selector */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4 text-xs font-bold text-slate-700">
                  <span>Acting as:</span>
                  <select 
                    value={leftRole} 
                    onChange={(e) => setLeftRole(e.target.value as any)}
                    className="bg-white border border-slate-300 p-1.5 rounded focus:outline-none"
                  >
                    <option value="hospital">Hospital Terminal</option>
                    <option value="super_admin">National Grid</option>
                    <option value="blood_bank">Blood Bank Manager</option>
                    <option value="donor">Donor Portal</option>
                  </select>
                </div>

                {/* Left Component Render */}
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                  <AnimatePresence mode="wait">
                    {leftRole === 'super_admin' && (
                      <motion.div
                        key="left-super_admin"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <NationalDashboard />
                      </motion.div>
                    )}
                    {leftRole === 'hospital' && (
                      <motion.div
                        key="left-hospital"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <HospitalDashboard />
                      </motion.div>
                    )}
                    {leftRole === 'blood_bank' && (
                      <motion.div
                        key="left-blood_bank"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <BloodBankDashboard />
                      </motion.div>
                    )}
                    {leftRole === 'donor' && (
                      <motion.div
                        key="left-donor"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <DonorDashboard />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Screen Device Column */}
              <div id="sandbox-right-device" className="bg-slate-100 p-4 rounded-2xl border-4 border-slate-800 shadow-2xl relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 bg-slate-800 text-white text-[9px] font-bold px-4 py-0.5 rounded-b-md tracking-widest uppercase z-10">
                  DEVICE BETA
                </div>
                
                {/* Right Selector */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4 text-xs font-bold text-slate-700">
                  <span>Acting as:</span>
                  <select 
                    value={rightRole} 
                    onChange={(e) => setRightRole(e.target.value as any)}
                    className="bg-white border border-slate-300 p-1.5 rounded focus:outline-none"
                  >
                    <option value="blood_bank">Blood Bank Manager</option>
                    <option value="donor">Donor Portal</option>
                    <option value="super_admin">National Grid</option>
                    <option value="hospital">Hospital Terminal</option>
                  </select>
                </div>

                {/* Right Component Render */}
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                  <AnimatePresence mode="wait">
                    {rightRole === 'super_admin' && (
                      <motion.div
                        key="right-super_admin"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <NationalDashboard />
                      </motion.div>
                    )}
                    {rightRole === 'hospital' && (
                      <motion.div
                        key="right-hospital"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <HospitalDashboard />
                      </motion.div>
                    )}
                    {rightRole === 'blood_bank' && (
                      <motion.div
                        key="right-blood_bank"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <BloodBankDashboard />
                      </motion.div>
                    )}
                    {rightRole === 'donor' && (
                      <motion.div
                        key="right-donor"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <DonorDashboard />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>

            {/* Split Screen Live Map Integration */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-display font-extrabold text-slate-900 text-lg mb-4 flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand-red-600" /> Integrated Network GIS Mapping
              </h3>
              <LiveNetworkMap />
            </div>

          </div>
        ) : (
          /* Standard Fullscreen Portal Layout */
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {currentRole === 'super_admin' && (
                <motion.div
                  key="super_admin"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <NationalDashboard />
                  <LiveNetworkMap />
                </motion.div>
              )}

              {currentRole === 'hospital' && (
                <motion.div
                  key="hospital"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <HospitalDashboard />
                </motion.div>
              )}

              {currentRole === 'blood_bank' && (
                <motion.div
                  key="blood_bank"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <BloodBankDashboard />
                </motion.div>
              )}

              {currentRole === 'donor' && (
                <motion.div
                  key="donor"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <DonorDashboard />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </main>

      {/* Bottom Legal bar */}
      <footer className="bg-slate-100 border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 AeroBlood National Grid. Unified Health Informatics code HHS-109.</p>
          <div className="flex gap-4">
            <button onClick={() => setShowLanding(true)} className="hover:text-slate-800 transition-colors">Documentation</button>
            <button onClick={() => setShowLanding(true)} className="hover:text-slate-800 transition-colors">Privacy Charter</button>
            <button onClick={() => setShowLanding(true)} className="hover:text-slate-800 transition-colors font-semibold text-brand-red-600">Secure Protocol</button>
          </div>
        </div>
      </footer>

      <AuthGatewayModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        defaultRole={authDefaultRole}
        defaultTab={authDefaultTab}
      />

    </div>
  );
}
