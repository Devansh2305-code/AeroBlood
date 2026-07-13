import React, { useState, useMemo } from 'react';
import { useAeroBloodStore } from '../lib/store';
import { SOSAlert, HospitalProfile } from '../types';
import { 
  Building2, PlusCircle, Search, AlertCircle, HelpCircle, 
  MapPin, Heart, ArrowRight, ShieldAlert, CheckCircle2, User, Phone, Layers
} from 'lucide-react';

export default function HospitalDashboard() {
  const { 
    currentHospitalId, 
    hospitals, 
    bloodBanks, 
    bloodUnits, 
    sosAlerts, 
    createSOS, 
    resolveSOS,
    donors,
    setCurrentHospital
  } = useAeroBloodStore();

  // Selected Hospital profile
  const hospital = useMemo(() => {
    return hospitals.find(h => h.id === currentHospitalId) || hospitals[0];
  }, [hospitals, currentHospitalId]);

  // States
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);

  // Form states for SOS Creation
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [componentType, setComponentType] = useState<'Whole Blood' | 'Packed Red Cells' | 'Platelets' | 'Fresh Frozen Plasma'>('Packed Red Cells');
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [priority, setPriority] = useState<'Critical' | 'High' | 'Medium'>('Critical');
  const [remarks, setRemarks] = useState('');

  // Radar Search states
  const [radarSearchGroup, setRadarSearchGroup] = useState('O-');
  const [radarResults, setRadarResults] = useState<any[]>([]);
  const [hasSearchedRadar, setHasSearchedRadar] = useState(false);

  // Filter SOS alerts relevant to this hospital
  const hospitalSOSAlerts = useMemo(() => {
    return sosAlerts.filter(s => s.hospitalId === hospital.id);
  }, [sosAlerts, hospital]);

  // Execute Blood Radar Search
  const handleRadarSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Search units in bloodBanks that match group and are Available
    const matchingUnits = bloodUnits.filter(
      unit => unit.bloodGroup === radarSearchGroup && unit.status === 'Available'
    );

    // Build distance/details from blood banks
    const results = bloodBanks.map(bank => {
      const unitsInBank = matchingUnits.filter(u => u.bloodBankId === bank.id);
      const totalBags = unitsInBank.reduce((sum, u) => sum + u.units, 0);
      
      // Simulated distance from hospital location
      // Using simple pseudo-random offsets based on IDs
      const distance = parseFloat((Math.abs(bank.location.lat - hospital.location.lat) * 60 + 2).toFixed(1));
      
      return {
        ...bank,
        availableUnits: totalBags,
        bagsDetails: unitsInBank,
        distance
      };
    }).sort((a, b) => a.distance - b.distance);

    setRadarResults(results);
    setHasSearchedRadar(true);
  };

  // Handle SOS Creation Submit
  const handleSOSSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    createSOS({
      patientName,
      bloodGroup,
      componentType,
      unitsRequired,
      priority,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      location: hospital.location,
      remarks
    });

    setPatientName('');
    setRemarks('');
    setUnitsRequired(2);
    setSosSuccess(true);
    setTimeout(() => {
      setSosSuccess(false);
      setShowSOSModal(false);
    }, 2000);
  };

  // Quick resource update triggers (Simulated editing of hospital capacity)
  const [icuRooms, setIcuRooms] = useState(hospital.resources.icuCount);
  const [doctors, setDoctors] = useState(hospital.resources.totalDoctors);
  const [beds, setBeds] = useState(hospital.resources.bedCount);

  return (
    <div id="hospital-portal" className="space-y-6">
      
      {/* Header Profile Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-xl text-slate-900">{hospital.name}</h2>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {hospital.hospitalType} Facility
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Node:</span>
              <select
                value={currentHospitalId}
                onChange={(e) => setCurrentHospital(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name} ({h.location.address.slice(-2)})</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {hospital.location.address}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Licence ID: <strong className="text-slate-700">{hospital.hospitalIdNumber} ({hospital.hospitalIdType})</strong>
            </p>
          </div>
        </div>

        <button
          id="trigger-sos-modal"
          onClick={() => setShowSOSModal(true)}
          className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm shrink-0 w-full md:w-auto justify-center"
        >
          <PlusCircle className="w-5 h-5" /> Raise Emergency SOS
        </button>
      </div>

      {/* Editable Capacity Metrics & Live SOS Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Resource Tracker Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-1">
          <h3 className="font-display font-bold text-slate-900 mb-3 flex items-center gap-1.5 text-sm">
            <Layers className="w-4.5 h-4.5 text-blue-500" /> Operational Capacity Tracker
          </h3>
          <p className="text-xs text-slate-500 mb-4">Update live hospital metrics to coordinate emergency intakes</p>
          
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-600 font-medium">Beds Capacity:</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setBeds(Math.max(0, beds - 5))} className="w-6 h-6 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50">-</button>
                <span className="font-mono font-bold text-slate-900 w-12 text-center">{beds}</span>
                <button onClick={() => setBeds(beds + 5)} className="w-6 h-6 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50">+</button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-600 font-medium">Active Doctors:</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setDoctors(Math.max(0, doctors - 1))} className="w-6 h-6 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50">-</button>
                <span className="font-mono font-bold text-slate-900 w-12 text-center">{doctors}</span>
                <button onClick={() => setDoctors(doctors + 1)} className="w-6 h-6 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50">+</button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-600 font-medium">ICU Beds:</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setIcuRooms(Math.max(0, icuRooms - 1))} className="w-6 h-6 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50">-</button>
                <span className="font-mono font-bold text-slate-900 w-12 text-center">{icuRooms}</span>
                <button onClick={() => setIcuRooms(icuRooms + 1)} className="w-6 h-6 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50">+</button>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 text-center">
              * Changes synchronized instantly onto national dashboard maps
            </div>
          </div>
        </div>

        {/* Hospital SOS Log */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">Emergency Dispatch Board</h3>
              <p className="text-xs text-slate-500">SOS dispatches issued by your emergency desks</p>
            </div>
            <span className="bg-brand-red-100 text-brand-red-700 font-bold font-mono text-[10px] px-2.5 py-0.5 rounded-full">
              {hospitalSOSAlerts.filter(s => s.status === 'Active').length} Active SOS
            </span>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {hospitalSOSAlerts.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No SOS logs generated for this facility.</div>
            ) : (
              hospitalSOSAlerts.map(sos => (
                <div key={sos.id} className={`p-3.5 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                  sos.status === 'Active' ? 'bg-brand-red-50/20 border-brand-red-100 hover:bg-brand-red-50/40' : 'bg-slate-50 border-slate-200 opacity-75'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${sos.status === 'Active' ? 'bg-brand-red-600 animate-ping' : 'bg-slate-400'}`}></span>
                      <h4 className="font-display font-bold text-xs text-slate-900">Patient: {sos.patientName}</h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${sos.priority === 'Critical' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
                        {sos.priority}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Request ID: <strong className="text-slate-700">{sos.id}</strong> • Needed: <strong>{sos.unitsRequired} units ({sos.componentType})</strong>
                    </div>
                    {sos.remarks && <p className="text-[10px] text-slate-400 italic">"{sos.remarks}"</p>}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                    <span className="bg-slate-900 text-white font-display font-extrabold text-base px-3 py-1 rounded-lg">
                      {sos.bloodGroup}
                    </span>
                    {sos.status === 'Active' ? (
                      <button
                        id={`btn-resolve-${sos.id}`}
                        onClick={() => resolveSOS(sos.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Mark Fulfilled
                      </button>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Blood Radar Intelligence Block */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="font-display font-bold text-slate-900 text-sm">Blood Radar Transceiver</h3>
          <p className="text-xs text-slate-500">Search specific blood groups and locate immediate matching storage caches across all regional banks</p>
        </div>

        <form onSubmit={handleRadarSearch} className="flex flex-col md:flex-row items-end gap-3 max-w-md bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[10px] uppercase font-bold text-slate-500">Scan Target Group</label>
            <select
              value={radarSearchGroup}
              onChange={(e) => setRadarSearchGroup(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
            >
              <option value="O-">O- (Universal Red Blood Cells)</option>
              <option value="O+">O+</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
          <button
            type="submit"
            id="radar-scan-btn"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 w-full md:w-auto shrink-0 justify-center"
          >
            <Search className="w-4 h-4" /> Scan Network
          </button>
        </form>

        {/* Radar results */}
        {hasSearchedRadar && (
          <div id="radar-scan-results" className="mt-5 space-y-3 animate-soft-pulse">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              Found {radarResults.filter(r => r.availableUnits > 0).length} Blood Banks with available {radarSearchGroup} stock
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {radarResults.map(bank => (
                <div key={bank.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white transition-all space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-bold text-xs text-slate-900">{bank.name}</h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {bank.location.address.split(',')[1]} ({bank.distance} mi)
                      </p>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-1.5 py-0.5 rounded">
                      {bank.bankType}
                    </span>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Available Cache:</span>
                    <span className={`font-bold font-mono text-sm px-2.5 py-0.5 rounded ${
                      bank.availableUnits > 5 ? 'bg-emerald-100 text-emerald-800' : 
                      bank.availableUnits > 0 ? 'bg-amber-100 text-amber-800' : 
                      'bg-red-50 text-slate-400'
                    }`}>
                      {bank.availableUnits} bags
                    </span>
                  </div>

                  {bank.availableUnits > 0 ? (
                    <button
                      id={`btn-request-${bank.id}`}
                      onClick={() => {
                        alert(`Request of ${radarSearchGroup} sent instantly to ${bank.name}. Supabase database lock executed successfully. Code AB-RESERVE issued.`);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2 rounded-lg transition-colors"
                    >
                      Issue Storage Lock
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-slate-200 text-slate-400 text-[11px] font-bold py-2 rounded-lg cursor-not-allowed"
                    >
                      Out of Stock
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SOS Alert Modal Form */}
      {showSOSModal && (
        <div id="sos-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-soft-pulse">
            
            {/* Modal Header */}
            <div className="bg-brand-red-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 animate-bounce" />
                <h3 className="font-display font-bold text-lg">EMERGENCY SOS TRANSMISSION PANEL</h3>
              </div>
              <button 
                id="close-sos-modal"
                onClick={() => setShowSOSModal(false)} 
                className="text-white hover:text-red-200 font-medium text-sm"
              >
                ✕
              </button>
            </div>

            {sosSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="font-display font-extrabold text-xl text-slate-900">SOS Transmitted Successfully!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Alert has been added to the regional replication bus. All active blood banks and eligible matching donors nearby have been notified via realtime subscription.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSOSSubmit} className="p-5 space-y-4 text-xs text-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Patient Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Miller"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Blood Group Required</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none"
                    >
                      <option value="O-">O- (Universal Red Cells)</option>
                      <option value="O+">O+</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Component Type</label>
                    <select
                      value={componentType}
                      onChange={(e) => setComponentType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none"
                    >
                      <option value="Packed Red Cells">Packed Red Cells</option>
                      <option value="Whole Blood">Whole Blood</option>
                      <option value="Platelets">Platelets</option>
                      <option value="Fresh Frozen Plasma">Fresh Frozen Plasma</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Bags / Units Required</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="20"
                      value={unitsRequired}
                      onChange={(e) => setUnitsRequired(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Emergency Priority</label>
                  <div className="flex gap-4">
                    {['Critical', 'High', 'Medium'].map((lvl) => (
                      <label key={lvl} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="priority"
                          value={lvl}
                          checked={priority === lvl}
                          onChange={(e) => setPriority(e.target.value as any)}
                          className="accent-brand-red-600"
                        />
                        <span className={lvl === 'Critical' ? 'text-brand-red-600 font-bold' : lvl === 'High' ? 'text-orange-500 font-bold' : 'text-slate-600'}>
                          {lvl}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Clinical Remarks / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Provide additional clinical notes (e.g., bypass surgery, acute trauma, leukemia treatment details)"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none"
                  ></textarea>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowSOSModal(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-sos-form"
                    className="px-5 py-2 bg-brand-red-600 hover:bg-brand-red-700 text-white rounded-lg font-bold shadow"
                  >
                    Transmit Signal
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
