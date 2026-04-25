import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Plus, Building2, Trash2, Edit2, Mail, Phone, X, Check, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import api from '../../src/api';

const DepartmentManagement: React.FC<{ user: User }> = ({ user }) => {
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [newDept, setNewDept] = useState({ name: '', description: '', contactEmail: '', contactPhone: '' });
    const [editingDept, setEditingDept] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', contactEmail: '', contactPhone: '' });

    useEffect(() => { fetchDepartments(); }, []);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments');
            if (res.status === 200) setDepartments(res.data);
        } catch (e) { console.error(e); }
    };

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = editingDept ? editForm : newDept;
        if (!form.name.trim()) return;
        setLoading(true);
        try {
            const url = editingDept ? `/departments/${editingDept.id}` : '/departments';
            const res = await (editingDept ? api.put(url, form) : api.post(url, form));
            
            if (res.status === 200 || res.status === 201) {
                showToast(editingDept ? 'Updated successfully!' : 'Department created!', 'success');
                setNewDept({ name: '', description: '', contactEmail: '', contactPhone: '' });
                setEditingDept(null);
                fetchDepartments();
            } else {
                showToast(`Error: ${res.data}`, 'error');
            }
        } catch { showToast('Operation failed', 'error'); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this department?")) return;
        try {
            const res = await api.delete(`/departments/${id}`);
            if (res.status === 200 || res.status === 204) { showToast('Department removed.', 'success'); fetchDepartments(); }
            else showToast('Failed to delete.', 'error');
        } catch { showToast('Delete failed', 'error'); }
    };

    const startEditing = (dept: any) => {
        setEditingDept(dept);
        setEditForm({ name: dept.name || '', description: dept.description || '', contactEmail: dept.contactEmail || '', contactPhone: dept.contactPhone || '' });
    };

    const form = editingDept ? editForm : newDept;
    const setForm = editingDept
        ? (f: any) => setEditForm(f)
        : (f: any) => setNewDept(f);

    return (
        <div className="font-sans max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full border-[50px] border-white/5 -mr-16 -mt-16 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full border-[30px] border-blue-400/10 -ml-10 -mb-10 pointer-events-none" />
                <div className="relative z-10">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-white/10 backdrop-blur-sm mb-4">
                        <Building2 size={12} /> Administrative Console
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Department <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Management</span></h1>
                    <p className="text-slate-400 font-medium text-sm">Configure and manage municipal department entities and their contact information.</p>
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
                        <div className={`px-8 pt-8 pb-6 border-b border-slate-100 flex items-center justify-between ${editingDept ? 'bg-gradient-to-r from-indigo-50 to-violet-50' : 'bg-gradient-to-r from-blue-50 to-cyan-50'}`}>
                            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                {editingDept ? <Edit2 size={18} className="text-indigo-500" /> : <Plus size={18} className="text-blue-500" />}
                                {editingDept ? 'Edit Department' : 'New Department'}
                            </h3>
                            {editingDept && (
                                <button onClick={() => setEditingDept(null)} className="p-1.5 rounded-full hover:bg-white/80 text-slate-400 hover:text-slate-600 transition-all">
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            {[
                                { label: 'Department Name', key: 'name', type: 'text', placeholder: 'e.g. Sanitation, Water Supply', required: true },
                                { label: 'Description', key: 'description', type: 'textarea', placeholder: 'Brief description of responsibilities...' },
                                { label: 'Contact Email', key: 'contactEmail', type: 'email', placeholder: 'dept@sns.gov.in', icon: <Mail size={15} className="text-slate-400" /> },
                                { label: 'Contact Phone', key: 'contactPhone', type: 'tel', placeholder: '+91 98765 43210', icon: <Phone size={15} className="text-slate-400" /> },
                            ].map(field => (
                                <div key={field.key}>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        {field.label}{field.required && <span className="text-orange-400 ml-1">*</span>}
                                    </label>
                                    <div className="relative">
                                        {field.icon && <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">{field.icon}</div>}
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                value={(form as any)[field.key]}
                                                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                                                className="w-full px-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all outline-none resize-none"
                                                placeholder={field.placeholder}
                                                rows={3}
                                            />
                                        ) : (
                                            <input
                                                type={field.type}
                                                required={!!field.required}
                                                value={(form as any)[field.key]}
                                                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                                                className={`w-full py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all outline-none ${field.icon ? 'pl-9 pr-4' : 'px-4'}`}
                                                placeholder={field.placeholder}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                            <motion.button
                                whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                                type="submit" disabled={loading}
                                className={`w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 ${editingDept ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-500/30' : 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/30'}`}
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : (editingDept ? <><Check size={16} /> Update Department</> : <><Plus size={16} /> Create Department</>)}
                            </motion.button>
                        </form>
                    </div>
                </motion.div>

                {/* Department List */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
                            <h3 className="font-black text-slate-900 flex items-center gap-2">
                                <div className="w-2 h-6 bg-blue-500 rounded-full" />
                                Active Departments
                            </h3>
                            <span className="bg-blue-50 text-blue-700 text-[11px] font-black px-3 py-1.5 rounded-full border border-blue-100">{departments.length} Total</span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {departments.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <Building2 size={36} className="text-slate-300" />
                                    </div>
                                    <p className="font-black text-slate-500">No departments yet</p>
                                    <p className="text-sm text-slate-400 mt-1 font-medium">Add your first department using the form.</p>
                                </div>
                            ) : departments.map((dept, i) => (
                                <motion.div
                                    key={dept.id}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                    className="px-8 py-6 hover:bg-slate-50/70 transition-colors group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:from-blue-100 group-hover:to-cyan-100 transition-all shadow-sm">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-black text-slate-900 tracking-tight">{dept.name}</h4>
                                                    <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-widest">ID #{dept.id}</span>
                                                </div>
                                                {dept.description && <p className="text-slate-500 text-sm font-medium leading-relaxed mb-3 max-w-md">{dept.description}</p>}
                                                <div className="flex flex-wrap gap-3">
                                                    {dept.contactEmail && (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                            <Mail size={12} className="text-blue-400" /> {dept.contactEmail}
                                                        </span>
                                                    )}
                                                    {dept.contactPhone && (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                            <Phone size={12} className="text-green-400" /> {dept.contactPhone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button onClick={() => startEditing(dept)}
                                                className="p-2.5 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(dept.id)}
                                                className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
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

export default DepartmentManagement;
