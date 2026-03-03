
import React, { useState } from 'react';
import { User as UserType } from '../../types';
import { User, Mail, Phone, MapPin, Shield, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  user: UserType;
  onUpdate: (updatedUser: UserType) => void;
}

const Profile: React.FC<Props> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    mobileNumber: user.mobileNumber || '',
    address: user.address || ''
  });

  const [passwordData, setPasswordData] = useState({
    old: '',
    new: '',
    confirm: ''
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user.email, // using email as key for now
          fullName: formData.fullName,
          mobileNumber: formData.mobileNumber,
          address: formData.address
        })
      });

      if (response.ok) {
        setSuccess(true);
        // Optimistic update of local user state
        onUpdate({
          ...user,
          fullName: formData.fullName,
          mobileNumber: formData.mobileNumber,
          address: formData.address
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      alert("Passwords mismatch");
      return;
    }
    // Set loading/success simulation for now (Backend password change endpoint needed separately)
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setPasswordData({ old: '', new: '', confirm: '' });
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  const getRoleName = (role: string) => {
    if (role === 'ROLE_ADMIN' || role === 'ADMIN') return 'Administrator';
    if (role === 'ROLE_DEPT_HEAD') return 'Department Head';
    if (role === 'ROLE_CITIZEN' || role === 'CITIZEN') return 'Citizen User';
    return role;
  };

  const isCitizen = user.role === 'ROLE_CITIZEN' || user.role === 'CITIZEN';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account Settings</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Manage Personal Identity & Security</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl border border-green-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 size={16} />
            <span className="text-xs font-bold">Updated Successfully</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <User className="text-blue-600" size={20} /> Personal Information
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2 opacity-60">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Identity (Read Only)</label>
                  <input readOnly className="w-full px-5 py-4 bg-gray-100 border-0 rounded-2xl text-sm font-bold" value={formData.email} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Contact</label>
                  <input
                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.mobileNumber} onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                  />
                </div>
                {!isCitizen && user.department && (
                  <div className="space-y-2 opacity-60">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Department</label>
                    <input readOnly className="w-full px-5 py-4 bg-gray-100 border-0 rounded-2xl text-sm font-bold" value={user.department.name} />
                  </div>
                )}
              </div>

              {isCitizen && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Primary Address</label>
                  <textarea
                    rows={3}
                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-bold resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              )}

              <button disabled={loading} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 flex items-center gap-3">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> SAVE CHANGES</>}
              </button>
            </form>
          </section>

          <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <Shield className="text-red-600" size={20} /> Account Security
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                <input
                  type="password" placeholder="Verify identity"
                  className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  value={passwordData.old} onChange={e => setPasswordData({ ...passwordData, old: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                  <input
                    type="password" placeholder="Minimum 8 characters"
                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={passwordData.new} onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <input
                    type="password" placeholder="Repeat for safety"
                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={passwordData.confirm} onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  />
                </div>
              </div>
              <button disabled={loading} className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-lg flex items-center gap-3">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Lock size={18} /> UPDATE PIN</>}
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 border border-blue-400">
              <User size={32} />
            </div>
            <h4 className="text-xl font-black mb-2">{user.fullName}</h4>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-6">{getRoleName(user.role)}</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-blue-300" />
                <span className="font-medium opacity-80">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-blue-300" />
                <span className="font-medium opacity-80">{user.mobileNumber}</span>
              </div>
              {user.department && (
                <div className="flex items-center gap-3 text-sm">
                  <Shield size={16} className="text-blue-300" />
                  <span className="font-medium opacity-80">{user.department.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h4 className="font-black text-gray-900 mb-4">Account Status</h4>
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <span className="text-sm text-gray-500 font-bold uppercase text-[10px] tracking-widest">Verified Identity</span>
              <CheckCircle2 size={16} className="text-green-500" />
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-500 font-bold uppercase text-[10px] tracking-widest">Two-Factor</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[9px] font-black tracking-widest uppercase">Disabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Profile;
