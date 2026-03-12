import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Plus, User as UserIcon, Trash2, Mail, Phone, Shield, Loader2, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import api from '../../src/api';

const ManageOfficers: React.FC<{ user: User }> = ({ user }) => {
    const [officers, setOfficers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [newOfficer, setNewOfficer] = useState({ fullName: '', email: '', phoneNumber: '', password: '', employeeId: '' });

    useEffect(() => { fetchOfficers(); }, []);

    const fetchOfficers = async () => {
        try {
            const res = await api.get('/officers/department');
            if (res.status === 200) setOfficers(res.data);
        } catch (e) { console.error(e); }
    };

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleAddOfficer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOfficer.fullName.trim() || !newOfficer.email.trim() || !newOfficer.password.trim()) return;
        setLoading(true);
        try {
            const res = await api.post('/officers', newOfficer);
            if (res.status === 200 || res.status === 201) {
                setNewOfficer({ fullName: '', email: '', phoneNumber: '', password: '', employeeId: '' });
                showToast('Officer added successfully!', 'success');
                fetchOfficers();
            } else {
                showToast(res.data?.message || 'Failed to add officer', 'error');
            }
        } catch { showToast('Failed to add officer', 'error'); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Remove this officer from the department?")) return;
        try {
            const res = await api.delete(`/officers/${id}`);
            if (res.status === 200 || res.status === 204) { showToast('Officer removed.', 'success'); fetchOfficers(); }
            else showToast('Failed to delete.', 'error');
        } catch { showToast('Delete failed', 'error'); }
    };

    const fields = [
        { label: 'Full Name', key: 'fullName', type: 'text', placeholder: 'e.g. Ramesh Pawar', required: true },
        { label: 'Email Address', key: 'email', type: 'email', placeholder: 'officer@sns.gov.in', required: true, icon: <Mail size={15} className="text-slate-400" /> },
        { label: 'Phone Number', key: 'phoneNumber', type: 'tel', placeholder: '+91 98765 43210', icon: <Phone size={15} className="text-slate-400" /> },
        { label: 'Employee ID', key: 'employeeId', type: 'text', placeholder: 'Auto-generated if empty', icon: <Shield size={15} className="text-slate-400" /> },
        { label: 'Temporary Password', key: 'password', type: 'password', placeholder: '••••••••', required: true },
    ];

    // Get initials for avatar
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="font-sans max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-violet-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full border-[50px] border-white/5 -mr-16 -mt-16 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full border-[30px] border-violet-400/10 -ml-10 -mb-10 pointer-events-none" />
                <div className="relative z-10">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 text-violet-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-white/10 backdrop-blur-sm mb-4">
                        <UserIcon size={12} /> Department Head Console
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Manage <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-300">Officers</span></h1>
                    <p className="text-slate-400 font-medium text-sm">Add, remove, and manage field officers assigned to your department for complaint resolution.</p>
                </div>
            </motion.div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-lg text-sm font-bold ${toast.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white sticky top-28 overflow-hidden">
                        <div className="px-8 pt-8 pb-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
                            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                <Plus size={18} className="text-violet-500" /> Add New Officer
                            </h3>
                            <p className="text-slate-500 text-xs font-bold mt-1">Officer will receive login credentials</p>
                        </div>
                        <form onSubmit={handleAddOfficer} className="p-8 space-y-5">
                            {fields.map(field => (
                                <div key={field.key}>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        {field.label}{field.required && <span className="text-orange-400 ml-1">*</span>}
                                    </label>
                                    <div className="relative">
                                        {field.icon && <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">{field.icon}</div>}
                                        <input
                                            type={field.type}
                                            required={!!field.required}
                                            value={(newOfficer as any)[field.key]}
                                            onChange={e => setNewOfficer({ ...newOfficer, [field.key]: e.target.value })}
                                            className={`w-full py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all outline-none ${field.icon ? 'pl-9 pr-4' : 'px-4'}`}
                                            placeholder={field.placeholder}
                                        />
                                    </div>
                                </div>
                            ))}
                            <motion.button
                                whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                                type="submit" disabled={loading}
                                className="w-full py-4 text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={16} /> Add Officer</>}
                            </motion.button>
                        </form>
                    </div>
                </motion.div>

                {/* Officers List */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
                            <h3 className="font-black text-slate-900 flex items-center gap-2">
                                <div className="w-2 h-6 bg-violet-500 rounded-full" />
                                Department Officers
                            </h3>
                            <span className="bg-violet-50 text-violet-700 text-[11px] font-black px-3 py-1.5 rounded-full border border-violet-100">{officers.length} Officers</span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {officers.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <UserIcon size={36} className="text-slate-300" />
                                    </div>
                                    <p className="font-black text-slate-500">No officers assigned</p>
                                    <p className="text-sm text-slate-400 mt-1 font-medium">Add officers using the form to handle complaints.</p>
                                </div>
                            ) : officers.map((officer, i) => (
                                <motion.div
                                    key={officer.id}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                    className="px-8 py-6 hover:bg-slate-50/70 transition-colors group"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-md shadow-violet-500/20">
                                                {getInitials(officer.fullName || 'OF')}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-black text-slate-900 tracking-tight">{officer.fullName}</h4>
                                                    {officer.employeeId && (
                                                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-widest">#{officer.employeeId}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                        <Mail size={12} className="text-violet-400" /> {officer.email}
                                                    </span>
                                                    {officer.phoneNumber && (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                            <Phone size={12} className="text-green-400" /> {officer.phoneNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(officer.id)}
                                            className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 opacity-0 group-hover:opacity-100"
                                            title="Remove officer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ManageOfficers;
