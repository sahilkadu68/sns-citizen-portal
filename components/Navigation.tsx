
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import { LayoutDashboard, FilePlus, ListTodo, PieChart, LogOut, ShieldCheck, User as UserIcon, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  user: User;
  onLogout: () => void;
}

const Navigation: React.FC<Props> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const profilePath = user.role === UserRole.CITIZEN ? '/citizen/profile' : '/admin/profile';

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm sticky top-0 z-50">
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
              <span className="font-black text-2xl tracking-tighter text-slate-800">
                Smart<span className="text-orange-600">Nagrik</span><span className="text-green-600">Seva</span>
              </span>
            </Link>

            <div className="hidden lg:flex space-x-2">
              {user.role === UserRole.CITIZEN ? (
                <>
                  <NavLink to="/citizen/dashboard" current={location.pathname} icon={<LayoutDashboard size={18} />} label="Dashboard" />
                  <NavLink to="/citizen/lodge" current={location.pathname} icon={<FilePlus size={18} />} label="Lodge" />
                  <NavLink to="/citizen/track" current={location.pathname} icon={<ListTodo size={18} />} label="Tracking" />
                </>
              ) : user.role === UserRole.ADMIN ? (
                <>
                  <NavLink to="/admin/dashboard" current={location.pathname} icon={<LayoutDashboard size={18} />} label="Summary" />
                  <NavLink to="/admin/complaints" current={location.pathname} icon={<ListTodo size={18} />} label="Manage" />
                  <NavLink to="/admin/departments" current={location.pathname} icon={<Building2 size={18} />} label="Departments" />
                  <NavLink to="/admin/analytics" current={location.pathname} icon={<PieChart size={18} />} label="Analytics" />
                </>
              ) : user.role === UserRole.DEPT_HEAD ? (
                <>
                  <NavLink to="/admin/complaints" current={location.pathname} icon={<ListTodo size={18} />} label="Manage Issues" />
                  <NavLink to="/admin/officers" current={location.pathname} icon={<UserIcon size={18} />} label="Officers" />
                </>
              ) : (
                <>
                  <NavLink to="/admin/complaints" current={location.pathname} icon={<ListTodo size={18} />} label="Manage Issues" />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <Link
              to={profilePath}
              className="hidden sm:flex flex-col items-end group"
            >
              <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-orange-600 transition-colors">{user.fullName}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{user.role.replace('ROLE_', '').replace('_', ' ')}</span>
            </Link>
            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "#fee2e2" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-red-600 rounded-xl transition-colors flex items-center justify-center relative group"
              title="Logout"
            >
              <LogOut size={20} />
              <span className="absolute -bottom-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Sign Out
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
      <div className={`relative z-10 flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-orange-600' : 'text-slate-500 group-hover:text-slate-800'}`}>
        {icon}
        <span>{label}</span>
      </div>
      {isActive ? (
        <motion.div layoutId="nav-active" className="absolute inset-0 bg-orange-50 border border-orange-100 rounded-xl z-0" />
      ) : (
        <div className="absolute inset-0 bg-slate-100 opacity-0 group-hover:opacity-100 rounded-xl z-0 transition-opacity" />
      )}
    </Link>
  );
};

export default Navigation;
