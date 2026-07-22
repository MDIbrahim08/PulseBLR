import React from 'react';
import { motion } from 'framer-motion';

export interface AnimatedMetroTrackProps {
  statusText?: string;
  lineName?: string;
  className?: string;
}

export function AnimatedMetroTrack({
  statusText = "3-min Frequency",
  lineName = "Purple Line",
  className = ""
}: AnimatedMetroTrackProps) {
  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-[#161622]/90 to-[#101018]/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-xl overflow-hidden ${className}`}>
      
      {/* Animated Train on Track */}
      <div className="relative w-12 h-5 bg-white/5 rounded-md flex items-center overflow-hidden border border-white/10 px-1">
        {/* Track Line */}
        <div className="absolute inset-x-0 h-[2px] bg-white/20 top-1/2 -translate-y-1/2" />
        
        {/* Moving Metro Train */}
        <motion.div
          animate={{ x: [-24, 40] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
          className="relative z-10 w-5 h-3 bg-emerald-500 rounded-[3px] shadow-[0_0_8px_rgba(16,185,129,0.8)] flex items-center justify-between px-0.5"
        >
          {/* Headlights */}
          <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_4px_#FFF]" />
          <div className="w-1 h-1 bg-white/50 rounded-full" />
        </motion.div>
      </div>

      {/* Info Label */}
      <div className="flex flex-col text-left">
        <span className="text-[11px] font-bold text-white tracking-wide">
          {lineName} • {statusText}
        </span>
        <span className="text-[9px] font-medium text-emerald-400 uppercase tracking-widest">
          METRO EXPRESS
        </span>
      </div>
    </div>
  );
}
