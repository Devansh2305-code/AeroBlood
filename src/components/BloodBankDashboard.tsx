import React, { useState, useMemo } from 'react';
import { useAeroBloodStore } from '../lib/store';
import { BloodUnit, SOSAlert } from '../types';
import { 
  Building2, Heart, PlusCircle, AlertTriangle, Calendar, 
  Trash2, Filter, Sparkles, CheckCircle, Clock, BarChart3, HelpCircle 
} from 'lucide-react';

const getStateAbbreviation = (address: string): string => {
  if (!address) return '';
  const clean = address.trim().toUpperCase();
  const words = clean.split(/[\s,]+/);
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i];
    if (w.length === 2 && /^[A-Z]{2}$/.test(w)) {
      return w;
    }
  }
  return clean.slice(-2);
};

export default function BloodBankDashboard() {
  const { 
    currentBloodBankId, 
    bloodBanks, 
    bloodUnits, 
    addBloodUnit, 
    updateBloodUnitStatus, 
    removeBloodUnit,
    sosAlerts,
    resolveSOS,
    setCurrentBloodBank
  } = useAeroBloodStore();

  // Selected Blood Bank profile
  const bloodBank = useMemo(() => {
    return bloodBanks.find(b => b.id === currentBloodBankId) || bloodBanks[0];
  }, [bloodBanks, currentBloodBankId]);

  // States
  const [showAddModal, setShowAddModal] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // Form fields for adding blood unit
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [componentType, setComponentType] = useState<BloodUnit['componentType']>('Packed Red Cells');
  const [unitsCount, setUnitsCount] = useState(1);
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);

  // Auto-calculate expiry date based on component guidelines
  const calculatedExpiryDate = useMemo(() => {
    const colDate = new Date(collectionDate);
    if (isNaN(colDate.getTime())) return '';
    
    let shelfLifeDays = 35; // Whole Blood
    if (componentType === 'Packed Red Cells') shelfLifeDays = 42;
    else if (componentType === 'Platelets') shelfLifeDays = 5;
    else if (componentType === 'Fresh Frozen Plasma') shelfLifeDays = 365;

    colDate.setDate(colDate.getDate() + shelfLifeDays);
    return colDate.toISOString().split('T')[0];
  }, [collectionDate, componentType]);

  // Filter blood units for this blood bank
  const bankUnits = useMemo(() => {
    return bloodUnits.filter(u => u.bloodBankId === bloodBank.id);
  }, [bloodUnits, bloodBank]);

  // Expiry stats & listings
  const expiryDetails = useMemo(() => {
    const today = new Date();
    
    return bankUnits.map(unit => {
      const expDate = new Date(unit.expiryDate);
      const timeDiff = expDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
      let urgencyText = 'Healthy';
      let level: 'green' | 'yellow' | 'orange' | 'red' | 'expired' = 'green';

      if (daysRemaining < 0) {
        statusColor = 'text-slate-500 bg-slate-100 border-slate-200';
        urgencyText = 'Expired';
        level = 'expired';
      } else if (daysRemaining === 1) {
        statusColor = 'text-red-700 bg-red-100 border-red-300 animate-pulse';
        urgencyText = 'CRITICAL (1 Day)';
        level = 'red';
      } else if (daysRemaining <= 3) {
        statusColor = 'text-orange-700 bg-orange-100 border-orange-300';
        urgencyText = 'Warning (3 Days)';
        level = 'orange';
      } else if (daysRemaining <= 7) {
        statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
        urgencyText = 'Expiring soon (7 Days)';
        level = 'yellow';
      }

      return {
        ...unit,
        daysRemaining,
        statusColor,
        urgencyText,
        level
      };
    });
  }, [bankUnits]);

  // Aggregate stats
  const bankStats = useMemo(() => {
    const total = bankUnits.reduce((sum, u) => sum + u.units, 0);
    const available = bankUnits.filter(u => u.status === 'Available').reduce((sum, u) => sum + u.units, 0);
    const reserved = bankUnits.filter(u => u.status === 'Reserved').reduce((sum, u) => sum + u.units, 0);
    
    // Count alerts in warning zones (<= 7 days)
    const criticalExpiryCount = expiryDetails.filter(u => u.daysRemaining >= 0 && u.daysRemaining <= 7).length;

    return { total, available, reserved, criticalExpiryCount };
  }, [bankUnits, expiryDetails]);

  // Active SOS filter scope
  const [filterScope, setFilterScope] = useState<'all' | 'regional'>('all');

  // Active SOS in the network
  const activeSOS = useMemo(() => {
    let list = sosAlerts.filter(s => s.status === 'Active');
    if (filterScope === 'regional') {
      const bankState = getStateAbbreviation(bloodBank.location.address);
      list = list.filter(s => getStateAbbreviation(s.location.address) === bankState);
    }
    return list;
  }, [sosAlerts, filterScope, bloodBank]);

  // Submit adding blood unit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBloodUnit({
      bloodGroup,
      componentType,
      units: unitsCount,
      collectionDate,
      expiryDate: calculatedExpiryDate,
      status: 'Available',
      bloodBankId: bloodBank.id,
      bloodBankName: bloodBank.name
    });

    setUnitsCount(1);
    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
      setShowAddModal(false);
    }, 1500);
  };

  return (
    <div id="bloodbank-portal" className="space-y-6">
      
      {/* Profile Header Block */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-xl text-slate-900">{bloodBank.name}</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {bloodBank.bankType}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400" /> License ID e-Raktkosh: <strong className="text-slate-800">{bloodBank.eRaktkoshId}</strong>
              </p>
              <p className="text-xs text-slate-500 font-mono">
                Contact: <strong className="text-slate-700">{bloodBank.emergencyContact}</strong>
              </p>
            </div>
            
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Node:</span>
              <select
                value={currentBloodBankId}
                onChange={(e) => setCurrentBloodBank(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {bloodBanks.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.location.address.slice(-2)})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          id="add-blood-unit-btn"
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm shrink-0 w-full md:w-auto justify-center"
        >
          <PlusCircle className="w-5 h-5" /> Add Blood Unit
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Blood Stock</span>
          <p className="text-2xl font-display font-bold text-slate-900 mt-1">{bankStats.total} units</p>
          <span className="text-[10px] text-slate-500">In physical custody</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Available Cache</span>
          <p className="text-2xl font-display font-bold text-emerald-600 mt-1">{bankStats.available} units</p>
          <span className="text-[10px] text-slate-500">Ready for instant locks</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-indigo-500">Reserved / Promised</span>
          <p className="text-2xl font-display font-bold text-indigo-500 mt-1">{bankStats.reserved} units</p>
          <span className="text-[10px] text-slate-500">Locks and dispatch orders</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-brand-red-600">Expiry Warnings</span>
          <p className="text-2xl font-display font-bold text-brand-red-600 mt-1">{bankStats.criticalExpiryCount} alerts</p>
          <span className="text-[10px] text-slate-500">Expiring in &lt; 7 days</span>
          {bankStats.criticalExpiryCount > 0 && (
            <div className="absolute right-3 top-3 w-2 h-2 bg-brand-red-600 rounded-full animate-ping"></div>
          )}
        </div>
      </div>

      {/* Main split dashboard: Inventory table & Expiry monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Inventory Management Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">Physical Inventory Catalog</h3>
              <p className="text-xs text-slate-500">Manage real-time state of blood group reserves</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                  <th className="p-3">Unit ID</th>
                  <th className="p-3">Group</th>
                  <th className="p-3">Component Type</th>
                  <th className="p-3">Qty (Bags)</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bankUnits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">No blood stock logged. Add units to start.</td>
                  </tr>
                ) : (
                  bankUnits.map(unit => {
                    // Find matching expiry detail
                    const expDetail = expiryDetails.find(e => e.id === unit.id);
                    return (
                      <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-700">{unit.id}</td>
                        <td className="p-3">
                          <span className="bg-slate-900 text-white font-extrabold font-display px-2 py-0.5 rounded text-xs">
                            {unit.bloodGroup}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-800">{unit.componentType}</td>
                        <td className="p-3 font-mono font-semibold text-slate-900">{unit.units} bags</td>
                        <td className="p-3 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${expDetail?.statusColor}`}>
                            {unit.expiryDate}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={unit.status}
                            onChange={(e) => updateBloodUnitStatus(unit.id, e.target.value as any)}
                            className={`p-1.5 rounded font-bold border ${
                              unit.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              unit.status === 'Reserved' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              unit.status === 'Used' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            <option value="Available">Available</option>
                            <option value="Reserved">Reserved</option>
                            <option value="Used">Used</option>
                            <option value="Expired">Expired</option>
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            id={`btn-delete-${unit.id}`}
                            onClick={() => {
                              if (confirm('Are you sure you want to purge this physical blood unit from registries?')) {
                                removeBloodUnit(unit.id);
                              }
                            }}
                            className="text-slate-400 hover:text-brand-red-600 p-1 rounded hover:bg-red-50 transition-colors inline-block"
                            title="Delete unit record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expiry Warning Monitor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-display font-bold text-slate-900 text-sm">Biological Expiry Monitor</h3>
            <p className="text-xs text-slate-500">Live monitoring of shelf-life across products</p>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 text-xs">
            {expiryDetails.filter(u => u.daysRemaining <= 7).length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-55" />
                <p className="font-medium text-slate-500">No Critical Expiries</p>
                <p className="text-[10px] text-slate-400 mt-1">All blood units report healthy shelf-lives above 7 days.</p>
              </div>
            ) : (
              expiryDetails
                .filter(u => u.daysRemaining <= 7)
                .sort((a,b) => a.daysRemaining - b.daysRemaining)
                .map(item => (
                  <div key={item.id} className={`p-3 border rounded-xl flex items-start justify-between gap-3 ${
                    item.level === 'red' || item.level === 'expired' ? 'bg-red-50/50 border-red-200' :
                    item.level === 'orange' ? 'bg-orange-50/50 border-orange-200' :
                    'bg-amber-50/50 border-amber-200'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          item.level === 'red' || item.level === 'expired' ? 'bg-red-600' : 'bg-amber-500'
                        }`}></span>
                        <span className="font-mono font-bold text-slate-900">{item.id}</span>
                        <span className="font-bold text-slate-800">{item.componentType}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Group: <strong>{item.bloodGroup}</strong> • Qty: <strong>{item.units} units</strong>
                      </p>
                      <div className="pt-1">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${item.statusColor}`}>
                          {item.urgencyText}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {item.daysRemaining < 0 ? (
                        <button
                          id={`btn-disposal-${item.id}`}
                          onClick={() => {
                            alert(`Clinical disposal protocol triggered. Record cleared for security purposes.`);
                            removeBloodUnit(item.id);
                          }}
                          className="text-[9px] bg-slate-900 hover:bg-red-700 hover:text-white border border-slate-700 font-bold px-2 py-1 rounded transition-all"
                        >
                          Disposal Run
                        </button>
                      ) : (
                        <button
                          id={`btn-reassign-${item.id}`}
                          onClick={() => {
                            alert(`Priority routing initiated. Local hospitals notified of high discount clearance units.`);
                          }}
                          className="text-[9px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded transition-all"
                        >
                          Push Dispatch
                        </button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Active Hospital SOS alert matching nearby */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-slate-900 text-sm">Active Network Demands</h3>
            <p className="text-xs text-slate-500">Live emergency requests matching your regional cache</p>
          </div>
          
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 w-max shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setFilterScope('all')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                filterScope === 'all' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Grid ({sosAlerts.filter(s => s.status === 'Active').length})
            </button>
            <button
              onClick={() => setFilterScope('regional')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                filterScope === 'regional' 
                  ? 'bg-brand-red-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Regional ({sosAlerts.filter(s => s.status === 'Active' && getStateAbbreviation(s.location.address) === getStateAbbreviation(bloodBank.location.address)).length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeSOS.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-slate-400 text-xs">No active SOS alerts in network.</div>
          ) : (
            activeSOS.map(sos => {
              // Find matching units in inventory to commit
              const matches = bankUnits.filter(u => u.bloodGroup === sos.bloodGroup && u.status === 'Available');
              const matchCount = matches.reduce((sum, u) => sum + u.units, 0);

              return (
                <div key={sos.id} className="p-4 border border-brand-red-100 bg-brand-red-50/10 rounded-xl hover:border-brand-red-200 transition-all flex flex-col justify-between gap-3 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-brand-red-600 rounded-full animate-ping"></div>
                        <h4 className="font-display font-bold text-slate-900">{sos.hospitalName}</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Raised at {new Date(sos.createdAt).toLocaleTimeString()}
                      </p>
                      <p className="text-[10px] bg-brand-red-100/60 text-brand-red-700 px-2.5 py-0.5 rounded font-bold w-max mt-2">
                        Needed: {sos.unitsRequired} units ({sos.componentType})
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="bg-brand-red-600 text-white font-display font-extrabold text-lg px-3 py-1 rounded-lg block">
                        {sos.bloodGroup}
                      </span>
                    </div>
                  </div>

                  <hr className="border-brand-red-100/30" />

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Your available stock:</span>
                    <span className={`font-bold ${matchCount >= sos.unitsRequired ? 'text-emerald-600' : 'text-orange-500'}`}>
                      {matchCount} units
                    </span>
                  </div>

                  {matchCount > 0 ? (
                    <button
                      id={`btn-commit-sos-${sos.id}`}
                      onClick={() => {
                        resolveSOS(sos.id);
                        alert(`Successfully committed blood units. Dispatch route created to ${sos.hospitalName}. SOS resolved.`);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-colors"
                    >
                      Commit & Fulfill SOS
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-slate-200 text-slate-400 font-bold py-2 rounded-lg cursor-not-allowed"
                    >
                      Insufficient Stock to Fulfill
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Blood Unit Modal */}
      {showAddModal && (
        <div id="add-blood-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            
            {/* Header */}
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-display font-bold text-lg">ADD BLOOD UNIT</h3>
              </div>
              <button 
                id="close-add-blood-modal"
                onClick={() => setShowAddModal(false)} 
                className="text-white hover:text-emerald-100 font-bold"
              >
                ✕
              </button>
            </div>

            {successToast ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h4 className="font-display font-extrabold text-xl text-slate-900">Stock Updated Successfully</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  New blood group storage record has been safely written into Supabase. Synced instantly on the Radar map view.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs text-slate-700">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none"
                    >
                      <option value="O-">O- (Universal)</option>
                      <option value="O+">O+</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Product Quantity</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="50"
                      value={unitsCount}
                      onChange={(e) => setUnitsCount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Blood Component Type</label>
                  <select
                    value={componentType}
                    onChange={(e) => setComponentType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none"
                  >
                    <option value="Packed Red Cells">Packed Red Cells (expires in 42d)</option>
                    <option value="Whole Blood">Whole Blood (expires in 35d)</option>
                    <option value="Platelets">Platelets (expires in 5d)</option>
                    <option value="Fresh Frozen Plasma">Fresh Frozen Plasma (expires in 365d)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Collection Date</label>
                  <input
                    type="date"
                    required
                    value={collectionDate}
                    onChange={(e) => setCollectionDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1 font-mono text-[10px]">
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[8px]">HEALTHCARE SYSTEM AUTO-FORMULAS</p>
                  <div className="flex justify-between">
                    <span>Component Shelf-Life:</span>
                    <span className="font-bold text-slate-800">
                      {componentType === 'Platelets' ? '5 Days' : componentType === 'Packed Red Cells' ? '42 Days' : componentType === 'Whole Blood' ? '35 Days' : '365 Days'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Computed Expiry Date:</span>
                    <span className="font-bold text-brand-red-600">{calculatedExpiryDate}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-blood-unit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow"
                  >
                    Update Stock
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
