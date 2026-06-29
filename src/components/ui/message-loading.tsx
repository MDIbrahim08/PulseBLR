import { motion } from "framer-motion";
import React from "react";

export function MessageLoading() {
  return (
    <div className="flex items-center gap-2 px-6 py-4 bg-slate-800/80 rounded-3xl rounded-tl-sm w-fit border border-slate-700/50 shadow-sm">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2.5 h-2.5 rounded-full bg-pulse-400"
          animate={{
            y: ["0%", "-50%", "0%"],
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.15,
          }}
        />
      ))}
    </div>
  );
}

export function MessageLoadingDemo() {
  return (
    <div className="block">
      <MessageLoading />
    </div>
  );
}
