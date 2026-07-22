import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface WeatherCloudMascotProps {
  temperature?: string;
  condition?: string;
  className?: string;
}

export function WeatherCloudMascot({
  temperature = "28°C",
  condition = "Clear",
  className = ""
}: WeatherCloudMascotProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  // Periodic eye blink logic
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.96 }}
      className={`relative inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-black/40 backdrop-blur-2xl border border-white/15 rounded-full shadow-lg cursor-pointer select-none hover:bg-black/60 hover:border-white/30 transition-all duration-300 ${className}`}
    >
      {/* 3D Soft Cloud Mascot with SVG Animated Face */}
      <div className="relative w-9 h-8 flex items-center justify-center shrink-0">
        <motion.svg
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          viewBox="0 0 64 48"
          className="w-full h-full drop-shadow-[0_4px_10px_rgba(255,255,255,0.25)]"
        >
          <defs>
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#38BDF8" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* 3D Soft Cloud Body */}
          <path
            d="M 18 38 C 10 38 6 30 12 22 C 10 12 22 6 32 12 C 40 4 54 10 52 20 C 60 24 58 38 48 38 Z"
            fill="url(#cloudGrad)"
            filter="url(#softGlow)"
          />

          {/* Animated Eyes (Normal vs Blinking) */}
          {isBlinking ? (
            // Curved closed eyes during blink
            <g stroke="#0369A1" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <path d="M 23 24 Q 26 27 29 24" />
              <path d="M 35 24 Q 38 27 41 24" />
            </g>
          ) : (
            // Open cute 3D eyes with highlights
            <g fill="#0284C7">
              <ellipse cx="26" cy="24" rx="2.5" ry="3.5" />
              <ellipse cx="38" cy="24" rx="2.5" ry="3.5" />
              {/* Eye Catchlights */}
              <circle cx="27" cy="22.5" r="1" fill="#FFFFFF" />
              <circle cx="39" cy="22.5" r="1" fill="#FFFFFF" />
            </g>
          )}

          {/* Cute Smile Mouth */}
          <path
            d="M 29 29 Q 32 32 35 29"
            stroke="#0369A1"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Rosy Cheeks */}
          <circle cx="21" cy="27" r="2" fill="#F43F5E" opacity="0.4" />
          <circle cx="43" cy="27" r="2" fill="#F43F5E" opacity="0.4" />
        </motion.svg>
      </div>

      {/* Weather Info Label */}
      <div className="flex flex-col text-left">
        <span className="text-[11px] font-bold text-white tracking-wide">
          {condition} • {temperature}
        </span>
        <span className="text-[9px] font-medium text-sky-400/80 uppercase tracking-widest">
          LIVE WEATHER
        </span>
      </div>
    </motion.div>
  );
}
