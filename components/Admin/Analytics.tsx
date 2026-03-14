import React, { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle, Clock, BarChart3, X, MapPin, Calendar, Tag, User, ChevronRight, Download, Map as MapIcon } from 'lucide-react';
import api from '../../src/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const initLeafletIcon = () => {
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });
  L.Marker.prototype.options.icon = DefaultIcon;
};

type DrillKey = 'total' | 'overdue' | 'resolved' | 'rate' | null;

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  RESOLVED: 'bg-green-50 text-green-700 border-green-100',
  CLOSED: 'bg-slate-50 text-slate-600 border-slate-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-blue-50 text-blue-600 border-blue-100',
  MEDIUM: 'bg-amber-50 text-amber-600 border-amber-100',
  HIGH: 'bg-orange-50 text-orange-600 border-orange-100',
  URGENT: 'bg-red-50 text-red-700 border-red-100',
};

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const drillRef = useRef<HTMLDivElement>(null);

  const [trendData, setTrendData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, resolved: 0, overdue: 0 });
  const [allComplaints, setAllComplaints] = useState<any[]>([]);
  const [activeDrill, setActiveDrill] = useState<DrillKey>(null);

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#f59e0b'];

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [trendRes, catRes, zoneRes, sumRes, complaintsRes] = await Promise.all([
          api.get('/analytics/daily-trend'),
          api.get('/analytics/category-distribution'),
          api.get('/analytics/zone-performance'),
          api.get('/analytics/summary'),
          api.get('/complaints/all'),
        ]);
        setTrendData(trendRes.data.reverse());
        setCategoryData(catRes.data);
        setZoneData(zoneRes.data);
        setSummary(sumRes.data);
        setAllComplaints(complaintsRes.data);
      } catch (e) { console.error("Analytics fetch error", e); }
    };
    initLeafletIcon();
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      const res = await api.get('/reports/export?format=csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sns_complaints_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to export report.");
    }
  };

  const completionRate = summary.total > 0 ? Math.round((summary.resolved / summary.total) * 100) : 0;

  // Filter complaints for each drill category
  const getDrillComplaints = (key: DrillKey): any[] => {
    if (!key || key === 'rate') return [];
    const now = new Date();
    if (key === 'total') return allComplaints;
    if (key === 'resolved') return allComplaints.filter(c => c.status === 'RESOLVED');
    if (key === 'overdue') return allComplaints.filter(c =>
      c.status === 'PENDING' && (
        (c.slaDeadline && new Date(c.slaDeadline) < now) ||
        (c.escalationLevel && c.escalationLevel > 0)
      )
    );
    return [];
  };

  const getDrillTitle = (key: DrillKey): string => {
    if (key === 'total') return 'All Complaints';
    if (key === 'resolved') return 'Resolved Complaints';
    if (key === 'overdue') return 'Overdue / Escalated Complaints';
    return '';
  };

  const handleCardClick = (key: DrillKey) => {
    if (key === 'rate') return; // Completion Rate has no list meaning
    setActiveDrill(prev => prev === key ? null : key);
    // Scroll to drill section
    setTimeout(() => drillRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const drillComplaints = getDrillComplaints(activeDrill);

  const stats = [
    { key: 'total' as DrillKey, title: 'Total Complaints', value: summary.total, label: 'Click to View All', icon: <TrendingUp size={22} />, gradient: 'from-blue-600 to-cyan-500', shadow: 'shadow-blue-500/20', ring: 'ring-blue-300' },
    { key: 'overdue' as DrillKey, title: 'Overdue SLA', value: summary.overdue, label: 'Click to View', icon: <AlertCircle size={22} />, gradient: 'from-red-500 to-orange-500', shadow: 'shadow-red-500/20', ring: 'ring-red-300' },
    { key: 'resolved' as DrillKey, title: 'Total Resolved', value: summary.resolved, label: 'Click to View', icon: <CheckCircle size={22} />, gradient: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/20', ring: 'ring-green-300' },
    { key: 'rate' as DrillKey, title: 'Completion Rate', value: `${completionRate}%`, label: 'Resolution Rate', icon: <Clock size={22} />, gradient: 'from-violet-600 to-indigo-600', shadow: 'shadow-violet-500/20', ring: 'ring-violet-300' },
  ];

  return (
    <div className="font-sans max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full border-[60px] border-white/5 -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full border-[40px] border-indigo-400/10 -ml-10 -mb-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-white/10 backdrop-blur-sm mb-4">
              <BarChart3 size={12} /> Performance Intelligence
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Grievance <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Analytics</span></h1>
            <p className="text-slate-400 font-medium text-sm">Live data analytics and SLA compliance metrics. <span className="text-blue-300 font-bold">Click any card below to view those complaints.</span></p>
          </div>
          <button 
            onClick={handleExport}
            className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center border border-white/20 transition-all shadow-lg active:scale-95 shrink-0"
          >
            <Download className="mr-2" size={16} /> Export CSV Data
          </button>
        </div>
      </motion.div>

      {/* Stats Cards — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const isActive = activeDrill === stat.key && stat.key !== 'rate';
          const clickable = stat.key !== 'rate';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: clickable ? -6 : -4, scale: clickable ? 1.02 : 1, transition: { duration: 0.2 } }}
              whileTap={clickable ? { scale: 0.97 } : {}}
              onClick={() => handleCardClick(stat.key)}
              className={`bg-gradient-to-br ${stat.gradient} rounded-[2rem] p-6 text-white shadow-2xl ${stat.shadow} relative overflow-hidden transition-all ${clickable ? 'cursor-pointer' : 'cursor-default'} ${isActive ? `ring-4 ${stat.ring} ring-offset-2` : ''}`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mt-6 pointer-events-none" />
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                {stat.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">{stat.title}</p>
              <h4 className="text-3xl font-black tracking-tight">{stat.value}</h4>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest">{stat.label}</p>
                {clickable && (
                  <div className={`w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform ${isActive ? 'rotate-90' : ''}`}>
                    <ChevronRight size={12} />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* DRILL-DOWN PANEL */}
      <div ref={drillRef}>
        <AnimatePresence>
          {activeDrill && activeDrill !== 'rate' && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white">
                {/* Drill Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                      <div className={`w-2 h-6 rounded-full ${activeDrill === 'overdue' ? 'bg-red-500' : activeDrill === 'resolved' ? 'bg-green-500' : 'bg-blue-500'}`} />
                      {getDrillTitle(activeDrill)}
                    </h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{drillComplaints.length} complaints found</p>
                  </div>
                  <button onClick={() => setActiveDrill(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                    <X size={20} />
                  </button>
                </div>

                {/* Complaint List */}
                <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
                  {drillComplaints.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 font-medium">
                      <CheckCircle size={40} className="mx-auto mb-3 text-slate-200" />
                      No complaints in this category.
                    </div>
                  ) : drillComplaints.map((c, i) => (
                    <motion.div
                      key={c.complaintId}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => navigate(`/admin/complaint/${c.complaintId}`)}
                      className="px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Number Badge */}
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors border border-slate-200">
                          #{i + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h4 className="font-black text-slate-900 text-sm tracking-tight truncate max-w-[280px]">{c.title}</h4>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${STATUS_STYLES[c.status] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>{c.status}</span>
                            {c.escalationLevel > 0 && (
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                                Escalated L{c.escalationLevel}
                              </span>
                            )}
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${PRIORITY_STYLES[c.priority] || ''}`}>{c.priority}</span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1"><Tag size={11} className="text-slate-400" />{c.complaintNumber || 'Processing...'}</span>
                            <span className="flex items-center gap-1"><Calendar size={11} className="text-slate-400" />{new Date(c.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            {c.slaDeadline && (
                              <span className={`flex items-center gap-1 ${new Date(c.slaDeadline) < new Date() ? 'text-red-500 font-bold' : ''}`}>
                                <Clock size={11} /> SLA: {new Date(c.slaDeadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                {new Date(c.slaDeadline) < new Date() && ' (Breached)'}
                              </span>
                            )}
                            {c.assignedOfficerName && (
                              <span className="flex items-center gap-1"><User size={11} className="text-slate-400" />{c.assignedOfficerName}</span>
                            )}
                            {c.address && (
                              <span className="flex items-center gap-1 truncate max-w-[200px]"><MapPin size={11} className="text-slate-400 shrink-0" />{c.address}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all shrink-0 hidden sm:block" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-8">
          <h3 className="font-black text-slate-900 text-lg mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-500 rounded-full" /> Daily Complaint Trends
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: 700, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                <Line type="monotone" dataKey="lodged" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }} name="Lodged" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981', strokeWidth: 0 }} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-8">
          <h3 className="font-black text-slate-900 text-lg mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-orange-500 rounded-full" /> Category Distribution
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={4} dataKey="value">
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: 700, fontSize: 12 }} />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 - Heatmap Map */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-8">
        <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
          <div className="w-2 h-6 bg-rose-500 rounded-full" /> Geographic Incident Heatmap
        </h3>
        <p className="text-slate-500 text-sm font-medium mt-1 mb-6 pl-4">Live tracking of all plotted complaints across the region.</p>
        <div className="h-[450px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0 relative isolate">
          <MapContainer center={[19.0330, 73.0297]} zoom={9} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap contributors' />
            {allComplaints.filter(c => c.latitude && c.longitude).map(c => (
              <Marker key={c.complaintId} position={[c.latitude, c.longitude]}>
                <Popup>
                  <div className="font-sans min-w-[200px]">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border mb-2 inline-block ${c.status === 'RESOLVED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {c.status}
                    </span>
                    <p className="font-bold text-slate-800 text-sm leading-snug mb-1">{c.title}</p>
                    <p className="text-xs text-slate-500 mb-2">{c.categoryName}</p>
                    <button 
                      onClick={() => navigate(`/admin/complaint/${c.complaintId}`)}
                      className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg text-xs transition-colors"
                    >
                      View Issue
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </motion.div>

      {/* Zone Bar Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-8">
        <h3 className="font-black text-slate-900 text-lg mb-6 flex items-center gap-2">
          <div className="w-2 h-6 bg-violet-500 rounded-full" /> Zone Load Distribution
        </h3>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={zoneData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: 700, fontSize: 12 }} cursor={{ fill: '#f1f5f9', radius: 8 }} />
              <Bar dataKey="value" name="Complaints" radius={[12, 12, 0, 0]}>
                {zoneData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;
