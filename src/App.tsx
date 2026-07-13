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
  Sparkles, AlertCircle, HelpCircle, ArrowRight, Lock
} from 'lucide-react';

export default function App() {
  const { currentRole, setRole, syncMessages } = useAeroBloodStore();
  const [showLanding, setShowLanding] = useState(true);
  const [lookupPassportId, setLookupPassportId] = useState<string | null>(null);

  // Authentication & Onboarding overlays
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<UserRole>('donor');
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login');
  
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
              {/* Dynamic status indicator */}
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/60 px-3 py-1.5 rounded-xl text-[11px] font-medium text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>National Grid Live</span>
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
      {!lookupPassportId && (
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
