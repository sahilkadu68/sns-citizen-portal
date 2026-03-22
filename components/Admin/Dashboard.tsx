import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ComplaintStatus } from '../../types';
import { ListTodo, PieChart, Users, Map, Plus, ChevronRight, ActivitySquare } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../src/api';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ new: 0, progress: 0, escalated: 0, overdue: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 2. Fetch All for Recent & Client-side stats (Detailed breakdown)
        const resComplaints = await api.get('/complaints/all');
        if (resComplaints.status === 200) {
          const complaints = resComplaints.data;
          setRecent(complaints.slice(0, 5));

          // Hybrid approach: Use client calculations for statuses, Server for SLA/Overdue
          setStats(prev => ({
            ...prev,
            new: complaints.filter((c: any) => c.status === 'PENDING').length,
            progress: complaints.filter((c: any) => c.status === 'RESOLVED').length,
            escalated: complaints.filter((c: any) => (c.escalationLevel || 0) > 0 && c.status === 'PENDING').length,
            // overdue comes from summary endpoint below
          }));
        }

        // 3. Fetch Summary for Overdue (Server-side logic)
        const resAnalytics = await api.get('/analytics/summary');
        if (resAnalytics.status === 200) {
          const analytics = resAnalytics.data;
          setStats(prev => ({ ...prev, overdue: analytics.overdue }));
        }

        // 4. Fetch Zone Performance
        const resZones = await api.get('/analytics/zone-performance');
        if (resZones.status === 200) {
          const zones: any[] = resZones.data;
          // Calculate total for percentage
          const total = zones.reduce((acc, curr) => acc + (curr.value as number), 0);

          const formattedZones = zones.map((z: any) => ({
            name: z.name || 'Unassigned',
            value: total === 0 ? 0 : Math.round(((z.value as number) / total) * 100)
          }));
          setZoneData(formattedZones);
        }

        // 5. Fetch Audit Logs for Admins
        if (user.role === 'ROLE_ADMIN') {
          const resAudit = await api.get('/reports/audit-logs');
          setAuditLogs(resAudit.data.slice(0, 5));
        }

      } catch (e) {
        console.error("Admin dash fetch error", e);
      }
    };
    fetchStats();
  }, []);

  const containerVars = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVars} className="space-y-8 font-sans max-w-7xl mx-auto">
      <motion.div variants={itemVars} className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 dark:from-blue-900/20 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 mb-3 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">
            {user.role === 'ROLE_ADMIN' ? 'System Administrator' : 'Department Official'}
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user.role === 'ROLE_ADMIN' ? 'Admin' : user.fullName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Monitor real-time civic issues and performance metrics.</p>
        </div>
        <div className="relative z-10">
          <motion.button
            whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(37,99,235,0.2)" }}
            whileTap={{ y: 0 }}
            onClick={() => navigate('/admin/complaints')}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            Manage Grievances <ChevronRight size={18} />
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusSummary title="Pending Grievances" count={stats.new} icon={<Plus size={24} />} type="blue" delay={0.1} />
        <StatusSummary title="Resolved Cases" count={stats.progress} icon={<ListTodo size={24} />} type="indigo" delay={0.2} />
        <StatusSummary title="Escalated Issues" count={stats.escalated} icon={<Map size={24} />} type="red" delay={0.3} />
        <StatusSummary title="SLA Breached" count={stats.overdue} icon={<Users size={24} />} type="amber" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVars} className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 overflow-hidden relative">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 relative">
              <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                Recently Lodged Grievances
              </h3>
              <button onClick={() => navigate('/admin/complaints')} className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 dark:hover:text-blue-300 transition-colors">View All</button>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {recent.length === 0 ? <p className="p-10 text-center text-slate-400 font-medium">No complaints logged yet.</p> : recent.map((c, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (i * 0.1) }}
                  key={c.complaintId} onClick={() => navigate('/admin/complaints')}
                  className="px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black shadow-inner border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      #S
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight">{c.complaintNumber}</h4>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{c.categoryName || 'General'} <span className="text-slate-300 dark:text-slate-600 mx-1">•</span> {new Date(c.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                    <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">{c.status}</span>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all hidden sm:block" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 p-8">
            <h3 className="font-black text-slate-900 dark:text-white mb-6 flex items-center text-lg tracking-tight">
              <PieChart size={20} className="mr-2 text-indigo-500" />
              Zone Complaints
            </h3>
            <div className="space-y-5">
              {zoneData.length === 0 ? <p className="text-slate-400 text-sm font-medium">No data available to display</p> : zoneData.map((z, index) => (
                <ZoneProgress key={index} name={z.name} percent={z.value} delay={0.4 + (index * 0.1)} />
              ))}
            </div>
          </div>

          {user.role === 'ROLE_ADMIN' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <h3 className="font-black text-slate-900 dark:text-white mb-6 flex items-center text-lg tracking-tight relative z-10">
                <ActivitySquare size={20} className="mr-2 text-slate-500 dark:text-slate-400" />
                System Audit Log
              </h3>
              <div className="space-y-4 relative z-10">
                {auditLogs.length === 0 ? <p className="text-slate-400 text-sm font-medium">No activity recorded</p> : auditLogs.map((log) => (
                  <div key={log.id} className="pb-3 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between mb-1">
                      <span>{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight leading-snug">
                      <span className="text-blue-600 font-mono text-[11px] mr-1">{log.complaintNumber}</span>
                      {log.oldValue && log.newValue ? `changed from ${log.oldValue} to ${log.newValue}` : log.details || 'Action recorded'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-1 font-medium">by {log.performedBy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

const StatusSummary: React.FC<{ title: string; count: number; icon: React.ReactNode; type: 'blue' | 'indigo' | 'red' | 'amber'; delay: number }> = ({ title, count, icon, type, delay }) => {
  const styles: any = {
    blue: { bg: 'from-blue-50 to-white dark:from-blue-500/10 dark:to-slate-900', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-500/20', iconBg: 'bg-blue-100 dark:bg-blue-500/20', iconColor: 'text-blue-600 dark:text-blue-400' },
    indigo: { bg: 'from-indigo-50 to-white dark:from-indigo-500/10 dark:to-slate-900', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-500/20', iconBg: 'bg-indigo-100 dark:bg-indigo-500/20', iconColor: 'text-indigo-600 dark:text-indigo-400' },
    red: { bg: 'from-red-50 to-white dark:from-red-500/10 dark:to-slate-900', text: 'text-red-600 dark:text-red-400', border: 'border-red-100 dark:border-red-500/20', iconBg: 'bg-red-100 dark:bg-red-500/20', iconColor: 'text-red-600 dark:text-red-400' },
    amber: { bg: 'from-amber-50 to-white dark:from-amber-500/10 dark:to-slate-900', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-500/20', iconBg: 'bg-amber-100 dark:bg-amber-500/20', iconColor: 'text-amber-600 dark:text-amber-400' }
  };
  const s = styles[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }}
      whileHover={{ y: -4, shadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
      className={`p-6 rounded-3xl border shadow-sm flex items-center justify-between bg-gradient-to-br ${s.bg} ${s.border}`}
    >
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest ${s.text} opacity-80 mb-1`}>{title}</p>
        <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{count}</h4>
      </div>
      <div className={`p-3 rounded-2xl shadow-inner ${s.iconBg} ${s.iconColor}`}>
        {icon}
      </div>
    </motion.div>
  );
};

const ZoneProgress: React.FC<{ name: string; percent: number; delay: number }> = ({ name, percent, delay }) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }} className="space-y-2">
    <div className="flex justify-between items-end">
      <span className="font-bold text-slate-700 dark:text-slate-300 text-sm tracking-tight">{name}</span>
      <span className="font-black text-slate-900 dark:text-white text-sm">{percent}%</span>
    </div>
    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1, delay, ease: "easeOut" }}
        className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full"
      ></motion.div>
    </div>
  </motion.div>
);

export default Dashboard;
