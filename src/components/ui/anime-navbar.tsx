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
    <div className={cn("relative z-30 w-full flex justify-center", className)}>
      <motion.div 
        className="flex items-center gap-1.5 bg-black/60 border border-white/15 backdrop-blur-2xl py-1.5 px-2 rounded-full shadow-2xl relative max-w-full overflow-x-auto custom-scrollbar"
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
                "relative cursor-pointer text-xs font-semibold px-4 sm:px-5 py-2 rounded-full transition-all duration-300 flex items-center gap-2 shrink-0 select-none",
                "text-white/70 hover:text-white",
                isActive && "text-white font-bold"
              )}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full -z-10 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="absolute inset-0 bg-sky-500/30 rounded-full blur-md" />
                  <div className="absolute inset-[-4px] bg-sky-400/20 rounded-full blur-xl" />
                  <div className="absolute inset-[-8px] bg-sky-500/10 rounded-full blur-2xl" />
                  
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
                  className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="relative w-9 h-9">
                    <motion.div 
                      className="absolute w-8 h-8 bg-white rounded-full left-1/2 -translate-x-1/2 shadow-md flex items-center justify-center"
                      animate={
                        hoveredTab ? {
                          scale: [1, 1.1, 1],
                          rotate: [0, -5, 5, 0],
                          transition: {
                            duration: 0.5,
                            ease: "easeInOut"
                          }
                        } : {
                          y: [0, -3, 0],
                          transition: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }
                        }
                      }
                    >
                      <motion.div 
                        className="absolute w-1.5 h-1.5 bg-black rounded-full"
                        animate={
                          hoveredTab ? {
                            scaleY: [1, 0.2, 1],
                            transition: {
                              duration: 0.2,
                              times: [0, 0.5, 1]
                            }
                          } : {}
                        }
                        style={{ left: '25%', top: '35%' }}
                      />
                      <motion.div 
                        className="absolute w-1.5 h-1.5 bg-black rounded-full"
                        animate={
                          hoveredTab ? {
                            scaleY: [1, 0.2, 1],
                            transition: {
                              duration: 0.2,
                              times: [0, 0.5, 1]
                            }
                          } : {}
                        }
                        style={{ right: '25%', top: '35%' }}
                      />
                      <motion.div 
                        className="absolute w-1.5 h-1 bg-pink-400 rounded-full"
                        animate={{
                          opacity: hoveredTab ? 0.9 : 0.6
                        }}
                        style={{ left: '15%', top: '50%' }}
                      />
                      <motion.div 
                        className="absolute w-1.5 h-1 bg-pink-400 rounded-full"
                        animate={{
                          opacity: hoveredTab ? 0.9 : 0.6
                        }}
                        style={{ right: '15%', top: '50%' }}
                      />
                      
                      <motion.div 
                        className="absolute w-3 h-1.5 border-b-2 border-black rounded-full"
                        animate={
                          hoveredTab ? {
                            scaleY: 1.5,
                            y: -1
                          } : {
                            scaleY: 1,
                            y: 0
                          }
                        }
                        style={{ left: '30%', top: '55%' }}
                      />
                      <AnimatePresence>
                        {hoveredTab && (
                          <>
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              className="absolute -top-1 -right-1 text-[10px]"
                            >
                              ✨
                            </motion.div>
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              transition={{ delay: 0.1 }}
                              className="absolute -top-2 left-0 text-[10px]"
                            >
                              ✨
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-1 left-1/2 w-3 h-3 -translate-x-1/2"
                      animate={
                        hoveredTab ? {
                          y: [0, -3, 0],
                          transition: {
                            duration: 0.3,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }
                        } : {
                          y: [0, 2, 0],
                          transition: {
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5
                          }
                        }
                      }
                    >
                      <div className="w-full h-full bg-white rotate-45 transform origin-center" />
                    </motion.div>
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
