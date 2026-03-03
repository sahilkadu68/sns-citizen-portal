
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Shield, ArrowLeft, Key, Lock, CheckCircle2, Loader2 } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1500);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("Passwords mismatch!");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 relative overflow-hidden">
        {step < 4 && (
          <Link to="/login" className="absolute top-8 left-8 p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-all">
            <ArrowLeft size={18} />
          </Link>
        )}

        <div className="text-center mt-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-50">
            {step === 4 ? <CheckCircle2 size={32} /> : <Key size={32} />}
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            {step === 1 && "Reset Password"}
            {step === 2 && "Verification"}
            {step === 3 && "Secure Account"}
            {step === 4 && "All Set!"}
          </h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">
            {step === 1 && "Identity Verification"}
            {step === 2 && "OTP Code Required"}
            {step === 3 && "Create New Credentials"}
            {step === 4 && "Password Updated"}
          </p>
        </div>

        <div className="mt-10">
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    required type="email" placeholder="name@example.com" 
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <button disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : "SEND OTP CODE"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <p className="text-sm text-center text-gray-500 mb-4">Verification code sent to <strong>{email}</strong></p>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">6-Digit Code</label>
                <input 
                  required type="text" maxLength={6} placeholder="0 0 0 0 0 0" 
                  className="w-full text-center tracking-[0.5em] py-4 bg-gray-50 border-0 rounded-2xl text-xl font-black focus:ring-2 focus:ring-blue-500 outline-none"
                  value={otp} onChange={e => setOtp(e.target.value)}
                />
              </div>
              <button disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : "VERIFY CODE"}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required type="password" placeholder="••••••••" 
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required type="password" placeholder="••••••••" 
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <button disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : "UPDATE PASSWORD"}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center space-y-6">
              <p className="text-gray-500">Your credentials have been successfully updated. You can now access your portal.</p>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100"
              >
                SIGN IN NOW
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
