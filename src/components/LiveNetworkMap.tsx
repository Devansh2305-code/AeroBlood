import React, { useState, useMemo } from 'react';
import { useAeroBloodStore } from '../lib/store';
import { HospitalProfile, BloodBankProfile, SOSAlert, DonationCamp } from '../types';
import { MapPin, AlertCircle, Building2, Calendar, Compass, Layers, ZoomIn, ZoomOut, Search, Filter } from 'lucide-react';

export default function LiveNetworkMap() {
  const { hospitals, bloodBanks, sosAlerts, donationCamps } = useAeroBloodStore();
  
  // States
  const [mapMode, setMapMode] = useState<'streets' | 'heatmap'>('streets');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedRadius, setSelectedRadius] = useState<number>(50); // miles
  const [activeItem, setActiveItem] = useState<{
    type: 'hospital' | 'blood_bank' | 'sos' | 'camp';
    data: any;
  } | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Coordinate limits to fit our mock data beautifully (IL, WI, MO)
  // Midwest boundaries: lat 38 to 44, lng -91 to -87
  const minLat = 38.0;
  const maxLat = 44.0;
  const minLng = -91.0;
  const maxLng = -87.0;

  // Convert GPS coordinates to percentage positions for SVG grid
  const getXY = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100; // Invert Y since 0 is top
    return { 
      x: Math.max(10, Math.min(90, x)), 
      y: Math.max(10, Math.min(90, y)) 
    };
  };

  // Pre-calculate positions
  const mappedHospitals = useMemo(() => {
    return hospitals.map(h => ({ ...h, ...getXY(h.location.lat, h.location.lng) }));
  }, [hospitals]);

  const mappedBanks = useMemo(() => {
    return bloodBanks.map(b => ({ ...b, ...getXY(b.location.lat, b.location.lng) }));
  }, [bloodBanks]);

  const mappedSOS = useMemo(() => {
    return sosAlerts
      .filter(s => s.status === 'Active')
      .map(s => ({ ...s, ...getXY(s.location.lat, s.location.lng) }));
  }, [sosAlerts]);

  const mappedCamps = useMemo(() => {
    return donationCamps
      .filter(c => c.status !== 'Completed')
      .map(c => ({ ...c, ...getXY(c.location.lat, c.location.lng) }));
  }, [donationCamps]);

  // Handle click on marker
  const handleMarkerClick = (type: 'hospital' | 'blood_bank' | 'sos' | 'camp', data: any) => {
    setActiveItem({ type, data });
  };

  // Filter items based on blood group and searchQuery
  const filteredSOS = useMemo(() => {
    return mappedSOS.filter(s => {
      const matchBlood = selectedBloodGroup === 'All' || s.bloodGroup === selectedBloodGroup;
      const matchQuery = s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBlood && matchQuery;
    });
  }, [mappedSOS, selectedBloodGroup, searchQuery]);

  // Determine supply status for Heatmap (aggregated around blood banks)
  const heatmapCircles = useMemo(() => {
    return mappedBanks.map(b => {
      // Simulate random/varying supply status
      let colorClass = 'rgba(239, 68, 68, 0.4)'; // Red (Low)
      let supplyText = 'Critical Supply';
      if (b.name.includes('Central')) {
        colorClass = 'rgba(34, 197, 94, 0.4)'; // Green (Healthy)
        supplyText = 'Healthy Supply';
      } else if (b.name.includes('Springfield')) {
        colorClass = 'rgba(234, 179, 8, 0.4)'; // Yellow (Average)
        supplyText = 'Average Supply';
      } else {
        colorClass = 'rgba(249, 115, 22, 0.4)'; // Orange (Low)
        supplyText = 'Low Supply';
      }
      return {
        ...b,
        colorClass,
        supplyText
      };
    });
  }, [mappedBanks]);

  return (
    <div id="live-blood-map" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[580px]">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-brand-red-600 rounded-full animate-pulse"></div>
          <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-red-600" />
            Live National Blood Network Map
          </h3>
        </div>
        
        {/* Toggle street/heatmap */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm text-xs">
          <button 
            id="map-mode-streets"
            onClick={() => setMapMode('streets')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${mapMode === 'streets' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Network View
          </button>
          <button 
            id="map-mode-heatmap"
            onClick={() => setMapMode('heatmap')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${mapMode === 'heatmap' ? 'bg-brand-red-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Supply Heatmap
          </button>
        </div>
      </div>

      {/* Control filters */}
      <div className="p-3 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs bg-white">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search map elements..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-red-600 focus:bg-white text-slate-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 shrink-0">Blood:</span>
          <select 
            value={selectedBloodGroup} 
            onChange={(e) => setSelectedBloodGroup(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-red-600"
          >
            <option value="All">All Groups</option>
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

        <div className="flex items-center gap-2">
          <span className="text-slate-500 shrink-0">Region:</span>
          <select 
            value={selectedState} 
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none"
          >
            <option value="All">All Regions</option>
            <option value="IL">Illinois (IL)</option>
            <option value="WI">Wisconsin (WI)</option>
            <option value="MO">Missouri (MO)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 shrink-0">Radar Radius:</span>
          <input 
            type="range" 
            min="10" 
            max="150" 
            value={selectedRadius}
            onChange={(e) => setSelectedRadius(Number(e.target.value))}
            className="w-full accent-brand-red-600"
          />
          <span className="text-slate-600 font-mono font-medium shrink-0 w-12 text-right">{selectedRadius}mi</span>
        </div>
      </div>

      {/* Main Map Body split view */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden bg-slate-900">
        
        {/* Map Grid canvas using vector rendering */}
        <div className="flex-1 h-full relative overflow-hidden select-none">
          
          {/* Map Base Background */}
          <div className={`absolute inset-0 transition-colors duration-500 ${mapMode === 'heatmap' ? 'bg-slate-950' : 'bg-[#f4f3f0]'}`}>
            
            {/* Simulated Grid roads / topography */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
              <defs>
                <pattern id="road-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke={mapMode === 'heatmap' ? '#334155' : '#cbd5e1'} strokeWidth="1" />
                </pattern>
                <radialGradient id="glowing-node" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#road-grid)" />
              
              {/* Rivers/Lakes outline simulation */}
              <path d="M-10,120 Q50,150 120,80 T300,100 T500,20 T800,200" fill="none" stroke={mapMode === 'heatmap' ? '#1e293b' : '#93c5fd'} strokeWidth="16" />
              <path d="M400,250 Q480,300 600,210 T900,400" fill="none" stroke={mapMode === 'heatmap' ? '#1e293b' : '#93c5fd'} strokeWidth="10" />
            </svg>

            {/* Simulated States Borders */}
            <div className="absolute top-1/4 left-1/2 w-px h-1/2 border-l border-dashed border-slate-400/30"></div>
            <div className="absolute top-1/2 left-1/4 w-3/4 h-px border-t border-dashed border-slate-400/30"></div>
            
            <span className="absolute top-[20%] left-[25%] font-display text-xs font-bold uppercase tracking-wider text-slate-400/30 pointer-events-none">Wisconsin (WI)</span>
            <span className="absolute top-[60%] left-[35%] font-display text-xs font-bold uppercase tracking-wider text-slate-400/30 pointer-events-none">Illinois (IL)</span>
            <span className="absolute top-[75%] left-[12%] font-display text-xs font-bold uppercase tracking-wider text-slate-400/30 pointer-events-none">Missouri (MO)</span>
          </div>

          {/* Map Layer: Heat Zones / Circles (Only on Heatmap mode) */}
          {mapMode === 'heatmap' && (
            <div className="absolute inset-0 pointer-events-none">
              {heatmapCircles.map(bank => (
                <div 
                  key={bank.id}
                  className="absolute rounded-full transition-all duration-1000 flex items-center justify-center"
                  style={{
                    left: `${bank.x}%`,
                    top: `${bank.y}%`,
                    width: '160px',
                    height: '160px',
                    transform: 'translate(-50%, -50%)',
                    background: bank.colorClass,
                    boxShadow: '0 0 40px rgba(239, 68, 68, 0.1) inset'
                  }}
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                </div>
              ))}

              {/* Aggregated SOS Heat circles */}
              {filteredSOS.map(sos => (
                <div 
                  key={sos.id}
                  className="absolute rounded-full flex items-center justify-center animate-soft-pulse"
                  style={{
                    left: `${sos.x}%`,
                    top: `${sos.y}%`,
                    width: '100px',
                    height: '100px',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(220, 38, 38, 0.3)',
                    border: '1px solid rgba(220, 38, 38, 0.5)'
                  }}
                />
              ))}
            </div>
          )}

          {/* Map Layer: Markers */}
          <div className="absolute inset-0">
            
            {/* Blood Banks Markers */}
            {mappedBanks.map(bank => (
              <button
                key={bank.id}
                onClick={() => handleMarkerClick('blood_bank', bank)}
                className="absolute focus:outline-none group hover:scale-110 transition-transform cursor-pointer"
                style={{ left: `${bank.x}%`, top: `${bank.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="bg-emerald-600 text-white p-1.5 rounded-full shadow-lg border border-white hover:bg-emerald-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                {/* Minimal tooltip on hover */}
                <span className="absolute left-1/2 -bottom-7 -translate-x-1/2 bg-slate-900/95 text-[10px] text-white font-medium px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
                  {bank.name}
                </span>
              </button>
            ))}

            {/* Hospital Markers */}
            {mappedHospitals.map(hosp => (
              <button
                key={hosp.id}
                onClick={() => handleMarkerClick('hospital', hosp)}
                className="absolute focus:outline-none group hover:scale-110 transition-transform cursor-pointer"
                style={{ left: `${hosp.x}%`, top: `${hosp.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg border border-white hover:bg-blue-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="absolute left-1/2 -bottom-7 -translate-x-1/2 bg-slate-900/95 text-[10px] text-white font-medium px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
                  {hosp.name}
                </span>
              </button>
            ))}

            {/* Donation Camps Markers */}
            {mappedCamps.map(camp => (
              <button
                key={camp.id}
                onClick={() => handleMarkerClick('camp', camp)}
                className="absolute focus:outline-none group hover:scale-110 transition-transform cursor-pointer"
                style={{ left: `${camp.x}%`, top: `${camp.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="bg-amber-500 text-white p-1.5 rounded-full shadow-lg border border-white hover:bg-amber-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="absolute left-1/2 -bottom-7 -translate-x-1/2 bg-slate-900/95 text-[10px] text-white font-medium px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
                  Camp: {camp.name}
                </span>
              </button>
            ))}

            {/* Active SOS Markers (Blinking Critical) */}
            {filteredSOS.map(sos => (
              <button
                key={sos.id}
                onClick={() => handleMarkerClick('sos', sos)}
                className="absolute focus:outline-none group hover:scale-125 transition-transform cursor-pointer z-20"
                style={{ left: `${sos.x}%`, top: `${sos.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className={`p-1.5 rounded-full shadow-xl border-2 border-white flex items-center justify-center text-white ${sos.priority === 'Critical' ? 'bg-brand-red-600 animate-bounce' : 'bg-orange-500'}`}>
                  <AlertCircle className="w-4 h-4 animate-pulse" />
                </div>
                <span className="absolute left-1/2 -bottom-7 -translate-x-1/2 bg-brand-red-700 text-[10px] text-white font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-lg">
                  SOS: {sos.bloodGroup} {sos.priority}
                </span>
              </button>
            ))}
          </div>

          {/* Compass & Map Legend Controls inside map canvas */}
          <div className="absolute right-3 bottom-3 flex flex-col gap-1.5 z-10">
            <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-slate-200/50 flex flex-col gap-1">
              <button className="p-1 hover:bg-slate-100 rounded text-slate-800"><ZoomIn className="w-4 h-4" /></button>
              <button className="p-1 hover:bg-slate-100 rounded text-slate-800"><ZoomOut className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="absolute left-3 bottom-3 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-slate-200/50 text-[10px] font-medium text-slate-800 flex flex-col gap-1.5 shadow-md">
            <div className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-1">LEGEND</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white"></span>
              <span>Hospital</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white"></span>
              <span>Blood Bank</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white"></span>
              <span>Donation Camp</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-red-600 border border-white"></span>
              <span className="font-semibold text-brand-red-600 animate-pulse">Critical SOS Alert</span>
            </div>
          </div>
        </div>

        {/* Selected Info Sidebar */}
        <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 text-white overflow-y-auto flex flex-col justify-between">
          <div>
            {!activeItem ? (
              <div className="h-48 md:h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <MapPin className="w-10 h-10 mb-2 text-slate-600" />
                <p className="text-sm font-medium">No Location Selected</p>
                <p className="text-xs text-slate-500 mt-1">Click on any marker on the map to inspect live resource metrics, SOS routes, or operational supply indexes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                    activeItem.type === 'hospital' ? 'bg-blue-500/20 text-blue-300' :
                    activeItem.type === 'blood_bank' ? 'bg-emerald-500/20 text-emerald-300' :
                    activeItem.type === 'camp' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}>
                    {activeItem.type.replace('_', ' ')}
                  </span>
                  <button 
                    onClick={() => setActiveItem(null)} 
                    className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded border border-slate-700/50 hover:bg-slate-800"
                  >
                    Clear
                  </button>
                </div>

                <div>
                  <h4 className="font-display font-bold text-base leading-snug">{activeItem.data.name || activeItem.data.patientName}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {activeItem.data.location?.address}
                  </p>
                </div>

                <hr className="border-slate-800" />

                {/* Conditional metrics based on selection type */}
                {activeItem.type === 'hospital' && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Type:</span><span className="font-medium">{activeItem.data.hospitalType}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Emergency Call:</span><span className="font-mono text-blue-300 font-semibold">{activeItem.data.emergencyContact}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">ID Registration:</span><span className="font-mono">{activeItem.data.hospitalIdNumber}</span></div>
                    
                    <div className="bg-slate-800/50 p-2.5 rounded-lg space-y-1.5 mt-2">
                      <p className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">HOSPITAL CAPACITY</p>
                      <div className="flex justify-between"><span>ICU Count:</span><span className="font-semibold text-slate-200">{activeItem.data.resources?.icuCount} beds</span></div>
                      <div className="flex justify-between"><span>Active Doctors:</span><span>{activeItem.data.resources?.totalDoctors} MDs</span></div>
                      <div className="flex justify-between"><span>Total Beds:</span><span>{activeItem.data.resources?.bedCount}</span></div>
                      <div className="flex justify-between"><span>OPD Facility:</span><span className={activeItem.data.resources?.opdAvailable ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                        {activeItem.data.resources?.opdAvailable ? 'Active Operational' : 'Inactive'}
                      </span></div>
                    </div>
                  </div>
                )}

                {activeItem.type === 'blood_bank' && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Network Type:</span><span className="font-medium">{activeItem.data.bankType}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">e-Raktkosh Code:</span><span className="font-mono text-emerald-300 font-semibold">{activeItem.data.eRaktkoshId}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Emergency Call:</span><span className="font-mono">{activeItem.data.emergencyContact}</span></div>
                    
                    <div className="bg-slate-800/50 p-2.5 rounded-lg space-y-1 mt-2">
                      <p className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">CURRENT SUPPLY HEALTH</p>
                      <div className="flex items-center justify-between">
                        <span>O- Neg Reserve:</span>
                        <span className="font-bold text-emerald-400">3 units</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>A+ Pos Reserve:</span>
                        <span className="font-bold text-emerald-400">20 units</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Total Units Held:</span>
                        <span className="font-bold text-slate-200">30+ bags</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeItem.type === 'camp' && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Organizer:</span><span className="font-medium">{activeItem.data.organizer}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Date:</span><span className="font-bold text-amber-300">{activeItem.data.date}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Timings:</span><span>{activeItem.data.time}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Camp Contact:</span><span className="font-mono">{activeItem.data.contact}</span></div>
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-2 rounded text-center font-medium mt-2 animate-pulse">
                      Donors Welcomed • Walk-ins Accepted
                    </div>
                  </div>
                )}

                {activeItem.type === 'sos' && (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center bg-brand-red-600/30 text-red-200 p-2 rounded-lg border border-brand-red-600/40">
                      <span className="font-semibold text-sm">Blood Needed:</span>
                      <span className="text-lg font-display font-bold px-2 py-0.5 bg-brand-red-600 rounded-md text-white">{activeItem.data.bloodGroup}</span>
                    </div>
                    <div className="flex justify-between"><span className="text-slate-400">Patient:</span><span className="font-medium">{activeItem.data.patientName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Type:</span><span>{activeItem.data.componentType}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Qty Required:</span><span className="font-bold text-white text-sm">{activeItem.data.unitsRequired} units</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Hospital:</span><span>{activeItem.data.hospitalName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Raised At:</span><span>{new Date(activeItem.data.createdAt).toLocaleTimeString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Priority level:</span><span className={`px-2 py-0.5 rounded font-bold ${activeItem.data.priority === 'Critical' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-500 text-white'}`}>{activeItem.data.priority}</span></div>
                    
                    <div className="bg-slate-800/80 p-2.5 rounded-lg mt-2 border border-slate-700/50">
                      <p className="font-bold text-slate-300 text-[10px] uppercase tracking-wider mb-1">REMARKS</p>
                      <p className="text-slate-300 italic">"{activeItem.data.remarks || 'No notes provided'}"</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2">
            {activeItem?.type === 'sos' && (
              <button 
                id="btn-fulfill-sos"
                onClick={() => {
                  alert(`Direct blood dispatch routing simulated to ${activeItem.data.hospitalName}. Real-time coordinate sync triggered with AeroBlood logistics dispatcher.`);
                }}
                className="w-full bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4" /> Dispatch Blood Now
              </button>
            )}
            <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
              <Layers className="w-3.5 h-3.5" /> GPS Coordinates Active • Live Sync
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
