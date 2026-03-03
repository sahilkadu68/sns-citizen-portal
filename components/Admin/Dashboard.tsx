import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ComplaintStatus } from '../../types';
import { ListTodo, PieChart, Users, Map, Plus, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ new: 0, progress: 0, escalated: 0, overdue: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [zoneData, setZoneData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };



        // 2. Fetch All for Recent & Client-side stats (Detailed breakdown)
        const resComplaints = await fetch('http://localhost:8080/api/complaints/all', { headers });
        if (resComplaints.ok) {
          const complaints = await resComplaints.json();
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
        const resAnalytics = await fetch('http://localhost:8080/api/analytics/summary', { headers });
        if (resAnalytics.ok) {
          const analytics = await resAnalytics.json();
          setStats(prev => ({ ...prev, overdue: analytics.overdue }));
        }

        // 4. Fetch Zone Performance
        const resZones = await fetch('http://localhost:8080/api/analytics/zone-performance', { headers });
        if (resZones.ok) {
          const zones: any[] = await resZones.json();
          // Calculate total for percentage
          const total = zones.reduce((acc, curr) => acc + (curr.value as number), 0);

          const formattedZones = zones.map((z: any) => ({
            name: z.name || 'Unassigned',
            value: total === 0 ? 0 : Math.round(((z.value as number) / total) * 100)
          }));
          setZoneData(formattedZones);
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
      <motion.div variants={itemVars} className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 mb-3 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
            {user.role === 'ROLE_ADMIN' ? 'System Administrator' : 'Department Official'}
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Welcome back, {user.role === 'ROLE_ADMIN' ? 'Admin' : user.fullName}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Monitor real-time civic issues and performance metrics.</p>
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
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden relative">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-sm z-10 relative">
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                Recently Lodged Grievances
              </h3>
              <button onClick={() => navigate('/admin/complaints')} className="text-sm text-blue-600 font-bold hover:text-blue-700 transition-colors">View All</button>
            </div>
            <div className="divide-y divide-slate-50">
              {recent.length === 0 ? <p className="p-10 text-center text-slate-400 font-medium">No complaints logged yet.</p> : recent.map((c, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (i * 0.1) }}
                  key={c.complaintId} onClick={() => navigate('/admin/complaints')}
                  className="px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black shadow-inner border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      #S
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm tracking-tight">{c.complaintNumber}</h4>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">{c.categoryName || 'General'} <span className="text-slate-300 mx-1">•</span> {new Date(c.submittedAt).toLocaleDateString()}</p>
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
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
            <h3 className="font-black text-slate-900 mb-6 flex items-center text-lg tracking-tight">
              <PieChart size={20} className="mr-2 text-indigo-500" />
              Zone Complaints
            </h3>
            <div className="space-y-5">
              {zoneData.length === 0 ? <p className="text-slate-400 text-sm font-medium">No data available to display</p> : zoneData.map((z, index) => (
                <ZoneProgress key={index} name={z.name} percent={z.value} delay={0.4 + (index * 0.1)} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const StatusSummary: React.FC<{ title: string; count: number; icon: React.ReactNode; type: 'blue' | 'indigo' | 'red' | 'amber'; delay: number }> = ({ title, count, icon, type, delay }) => {
  const styles: any = {
    blue: { bg: 'from-blue-50 to-white', text: 'text-blue-600', border: 'border-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    indigo: { bg: 'from-indigo-50 to-white', text: 'text-indigo-600', border: 'border-indigo-100', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    red: { bg: 'from-red-50 to-white', text: 'text-red-600', border: 'border-red-100', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    amber: { bg: 'from-amber-50 to-white', text: 'text-amber-600', border: 'border-amber-100', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' }
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
        <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{count}</h4>
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
      <span className="font-bold text-slate-700 text-sm tracking-tight">{name}</span>
      <span className="font-black text-slate-900 text-sm">{percent}%</span>
    </div>
    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1, delay, ease: "easeOut" }}
        className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full"
      ></motion.div>
    </div>
  </motion.div>
);

export default Dashboard;
