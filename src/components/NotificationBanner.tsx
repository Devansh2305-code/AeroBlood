import React, { useState, useEffect } from 'react';
import { useAeroBloodStore } from '../lib/store';
import { Radio, Bell, X, ShieldAlert, CheckCircle, Database, HelpCircle, HeartHandshake } from 'lucide-react';

export default function NotificationBanner() {
  const { syncMessages, clearSyncMessages } = useAeroBloodStore();
  const [isOpen, setIsOpen] = useState(false);
  const [latestMessage, setLatestMessage] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);

  // Trigger notification toast on new message additions
  useEffect(() => {
    if (syncMessages.length > 0) {
      const msg = syncMessages[0];
      if (msg.id !== 'INIT-LOG') {
        setLatestMessage(msg);
        setShowToast(true);
        const timer = setTimeout(() => {
          setShowToast(false);
        }, 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [syncMessages]);

  const getEventDescription = (msg: any) => {
    if (!msg) return '';
    switch (msg.messageType) {
      case 'SOS_CREATED':
        return `Emergency SOS raised for ${msg.payload.bloodGroup} by ${msg.senderName}! Required: ${msg.payload.unitsRequired} units.`;
      case 'SOS_FULFILLED':
        return `Emergency SOS fulfilled for ${msg.payload.patientName} at ${msg.senderName}. Great job!`;
      case 'INVENTORY_UPDATED':
        return `Blood inventory refreshed by ${msg.senderName}: Group ${msg.payload.bloodGroup} status is now ${msg.payload.status}.`;
      case 'CAMP_ADDED':
        return `New blood donation campaign listed: "${msg.payload.name}" by ${msg.payload.organizer}.`;
      case 'DONOR_REGISTERED':
        return `New lifesaver registered: ${msg.senderName} (Group ${msg.payload.bloodGroup}). Welcome!`;
      default:
        return 'System intelligence synchronization triggered.';
    }
  };

  return (
    <div className="z-40 relative">
      {/* Toast Alert */}
      {showToast && latestMessage && (
        <div id="realtime-toast" className="fixed bottom-5 right-5 max-w-md w-full bg-slate-900 text-white rounded-xl shadow-2xl border-l-4 border-brand-red-600 p-4 animate-bounce z-50 flex items-start gap-3">
          <div className="p-1 bg-brand-red-600/20 text-brand-red-500 rounded-full shrink-0 mt-0.5 animate-pulse">
            <Radio className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                REAL-TIME SIGNAL RECEIVER
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Just Now
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-200 mt-1">
              {getEventDescription(latestMessage)}
            </p>
            <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
              Synchronized instantly across all portals.
            </div>
          </div>
          <button 
            id="close-toast-btn"
            onClick={() => setShowToast(false)} 
            className="text-slate-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Ribbon Banner indicator */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase font-mono animate-soft-pulse">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Supabase Realtime Connected
          </span>
          <p className="hidden md:inline text-slate-300">
            AeroBlood Sync Layer active. Any changes instantly replicate without refresh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="sync-logs-btn"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 hover:text-brand-red-500 transition-colors cursor-pointer text-slate-200"
          >
            <Bell className="w-4 h-4 text-brand-red-500 shrink-0" />
            <span>Network Log ({syncMessages.length})</span>
          </button>
        </div>
      </div>

      {/* Network Logs Drawer Panel */}
      {isOpen && (
        <div id="sync-messages-drawer" className="bg-slate-950 border-b border-slate-800 text-white p-4 max-h-72 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-display font-bold text-slate-100">Live PostgreSQL Replication Bus</h4>
                  <p className="text-[10px] text-slate-400">Chronological history of Supabase Auth & Realtime event streams</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  id="clear-logs-btn"
                  onClick={clearSyncMessages}
                  className="text-[10px] text-slate-400 hover:text-white border border-slate-800 px-2.5 py-1 rounded transition-colors"
                >
                  Clear Logs
                </button>
                <button 
                  id="close-drawer-btn"
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] text-slate-400 hover:text-white border border-slate-800 px-2.5 py-1 rounded transition-colors"
                >
                  Minimize
                </button>
              </div>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              {syncMessages.length === 0 ? (
                <div className="text-center text-slate-500 py-4">No events in database socket channel yet. Trigger some actions!</div>
              ) : (
                syncMessages.map((msg) => (
                  <div key={msg.id} className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900/50 p-2.5 rounded border border-slate-800/40 hover:bg-slate-900/80 transition-colors gap-2">
                    <div className="flex items-start md:items-center gap-2.5">
                      <span className="text-slate-500 shrink-0">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                        msg.messageType === 'SOS_CREATED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        msg.messageType === 'SOS_FULFILLED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        msg.messageType === 'INVENTORY_UPDATED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        msg.messageType === 'CAMP_ADDED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {msg.messageType}
                      </span>
                      <span className="text-slate-300">
                        {getEventDescription(msg)}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-sans shrink-0 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800/60 align-right self-end md:self-auto">
                      <span>Source:</span>
                      <span className="font-bold text-slate-200 capitalize">{msg.senderRole.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
