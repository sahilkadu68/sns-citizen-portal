
import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types';
import { FilePlus, MapPin, ListTodo, HelpCircle, Bell, ChevronRight, Activity, TrendingUp } from 'lucide-react';
import api from '../../src/api';
import { motion } from 'framer-motion';
import { useI18n } from '../../src/i18n';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [complaints, setComplaints] = React.useState<any[]>([]);
  const { t } = useI18n();

  React.useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await api.get('/complaints/my');

        // Sort by date desc
        setComplaints(res.data.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
      } catch (err) {
        console.error(err);
      }
    };
    fetchComplaints();
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
      <motion.div variants={itemVars} className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-3xl p-8 sm:p-12 border border-slate-700 shadow-2xl relative overflow-hidden">
        {/* Background Decorative Rings */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full border-[40px] border-white/5 opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-20 -mb-20 w-64 h-64 rounded-full border-[30px] border-orange-500/10 opacity-30 pointer-events-none"></div>

        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white uppercase tracking-widest mb-4 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> {t('citizen.portal')}
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">{t('citizen.welcome')}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">{user.fullName}</span>!</h1>
            <p className="text-slate-300 text-lg max-w-xl font-medium leading-relaxed">{t('citizen.subtitle')}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-wrap gap-4 mt-8">
            <Link to="/citizen/lodge">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-500/20 transition-all border border-orange-400/50">
                <FilePlus size={20} />
                <span>{t('citizen.reportIssue')}</span>
              </motion.button>
            </Link>
            <Link to="/citizen/track">
              <motion.button whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }} whileTap={{ scale: 0.95 }} className="flex items-center space-x-2 px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold shadow-xl transition-all">
                <ListTodo size={20} />
                <span>{t('citizen.trackIssues')}</span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVars} className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Activity className="text-orange-500" size={24} /> {t('citizen.recentActivity')}
            </h3>
            <Link to="/citizen/track" className="text-sm font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors flex items-center">
              {t('citizen.viewAll')} <ChevronRight size={16} />
            </Link>
          </div>

          <div className="space-y-4">
            {complaints.slice(0, 3).map((c, i) => (
              <motion.div key={c.complaintId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (i * 0.1) }}>
                <ActivityItem
                  title={`Grievance: ${c.complaintNumber || 'Processing...'}`}
                  desc={c.title}
                  time={new Date(c.submittedAt).toLocaleDateString()}
                  type={c.status === 'RESOLVED' ? 'success' : c.status === 'SUBMITTED' ? 'pending' : 'info'}
                />
              </motion.div>
            ))}
            {complaints.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <MapPin className="mx-auto text-slate-300 mb-3" size={40} />
                <p className="text-slate-500 font-bold">{t('citizen.noComplaints')}</p>
                <p className="text-sm text-slate-400 mt-1">{t('citizen.noComplaintsHint')}</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/40 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -z-10"></div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-5 flex items-center tracking-tight">
              <TrendingUp size={20} className="mr-2 text-blue-500" />
              {t('citizen.cityServices')}
            </h3>
            <div className="space-y-5">
              <ServiceStatusItem name="Water Supply" status="Normal" color="green" />
              <ServiceStatusItem name="Power Grid" status="Normal" color="green" />
              <ServiceStatusItem name="Sanitation" status="Delayed" color="amber" />
            </div>
          </div>

          <motion.div whileHover={{ y: -4 }} className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
            <HelpCircle className="text-emerald-100 mb-4" size={36} />
            <h4 className="font-black text-xl mb-2 tracking-tight">{t('citizen.needHelp')}</h4>
            <p className="text-emerald-50 text-sm mb-6 leading-relaxed font-medium">{t('citizen.helpText')}</p>
            <button className="w-full py-3.5 bg-white text-emerald-700 rounded-2xl font-black text-sm hover:shadow-lg transition-all shadow-md">
              {t('citizen.helpline')}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const ActivityItem: React.FC<{ title: string; desc: string; time: string; type: 'success' | 'info' | 'pending' }> = ({ title, desc, time, type }) => {
  const styles: any = {
    success: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500', border: 'border-green-100' },
    info: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', border: 'border-blue-100' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', border: 'border-amber-100' }
  };
  const s = styles[type];

  return (
    <div className={`p-5 rounded-3xl border ${s.border} bg-white dark:bg-slate-900 dark:border-slate-800 flex items-start space-x-4 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group`}>
      <div className={`w-12 h-12 shrink-0 rounded-2xl ${s.bg} flex items-center justify-center`}>
        <div className={`w-3 h-3 rounded-full ${s.dot} shadow-sm`}></div>
      </div>
      <div className="flex-grow pt-1">
        <div className="flex justify-between items-start">
          <h4 className="font-black text-slate-800 dark:text-white text-sm tracking-tight group-hover:text-orange-600 transition-colors">{title}</h4>
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">{time}</span>
        </div>
        <p className="text-sm text-slate-500 mt-1.5 font-medium leading-snug">{desc}</p>
      </div>
    </div>
  );
};

const ServiceStatusItem: React.FC<{ name: string; status: string; color: string }> = ({ name, status, color }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
        <div className={`w-2 h-2 rounded-full bg-${color}-500 group-hover:scale-125 transition-transform`}></div>
      </div>
      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{name}</span>
    </div>
    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-${color}-50 text-${color}-600 border border-${color}-100 shadow-sm`}>
      {status}
    </span>
  </div>
);

export default Dashboard;
