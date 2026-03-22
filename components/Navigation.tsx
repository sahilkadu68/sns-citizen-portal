
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import { LayoutDashboard, FilePlus, ListTodo, PieChart, LogOut, ShieldCheck, User as UserIcon, Building2, Moon, Sun, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n, Lang, LANG_LABELS } from '../src/i18n';

interface Props {
  user: User;
  onLogout: () => void;
}

const Navigation: React.FC<Props> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useI18n();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    // Forcefully remove dark mode as requested by user to hide the feature for now
    html.classList.remove('dark');
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const profilePath = user.role === UserRole.CITIZEN ? '/citizen/profile' : '/admin/profile';

  return (
    <nav className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 shadow-sm sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-10">
            <Link
              to={
                user.role === UserRole.CITIZEN ? '/citizen/dashboard' :
                  user.role === UserRole.ADMIN ? '/admin/dashboard' :
                    '/admin/complaints'
              }
              className="flex items-center space-x-3 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-slate-800 dark:text-white">
                Smart<span className="text-orange-600">Nagrik</span><span className="text-green-600 dark:text-green-400">Seva</span>
              </span>
            </Link>

            <div className="hidden lg:flex space-x-2">
              {user.role === UserRole.CITIZEN ? (
                <>
                  <NavLink to="/citizen/dashboard" current={location.pathname} icon={<LayoutDashboard size={18} />} label={t('nav.dashboard')} />
                  <NavLink to="/citizen/lodge" current={location.pathname} icon={<FilePlus size={18} />} label={t('nav.lodge')} />
                  <NavLink to="/citizen/track" current={location.pathname} icon={<ListTodo size={18} />} label={t('nav.tracking')} />
                </>
              ) : user.role === UserRole.ADMIN ? (
                <>
                  <NavLink to="/admin/dashboard" current={location.pathname} icon={<LayoutDashboard size={18} />} label={t('nav.summary')} />
                  <NavLink to="/admin/complaints" current={location.pathname} icon={<ListTodo size={18} />} label={t('nav.manage')} />
                  <NavLink to="/admin/departments" current={location.pathname} icon={<Building2 size={18} />} label={t('nav.departments')} />
                  <NavLink to="/admin/analytics" current={location.pathname} icon={<PieChart size={18} />} label={t('nav.analytics')} />
                </>
              ) : user.role === UserRole.DEPT_HEAD ? (
                <>
                  <NavLink to="/admin/complaints" current={location.pathname} icon={<ListTodo size={18} />} label={t('nav.manageIssues')} />
                  <NavLink to="/admin/officers" current={location.pathname} icon={<UserIcon size={18} />} label={t('nav.officers')} />
                </>
              ) : (
                <>
                  <NavLink to="/admin/complaints" current={location.pathname} icon={<ListTodo size={18} />} label={t('nav.manageIssues')} />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            {/* Language Selector 
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center relative group"
                title="Change Language"
              >
                <Globe size={18} className={lang !== 'en' ? 'text-blue-500' : ''} />
                <span className="absolute -bottom-8 bg-slate-800 dark:bg-white dark:text-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {LANG_LABELS[lang]}
                </span>
              </motion.button>
              
              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-100 dark:border-slate-700 overflow-hidden z-50"
                  >
                    {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => { setLang(l); setShowLangMenu(false); }}
                        className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors ${lang === l ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                      >
                        {LANG_LABELS[l]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            */}

            <Link
              to={profilePath}
              className="hidden sm:flex flex-col items-end group"
            >
              <span className="text-sm font-black text-slate-800 dark:text-white tracking-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{user.fullName}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">{user.role.replace('ROLE_', '').replace('_', ' ')}</span>
            </Link>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            {/* Dark Mode Toggle
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDark(d => !d)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative group"
              title={t(dark ? 'nav.lightMode' : 'nav.darkMode')}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
              <span className="absolute -bottom-8 bg-slate-800 dark:bg-white dark:text-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {t(dark ? 'nav.lightMode' : 'nav.darkMode')}
              </span>
            </motion.button>
            */}

            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "#fee2e2" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-red-600 rounded-xl transition-colors flex items-center justify-center relative group"
              title={t('nav.signOut')}
            >
              <LogOut size={20} />
              <span className="absolute -bottom-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {t('nav.signOut')}
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; current: string }> = ({ to, icon, label, current }) => {
  const isActive = current === to || current.startsWith(`${to}/`);

  return (
    <Link to={to} className="relative px-4 py-2 rounded-xl group overflow-hidden">
      <div className={`relative z-10 flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white'}`}>
        {icon}
        <span>{label}</span>
      </div>
      {isActive ? (
        <motion.div layoutId="nav-active" className="absolute inset-0 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl z-0" />
      ) : (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 opacity-0 group-hover:opacity-100 rounded-xl z-0 transition-opacity" />
      )}
    </Link>
  );
};

export default Navigation;
