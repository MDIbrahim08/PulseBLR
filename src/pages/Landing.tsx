import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Brain, ShieldAlert, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pulse-900/40 via-slate-950 to-slate-950 -z-10"></div>
      
      <header className="container mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shadow-lg">
            <img src="/logo.png" alt="PulseBLR Logo" className="w-full h-full object-cover scale-150" />
          </div>
          <span className="font-bold text-xl tracking-tight">PulseBLR</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-pulse-400 transition-colors">Features</a>
          <a href="#architecture" className="hover:text-pulse-400 transition-colors">PulseCore</a>
          <a href="#governance" className="hover:text-pulse-400 transition-colors">ArmorIQ</a>
        </nav>
        <button 
          onClick={() => navigate('/login')}
          className="glass-button px-6 py-2"
        >
          Login
        </button>
      </header>

      <main className="container mx-auto px-6 py-20 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1.5 rounded-full bg-pulse-500/10 border border-pulse-500/30 text-pulse-400 text-sm font-bold uppercase tracking-wider mb-8"
        >
          Bangalore AI Hack 2026 Finalist
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight"
        >
          AI That Gives Bangalore <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pulse-400 to-emerald-400">Its Time Back.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-xl text-slate-400 max-w-2xl"
        >
          Stop checking five different apps to plan your commute. PulseCore synthesizes live traffic, weather, and transit data into one intelligent decision.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex gap-4"
        >
          <button onClick={() => navigate('/login')} className="bg-pulse-600 hover:bg-pulse-500 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(14,165,233,0.4)]">
            Start Live Demo <ArrowRight size={20} />
          </button>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 text-left w-full" id="features">
          <div className="glass-panel p-8">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6"><Brain size={24} /></div>
            <h3 className="text-xl font-bold mb-3">Multi-Agent AI</h3>
            <p className="text-slate-400">Velocity, Nimbus, and TransitIQ agents analyze the city in real-time to find the optimal commute.</p>
          </div>
          <div className="glass-panel p-8">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-6"><ShieldAlert size={24} /></div>
            <h3 className="text-xl font-bold mb-3">ArmorIQ Governance</h3>
            <p className="text-slate-400">AI shouldn't act without permission. Every automated action requires explicit user approval.</p>
          </div>
          <div className="glass-panel p-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6"><MapPin size={24} /></div>
            <h3 className="text-xl font-bold mb-3">Live Signals</h3>
            <p className="text-slate-400">Integrates Open-Meteo and OSRM to provide exact, localized decisions based on current reality.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
