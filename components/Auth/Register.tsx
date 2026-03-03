import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, User, Mail, Phone, MapPin, Lock,
  ChevronRight, CheckCircle2, Loader2, AlertCircle, ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [otpStage, setOtpStage] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  /* ================= REGISTER (SEND OTP) ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      await axios.post('http://localhost:8080/api/auth/register', {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phone,
        address: formData.address,
        password: formData.password
      });

      // Move to OTP screen ONLY after backend success
      setOtpStage(true);

    } catch (err: any) {
      setError(err.response?.data || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post('http://localhost:8080/api/auth/verify-otp', {
        email: formData.email,
        otp: otp
      });

      setIsSuccess(true);

    } catch (err: any) {
      setError(err.response?.data || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= OTP SCREEN ================= */

  if (otpStage && !isSuccess) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-orange-400/20 blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-green-400/20 blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border border-white/50 relative z-10"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Mail size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Verify your Email</h2>
          <p className="text-slate-500 font-medium mb-8">
            Enter the 6-digit OTP sent to <strong className="text-slate-800">{formData.email}</strong>
          </p>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-red-50/80 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center justify-center gap-2">
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}

          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            className="w-full px-4 py-4 mb-6 bg-slate-50/50 border border-slate-200 rounded-2xl text-center text-3xl font-black tracking-[1em] focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all outline-none"
          />

          <motion.button
            whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgb(249 115 22 / 0.2)" }}
            whileTap={{ y: 0 }}
            onClick={handleVerifyOtp}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-500/20 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "VERIFY OTP"}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  /* ================= SUCCESS SCREEN ================= */

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-400/20 blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border border-white/50 relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
          >
            <CheckCircle2 size={40} />
          </motion.div>

          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Registration Complete</h2>
          <p className="text-slate-500 font-medium mb-8">Your account has been verified successfully.</p>

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-900/20 transition-all"
          >
            PROCEED TO LOGIN
          </motion.button>
        </motion.div>
      </div>
    );
  }

  /* ================= REGISTRATION FORM ================= */

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center relative overflow-hidden font-sans py-12 sm:px-6 lg:px-8">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-orange-400/20 blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-green-400/20 blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 mb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm hover:bg-white transition-colors">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-1.5 rounded-lg shadow-md shadow-orange-500/20">
            <Shield size={20} />
          </div>
          <span className="font-black text-xl tracking-tighter text-slate-800">
            Smart<span className="text-orange-600">Nagrik</span><span className="text-green-600">Seva</span>
          </span>
        </Link>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Create Account</h2>
        <p className="text-slate-500 font-medium">Join the civic platform for real-time issue tracking.</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50"
        >
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-red-50/80 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0" /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Full Name" value={formData.fullName}
                onChange={v => setFormData({ ...formData, fullName: v })} icon={<User size={18} />} placeholder="Jane Doe" />
              <InputField label="Email" type="email" value={formData.email}
                onChange={v => setFormData({ ...formData, email: v })} icon={<Mail size={18} />} placeholder="name@domain.com" />
              <InputField label="Phone" value={formData.phone}
                onChange={v => setFormData({ ...formData, phone: v })} icon={<Phone size={18} />} placeholder="+91 9876543210" />
              <InputField label="City Address" value={formData.address}
                onChange={v => setFormData({ ...formData, address: v })} icon={<MapPin size={18} />} placeholder="Mumbai, MH" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Password" type="password" value={formData.password}
                onChange={v => setFormData({ ...formData, password: v })} icon={<Lock size={18} />} placeholder="••••••••" />
              <InputField label="Confirm Password" type="password" value={formData.confirmPassword}
                onChange={v => setFormData({ ...formData, confirmPassword: v })} icon={<Lock size={18} />} placeholder="••••••••" />
            </div>

            <motion.button
              whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgb(249 115 22 / 0.2)" }}
              whileTap={{ y: 0 }}
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>REGISTER & VERIFY <ArrowRight size={18} /></>}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm font-medium text-slate-500">
              Already have an account? <Link to="/login" className="font-black text-orange-600 hover:text-orange-500 transition-colors">Sign in here</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ================= INPUT COMPONENT ================= */

const InputField: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}> = ({ icon, label, value, onChange, type = "text", placeholder }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
        {icon}
      </div>
      <input
        required
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all outline-none shadow-sm placeholder:text-slate-300"
      />
    </div>
  </div>
);

export default Register;
