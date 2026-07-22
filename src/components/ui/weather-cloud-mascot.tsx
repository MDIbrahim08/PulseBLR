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

  const condLower = condition.toLowerCase();
  const isRainy = condLower.includes('rain') || condLower.includes('drizzle') || condLower.includes('thunderstorm');
  const isDrizzling = condLower.includes('drizzle');
  const isCloudy = condLower.includes('cloud') || condLower.includes('overcast') || condLower.includes('fog');

  // Dynamic cloud color gradients per weather condition
  const getGradient = () => {
    if (isRainy) {
      return {
        stop1: "#94A3B8",
        stop2: "#475569",
        stop3: "#334155",
        glow: "#38BDF8"
      };
    }
    if (isCloudy) {
      return {
        stop1: "#F1F5F9",
        stop2: "#CBD5E1",
        stop3: "#94A3B8",
        glow: "#94A3B8"
      };
    }
    return {
      stop1: "#FFFFFF",
      stop2: "#E0F2FE",
      stop3: "#BAE6FD",
      glow: "#38BDF8"
    };
  };

  const grad = getGradient();

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`relative inline-flex items-center gap-3 px-3 py-1 bg-transparent cursor-pointer select-none ${className}`}
    >
      {/* 3D Soft Cloud Mascot Container */}
      <div className="relative w-14 h-12 flex items-center justify-center shrink-0">
        
        {/* Falling Water Raindrops Animation */}
        {isRainy && (
          <div className="absolute inset-x-0 bottom-0 top-7 flex justify-around pointer-events-none z-0 px-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, 14, 20],
                  opacity: [0, 1, 0],
                  scaleY: [0.8, 1.4, 0.5]
                }}
                transition={{
                  duration: isDrizzling ? 1.2 : 0.7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.25
                }}
                className="w-1 h-3 bg-sky-400 rounded-full shadow-[0_0_6px_#38BDF8]"
              />
            ))}
          </div>
        )}

        {/* 3D Cloud SVG Face & Body */}
        <motion.svg
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          viewBox="0 0 64 48"
          className="w-full h-full drop-shadow-[0_6px_14px_rgba(255,255,255,0.3)] relative z-10"
        >
          <defs>
            <linearGradient id={`cloudGrad-${condition}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={grad.stop1} />
              <stop offset="70%" stopColor={grad.stop2} />
              <stop offset="100%" stopColor={grad.stop3} />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={grad.glow} floodOpacity="0.5" />
            </filter>
          </defs>

          {/* 3D Soft Cloud Body */}
          <path
            d="M 18 38 C 10 38 6 30 12 22 C 10 12 22 6 32 12 C 40 4 54 10 52 20 C 60 24 58 38 48 38 Z"
            fill={`url(#cloudGrad-${condition})`}
            filter="url(#softGlow)"
          />

          {/* Animated Eyes based on Weather */}
          {isBlinking ? (
            <g stroke={isRainy ? "#0F172A" : "#0369A1"} strokeWidth="2.5" strokeLinecap="round" fill="none">
              <path d="M 23 24 Q 26 27 29 24" />
              <path d="M 35 24 Q 38 27 41 24" />
            </g>
          ) : isRainy ? (
            // Worried / Surprised Rain Eyes
            <g fill="#0F172A">
              <circle cx="26" cy="24" r="3" />
              <circle cx="38" cy="24" r="3" />
              <circle cx="27.5" cy="22.5" r="1" fill="#FFFFFF" />
              <circle cx="39.5" cy="22.5" r="1" fill="#FFFFFF" />
            </g>
          ) : (
            // Happy Cheerful Eyes
            <g fill="#0284C7">
              <ellipse cx="26" cy="24" rx="2.5" ry="3.5" />
              <ellipse cx="38" cy="24" rx="2.5" ry="3.5" />
              <circle cx="27" cy="22.5" r="1" fill="#FFFFFF" />
              <circle cx="39" cy="22.5" r="1" fill="#FFFFFF" />
            </g>
          )}

          {/* Mouth Expression */}
          {isRainy ? (
            // O-shaped mouth for rainy
            <ellipse cx="32" cy="30" rx="2" ry="2.5" fill="#0F172A" />
          ) : (
            // Smile mouth
            <path
              d="M 29 29 Q 32 32 35 29"
              stroke="#0369A1"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Rosy Cheeks */}
          <circle cx="20" cy="27" r="2.5" fill="#F43F5E" opacity={isRainy ? "0.6" : "0.4"} />
          <circle cx="44" cy="27" r="2.5" fill="#F43F5E" opacity={isRainy ? "0.6" : "0.4"} />
        </motion.svg>
      </div>

      {/* Weather Info Label */}
      <div className="flex flex-col text-left">
        <span className="text-[13px] font-bold text-white tracking-wide">
          {condition} • {temperature}
        </span>
        <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest">
          LIVE WEATHER
        </span>
      </div>
    </motion.div>
  );
}
