import React, { useState, useEffect } from 'react';
import { ComplaintStatus } from '../../types';
import { Clock, CheckCircle, ExternalLink, Activity, Filter, Loader2, MapPin } from 'lucide-react';
import api from '../../src/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ComplaintTracking: React.FC<{ user: any }> = ({ user }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ FETCH FROM BACKEND
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await api.get('/complaints/my');

        setComplaints(res.data);
      } catch (err) {
        console.error('Failed to fetch complaints', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.PENDING:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case ComplaintStatus.RESOLVED:
        return 'bg-green-100 text-green-700 border-green-200';
      case ComplaintStatus.CLOSED:
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case ComplaintStatus.REJECTED:
        return 'bg-black text-white border-black';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getAuthorityText = (level?: number) => {
    if (level === undefined || level === 0) return "Handled by: Department Officer";
    if (level === 1) return "Escalated to: Department Head";
    return "Escalated to: System Administrator";
  };

  const filtered = complaints.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'active')
      return c.status !== ComplaintStatus.CLOSED &&
        c.status !== ComplaintStatus.RESOLVED;
    if (filter === 'resolved')
      return c.status === ComplaintStatus.RESOLVED ||
        c.status === ComplaintStatus.CLOSED;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Grievances...</p>
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
    <motion.div initial="hidden" animate="visible" variants={containerVars} className="space-y-10 max-w-7xl mx-auto px-4 pb-20 font-sans">
      {/* HEADER */}
      <motion.div variants={itemVars} className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/50 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/40 border border-white">
        <div>
          <span className="inline-block px-3 py-1 mb-3 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
            Citizen Dashboard
          </span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Activity className="text-blue-500" size={32} />
            Track Grievances
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Real-time monitoring and lifecycle tracking of your reported civic issues.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner relative">
          {['all', 'active', 'resolved'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t as any)}
              className="relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors z-10"
            >
              <span className={`relative z-10 ${filter === t ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>{t}</span>
              {filter === t && (
                <motion.div layoutId="filterTab" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200 z-0" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* LIST */}
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center py-24 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white shadow-xl shadow-slate-200/40">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Filter size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-black text-lg">No grievances found for your profile.</p>
              <p className="text-slate-400 font-medium text-sm mt-2">Adjust your filters or lodge a new complaint.</p>
            </motion.div>
          ) : (
            filtered.map((c, i) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                key={c.complaintId}
                className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 transition-all group"
              >
                <div className="p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest border border-blue-100">
                          {c.complaintNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-400 flex items-center">
                          <Clock size={12} className="mr-1.5" />
                          {new Date(c.submittedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                        {c.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
                          {c.category?.name}
                        </p>
                        <p className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border ${(c.escalationLevel || 0) === 0 ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          (c.escalationLevel === 1) ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                          {getAuthorityText(c.escalationLevel)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <p className="text-slate-600 text-sm font-medium mb-8 bg-slate-50/80 p-5 rounded-2xl border border-slate-100 leading-relaxed">
                    {c.description}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-slate-100/80">
                    <button
                      onClick={() => navigate(`/citizen/complaint/${c.complaintId}`)}
                      className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 group-hover:border-blue-200"
                    >
                      <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500" />
                      View Full Details
                    </button>

                    {c.status === ComplaintStatus.RESOLVED && (
                      <button className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                        <CheckCircle size={16} />
                        Confirm Resolution
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ComplaintTracking;
