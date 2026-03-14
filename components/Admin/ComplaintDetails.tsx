
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Complaint, ComplaintStatus } from '../../types';
import { ChevronLeft, MapPin, Calendar, User as UserIcon, AlertCircle, CheckCircle, Upload, Loader2, Clock, AlertTriangle } from 'lucide-react';
import api from '../../src/api';
import { motion } from 'framer-motion';

const ComplaintDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<ComplaintStatus | ''>('');
    const [proof, setProof] = useState<File | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState('');

    useEffect(() => {
        const fetchComplaint = async () => {
            try {
                const res = await api.get(`/complaints/${id}`);
                setComplaint(res.data);
                setStatus(res.data.status);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchComplaint();
    }, [id]);

    const handleStatusUpdate = async () => {
        try {
            const formData = new FormData();
            formData.append('status', status as string);
            if (resolutionNotes.trim() !== '') {
                formData.append('notes', resolutionNotes);
            }
            if (proof) {
                formData.append('proof', proof);
            }

            await api.put(`/complaints/${id}/resolve`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Complaint Updated Successfully!');
            navigate('/admin/complaints');
        } catch (e) {
            console.error("Update failed", e);
            alert('Failed to update complaint');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProof(e.target.files[0]);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
            <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Grievance File...</p>
        </div>
    );
    if (!complaint) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <AlertTriangle className="text-red-500 w-16 h-16" />
            <p className="text-slate-500 font-bold tracking-widest uppercase text-lg">Grievance Not Found</p>
            <button onClick={() => navigate('/admin/complaints')} className="text-blue-600 font-bold hover:underline">Return to List</button>
        </div>
    );

    const containerVars = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.div initial="hidden" animate="visible" variants={containerVars} className="max-w-6xl mx-auto px-4 py-8 font-sans space-y-8">
            <button onClick={() => navigate('/admin/complaints')} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors font-bold uppercase tracking-widest text-xs group">
                <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </button>

            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-white">
                <div className="p-8 md:p-10 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-bl-full pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10 w-full">
                        <div>
                            <span className="inline-block px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 mb-4 border border-blue-100 shadow-sm">
                                {complaint.category?.name || 'General Grievance'}
                            </span>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{complaint.title}</h1>
                            <p className="text-slate-500 font-bold flex flex-wrap items-center gap-3">
                                <span className="bg-white border border-slate-100 shadow-sm text-blue-600 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest">{complaint.complaintNumber}</span>
                                <span className="flex items-center bg-white border border-slate-100 shadow-sm px-3 py-1.5 rounded-lg text-xs"><Clock size={14} className="mr-2 text-slate-400" /> {new Date(complaint.submittedAt).toLocaleString()}</span>
                            </p>
                        </div>
                        <div className={`px-6 py-2.5 rounded-2xl text-center border-2 font-black uppercase tracking-widest text-xs shadow-md shrink-0
                            ${complaint.priority === 'URGENT' ? 'border-red-200 bg-red-50 text-red-600 shadow-red-500/10' :
                                complaint.priority === 'HIGH' ? 'border-orange-200 bg-orange-50 text-orange-600 shadow-orange-500/10' :
                                    'border-blue-200 bg-blue-50 text-blue-600 shadow-blue-500/10'}`}>
                            {complaint.priority} Priority
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Incident Description</h3>
                            <p className="text-slate-700 leading-relaxed text-sm bg-slate-50/80 p-6 rounded-3xl border border-slate-100 font-medium">{complaint.description}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="col-span-1 sm:col-span-2 bg-slate-50/50 p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5 flex items-center relative z-10"><Calendar size={14} className="mr-1.5" /> Lifecycle History</h4>
                                <ul className="text-xs font-bold text-slate-600 space-y-4 relative z-10 w-full pl-2 border-l-2 border-slate-200 ml-1.5">
                                    <li className="relative pl-6"><span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white shadow-sm outline outline-1 outline-slate-200"></span><span className="w-20 inline-block uppercase tracking-widest text-[9px] text-slate-400">Submit:</span> <span className="text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-100">{new Date(complaint.submittedAt).toLocaleDateString()} {new Date(complaint.submittedAt).toLocaleTimeString()}</span></li>
                                    {complaint.assignedAt && <li className="relative pl-6"><span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm outline outline-1 outline-blue-200"></span><span className="text-blue-500 w-20 inline-block uppercase tracking-widest text-[9px]">Assign:</span> <span className="text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-100">{new Date(complaint.assignedAt).toLocaleDateString()} {new Date(complaint.assignedAt).toLocaleTimeString()}</span></li>}
                                    {complaint.escalatedAt && <li className="relative pl-6"><span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white shadow-sm outline outline-1 outline-orange-200"></span><span className="text-orange-500 w-20 inline-block uppercase tracking-widest text-[9px]">Escalate:</span> <span className="text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-100">{new Date(complaint.escalatedAt).toLocaleDateString()} {new Date(complaint.escalatedAt).toLocaleTimeString()}</span></li>}
                                    {complaint.resolvedAt && <li className="relative pl-6"><span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm outline outline-1 outline-emerald-200"></span><span className="text-emerald-500 w-20 inline-block uppercase tracking-widest text-[9px]">Resolve:</span> <span className="text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-100">{new Date(complaint.resolvedAt).toLocaleDateString()} {new Date(complaint.resolvedAt).toLocaleTimeString()}</span></li>}
                                    {complaint.closedAt && <li className="relative pl-6"><span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-white shadow-sm outline outline-1 outline-slate-400"></span><span className="text-slate-800 w-20 inline-block uppercase tracking-widest text-[9px]">Close:</span> <span className="text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-100">{new Date(complaint.closedAt).toLocaleDateString()} {new Date(complaint.closedAt).toLocaleTimeString()}</span></li>}
                                </ul>
                            </div>
                            <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 opacity-5"><UserIcon size={120} /></div>
                                <div className="mb-5 relative z-10">
                                    <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1.5 flex items-center"><UserIcon size={14} className="mr-1" /> Assigned Authority</h4>
                                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">
                                        {complaint.escalationLevel === 0 ? "Department Officer" : complaint.escalationLevel === 1 ? "Department Head" : "System Admin"}
                                    </p>
                                    <p className="font-black text-orange-950 text-lg tracking-tight">
                                        {complaint.assignedTo?.fullName || 'Pending Assignment'}
                                    </p>
                                    {complaint.assignedTo?.email && (
                                        <p className="text-xs text-orange-700/80 font-bold mt-1 bg-white/50 px-3 py-1.5 rounded-lg inline-block">{complaint.assignedTo.email}</p>
                                    )}
                                </div>

                                <div className="pt-5 border-t border-orange-200/40 relative z-10">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center"><UserIcon size={14} className="mr-1" /> Citizen Details</h4>
                                    <p className="font-black text-slate-800 text-[15px]">{complaint.user?.fullName}</p>
                                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">{complaint.user?.email}</p>
                                    {complaint.address && (
                                        <p className="text-xs text-slate-600 font-medium mt-3 bg-white/50 p-3 rounded-xl line-clamp-2" title={complaint.address}>
                                            <MapPin size={12} className="inline mr-1 text-red-400 flex-shrink-0" />{complaint.address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {complaint.imageUrl && (
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Photo Evidence</h3>
                                <img src={complaint.imageUrl} alt="Proof" className="rounded-[2rem] shadow-lg max-h-72 w-full object-cover border-4 border-slate-50 hover:scale-[1.02] transition-transform duration-500" />
                            </div>
                        )}
                    </div>

                    <div className="h-full">
                        <div className="bg-gradient-to-b from-blue-50/50 to-indigo-50/30 p-8 md:p-10 rounded-[2.5rem] border border-blue-100 shadow-inner sticky top-28">
                            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center tracking-tight">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mr-3 shadow-inner"><CheckCircle size={20} /></div>
                                Update Status
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Current Status</label>
                                    <div className="relative">
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                                            className="w-full pl-5 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer outline-none"
                                        >
                                            <option value="PENDING">PENDING</option>
                                            <option value="RESOLVED">RESOLVED</option>
                                            <option value="CLOSED">CLOSED / REJECTED</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                {status === ComplaintStatus.RESOLVED && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resolution Notes / Action Taken</label>
                                            <textarea
                                                value={resolutionNotes}
                                                onChange={(e) => setResolutionNotes(e.target.value)}
                                                placeholder="Describe how the issue was resolved..."
                                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none h-24"
                                            ></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Upload Resolution Photo</label>
                                            <div className="border-2 border-dashed border-blue-200 rounded-3xl p-8 text-center bg-white/50 hover:bg-white transition-colors cursor-pointer relative shadow-inner group">
                                                <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-blue-100 transition-all"><Upload size={20} /></div>
                                                <p className="text-sm font-black text-blue-700 tracking-tight">{proof ? proof.name : "Click or drag to upload photo"}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="pt-4">
                                    <button
                                        onClick={handleStatusUpdate}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all shadow-md flex justify-center items-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Save Changes
                                    </button>
                                </div>

                                {status !== ComplaintStatus.RESOLVED && status !== ComplaintStatus.CLOSED && complaint.escalationLevel !== 2 && (
                                    <div className="pt-2">
                                        <button
                                            onClick={async () => {
                                                if (!window.confirm("Are you sure you want to escalate this complaint?")) return;
                                                try {
                                                    await api.put(`/complaints/${id}/escalate`, {});
                                                    alert('Complaint Escalated!');
                                                    navigate('/admin/complaints');
                                                } catch (e) { console.error(e); alert('Escalation failed'); }
                                            }}
                                            className="w-full py-3.5 bg-red-50/50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 border border-red-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <AlertCircle size={16} /> Escalate to Super Admin
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ComplaintDetails;
