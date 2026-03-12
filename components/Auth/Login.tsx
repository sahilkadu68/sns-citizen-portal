import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../../types';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '../../src/api';
import { motion } from 'framer-motion';

interface Props {
  onLogin: (user: User) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      console.log("LOGIN RESPONSE:", response.data);
      console.log("LOGIN RESPONSE:", response.data);
      const token = response.data.token;


      if (!token) {
        throw new Error('Token not received from backend');
      }

      // Save token to localStorage for authenticated requests
      localStorage.setItem('token', token);

      const userData: User = {
        id: response.data.id || Date.now(),
        username: email.split('@')[0],
        fullName: response.data.fullName || "Citizen User",
        email: email,
        mobileNumber: response.data.mobileNumber || "N/A",
        role: response.data.role as UserRole,
        address: response.data.address,
        department: response.data.department,
        employeeId: response.data.employeeId,
        token: token
      };

      // Save user data for persistence
      localStorage.setItem('sns_user', JSON.stringify(userData));

      onLogin(userData);
      navigate(
        userData.role === UserRole.CITIZEN
          ? '/citizen/dashboard'
          : '/admin/dashboard'
      );

    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError('Invalid Email or Password. Try again');
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          'Authentication failed'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center relative overflow-hidden font-sans">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-orange-400/20 blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-green-400/20 blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-400/10 blur-3xl opacity-30 mix-blend-multiply pointer-events-none"></div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Link to="/" className="inline-flex items-center gap-2 mb-8 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm hover:bg-white transition-colors">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-1.5 rounded-lg shadow-md shadow-orange-500/20">
              <Shield size={20} />
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-800">
              Smart<span className="text-orange-600">Nagrik</span><span className="text-green-600">Seva</span>
            </span>
          </Link>

          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome Back</h2>
          <p className="text-slate-500 font-medium mb-8">Access the civic grievance portal</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 shadow-inner"
            >
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-bold leading-tight">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all outline-none shadow-sm"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Secure Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all outline-none shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link to="/forgot-password" className="font-bold text-slate-500 hover:text-orange-600 transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <motion.button
              whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgb(249 115 22 / 0.2)" }}
              whileTap={{ y: 0 }}
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-orange-500/20 text-sm font-black text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>SIGN IN <ArrowRight size={18} /></>
              )}
            </motion.button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500 font-medium">New to Smart Nagrik Seva?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link to="/register" className="font-black text-orange-600 hover:text-orange-500 transition-colors inline-block pb-0.5 border-b-2 border-orange-200 hover:border-orange-500">
                Create an account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
