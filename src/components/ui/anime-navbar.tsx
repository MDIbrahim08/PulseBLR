import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface NavItem {
  name: string;
  url?: string;
  icon: LucideIcon;
  onClick?: () => void;
}

export interface AnimeNavBarProps {
  items: NavItem[];
  className?: string;
  defaultActive?: string;
}

export function AnimeNavBar({ items, className, defaultActive }: AnimeNavBarProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(defaultActive || items[0]?.name || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={cn("relative z-30 w-full flex justify-center pt-9 pb-2 overflow-x-auto scrollbar-none touch-pan-x px-3", className)}>
      <motion.div 
        className="flex items-center gap-1.5 bg-black/70 border border-white/20 backdrop-blur-2xl py-2 px-3 rounded-full shadow-2xl relative shrink-0"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;
          const isHovered = hoveredTab === item.name;

          return (
            <button
              key={item.name}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.name);
                if (item.onClick) item.onClick();
              }}
              onMouseEnter={() => setHoveredTab(item.name)}
              onMouseLeave={() => setHoveredTab(null)}
              className={cn(
                "relative cursor-pointer text-xs font-semibold px-4 sm:px-5 py-2.5 rounded-full transition-all duration-300 flex items-center gap-2 shrink-0 select-none",
                "text-white/70 hover:text-white",
                isActive && "text-white font-bold"
              )}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full -z-10 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0.4, 0.7, 0.4],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="absolute inset-0 bg-sky-500/35 rounded-full blur-md" />
                  <div className="absolute inset-[-4px] bg-sky-400/25 rounded-full blur-xl" />
                  <div className="absolute inset-[-8px] bg-sky-500/15 rounded-full blur-2xl" />
                  
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-sky-400/0 via-sky-400/30 to-sky-400/0"
                    style={{
                      animation: "shine 3s ease-in-out infinite"
                    }}
                  />
                </motion.div>
              )}

              <Icon size={14} className={isActive ? "text-sky-400" : "text-white/60"} strokeWidth={2} />

              <motion.span
                className="relative z-10 whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {item.name}
              </motion.span>
        
              <AnimatePresence>
                {isHovered && !isActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 bg-white/10 rounded-full -z-10"
                  />
                )}
              </AnimatePresence>

              {isActive && (
                <motion.div
                  layoutId="anime-mascot"
                  className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none z-50"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="relative flex flex-col items-center">
                    {/* 3D Apple Liquid Glass Navigation Orb */}
                    <motion.div 
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-white/95 via-sky-100/80 to-sky-400/50 backdrop-blur-2xl border border-white/80 shadow-[0_6px_20px_rgba(56,189,248,0.4)] flex items-center justify-center relative overflow-hidden"
                      animate={
                        hoveredTab ? {
                          scale: [1, 1.2, 1],
                          transition: { duration: 0.4, ease: "easeInOut" }
                        } : {
                          y: [0, -3, 0],
                          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }
                      }
                    >
                      {/* Top Specular Glare Reflection */}
                      <div className="absolute top-0 inset-x-0 h-3.5 bg-gradient-to-b from-white/90 to-transparent rounded-t-full pointer-events-none" />

                      {/* Live Location Pulse Core */}
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38BDF8] relative z-10 animate-pulse" />
                    </motion.div>

                    {/* 3D Glass Teardrop Pointer */}
                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white/80 -mt-0.5 filter drop-shadow-sm" />
                  </div>
                </motion.div>
              )}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
