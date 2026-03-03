import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Shield, Users, Activity, ChevronRight, Clock, MapPin, CheckCircle, ArrowRight, Star, Zap, Bell, Lock, Menu, X, ShieldCheck, BarChart3, Building2 } from 'lucide-react';
import { User } from '../types';

interface Props {
    user: User | null;
}

const LandingPage: React.FC<Props> = ({ user }) => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: containerRef });
    const blob1Y = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);
    const blob2Y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

    // Redirect logged-in user directly to dashboard on load
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const dashboardPath = user
        ? (user.role === 'ROLE_CITIZEN' ? '/citizen/dashboard'
            : user.role === 'ROLE_ADMIN' ? '/admin/dashboard'
                : '/admin/complaints')
        : null;

    // Animations
    const fadeUp = {
        hidden: { opacity: 0, y: 40 },
        visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] } })
    };

    const stats = [
        { value: '24,500+', label: 'Complaints Resolved', icon: <CheckCircle size={24} className="text-green-500" /> },
        { value: '50,000+', label: 'Active Citizens', icon: <Users size={24} className="text-blue-500" /> },
        { value: '12+', label: 'Gov. Departments', icon: <Building2 size={24} className="text-violet-500" /> },
        { value: '< 48h', label: 'Avg Resolution', icon: <Clock size={24} className="text-orange-500" /> },
    ];

    const features = [
        {
            icon: <MapPin size={28} className="text-orange-500" />,
            step: '01',
            title: 'Report Any Issue',
            desc: 'Pinpoint exact locations on our interactive map, upload photo evidence, and describe the civic issue in seconds. Available in multiple Indian languages.',
            bg: 'from-orange-500/10 to-amber-500/5',
            border: 'border-orange-100',
            badge: 'GPS-enabled'
        },
        {
            icon: <Activity size={28} className="text-blue-500" />,
            step: '02',
            title: 'Real-Time Tracking',
            desc: 'A live timeline follows every stage: Submitted → Assigned → Under Review → Resolved. No more unanswered complaints falling into the void.',
            bg: 'from-blue-500/10 to-cyan-500/5',
            border: 'border-blue-100',
            badge: 'Live Updates'
        },
        {
            icon: <CheckCircle size={28} className="text-green-500" />,
            step: '03',
            title: 'Verified Resolution',
            desc: 'Officers upload photo proof of resolutions via our secure portal. Complete transparency at every step, accountable to every citizen.',
            bg: 'from-green-500/10 to-emerald-500/5',
            border: 'border-green-100',
            badge: 'Photo Proof'
        },
    ];

    const testimonials = [
        { name: 'Priya Sharma', role: 'Resident, Navi Mumbai', quote: 'My complaint about the broken street light was resolved in just 36 hours! Amazing transparency.', rating: 5, avatar: 'PS' },
        { name: 'Rakesh Gupta', role: 'Shop Owner, Thane', quote: 'Filed a drainage complaint after monsoons. The photo proof from the officer was very reassuring.', rating: 5, avatar: 'RG' },
        { name: 'Anjali More', role: 'Student, Panvel', quote: 'I love the map feature to pinpoint the exact pothole location. Makes it so accurate!', rating: 5, avatar: 'AM' },
    ];

    return (
        <div ref={containerRef} className="min-h-screen bg-[#f8fafc] font-sans overflow-x-hidden scroll-smooth">

            {/* === NAVIGATION === */}
            <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-md shadow-slate-200/60 border-b border-white' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
                    <div className="flex justify-between items-center h-20">
                        <Link to={dashboardPath || '/'} className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 group-hover:scale-105 transition-all">
                                <ShieldCheck size={22} />
                            </div>
                            <span className="font-black text-[1.4rem] tracking-tighter text-slate-900">
                                Smart<span className="text-orange-500">Nagrik</span><span className="text-green-600">Seva</span>
                            </span>
                        </Link>



                        <div className="hidden md:flex items-center gap-4">
                            {user ? (
                                <Link to={dashboardPath!}>
                                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                        className="flex items-center gap-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all">
                                        Go to Dashboard <ArrowRight size={15} />
                                    </motion.button>
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-sm font-bold text-slate-700 hover:text-orange-500 transition-colors">Sign In</Link>
                                    <Link to="/register">
                                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                            className="flex items-center gap-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-orange-500/30">
                                            Register Free <ChevronRight size={15} />
                                        </motion.button>
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-slate-700 rounded-xl hover:bg-slate-100 transition-all">
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg shadow-xl"
                        >
                            <div className="flex flex-col px-6 py-6 gap-5">
                                <a href="#how-it-works" className="font-bold text-slate-700" onClick={() => setMenuOpen(false)}>How It Works</a>
                                <a href="#features" className="font-bold text-slate-700" onClick={() => setMenuOpen(false)}>Features</a>
                                <a href="#testimonials" className="font-bold text-slate-700" onClick={() => setMenuOpen(false)}>Testimonials</a>
                                <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                                    {user ? (
                                        <Link to={dashboardPath!} className="text-center bg-orange-500 text-white py-3 rounded-2xl font-bold" onClick={() => setMenuOpen(false)}>Go to Dashboard</Link>
                                    ) : (
                                        <>
                                            <Link to="/login" className="text-center border border-slate-200 py-3 rounded-2xl font-bold text-slate-700" onClick={() => setMenuOpen(false)}>Sign In</Link>
                                            <Link to="/register" className="text-center bg-orange-500 text-white py-3 rounded-2xl font-bold" onClick={() => setMenuOpen(false)}>Register Free</Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* === HERO SECTION === */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div style={{ y: blob1Y }} className="absolute -top-20 -right-20 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-orange-300/30 to-amber-400/20 blur-3xl" />
                    <motion.div style={{ y: blob2Y }} className="absolute -bottom-20 -left-20 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-green-300/20 to-teal-400/10 blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-200/10 to-violet-200/10 blur-3xl" />
                    {/* Grid pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 text-center">
                    <motion.div initial="hidden" animate="visible">
                        {/* Badge */}
                        <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg shadow-slate-200/50 mb-10">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Official Government Grievance Portal • MMR Region</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[1.0] mb-8">
                            Your Civic Voice,<br />
                            <span className="relative inline-block">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-green-500">Heard & Resolved.</span>
                                <motion.span
                                    initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
                                    className="absolute bottom-1 left-0 h-1 bg-gradient-to-r from-orange-400 to-green-400 rounded-full opacity-40"
                                />
                            </span>
                        </motion.h1>

                        {/* Sub text */}
                        <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
                            A transparent, fast, and secure platform to report, track, and resolve civic complaints directly with Municipal authorities. No corruption. No delays. Just results.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to={user ? (dashboardPath!) : '/register'}>
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: '0 25px 50px -12px rgba(249, 115, 22, 0.4)' }}
                                    whileTap={{ scale: 0.97 }}
                                    className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-5 rounded-full font-black text-lg shadow-xl shadow-orange-500/30 transition-all"
                                >
                                    <Zap size={20} className="group-hover:rotate-12 transition-transform" />
                                    {user ? 'Go to Dashboard' : 'Lodge a Complaint'}
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                            </Link>
                            <Link to="/login">
                                <motion.button
                                    whileHover={{ scale: 1.05, backgroundColor: '#f8fafc' }}
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-slate-800 border-2 border-slate-200 px-10 py-5 rounded-full font-black text-lg transition-all shadow-lg"
                                >
                                    Track Your Complaint
                                </motion.button>
                            </Link>
                        </motion.div>

                        {/* Trust Badges */}
                        <motion.div variants={fadeUp} custom={4} className="flex flex-wrap justify-center gap-6 mt-16">
                            {[
                                { icon: <Lock size={16} />, label: 'End-to-End Secure' },
                                { icon: <Bell size={16} />, label: 'Real-Time Alerts' },
                                { icon: <BarChart3 size={16} />, label: 'Transparent Analytics' },
                                { icon: <Star size={16} />, label: '4.9★ Average Rating' },
                            ].map((b, i) => (
                                <div key={i} className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-full border border-slate-200 shadow-sm">
                                    <span className="text-orange-500">{b.icon}</span> {b.label}
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">Scroll to explore</span>
                    <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-6 h-10 border-2 border-slate-300 rounded-full flex items-start justify-center p-1.5">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    </motion.div>
                </motion.div>
            </section>

            {/* === STATS TICKER === */}
            <section className="py-16 bg-white border-y border-slate-100 relative z-20 overflow-hidden">
                <div className="absolute left-0 h-full w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 h-full w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                <div className="max-w-6xl mx-auto px-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="flex flex-col items-center py-8 px-6 border-r border-b border-slate-100 last:border-r-0 group hover:bg-slate-50 transition-colors"
                            >
                                <div className="mb-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:scale-110 transition-transform shadow-sm">
                                    {stat.icon}
                                </div>
                                <p className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-center">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === HOW IT WORKS === */}
            <section id="how-it-works" className="py-32 bg-[#f8fafc] relative overflow-hidden">
                <div className="absolute top-0 -right-96 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-200/20 to-violet-200/10 blur-3xl pointer-events-none" />
                <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black uppercase tracking-widest border border-blue-100 mb-6">
                            <Activity size={14} /> Simple Three-Step Process
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-5">How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-green-500">Works</span></h2>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed">From lodging to resolution — a seamless experience engineered for every citizen of the MMR region.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connector Line */}
                        <div className="hidden md:block absolute top-16 left-[calc(50%/3+50%/3)] right-[calc(50%/3+50%/3)] h-0.5 bg-gradient-to-r from-orange-200 via-blue-200 to-green-200 z-0" />

                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ y: -10, scale: 1.02, transition: { duration: 0.2 } }}
                                className={`relative bg-white p-8 rounded-[2.5rem] border ${feature.border} shadow-xl shadow-slate-200/60 flex flex-col gap-5 overflow-hidden group cursor-default`}
                            >
                                {/* Step Number */}
                                <span className="absolute top-6 right-8 text-8xl font-black text-slate-100 leading-none tabular-nums tracking-tighter group-hover:text-slate-50 transition-colors z-0">
                                    {feature.step}
                                </span>
                                <div className={`relative z-10 w-16 h-16 bg-gradient-to-br ${feature.bg} rounded-2xl flex items-center justify-center border ${feature.border} shadow-inner group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <h3 className="text-xl font-black text-slate-900">{feature.title}</h3>
                                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-gradient-to-br ${feature.bg} border ${feature.border}`}>{feature.badge}</span>
                                    </div>
                                    <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === FEATURES GRID === */}
            <section id="features" className="py-32 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgb(249 115 22 / 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgb(34 197 94 / 0.1) 0%, transparent 50%)' }} />
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

                <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-[11px] font-black uppercase tracking-widest border border-white/10 mb-6">
                            <Star size={14} className="text-orange-400" /> Platform Features
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-5">Designed for <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Accountability</span></h2>
                        <p className="text-slate-400 text-lg font-medium">Every feature built with transparency, speed, and citizen trust at its core.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: <MapPin size={24} className="text-orange-400" />, title: 'GPS Location Pinning', desc: 'Drop a pin anywhere on the live Leaflet map. No confusion. Exact locations every time.', bg: 'from-orange-500/10 to-amber-500/5', border: 'border-orange-500/20' },
                            { icon: <Bell size={24} className="text-blue-400" />, title: 'Live Status Timeline', desc: 'Complaint lifecycle tracked from Submit → Assign → Escalate → Resolve. Total transparency.', bg: 'from-blue-500/10 to-cyan-500/5', border: 'border-blue-500/20' },
                            { icon: <Users size={24} className="text-violet-400" />, title: 'Role-Based Access', desc: 'Citizens, Officers, Dept Heads, Admins — every role has a tailored, secure workspace.', bg: 'from-violet-500/10 to-purple-500/5', border: 'border-violet-500/20' },
                            { icon: <Zap size={24} className="text-yellow-400" />, title: 'Auto Escalation (SLA)', desc: 'Unresolved complaints breach SLA? The system automatically escalates to the next authority.', bg: 'from-yellow-500/10 to-amber-500/5', border: 'border-yellow-500/20' },
                            { icon: <Lock size={24} className="text-green-400" />, title: 'Secure JWT Auth', desc: 'All sessions are protected with industry-standard JWT tokens. Your data, your privacy.', bg: 'from-green-500/10 to-emerald-500/5', border: 'border-green-500/20' },
                            { icon: <BarChart3 size={24} className="text-pink-400" />, title: 'Admin Analytics', desc: 'Real-time charts, zone performance metrics, and daily complaint trends for authorities.', bg: 'from-pink-500/10 to-rose-500/5', border: 'border-pink-500/20' },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                className={`bg-gradient-to-br ${item.bg} p-8 rounded-[2rem] border ${item.border} backdrop-blur-sm group cursor-default`}
                            >
                                <div className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-5 border ${item.border} group-hover:scale-110 transition-transform shadow-inner`}>
                                    {item.icon}
                                </div>
                                <h3 className="text-lg font-black text-white mb-2 tracking-tight">{item.title}</h3>
                                <p className="text-slate-400 font-medium text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === TESTIMONIALS === */}
            <section id="testimonials" className="py-32 bg-[#f8fafc] relative overflow-hidden">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-orange-300/20 to-amber-200/10 blur-3xl pointer-events-none" />
                <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-[11px] font-black uppercase tracking-widest border border-orange-100 mb-6">
                            <Star size={14} /> Citizens Love It
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-5">Real Stories, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-green-500">Real Impact</span></h2>
                        <p className="text-slate-500 text-lg font-medium">Thousands of citizens across the MMR have experienced a faster, fairer government.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.15 }}
                                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/60 flex flex-col gap-6"
                            >
                                <div className="flex gap-1">
                                    {Array(t.rating).fill(0).map((_, j) => (
                                        <Star key={j} size={18} className="text-orange-400 fill-orange-400" />
                                    ))}
                                </div>
                                <p className="text-slate-700 font-medium text-[15px] leading-relaxed italic">"{t.quote}"</p>
                                <div className="flex items-center gap-4 border-t border-slate-100 pt-5">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-black shadow-md shadow-orange-500/20">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-[15px]">{t.name}</p>
                                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{t.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === CTA SECTION === */}
            <section className="py-32 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 0%, transparent 40%), radial-gradient(circle at 75% 75%, white 0%, transparent 40%)' }} />
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full text-[11px] font-black uppercase tracking-widest border border-white/30 backdrop-blur-sm mb-8">
                            <Zap size={14} className="text-yellow-300" /> Free for All Citizens
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6">Make Your City<br />Better, Starting Now.</h2>
                        <p className="text-orange-100 text-lg font-medium mb-10 max-w-xl mx-auto leading-relaxed">Join 50,000+ citizens who have made MMR a cleaner, safer, smarter place to live. It's free, it's official, it's powerful.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to={user ? dashboardPath! : '/register'}>
                                <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-orange-600 px-10 py-5 rounded-full font-black text-lg shadow-2xl hover:shadow-white/30 transition-all">
                                    {user ? 'Open Dashboard' : 'Get Started Free'} <ArrowRight size={20} />
                                </motion.button>
                            </Link>
                            <Link to="/login">
                                <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white px-10 py-5 rounded-full font-black text-lg hover:bg-white/20 transition-all">
                                    Sign In
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* === FOOTER === */}
            <footer className="bg-slate-950 text-white py-16">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="grid md:grid-cols-3 gap-12 mb-16">
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                    <ShieldCheck size={22} className="text-white" />
                                </div>
                                <span className="font-black text-xl tracking-tighter">
                                    Smart<span className="text-orange-500">Nagrik</span><span className="text-green-500">Seva</span>
                                </span>
                            </div>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs">
                                An urban governance initiative to build smarter, cleaner, and more transparent cities through active citizen participation.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-black text-slate-300 uppercase text-[11px] tracking-widest mb-5">Citizen Portal</h4>
                            <ul className="space-y-3">
                                {[['Lodge Complaint', '/register'], ['Track Status', '/login'], ['View Dashboard', '/login']].map(([label, to]) => (
                                    <li key={label}><Link to={to} className="text-slate-500 hover:text-orange-400 font-bold text-sm transition-colors">{label}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-slate-300 uppercase text-[11px] tracking-widest mb-5">Authority Access</h4>
                            <ul className="space-y-3">
                                {[['Officer Login', '/login'], ['Department Portal', '/login'], ['Admin Dashboard', '/login']].map(([label, to]) => (
                                    <li key={label}><Link to={to} className="text-slate-500 hover:text-orange-400 font-bold text-sm transition-colors">{label}</Link></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-slate-600 text-sm font-medium">© 2026 Smart Nagrik Seva. All rights reserved.</p>
                        <p className="text-slate-700 text-[11px] font-bold uppercase tracking-widest">Built with ❤️ for the Citizens of MMR</p>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
