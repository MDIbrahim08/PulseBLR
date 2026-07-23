import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, Heart, Sparkles, MapPin } from 'lucide-react';

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="w-full max-w-[1000px] mt-16 pt-8 pb-12 border-t border-white/10 flex flex-col items-center gap-6 px-4 z-20 relative">
      {/* Top Row: Logo */}
      <div className="w-full flex items-center justify-center sm:justify-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black/80 border border-white/20 flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/logo.png" alt="PulseBLR Logo" className="w-full h-full object-cover scale-[1.3]" />
          </div>
          <div className="flex flex-col">
            <span className="font-schibsted font-bold text-white text-lg tracking-tight">PulseBLR</span>
            <span className="text-xs text-white/50 font-schibsted">AI-Powered Intelligent Commute Platform</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Quick Navigation Links */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-schibsted text-white/70">
        <button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors">Commute Planner</button>
        <button onClick={() => navigate('/smart-pivot')} className="hover:text-white transition-colors">Smart Pivot</button>
        <button onClick={() => navigate('/feedback')} className="hover:text-white transition-colors">Feedback</button>
        <button onClick={() => navigate('/admin/feedbacks')} className="hover:text-orange-400 text-orange-400 font-semibold transition-colors">Admin Portal</button>
      </div>

      {/* Bottom Copyright & Tech Stack Badge */}
      <div className="w-full pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40 font-schibsted">
        <span>© {new Date().getFullYear()} PulseBLR. All rights reserved.</span>
        <span className="flex items-center gap-1">
          Made for <span className="text-white/70 font-semibold">Bengaluru Commuters</span>
        </span>
      </div>
    </footer>
  );
}
