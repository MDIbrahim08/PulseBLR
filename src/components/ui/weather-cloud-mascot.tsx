import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isHoldingWater, setIsHoldingWater] = useState(false);
  const [isSpitting, setIsSpitting] = useState(false);

  // Periodic eye blink logic
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleStartHold = () => {
    setIsHoldingWater(true);
  };

  const handleEndHold = () => {
    if (isHoldingWater) {
      setIsHoldingWater(false);
      setIsSpitting(true);
      setTimeout(() => setIsSpitting(false), 1000);
    }
  };

  const condLower = condition.toLowerCase();
  const isRainy = condLower.includes('rain') || condLower.includes('drizzle') || condLower.includes('thunderstorm') || isSpitting;
  const isDrizzling = condLower.includes('drizzle');
  const isCloudy = condLower.includes('cloud') || condLower.includes('overcast') || condLower.includes('fog');

  // Dynamic cloud color gradients per weather condition
  const getGradient = () => {
    if (isHoldingWater) {
      return { stop1: "#64748B", stop2: "#334155", stop3: "#1E293B", glow: "#38BDF8" };
    }
    if (isRainy) {
      return { stop1: "#94A3B8", stop2: "#475569", stop3: "#334155", glow: "#38BDF8" };
    }
    if (isCloudy) {
      return { stop1: "#F8FAFC", stop2: "#E2E8F0", stop3: "#CBD5E1", glow: "#94A3B8" };
    }
    return { stop1: "#FFFFFF", stop2: "#E0F2FE", stop3: "#BAE6FD", glow: "#38BDF8" };
  };

  const grad = getGradient();

  return (
    <motion.div
      onMouseDown={handleStartHold}
      onMouseUp={handleEndHold}
      onMouseLeave={handleEndHold}
      onTouchStart={handleStartHold}
      onTouchEnd={handleEndHold}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 1.25 }}
      animate={isHoldingWater ? { scale: 1.25 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className={`relative inline-flex flex-col sm:flex-row items-center gap-4 cursor-pointer select-none py-2 px-3 ${className}`}
    >
      {/* Giant 3D Soft Cloud Mascot */}
      <div className="relative w-28 h-24 flex items-center justify-center shrink-0">
        
        {/* Regular Rain & Spit Water Burst Stream Animation */}
        <AnimatePresence>
          {(isRainy && !isHoldingWater) && (
            <div className="absolute inset-x-0 bottom-0 top-14 flex justify-around pointer-events-none z-0 px-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{
                    y: isSpitting ? [0, 24, 36] : [0, 16, 26],
                    opacity: [0, 1, 0],
                    scaleY: isSpitting ? [1, 2.5, 0.5] : [0.8, 1.4, 0.5],
                    scaleX: isSpitting ? 1.5 : 1
                  }}
                  transition={{
                    duration: isSpitting ? 0.35 : (isDrizzling ? 1.2 : 0.65),
                    repeat: isSpitting ? 3 : Infinity,
                    ease: "easeOut",
                    delay: i * 0.1
                  }}
                  className="w-1.5 h-4 bg-sky-400 rounded-full shadow-[0_0_8px_#38BDF8]"
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* 3D Cloud SVG Face & Body */}
        <motion.svg
          animate={
            isHoldingWater 
              ? { scale: [1.2, 1.25, 1.2] } 
              : isSpitting 
              ? { scale: [1.1, 0.95, 1], rotate: [0, -3, 3, 0] } 
              : { y: [0, -4, 0] }
          }
          transition={{ duration: isHoldingWater ? 0.5 : 2.5, repeat: isHoldingWater ? Infinity : (isSpitting ? 1 : Infinity), ease: "easeInOut" }}
          viewBox="0 0 64 48"
          className="w-full h-full drop-shadow-[0_8px_24px_rgba(56,189,248,0.4)] relative z-10"
        >
          <defs>
            <linearGradient id={`giantCloudGrad-${condition}-${isHoldingWater}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={grad.stop1} />
              <stop offset="70%" stopColor={grad.stop2} />
              <stop offset="100%" stopColor={grad.stop3} />
            </linearGradient>
            <filter id="giantSoftGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={grad.glow} floodOpacity="0.6" />
            </filter>
          </defs>

          {/* 3D Soft Cloud Body */}
          <path
            d="M 18 38 C 10 38 6 30 12 22 C 10 12 22 6 32 12 C 40 4 54 10 52 20 C 60 24 58 38 48 38 Z"
            fill={`url(#giantCloudGrad-${condition}-${isHoldingWater})`}
            filter="url(#giantSoftGlow)"
          />

          {/* Animated Eyes based on State & Weather */}
          {isHoldingWater ? (
            // Squeezed tight holding-water eyes >_<
            <g stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M 22 23 L 28 26 L 22 29" />
              <path d="M 42 23 L 36 26 L 42 29" />
            </g>
          ) : isBlinking ? (
            <g stroke={isRainy ? "#0F172A" : "#0369A1"} strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M 22 25 Q 26 28 30 25" />
              <path d="M 34 25 Q 38 28 42 25" />
            </g>
          ) : isSpitting ? (
            // Relieved wide eyes after spitting
            <g fill="#0284C7">
              <circle cx="25" cy="23" r="3.5" />
              <circle cx="39" cy="23" r="3.5" />
              <circle cx="26.5" cy="21.5" r="1.2" fill="#FFFFFF" />
              <circle cx="40.5" cy="21.5" r="1.2" fill="#FFFFFF" />
            </g>
          ) : isRainy ? (
            // Worried Rain Eyes
            <g fill="#0F172A">
              <circle cx="25" cy="24" r="3.5" />
              <circle cx="39" cy="24" r="3.5" />
              <circle cx="26.5" cy="22.5" r="1.2" fill="#FFFFFF" />
              <circle cx="40.5" cy="22.5" r="1.2" fill="#FFFFFF" />
            </g>
          ) : (
            // Happy Cheerful Cute Eyes
            <g fill="#0284C7">
              <ellipse cx="25" cy="24" rx="3" ry="4" />
              <ellipse cx="39" cy="24" rx="3" ry="4" />
              <circle cx="26.5" cy="22" r="1.3" fill="#FFFFFF" />
              <circle cx="40.5" cy="22" r="1.3" fill="#FFFFFF" />
            </g>
          )}

          {/* Mouth Expression */}
          {isHoldingWater ? (
            // Puffed tight closed mouth holding water
            <path
              d="M 28 32 Q 32 30 36 32"
              stroke="#F43F5E"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          ) : isSpitting ? (
            // Spitting mouth wide open spitting water stream
            <ellipse cx="32" cy="31" rx="4" ry="5" fill="#0284C7" />
          ) : isRainy ? (
            // Small O-mouth for rain
            <ellipse cx="32" cy="31" rx="2.5" ry="3" fill="#0F172A" />
          ) : (
            // Cute smile mouth
            <path
              d="M 28 29 Q 32 33 36 29"
              stroke="#0369A1"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Puffed Rosy Cheeks */}
          <motion.circle 
            cx="18" 
            cy="27" 
            r={isHoldingWater ? "4.5" : "3"} 
            fill="#F43F5E" 
            opacity={isHoldingWater ? "0.9" : "0.5"} 
          />
          <motion.circle 
            cx="46" 
            cy="27" 
            r={isHoldingWater ? "4.5" : "3"} 
            fill="#F43F5E" 
            opacity={isHoldingWater ? "0.9" : "0.5"} 
          />
        </motion.svg>
      </div>

      {/* Weather Info & Helper Text */}
      <div className="flex flex-col text-center sm:text-left">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <span className="text-xl sm:text-2xl font-extrabold text-white tracking-wide drop-shadow-md">
            {condition}
          </span>
          <span className="text-lg font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
            {temperature}
          </span>
        </div>
        <span className="text-xs font-semibold text-sky-300/90 mt-0.5 tracking-wider uppercase flex items-center justify-center sm:justify-start gap-1">
          <span>{isHoldingWater ? "😯 HOLDING WATER... RELEASE TO SPIT!" : "👈 Tap & Hold Cloud to Puff!"}</span>
        </span>
      </div>
    </motion.div>
  );
}
