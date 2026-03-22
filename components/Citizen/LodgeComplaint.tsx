
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ComplaintStatus, ComplaintPriority } from '../../types';
import { Camera, MapPin, Send, CheckCircle2, Search, Loader2, X, Crosshair, FilePlus, Trash2, Map as MapIcon, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import api from '../../src/api';
import { motion } from 'framer-motion';


// Fix for Leaflet marker icon in React
const initLeafletIcon = () => {
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });
  L.Marker.prototype.options.icon = DefaultIcon;
};

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

const LocationPicker = ({ position, setPosition, validateLocation }: { position: [number, number], setPosition: (pos: [number, number]) => void, validateLocation: (lat: number, lng: number) => boolean }) => {
  useMapEvents({
    click(e) {
      if (validateLocation(e.latlng.lat, e.latlng.lng)) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      } else {
        alert("Selected location is outside the Metropolitan Region (MMR). Please select a location within the highlighted boundary.");
      }
    },
  });
  return position ? <Marker position={position} /> : null;
};

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const LodgeComplaint: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [success, setSuccess] = useState(false);

  // F9: Duplicate Detection State
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState<any[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // State for Pin Location (marker)
  const [position, setPosition] = useState<[number, number]>([19.0330, 73.0297]);

  // State for Map View (center) - separate so clicking doesn't force re-center
  const [viewCenter, setViewCenter] = useState<[number, number]>([19.0330, 73.0297]);

  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeMethod, setActiveMethod] = useState<'map' | 'search' | 'gps'>('map');

  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    priority: ComplaintPriority.MEDIUM,
    image: null as File | null
  });

  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/departments');
        setDepartments(res.data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchDepartments();
  }, [user.token]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Precise MMR Polygon (Based on 'New MMR Boundary' Map)
  // Includes Palghar Dist (N), Thane Dist (E), Raigad Dist (S)
  const MMR_POLYGON: [number, number][] = [
    // --- North (Palghar District) ---
    [20.2500, 72.7500], // Talasari / Gujarat Border (NW Tip)
    [20.2500, 72.9500], // Talasari East
    [20.0000, 73.4000], // Mokhada / Jawhar (NE Tip)

    // --- East (Thane / Raigad Interior) ---
    [19.7000, 73.4500], // Shahapur / Kasara
    [19.2500, 73.6000], // Murbad / Saralgaon
    [18.9000, 73.5000], // Karjat / Neral
    [18.7500, 73.4000], // Khalapur / Khopoli

    // --- South (Raigad Coastal) ---
    [18.6500, 73.1500], // Pen
    [18.4000, 73.0500], // Roha Border
    [18.2500, 72.9500], // Murud / Revdanda (South Tip)
    [18.6000, 72.8500], // Alibaug West
    [18.8000, 72.8000], // Mandwa / Uran Coast

    // --- West (Coastline) ---
    [18.9500, 72.7500], // Mumbai South Tip
    [19.3000, 72.7000], // Vasai Coast
    [19.7000, 72.6000], // Palghar / Kelwa Beach
    [20.2500, 72.7500]  // Loop back to North
  ];

  // Bounding box for map constraints
  const MMR_BOUNDS: L.LatLngBoundsExpression = [
    [18.2000, 72.5000], // South-West
    [20.3000, 73.7000]  // North-East
  ];

  // Ray-casting algorithm for Point-in-Polygon
  const isPointInMMR = (lat: number, lng: number) => {
    let inside = false;
    for (let i = 0, j = MMR_POLYGON.length - 1; i < MMR_POLYGON.length; j = i++) {
      const xi = MMR_POLYGON[i][0], yi = MMR_POLYGON[i][1];
      const xj = MMR_POLYGON[j][0], yj = MMR_POLYGON[j][1];

      const intersect = ((yi > lng) !== (yj > lng))
        && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  useEffect(() => {
    initLeafletIcon();
  }, []);

  useEffect(() => {
    if (!formData.image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(formData.image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [formData.image]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      // Switched to BigDataCloud free geocoding to prevent Nominatim CORS blocking on localhost
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const data = await res.json();

      const locName = data.locality || data.city || data.principalSubdivision || 'Unknown Location';
      setAddress(locName);
    } catch (e) {
      console.error("Reverse geocoding error", e);
      setAddress('');
    } finally {
      setGeocoding(false);
    }
  }, []);

  // Handle address search recommendations
  useEffect(() => {
    if (searchQuery.length < 3 || activeMethod !== 'search') {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Restrict search to MMR Viewbox
        const viewbox = '72.7500,19.3500,73.2500,18.8500'; // Left,Top,Right,Bottom
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&viewbox=${viewbox}&bounded=1`);
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (e) {
        console.error("Search error", e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeMethod]);

  const handleGetCurrentLocation = () => {
    setActiveMethod('gps');
    if (navigator.geolocation) {
      setGeocoding(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(p);
          setViewCenter(p); // Move map to GPS location
          reverseGeocode(p[0], p[1]);
        },
        () => {
          setGeocoding(false);
          alert("Could not access your location. Please check browser permissions.");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const selectSuggestion = (s: Suggestion) => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    setPosition([lat, lon]);
    setViewCenter([lat, lon]); // Move map to searched location
    setAddress(s.display_name);
    setSearchQuery(s.display_name);
    setShowSuggestions(false);
  };

  const convertBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const proceedWithLodge = async (linkParentId?: number) => {
    setLoading(true);
    setShowDuplicateModal(false);
    try {
      const token = localStorage.getItem("token") || user.token;
      if (!token) {
        alert("Authentication error. Please log in again.");
        return;
      }

      let base64Image = "";
      if (formData.image) {
        base64Image = await convertBase64(formData.image) as string;
      }

      if (linkParentId) {
        await api.post(`/complaints/${linkParentId}/link-duplicate`, {
          title: formData.title,
          description: formData.description,
          latitude: position[0],
          longitude: position[1],
          address: address,
          priority: formData.priority,
          category: formData.category,
          imageUrl: base64Image
        });
      } else {
        await api.post('/complaints/lodge', {
          title: formData.title,
          description: formData.description,
          latitude: position[0],
          longitude: position[1],
          address: address,
          priority: formData.priority,
          category: { name: formData.category },
          imageUrl: base64Image
        });
      }

      setSuccess(true);
      setTimeout(() => navigate("/citizen/track"), 2000);
    } catch (err) {
      console.error(err);
      alert("Failed to lodge complaint. Please try again.");
    } finally {
      setLoading(false);
      setCheckingDuplicates(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      alert("Please select a location on the map.");
      return;
    }

    setCheckingDuplicates(true);
    try {
      // 1. Check for duplicates first
      const res = await api.post('/complaints/check-duplicates', {
        category: formData.category,
        latitude: position[0],
        longitude: position[1],
        title: formData.title,
        description: formData.description
      });

      if (res.data && res.data.length > 0) {
        setPotentialDuplicates(res.data);
        setShowDuplicateModal(true);
        setCheckingDuplicates(false);
        return; // Pause submit
      }
    } catch (e) {
      console.error("Duplicate check failed", e);
    }
    
    // 2. No duplicates found, or error, proceed normally
    proceedWithLodge();
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center p-12 bg-white rounded-3xl shadow-2xl border border-green-50 animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Grievance Lodged Successfully</h2>
        <p className="text-gray-500 mb-6 text-lg">Our municipal routing engine has assigned your case to the local department.</p>
        <div className="bg-blue-50 p-4 rounded-2xl inline-block">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Your Tracking ID</p>
          <p className="text-blue-600 font-mono text-xl font-bold">SNS-{new Date().toISOString().split('T')[0].replace(/-/g, '')}-...</p>
        </div>
      </div>
    );
  }

  const containerVars = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVars} className="max-w-7xl mx-auto px-4 pb-20 font-sans relative">
      
      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6 border border-amber-200">
              <Crosshair size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Is This the Same Problem?</h2>
            <p className="text-slate-500 mb-6">We found {potentialDuplicates.length} similar report(s) near your location. If your issue matches one below, linking it helps prioritize the problem. If it's a different issue, submit as a new report.</p>
            
            <div className="space-y-4 mb-8">
              {potentialDuplicates.map(dup => (
                <div key={dup.complaintId} className="p-5 border-2 border-slate-100 rounded-2xl hover:border-blue-200 transition-colors bg-slate-50 hover:bg-white text-left group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{dup.complaintNumber}</span>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{dup.similarityPercent}% match</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">{dup.distanceMeters}m away</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1 leading-snug">{dup.title}</h3>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{dup.description}</p>
                  <button 
                    onClick={() => proceedWithLodge(dup.complaintId)}
                    disabled={loading}
                    className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all flex justify-center items-center"
                  >
                     <CheckCircle2 size={16} className="mr-2" /> Yes, This Is the Same Issue
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => proceedWithLodge()}
                disabled={loading}
                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-colors"
              >
                No, It's a Different Issue — Submit New
              </button>
              <button 
                onClick={() => setShowDuplicateModal(false)}
                disabled={loading}
                className="py-4 px-6 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div variants={itemVars} className="mb-10">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Lodge Grievance</h1>
        <p className="text-slate-500 font-medium text-lg mt-2">Provide specific location and incident details for faster resolution in the MMR region.</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Location Module */}
        <motion.div variants={itemVars} className="lg:w-3/5 w-full space-y-6">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden relative">
            {/* 3 Distinct Options Toggle */}
            <div className="p-4 bg-gray-50/80 border-b border-gray-100">
              <div className="grid grid-cols-3 gap-2 bg-gray-200/50 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveMethod('map')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeMethod === 'map' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <MapPin size={16} /> PIN ON MAP
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMethod('search')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeMethod === 'search' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Search size={16} /> SEARCH ADDRESS
                </button>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeMethod === 'gps' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Navigation size={16} /> USE GPS
                </button>
              </div>
            </div>

            {/* Conditional Search Bar with Recommendations */}
            {activeMethod === 'search' && (
              <div className="p-4 bg-white border-b border-gray-100 relative z-[2000]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search colony, street, or landmark..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                  />
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50 z-[3000]">
                    {suggestions.map((s) => (
                      <button
                        key={s.place_id}
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left p-4 hover:bg-blue-50 transition-colors flex items-start gap-3"
                      >
                        <MapPin size={16} className="text-blue-400 mt-1 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">{s.display_name.split(',')[0]}</p>
                          <p className="text-[10px] text-gray-500 font-medium line-clamp-1">{s.display_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Map Area */}
            <div className="h-[520px] relative">
              <MapContainer
                center={position}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                minZoom={8}
              >
                <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {/* Boundary Only - No Fill */}
                <Polygon positions={MMR_POLYGON} pathOptions={{ color: 'blue', weight: 3, fillOpacity: 0, dashArray: '10, 10' }} />
                <LocationPicker
                  position={position}
                  setPosition={(pos) => {
                    setPosition(pos);
                    reverseGeocode(pos[0], pos[1]);
                    setActiveMethod('map');
                  }}
                  validateLocation={isPointInMMR}
                />
                <MapController center={position} />
              </MapContainer>

              {/* Overlay for Geocoding State */}
              {geocoding && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-[1001] flex items-center justify-center">
                  <div className="bg-white px-6 py-4 rounded-2xl shadow-2xl border border-blue-100 flex items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" />
                    <span className="text-sm font-black text-blue-900 tracking-tight">Geo-Locating Incident...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Location Confirmation Footer */}
            <div className="p-6 bg-blue-50/80 border-t border-blue-100 flex items-center justify-between gap-4">
              <div className="flex-grow">
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 block">Verified Incident Address</label>
                <p className="text-sm font-bold text-blue-900 line-clamp-2">
                  {geocoding ? "Identifying location..." : address || "Please select a point on the map"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-black text-gray-400 font-mono tracking-tighter">
                  LAT: {position[0].toFixed(5)}<br />
                  LNG: {position[1].toFixed(5)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Details Form Module */}
        <motion.div variants={itemVars} className="lg:w-2/5 w-full">
          <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white p-10 space-y-8 h-full flex flex-col">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FilePlus size={26} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Issue Details</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Departmental Form</p>
              </div>
            </div>

            <div className="space-y-6 flex-grow">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Grievance Category</label>
                <div className="relative">
                  <select
                    required
                    className="w-full pl-5 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer outline-none shadow-sm"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="" disabled className="text-slate-400">Select Category</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.name}>
                        {d.name} {d.description ? `- ${d.description}` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Set Priority Level</label>
                <div className="grid grid-cols-2 gap-3">
                  {[ComplaintPriority.LOW, ComplaintPriority.MEDIUM, ComplaintPriority.HIGH, ComplaintPriority.URGENT].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={`py-3.5 px-2 text-[11px] font-black rounded-[1.25rem] border-2 transition-all ${formData.priority === p ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/30' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Complaint Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Pipeline burst at Sector 4"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none shadow-sm placeholder:text-slate-300"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the magnitude and impact of the issue..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-800 resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none shadow-sm placeholder:text-slate-300 placeholder:font-bold"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Media Evidence (Required)</label>
                <div className="relative border-4 border-dashed border-gray-50 rounded-3xl p-6 bg-gray-50 hover:bg-blue-50/50 hover:border-blue-200 transition-all group flex flex-col items-center justify-center min-h-[160px] cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={e => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                  />
                  {previewUrl ? (
                    <div className="relative w-full h-full flex flex-col items-center">
                      <img src={previewUrl} className="max-h-32 w-full object-cover rounded-2xl shadow-lg" alt="Evidence Preview" />
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFormData({ ...formData, image: null }); }}
                        className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera size={40} className="text-gray-300 mb-3 group-hover:text-blue-400 transition-colors" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Capture or Upload Photo</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgba(37, 99, 235, 0.2)" }}
              whileTap={{ y: 0 }}
              type="submit"
              disabled={loading || geocoding || checkingDuplicates}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl font-black text-[13px] tracking-widest uppercase shadow-xl shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-8"
            >
              {loading || checkingDuplicates ? <Loader2 className="animate-spin" size={24} /> : <><Send size={20} /> <span>Submit to Authorities</span></>}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LodgeComplaint;
