"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs?: Tab[];
  defaultTab?: string;
  className?: string;
}

const AnimatedTabs = ({
  tabs = [],
  defaultTab,
  className,
}: AnimatedTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || (tabs.length > 0 ? tabs[0].id : ""));

  if (!tabs?.length) return null;

  return (
    <div className={cn("w-full flex flex-col gap-y-2", className)}>
      <div className="flex gap-2 flex-wrap bg-white/5 border border-white/10 backdrop-blur-md p-1.5 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium rounded-lg text-white outline-none transition-colors flex-1 min-w-[120px] text-center"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-pulse-500/30 shadow-[0_0_20px_rgba(90,225,76,0.2)] backdrop-blur-sm rounded-lg border border-pulse-400/30"
                transition={{ type: "spring", duration: 0.6 }}
              />
            )}
            <span className="relative z-10 font-schibsted">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6 bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.2)] text-white backdrop-blur-xl rounded-2xl min-h-[200px] h-full overflow-hidden relative">
        {tabs.map(
          (tab) =>
            activeTab === tab.id && (
              <motion.div
                key={tab.id}
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  x: -10,
                  filter: "blur(10px)",
                }}
                animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, x: -10, filter: "blur(10px)" }}
                transition={{
                  duration: 0.5,
                  ease: "circInOut",
                  type: "spring",
                }}
                className="w-full h-full"
              >
                {tab.content}
              </motion.div>
            )
        )}
      </div>
    </div>
  );
};

export { AnimatedTabs };
