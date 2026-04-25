import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../src/api';
import { ArrowLeft, Clock, MapPin, AlertTriangle, User, CheckCircle2, Loader2, Activity, Star, Send } from 'lucide-react';
import { ComplaintStatus } from '../../types';
import { motion } from 'framer-motion';

const getAuthorityText = (level?: number) => {
    if (level === undefined || level === 0) return "Handled by: Department Officer";
    if (level === 1) return "Escalated to: Department Head";
    return "Escalated to: System Administrator";
};

const ComplaintDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedRating, setSelectedRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get('/complaints/my');
                // Filter locally since we don't have a specific get-by-id endpoint yet, or use /my list
                const found = res.data.find((c: any) => c.complaintId.toString() === id);
                setComplaint(found);
            } catch (err) {
                console.error("Error fetching details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
            <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Details...</p>
        </div>
    );
    if (!complaint) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <AlertTriangle className="text-red-500 w-16 h-16" />
            <p className="text-slate-500 font-bold tracking-widest uppercase text-lg">Grievance Not Found</p>
            <button onClick={() => navigate('/citizen/track')} className="text-blue-600 font-bold hover:underline">Return to Dashboard</button>
        </div>
    );

    const containerVars = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.div initial="hidden" animate="visible" variants={containerVars} className="max-w-5xl mx-auto px-4 py-12 font-sans">
            <button
                onClick={() => navigate('/citizen/track')}
                className="flex items-center text-slate-500 hover:text-blue-600 mb-8 transition-colors font-bold uppercase tracking-widest text-xs group"
            >
                <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </button>

            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden relative">
                {/* Header */}
                <div className="p-8 md:p-10 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-bl-full pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                        <div>
                            <span className="inline-block px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 mb-4 border border-blue-100 shadow-sm">
                                ID: {complaint.complaintNumber}
                            </span>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{complaint.title}</h1>
                            <div className="flex flex-wrap items-center text-slate-500 text-sm gap-4 font-medium">
                                <span className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm"><Clock size={14} className="mr-2 text-blue-500" /> {new Date(complaint.submittedAt).toLocaleDateString()}</span>
                                <span className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm"><MapPin size={14} className="mr-2 text-red-500" /> {complaint.address || "Location Pinned"}</span>
                            </div>
                        </div>
                        <div className="text-left md:text-right shrink-0">
                            <div className={`px-6 py-2.5 rounded-2xl text-[12px] font-black border-2 uppercase tracking-widest shadow-md
                ${complaint.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-emerald-500/10' :
                                    complaint.status === 'PENDING' ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-blue-500/10' :
                                        'bg-amber-50 text-amber-600 border-amber-200 shadow-amber-500/10'}
              `}>
                                {complaint.status}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Linked Duplicate Banner */}
                {complaint.parentComplaintId && (
                    <div className="mx-8 md:mx-10 -mt-1 mb-0 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                            <Activity size={16} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-800">Linked Report</p>
                            <p className="text-xs text-blue-600 mt-0.5">Your report is linked to an earlier complaint for the same issue. When the original complaint is resolved, your report will be updated automatically.</p>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-8 md:p-10 grid lg:grid-cols-5 gap-10">

                    <div className="lg:col-span-3 space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Incident Description</h3>
                            <p className="text-slate-600 leading-relaxed font-medium bg-slate-50/80 p-6 rounded-3xl border border-slate-100 text-sm">
                                {complaint.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-3xl border border-blue-100/50 shadow-sm">
                                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5 flex items-center"><Activity size={12} className="mr-1" /> Category</h4>
                                <p className="font-black text-blue-900">{complaint.category?.name}</p>
                            </div>
                            <div className="p-5 bg-gradient-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100/50 shadow-sm">
                                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 flex items-center"><AlertTriangle size={12} className="mr-1" /> Priority</h4>
                                <p className="font-black text-indigo-900 uppercase">{complaint.priority}</p>
                            </div>
                            <div className="col-span-2 p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl border border-orange-100 shadow-sm mt-2 relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 opacity-10"><User size={100} /></div>
                                <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 flex items-center relative z-10"><User size={14} className="mr-1" /> Assigned Authority</h4>
                                <div className="mb-1 relative z-10">
                                    <p className="text-[10px] font-bold text-orange-600/80 uppercase tracking-widest mb-1">
                                        {getAuthorityText(complaint.escalationLevel)}
                                    </p>
                                    <p className="font-black text-orange-950 text-xl tracking-tight">
                                        {complaint.assignedTo?.fullName || 'Pending Assignment'}
                                    </p>
                                </div>
                            </div>

                            <div className="col-span-2 p-6 bg-slate-50/50 rounded-3xl border border-slate-200 mt-2 relative overflow-hidden">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5 flex items-center"><Clock size={14} className="mr-1" /> Lifecycle Timeline</h4>
                                <ul className="text-sm space-y-5 relative z-10 w-full pl-2 border-l-2 border-slate-200 ml-1.5">
                                    <li className="relative pl-6">
                                        <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white shadow-sm outline outline-1 outline-slate-200"></span>
                                        <span className="font-black text-slate-800 inline-block w-24 text-xs uppercase tracking-widest">Submitted</span>
                                        <span className="text-slate-500 font-bold text-xs bg-white px-2 py-0.5 rounded-md border border-slate-100">{new Date(complaint.submittedAt).toLocaleString()}</span>
                                    </li>
                                    {complaint.assignedAt && (
                                        <li className="relative pl-6">
                                            <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm outline outline-1 outline-blue-200"></span>
                                            <span className="font-black text-blue-600 inline-block w-24 text-xs uppercase tracking-widest">Assigned</span>
                                            <span className="text-slate-500 font-bold text-xs bg-white px-2 py-0.5 rounded-md border border-slate-100">{new Date(complaint.assignedAt).toLocaleString()}</span>
                                        </li>
                                    )}
                                    {complaint.escalatedAt && (
                                        <li className="relative pl-6">
                                            <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white shadow-sm outline outline-1 outline-orange-200"></span>
                                            <span className="font-black text-orange-600 inline-block w-24 text-xs uppercase tracking-widest">Escalated</span>
                                            <span className="text-slate-500 font-bold text-xs bg-white px-2 py-0.5 rounded-md border border-slate-100">{new Date(complaint.escalatedAt).toLocaleString()}</span>
                                        </li>
                                    )}
                                    {complaint.resolvedAt && (
                                        <li className="relative pl-6">
                                            <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm outline outline-1 outline-emerald-200"></span>
                                            <span className="font-black text-emerald-600 inline-block w-24 text-xs uppercase tracking-widest">Resolved</span>
                                            <span className="text-slate-500 font-bold text-xs bg-white px-2 py-0.5 rounded-md border border-slate-100">{new Date(complaint.resolvedAt).toLocaleString()}</span>
                                        </li>
                                    )}
                                    {complaint.closedAt && (
                                        <li className="relative pl-6">
                                            <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-white shadow-sm outline outline-1 outline-slate-400"></span>
                                            <span className="font-black text-slate-800 inline-block w-24 text-xs uppercase tracking-widest">Closed</span>
                                            <span className="text-slate-500 font-bold text-xs bg-white px-2 py-0.5 rounded-md border border-slate-100">{new Date(complaint.closedAt).toLocaleString()}</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* Resolution Section if Resolved */}
                        {(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') && (
                            <div className="mt-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-100/50 shadow-inner">
                                <h3 className="flex items-center text-emerald-800 font-black mb-4 tracking-tight text-lg">
                                    <CheckCircle2 size={24} className="mr-2 text-emerald-500" /> Resolution Report
                                </h3>
                                {complaint.resolutionNotes && (
                                    <p className="text-emerald-800 font-medium text-sm mb-4 leading-relaxed bg-white/50 p-4 rounded-2xl border border-emerald-100">{complaint.resolutionNotes}</p>
                                )}
                                {complaint.resolutionProof && (
                                    <div className="rounded-2xl overflow-hidden border-4 border-white shadow-md">
                                        <img src={complaint.resolutionProof} alt="Proof" className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Citizen Rating Section */}
                        {(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') && (
                            <div className="mt-6 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-100 shadow-inner">
                                {complaint.citizenRating || feedbackSent ? (
                                    <div>
                                        <h3 className="text-amber-800 font-black mb-3 tracking-tight text-lg flex items-center">
                                            <Star size={20} className="mr-2 text-amber-500 fill-amber-500" /> Your Rating
                                        </h3>
                                        <div className="flex gap-1 mb-2">
                                            {[1,2,3,4,5].map(s => (
                                                <Star key={s} size={28} className={s <= (complaint.citizenRating || selectedRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                                            ))}
                                        </div>
                                        {(complaint.citizenFeedback || feedbackText) && (
                                            <p className="text-amber-800 text-sm font-medium italic bg-white/50 p-3 rounded-xl border border-amber-100">
                                                "{complaint.citizenFeedback || feedbackText}"
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="text-amber-800 font-black mb-3 tracking-tight text-lg">Rate This Resolution</h3>
                                        <p className="text-amber-700 text-sm mb-4 font-medium">How satisfied are you with how your complaint was resolved?</p>
                                        <div className="flex gap-2 mb-4">
                                            {[1,2,3,4,5].map(s => (
                                                <button
                                                    key={s}
                                                    onMouseEnter={() => setHoverRating(s)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => setSelectedRating(s)}
                                                    className="transition-transform hover:scale-125"
                                                >
                                                    <Star size={32} className={s <= (hoverRating || selectedRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            placeholder="Share your experience (optional)..."
                                            value={feedbackText}
                                            onChange={e => setFeedbackText(e.target.value)}
                                            className="w-full p-4 bg-white rounded-2xl border border-amber-200 text-sm font-medium resize-none h-20 focus:ring-2 focus:ring-amber-300 outline-none"
                                        />
                                        <button
                                            disabled={!selectedRating || feedbackLoading}
                                            onClick={async () => {
                                                setFeedbackLoading(true);
                                                try {
                                                    await api.post(`/complaints/${complaint.complaintId}/feedback`, {
                                                        rating: selectedRating,
                                                        feedback: feedbackText
                                                    });
                                                    setFeedbackSent(true);
                                                } catch (err) {
                                                    alert('Failed to submit feedback');
                                                } finally {
                                                    setFeedbackLoading(false);
                                                }
                                            }}
                                            className="mt-3 w-full py-3 bg-amber-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors disabled:opacity-40 shadow-lg shadow-amber-500/20"
                                        >
                                            {feedbackLoading ? <Loader2 className="animate-spin" size={18}/> : <><Send size={16}/> Submit Rating</>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Photo Evidence Column — Before/After Timeline */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-28 space-y-6">
                            {/* Before: Citizen Evidence */}
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Before — Citizen Evidence
                                </h3>
                                <div className="aspect-[4/3] bg-slate-100/50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative shadow-inner">
                                    {complaint.imageUrl ? (
                                        <img src={complaint.imageUrl} alt="Before" className="w-full h-full object-cover transition-transform hover:scale-110 duration-700" />
                                    ) : (
                                        <div className="text-center text-slate-400 p-6">
                                            <AlertTriangle size={48} className="mx-auto mb-3 opacity-40" />
                                            <p className="text-xs font-black uppercase tracking-widest">No Image Attached</p>
                                        </div>
                                    )}
                                </div>
                                <p className="text-center text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
                                    Uploaded {new Date(complaint.submittedAt).toLocaleDateString()}
                                </p>
                            </div>

                            {/* After: Resolution Proof */}
                            {(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') && (
                                <div>
                                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> After — Resolution Proof
                                    </h3>
                                    <div className="aspect-[4/3] bg-emerald-50/50 rounded-[2rem] border-2 border-dashed border-emerald-200 flex items-center justify-center overflow-hidden relative shadow-inner">
                                        {complaint.resolutionProof ? (
                                            <img src={complaint.resolutionProof} alt="After" className="w-full h-full object-cover transition-transform hover:scale-110 duration-700" />
                                        ) : (
                                            <div className="text-center text-emerald-400 p-6">
                                                <CheckCircle2 size={48} className="mx-auto mb-3 opacity-40" />
                                                <p className="text-xs font-black uppercase tracking-widest">No Proof Uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                    {complaint.resolvedAt && (
                                        <p className="text-center text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-widest">
                                            Resolved {new Date(complaint.resolvedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
};

export default ComplaintDetails;
