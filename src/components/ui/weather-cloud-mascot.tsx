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

  const condLower = condition.toLowerCase();
  const isRainy = condLower.includes('rain') || condLower.includes('drizzle') || condLower.includes('thunderstorm') || isSpitting;
  const isDrizzling = condLower.includes('drizzle');
  const isCloudy = condLower.includes('cloud') || condLower.includes('overcast') || condLower.includes('fog');

  // Periodic eye blink logic
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleStartHold = () => {
    if (isRainy) {
      setIsHoldingWater(true);
    }
  };

  const handleEndHold = () => {
    if (isHoldingWater) {
      setIsHoldingWater(false);
      setIsSpitting(true);
      setTimeout(() => setIsSpitting(false), 1000);
    }
  };

  // 3D Cartoon Color Gradients (No Pitch Black!)
  const getGradient = () => {
    if (isHoldingWater) {
      return { stop1: "#CBD5E1", stop2: "#64748B", stop3: "#334155", glow: "#38BDF8", cheek: "#F43F5E" };
    }
    if (isRainy) {
      return { stop1: "#E2E8F0", stop2: "#64748B", stop3: "#475569", glow: "#38BDF8", cheek: "#F43F5E" };
    }
    if (isCloudy) {
      return { stop1: "#FFFFFF", stop2: "#E2E8F0", stop3: "#94A3B8", glow: "#CBD5E1", cheek: "#FB7185" };
    }
    // Clear / Sunny Default
    return { stop1: "#FFFFFF", stop2: "#F0F9FF", stop3: "#7DD3FC", glow: "#38BDF8", cheek: "#F43F5E" };
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
      whileTap={{ scale: isRainy ? 1.25 : 0.95 }}
      animate={isHoldingWater ? { scale: 1.25 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className={`relative inline-flex flex-col sm:flex-row items-center gap-4 cursor-pointer select-none py-2 px-3 ${className}`}
    >
      {/* 3D Disney/Apple Style Cartoon Cloud Mascot */}
      <div className="relative w-28 h-24 flex items-center justify-center shrink-0">
        
        {/* Animated Water Droplets (Only for Rainy Weather) */}
        <AnimatePresence>
          {(isRainy && !isHoldingWater) && (
            <div className="absolute inset-x-0 bottom-0 top-14 flex justify-around pointer-events-none z-0 px-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{
                    y: isSpitting ? [0, 26, 40] : [0, 16, 26],
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
                  className="w-1.5 h-4 bg-sky-400 rounded-full shadow-[0_0_10px_#38BDF8]"
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* 3D Multi-Layered Cartoon Cloud SVG Body */}
        <motion.svg
          animate={
            isHoldingWater 
              ? { scale: [1.2, 1.25, 1.2] } 
              : isSpitting 
              ? { scale: [1.1, 0.95, 1], rotate: [0, -3, 3, 0] } 
              : { y: [0, -4, 0] }
          }
          transition={{ duration: isHoldingWater ? 0.5 : 2.5, repeat: isHoldingWater ? Infinity : (isSpitting ? 1 : Infinity), ease: "easeInOut" }}
          viewBox="0 0 100 80"
          className="w-full h-full drop-shadow-[0_10px_25px_rgba(56,189,248,0.4)] relative z-10"
        >
          <defs>
            <linearGradient id={`cartoonCloudGrad-${condition}-${isHoldingWater}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={grad.stop1} />
              <stop offset="55%" stopColor={grad.stop2} />
              <stop offset="100%" stopColor={grad.stop3} />
            </linearGradient>
            
            {/* Top Curve Glossy Highlight Gradient */}
            <linearGradient id="glossHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>

            <filter id="soft3DGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor={grad.glow} floodOpacity="0.5" />
            </filter>
          </defs>

          {/* 3D Layered Puff Cloud Body */}
          <g filter="url(#soft3DGlow)">
            {/* Base Cloud Silhouette */}
            <path
              d="M 25 65 C 12 65 5 52 14 38 C 12 20 32 10 48 20 C 60 8 82 18 80 34 C 92 40 90 65 75 65 Z"
              fill={`url(#cartoonCloudGrad-${condition}-${isHoldingWater})`}
            />

            {/* Top Glossy Highlight Curves for 3D Volume */}
            <path
              d="M 28 35 C 32 20 48 15 52 24 C 62 12 78 20 76 35"
              stroke="url(#glossHighlight)"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
          </g>

          {/* Animated Cartoon Eyes based on Weather & State */}
          {isHoldingWater ? (
            // Holding water >_< anime eyes
            <g stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 34 38 L 41 42 L 34 46" />
              <path d="M 66 38 L 59 42 L 66 46" />
            </g>
          ) : isBlinking ? (
            <g stroke="#0369A1" strokeWidth="3.5" strokeLinecap="round" fill="none">
              <path d="M 35 41 Q 40 45 45 41" />
              <path d="M 55 41 Q 60 45 65 41" />
            </g>
          ) : isSpitting ? (
            // Relieved happy anime eyes
            <g fill="#0284C7">
              <ellipse cx="40" cy="40" rx="4.5" ry="5.5" />
              <ellipse cx="60" cy="40" rx="4.5" ry="5.5" />
              <circle cx="42" cy="38" r="1.8" fill="#FFFFFF" />
              <circle cx="62" cy="38" r="1.8" fill="#FFFFFF" />
            </g>
          ) : isRainy ? (
            // Worried Cute Rain Eyes
            <g fill="#1E293B">
              <ellipse cx="40" cy="41" rx="4" ry="5" />
              <ellipse cx="60" cy="41" rx="4" ry="5" />
              <circle cx="42" cy="39" r="1.5" fill="#FFFFFF" />
              <circle cx="62" cy="39" r="1.5" fill="#FFFFFF" />
            </g>
          ) : isCloudy ? (
            // Relaxed Sleepy Content Eyes
            <g stroke="#0369A1" strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M 35 40 Q 40 44 45 40" />
              <path d="M 55 40 Q 60 44 65 40" />
            </g>
          ) : (
            // Bright Cheerful Sparkling Disney Eyes
            <g fill="#0284C7">
              <ellipse cx="40" cy="40" rx="4.5" ry="6" />
              <ellipse cx="60" cy="40" rx="4.5" ry="6" />
              {/* Catchlights */}
              <circle cx="42" cy="37.5" r="2" fill="#FFFFFF" />
              <circle cx="62" cy="37.5" r="2" fill="#FFFFFF" />
              <circle cx="38.5" cy="42.5" r="1" fill="#FFFFFF" opacity="0.8" />
              <circle cx="58.5" cy="42.5" r="1" fill="#FFFFFF" opacity="0.8" />
            </g>
          )}

          {/* Mouth Expression */}
          {isHoldingWater ? (
            // Tight Puffed Mouth holding water
            <path
              d="M 44 51 Q 50 48 56 51"
              stroke="#F43F5E"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          ) : isSpitting ? (
            // Spitting mouth wide open
            <ellipse cx="50" cy="50" rx="5" ry="6" fill="#0284C7" />
          ) : isRainy ? (
            // Worried O-mouth
            <ellipse cx="50" cy="50" rx="3" ry="4" fill="#1E293B" />
          ) : (
            // Big Cheerful Smile
            <path
              d="M 43 47 Q 50 53 57 47"
              stroke="#0369A1"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Rosy Cheeks */}
          <motion.circle 
            cx="29" 
            cy="45" 
            r={isHoldingWater ? "6" : "4.5"} 
            fill={grad.cheek} 
            opacity={isHoldingWater ? "0.9" : "0.55"} 
          />
          <motion.circle 
            cx="71" 
            cy="45" 
            r={isHoldingWater ? "6" : "4.5"} 
            fill={grad.cheek} 
            opacity={isHoldingWater ? "0.9" : "0.55"} 
          />
        </motion.svg>
      </div>

      {/* Weather Info & Helper Text */}
      <div className="flex flex-col text-center sm:text-left">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <span className="text-xl sm:text-2xl font-extrabold text-white tracking-wide drop-shadow-md">
            {condition}
          </span>
          <span className="text-lg font-bold text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
            {temperature}
          </span>
        </div>
        
        <span className="text-xs font-bold text-sky-300/90 mt-1 tracking-wider uppercase flex items-center justify-center sm:justify-start gap-1">
          {isHoldingWater ? (
            <span className="text-amber-300 animate-pulse">😯 HOLDING WATER... RELEASE TO SPIT!</span>
          ) : isRainy ? (
            <span>💧 Rainy — Tap & Hold Cloud to Puff & Spit Rain!</span>
          ) : isCloudy ? (
            <span>☁️ Live Weather: Overcast & Cozy</span>
          ) : (
            <span>☀️ Live Weather: Clear & Sunny</span>
          )}
        </span>
      </div>
    </motion.div>
  );
}
