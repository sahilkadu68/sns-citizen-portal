import React, { useState, useEffect } from 'react';
import { User, ComplaintStatus, ComplaintPriority } from '../../types';
import { LayoutList, Map as MapIcon, ChevronRight, Loader2, Filter, ShieldCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const initLeafletIcon = () => {
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });
  L.Marker.prototype.options.icon = DefaultIcon;
};

const ComplaintManagement: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // ✅ FETCH FROM BACKEND
  useEffect(() => {
    initLeafletIcon();

    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await axios.get(
          'http://localhost:8080/api/complaints/all',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setComplaints(res.data);
      } catch (err: any) {
        console.error('Failed to load complaints', err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const getStatusBadge = (status: ComplaintStatus) => {
    const base =
      'px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ';
    switch (status) {
      case ComplaintStatus.PENDING:
        return base + 'bg-blue-100 text-blue-700 border-blue-200';
      case ComplaintStatus.RESOLVED:
        return base + 'bg-green-100 text-green-700 border-green-200';
      case ComplaintStatus.CLOSED:
        return base + 'bg-gray-100 text-gray-700 border-gray-200';
      case ComplaintStatus.REJECTED:
        return base + 'bg-black text-white border-black';
      default:
        return base + 'bg-gray-50 text-gray-400';
    }
  };

  const getPriorityColor = (p: ComplaintPriority) => {
    switch (p) {
      case ComplaintPriority.URGENT:
        return 'text-red-600';
      case ComplaintPriority.HIGH:
        return 'text-orange-600';
      case ComplaintPriority.MEDIUM:
        return 'text-blue-600';
      default:
        return 'text-gray-400';
    }
  };

  const filtered = complaints.filter(c => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'PENDING') return c.status === 'PENDING';
    if (filterStatus === 'RESOLVED') return c.status === 'RESOLVED';
    if (filterStatus === 'CLOSED_OR_REJECTED') return ['CLOSED', 'REJECTED'].includes(c.status);
    return c.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Authority Dashboard...</p>
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
    <motion.div initial="hidden" animate="visible" variants={containerVars} className="space-y-8 font-sans max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <motion.div variants={itemVars} className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-white">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm relative overflow-hidden">
            <ShieldCheck size={12} className="relative z-10" />
            <span className="relative z-10">Administrative Control</span>
            <div className="absolute inset-0 bg-blue-100 opacity-0 hover:opacity-100 transition-opacity"></div>
          </span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Manage Grievances
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Centralized grievance lifecycle tracking and resolution center.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner relative">
          <button
            onClick={() => setViewMode('list')}
            className="relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors z-10 flex items-center gap-2"
          >
            <span className={`relative z-10 flex items-center gap-2 ${viewMode === 'list' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <LayoutList size={16} /> LIST
            </span>
            {viewMode === 'list' && (
              <motion.div layoutId="viewModeTab" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200 z-0" />
            )}
          </button>
          <button
            onClick={() => setViewMode('map')}
            className="relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors z-10 flex items-center gap-2"
          >
            <span className={`relative z-10 flex items-center gap-2 ${viewMode === 'map' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <MapIcon size={16} /> GEO MAP
            </span>
            {viewMode === 'map' && (
              <motion.div layoutId="viewModeTab" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200 z-0" />
            )}
          </button>
        </div>
      </motion.div>

      {/* FILTERS */}
      <motion.div variants={itemVars} className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-lg shadow-slate-200/40 border border-white flex flex-wrap gap-3 items-center">
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0 border border-slate-200 shadow-inner">
          <Filter size={18} className="text-slate-500" />
        </div>
        {[
          { key: 'all', label: 'ALL COMPLAINTS' },
          { key: 'PENDING', label: 'PENDING (ACTIVE)' },
          { key: 'RESOLVED', label: 'RESOLVED' },
          { key: 'CLOSED_OR_REJECTED', label: 'CLOSED / REJECTED' }
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s.key
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border-transparent hover:-translate-y-0.5'
              : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white hover:text-blue-600 hover:border-blue-200 hover:shadow-md'
              }`}
          >
            {s.label}
          </button>
        ))}
      </motion.div>

      {/* LIST VIEW */}
      {viewMode === 'list' ? (
        <motion.div variants={itemVars} className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Incident
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">
                    Priority
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">
                    Date Lodged
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap rounded-tr-[2.5rem]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filtered.map((c, i) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={c.complaintId}
                      className="hover:bg-blue-50/50 hover:shadow-inner transition-all group"
                    >
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-mono font-black text-blue-500 block bg-blue-50 w-fit px-2 py-0.5 rounded-md border border-blue-100 mb-1.5">
                          {c.complaintNumber}
                        </span>
                        <h4 className="font-bold text-slate-900 text-[15px] group-hover:text-blue-700 transition-colors">
                          {c.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          <span className="font-bold text-slate-700">{c.category?.name}</span> <span className="text-slate-300 mx-1">•</span> Filed by {c.user?.fullName}
                        </p>
                      </td>

                      <td className="px-8 py-5 text-center align-middle">
                        <span className={getStatusBadge(c.status)}>
                          {c.status}
                        </span>
                      </td>

                      <td className="px-8 py-5 text-center align-middle">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border shadow-sm bg-white ${getPriorityColor(c.priority)} ${c.priority === 'URGENT' ? 'border-red-200' :
                          c.priority === 'HIGH' ? 'border-orange-200' :
                            'border-blue-200'
                          }`}>
                          {c.priority}
                        </span>
                      </td>

                      <td className="px-8 py-5 text-center align-middle">
                        <div className="text-xs font-bold text-slate-700">
                          {c.submittedAt ? new Date(c.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {c.submittedAt ? new Date(c.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>

                      <td className="px-8 py-5 text-right align-middle">
                        <button
                          onClick={() => navigate(`/admin/complaint/${c.complaintId}`)}
                          className="p-3 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm hover:shadow transition-all group-hover:translate-x-1"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="p-24 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                <Filter size={24} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">
                No matching records found.
              </p>
            </div>
          )}
        </motion.div>
      ) : (
        /* MAP VIEW */
        <motion.div variants={itemVars} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="h-[600px] bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-3 relative overflow-hidden z-0">
          <MapContainer
            center={[19.033, 73.0297]}
            zoom={13}
            style={{ height: '100%', width: '100%', borderRadius: '2rem' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filtered.map(c => (
              <Marker
                key={c.complaintId}
                position={[c.latitude, c.longitude]}
              >
                <Popup className="rounded-2xl shadow-xl border-none">
                  <div className="p-1">
                    <p className="text-[10px] font-mono font-black text-blue-500 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-center mb-2">
                      {c.complaintNumber}
                    </p>
                    <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{c.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 leading-tight">{c.address}</p>
                    <div className="text-center">
                      <span className={getStatusBadge(c.status)}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ComplaintManagement;
