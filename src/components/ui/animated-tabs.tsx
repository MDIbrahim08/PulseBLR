"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface AnimatedTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

const AnimatedTabs = ({
  tabs,
  defaultTab,
  className,
}: AnimatedTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id);

  if (!tabs?.length) return null;

  return (
    <div className={cn("w-full flex flex-col gap-y-4 border-4 border-red-500 min-h-[100px]", className)}>
      <div className="flex justify-center w-full">
        <div className="flex gap-2 flex-wrap bg-red-900 p-4 rounded-xl shadow-lg border border-red-500">
          <h2 className="text-white font-bold text-xl w-full text-center">TABS SHOULD BE HERE</h2>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-6 py-2.5 text-sm md:text-base font-medium rounded-lg text-white outline-none transition-colors"
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-[#222222d1] bg-opacity-80 shadow-[0_0_15px_rgba(14,165,233,0.3)] backdrop-blur-sm !rounded-lg border border-pulse-500/30"
                  transition={{ type: "spring", duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col items-center justify-start h-full mt-4">
        <AnimatePresence mode="wait">
          {tabs.map(
            (tab) =>
              activeTab === tab.id && (
                <motion.div
                  key={tab.id}
                  className="w-full h-full flex flex-col max-w-[1200px]"
                  initial={{
                    opacity: 0,
                    scale: 0.95,
                    y: 10,
                    filter: "blur(10px)",
                  }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.95, y: -10, filter: "blur(10px)" }}
                  transition={{
                    duration: 0.4,
                    ease: "circInOut",
                  }}
                >
                  {tab.content}
                </motion.div>
              )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export { AnimatedTabs };
