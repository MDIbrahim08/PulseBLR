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
  const [isInteractiveActive, setIsInteractiveActive] = useState(false);

  const condLower = condition.toLowerCase();
  const isRainy = condLower.includes('rain') || condLower.includes('drizzle') || isSpitting;
  const isDrizzling = condLower.includes('drizzle');
  const isStorm = condLower.includes('thunder') || condLower.includes('storm');
  const isCloudy = (condLower.includes('cloud') || condLower.includes('overcast') || condLower.includes('fog')) && !isRainy && !isStorm;
  const isSunny = condLower.includes('clear') || condLower.includes('sun');
  const isCold = condLower.includes('snow') || condLower.includes('freezing') || condLower.includes('cold');

  // Periodic eye blink logic
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleStartInteraction = () => {
    if (isRainy) {
      setIsHoldingWater(true);
    } else {
      setIsInteractiveActive(true);
    }
  };

  const handleEndInteraction = () => {
    if (isHoldingWater) {
      setIsHoldingWater(false);
      setIsSpitting(true);
      setTimeout(() => setIsSpitting(false), 1000);
    }
    setTimeout(() => {
      setIsInteractiveActive(false);
    }, 1500);
  };

  // 3D Cartoon Color Gradients
  const getGradient = () => {
    if (isHoldingWater) {
      return { stop1: "#FFFFFF", stop2: "#CBD5E1", stop3: "#7DD3FC", glow: "#38BDF8", cheek: "#F43F5E" };
    }
    if (isStorm) {
      return { stop1: "#E2E8F0", stop2: "#64748B", stop3: "#1E293B", glow: "#818CF8", cheek: "#F43F5E" };
    }
    if (isRainy) {
      return { stop1: "#F0F9FF", stop2: "#BAE6FD", stop3: "#38BDF8", glow: "#38BDF8", cheek: "#F43F5E" };
    }
    if (isCloudy) {
      return { stop1: "#FFFFFF", stop2: "#F1F5F9", stop3: "#E2E8F0", glow: "#E2E8F0", cheek: "#FB7185" };
    }
    // Clear / Sunny Default
    return { stop1: "#FFFFFF", stop2: "#F0F9FF", stop3: "#7DD3FC", glow: "#38BDF8", cheek: "#F43F5E" };
  };

  const grad = getGradient();
  const safeGradId = `cartoonCloudGrad-${condition.replace(/[^a-zA-Z0-9_-]/g, '_')}-${isHoldingWater}`;

  return (
    <motion.div
      onMouseDown={handleStartInteraction}
      onMouseUp={handleEndInteraction}
      onMouseLeave={handleEndInteraction}
      onTouchStart={handleStartInteraction}
      onTouchEnd={handleEndInteraction}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: isRainy ? 1.25 : 1.1 }}
      animate={isHoldingWater ? { scale: 1.25 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className={`relative inline-flex flex-col sm:flex-row items-center gap-4 cursor-pointer select-none py-2 px-3 ${className}`}
    >
      {/* 3D Disney/Apple Style Cartoon Cloud Mascot */}
      <div className="relative w-28 h-24 flex items-center justify-center shrink-0">

        {/* ☀️ Sunny Mode: Floating Sunbeam Sparkles Overlay */}
        <AnimatePresence>
          {(isSunny && isInteractiveActive) && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                animate={{ opacity: 1, scale: 1.4, rotate: 180 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-amber-300/60 border-dashed pointer-events-none z-0"
              />
              {[0, 72, 144, 216, 288].map((angle, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.2, 0.5],
                    x: Math.cos((angle * Math.PI) / 180) * 35,
                    y: Math.sin((angle * Math.PI) / 180) * 35,
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                  className="absolute text-sm font-bold text-amber-300 pointer-events-none z-20"
                >
                  ✨
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* ☁️ Cloudy Mode: Floating Zzz Sleeping Bubbles Overlay */}
        <AnimatePresence>
          {(isCloudy && isInteractiveActive) && (
            <div className="absolute -top-6 right-2 flex flex-col items-center pointer-events-none z-30">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  initial={{ y: 0, opacity: 0, scale: 0.5 }}
                  animate={{
                    y: -24 - i * 12,
                    x: (i % 2 === 0 ? 1 : -1) * 8,
                    opacity: [0, 1, 0],
                    scale: [0.6, 1.2, 0.8],
                  }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4 }}
                  className="text-xs font-black text-sky-300 drop-shadow-md"
                >
                  Zzz...
                </motion.span>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* 🌧️ Rainy Mode: Animated Water Droplets */}
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

        {/* ⚡ Storm Mode: Animated Lightning Flash */}
        <AnimatePresence>
          {(isStorm || (isStorm && isInteractiveActive)) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: [0.2, 1, 0.4, 1, 0.2], y: [0, 5, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute inset-x-0 bottom-[-8px] flex justify-center pointer-events-none z-0"
            >
              <div className="text-xl font-bold text-amber-300 drop-shadow-[0_0_12px_#F59E0B]">
                ⚡
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Multi-Layered Cartoon Cloud SVG Body */}
        <motion.svg
          animate={
            isHoldingWater 
              ? { scale: [1.2, 1.25, 1.2] } 
              : isSpitting 
              ? { scale: [1.1, 0.95, 1], rotate: [0, -3, 3, 0] } 
              : isInteractiveActive && isCold
              ? { x: [-3, 3, -3, 3, 0] }
              : isInteractiveActive && isSunny
              ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }
              : { y: [0, -4, 0] }
          }
          transition={{ duration: isHoldingWater ? 0.5 : (isInteractiveActive ? 0.4 : 2.5), repeat: isHoldingWater ? Infinity : (isSpitting ? 1 : Infinity), ease: "easeInOut" }}
          viewBox="0 0 100 80"
          className="w-full h-full drop-shadow-[0_10px_25px_rgba(56,189,248,0.4)] relative z-10"
        >
          <defs>
            <linearGradient id={safeGradId} x1="0%" y1="0%" x2="0%" y2="100%">
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
              fill={`url(#${safeGradId})`}
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

          {/* ☀️ Cool 3D Sunglasses overlay when Tapped on Sunny Day */}
          {(isSunny && isInteractiveActive) ? (
            <g fill="#0F172A" stroke="#F59E0B" strokeWidth="1.5">
              {/* Left Lens */}
              <path d="M 32 37 L 46 37 C 46 45 32 45 32 37 Z" />
              {/* Right Lens */}
              <path d="M 54 37 L 68 37 C 68 45 54 45 54 37 Z" />
              {/* Bridge */}
              <line x1="46" y1="39" x2="54" y2="39" strokeWidth="2" />
              {/* Glare Lines */}
              <line x1="34" y1="39" x2="38" y2="43" stroke="#FFFFFF" strokeWidth="1" />
              <line x1="56" y1="39" x2="60" y2="43" stroke="#FFFFFF" strokeWidth="1" />
            </g>
          ) : isHoldingWater ? (
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
          ) : isSunny && isInteractiveActive ? (
            // Cool Smirk Smile
            <path d="M 45 50 Q 52 54 58 48" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" fill="none" />
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

      {/* Weather Info Card in Apple Glass Pill */}
      <div className="flex flex-col text-center sm:text-left bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl px-5 py-2.5 shadow-xl">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <span className="text-lg sm:text-xl font-extrabold text-white tracking-wide drop-shadow-md">
            {condition}
          </span>
          <span className="text-base font-bold text-sky-300 bg-sky-500/20 border border-sky-400/30 px-3 py-0.5 rounded-full">
            {temperature}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-white/70 mt-0.5 tracking-wider uppercase">
          Live Weather Signal
        </span>
      </div>
    </motion.div>
  );
}
