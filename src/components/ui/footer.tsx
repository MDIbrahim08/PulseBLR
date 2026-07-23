import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, Heart, Sparkles, MapPin } from 'lucide-react';

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="w-full max-w-[1000px] mt-16 pt-8 pb-12 border-t border-white/10 flex flex-col items-center gap-4 px-4 z-20 relative">
      {/* Footer Branding & Copyright Row */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40 font-schibsted">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black/80 border border-white/20 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
            <img src="/logo.png" alt="PulseBLR Logo" className="w-full h-full object-cover scale-[1.3]" />
          </div>
          <span className="font-schibsted font-bold text-white/80 text-sm tracking-tight">PulseBLR</span>
        </div>

        <span>© {new Date().getFullYear()} PulseBLR. All rights reserved.</span>
      </div>
    </footer>
  );
}
