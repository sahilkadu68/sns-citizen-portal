import React, { useState, useEffect } from 'react';
import { User, ComplaintStatus, ComplaintPriority } from '../../types';
import { LayoutList, Map as MapIcon, ChevronRight, Loader2, Filter, ShieldCheck, Link2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import api from '../../src/api';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, X, Check, XCircle } from 'lucide-react';
import { useI18n } from '../../src/i18n';

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
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // F9: Batch Scan State
  const [showScanModal, setShowScanModal] = useState(false);
  const [clusters, setClusters] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);

  // ✅ FETCH FROM BACKEND
  useEffect(() => {
    initLeafletIcon();

    const fetchComplaints = async () => {
      try {
        const res = await api.get('/complaints/all');
        setComplaints(res.data);
      } catch (err: any) {
        console.error('Failed to load complaints', err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  // F9: Global Batch Scan Handlers
  const handleGlobalScan = async () => {
    setScanning(true);
    setShowScanModal(true);
    try {
      const res = await api.get('/complaints/admin/scan-duplicates');
      setClusters(res.data);
    } catch (err) {
      console.error('Failed to scan duplicates', err);
      alert('Error running duplicate scan.');
    } finally {
      setScanning(false);
    }
  };

  const handleMergeCluster = async (clusterIndex: number, childId: number) => {
    try {
      const cluster = clusters[clusterIndex];
      await api.post(`/complaints/${cluster.anchor.complaintId}/merge-duplicate`, {
        childComplaintId: childId
      });
      // Remove the joined duplicate from UI
      setClusters(prev => {
        const next = [...prev];
        next[clusterIndex].duplicates = next[clusterIndex].duplicates.filter((d: any) => d.complaintId !== childId);
        return next;
      });
      // Refresh main background list
      const res = await api.get('/complaints/all');
      setComplaints(res.data);
    } catch (err: any) {
      alert(err.response?.data || 'Failed to merge complaint');
    }
  };

  const handleRejectPair = async (clusterIndex: number, childId: number) => {
    try {
      const cluster = clusters[clusterIndex];
      await api.post('/complaints/admin/reject-duplicate', {
        complaintId1: cluster.anchor.complaintId,
        complaintId2: childId
      });
      // Remove the rejected duplicate from UI
      setClusters(prev => {
        const next = [...prev];
        next[clusterIndex].duplicates = next[clusterIndex].duplicates.filter((d: any) => d.complaintId !== childId);
        return next;
      });
    } catch (err: any) {
      alert(err.response?.data || 'Failed to reject pairing');
    }
  };

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
      <motion.div variants={itemVars} className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/60 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-black/20 border border-white dark:border-slate-800">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20 shadow-sm relative overflow-hidden">
            <ShieldCheck size={12} className="relative z-10" />
            <span className="relative z-10">{t('manage.adminControl')}</span>
            <div className="absolute inset-0 bg-blue-100 opacity-0 hover:opacity-100 transition-opacity"></div>
          </span>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('manage.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
            {t('manage.subtitle')} <span className="ml-2 font-bold text-slate-700 dark:text-slate-300">• Total: {filtered.length} Complaints</span>
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner relative">
          <button
            onClick={() => setViewMode('list')}
            className="relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors z-10 flex items-center gap-2"
          >
            <span className={`relative z-10 flex items-center gap-2 ${viewMode === 'list' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <LayoutList size={16} /> {t('manage.list')}
            </span>
            {viewMode === 'list' && (
              <motion.div layoutId="viewModeTab" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 z-0" />
            )}
          </button>
          <button
            onClick={() => setViewMode('map')}
            className="relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors z-10 flex items-center gap-2"
          >
            <span className={`relative z-10 flex items-center gap-2 ${viewMode === 'map' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <MapIcon size={16} /> {t('manage.geoMap')}
            </span>
            {viewMode === 'map' && (
              <motion.div layoutId="viewModeTab" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 z-0" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Global Scan Floating Action Bar */}
      <motion.div variants={itemVars} className="flex justify-between items-center bg-blue-50/50 dark:bg-blue-500/5 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl border border-blue-200 shadow-inner">
            <Network size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-white text-sm tracking-wide">{t('manage.dupMgmt')}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('manage.dupDesc')}</p>
          </div>
        </div>
        <button
          onClick={handleGlobalScan}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex border border-blue-500 items-center gap-2"
        >
          <Network size={16} /> {t('manage.globalScan')}
        </button>
      </motion.div>

      {/* FILTERS */}
      <motion.div variants={itemVars} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl shadow-lg shadow-slate-200/40 dark:shadow-black/20 border border-white dark:border-slate-800 flex flex-wrap gap-3 items-center">
        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-inner">
          <Filter size={18} className="text-slate-500" />
        </div>
        {[
          { key: 'all', label: t('manage.allComplaints') },
          { key: 'PENDING', label: t('manage.pending') },
          { key: 'RESOLVED', label: t('manage.resolvedFilter') },
          { key: 'CLOSED_OR_REJECTED', label: t('manage.closedRejected') }
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s.key
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border-transparent hover:-translate-y-0.5'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-md'
              }`}
          >
            {s.label}
          </button>
        ))}
      </motion.div>

      {/* LIST VIEW */}
      {viewMode === 'list' ? (
        <motion.div variants={itemVars} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    {t('manage.incident')}
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">
                    {t('manage.status')}
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">
                    {t('manage.priority')}
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">
                    {t('manage.dateLodged')}
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap rounded-tr-[2.5rem]">
                    {t('manage.action')}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                <AnimatePresence>
                  {filtered.map((c, i) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={c.complaintId}
                      className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 hover:shadow-inner transition-all group"
                    >
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-mono font-black text-blue-500 block bg-blue-50 w-fit px-2 py-0.5 rounded-md border border-blue-100 mb-1.5">
                          #{i + 1} • {c.complaintNumber}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-[15px] group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          {c.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{c.category?.name}</span> <span className="text-slate-300 dark:text-slate-600 mx-1">•</span> Filed by {c.user?.fullName}
                          {(c.duplicateCount ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded-md border border-amber-200 shadow-sm">
                              <Link2 size={10} /> Cluster ({c.duplicateCount})
                            </span>
                          )}
                          {c.parentComplaintId && (
                            <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-md border border-indigo-200 shadow-sm">
                              <Link2 size={10} /> Linked
                            </span>
                          )}
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
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm hover:shadow transition-all group-hover:translate-x-1"
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

      {/* F9: Global Batch Scan Modal */}
      <AnimatePresence>
        {showScanModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex py-10 justify-center bg-slate-900/40 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 max-w-4xl w-full mx-4 my-auto flex flex-col max-h-full overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl shadow-inner border border-indigo-200">
                    <Network size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">Duplicate Suggestions</h2>
                    <p className="text-xs text-slate-500 font-medium">Verify and merge similar grievances found nearby.</p>
                  </div>
                </div>
                <button onClick={() => setShowScanModal(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50 border-t border-slate-100">
                {scanning ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Loader2 className="animate-spin text-indigo-500 w-12 h-12" />
                    <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Scanning Database...</p>
                    <p className="text-[10px] text-slate-400">Applying spatial sorting & similarity filters</p>
                  </div>
                ) : clusters.filter(c => c.duplicates.length > 0).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-3 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-2 shadow-inner border border-green-100">
                      <ShieldCheck size={32} />
                    </div>
                    <p className="text-slate-800 font-black text-lg">No Duplicates Found</p>
                    <p className="text-xs text-slate-500 text-center max-w-sm">All pending and resolved complaints appear completely distinct within their geographical bounds.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {clusters.map((cluster, cIdx) => cluster.duplicates.length > 0 && (
                      <div key={cIdx} className="bg-white rounded-3xl p-5 shadow-md shadow-slate-200/50 border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                            Cluster {cIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-500">{cluster.category}</span>
                        </div>
                        
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Anchor */}
                          <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-inner">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase tracking-widest border border-slate-300">Anchor Report</span>
                              <span className="text-[10px] font-mono font-black text-slate-700">{cluster.anchor.complaintNumber}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm mb-1">{cluster.anchor.title}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{cluster.anchor.description}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{cluster.anchor.address}</p>
                          </div>

                          <div className="hidden lg:flex flex-col justify-center items-center text-slate-300">
                            <Link2 size={24} />
                          </div>

                          {/* Duplicates to review */}
                          <div className="flex-[1.5] space-y-3">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Potential Duplicates</h5>
                            {cluster.duplicates.map((dup: any) => (
                              <div key={dup.complaintId} className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm group hover:border-blue-300 transition-colors">
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50 px-1.5 rounded">{dup.complaintNumber}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{dup.title}</h4>
                                    <p className="text-[11px] text-slate-500 line-clamp-1">{dup.description}</p>
                                  </div>
                                  <div className="flex flex-col gap-2 shrink-0">
                                    <button 
                                      onClick={() => handleMergeCluster(cIdx, dup.complaintId)}
                                      className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                    >
                                      <Check size={12} /> Merge
                                    </button>
                                    <button 
                                      onClick={() => handleRejectPair(cIdx, dup.complaintId)}
                                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-1"
                                    >
                                      <XCircle size={12} /> Reject
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ComplaintManagement;
