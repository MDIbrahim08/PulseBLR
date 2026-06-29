import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Car, Train, Building2, AlertTriangle, Brain, CheckCircle2, Loader2 } from 'lucide-react';

const AGENTS = [
  { id: 'nimbus', name: 'Nimbus', icon: CloudRain, color: 'text-sky-400', message: 'Weather collected' },
  { id: 'velocity', name: 'Velocity', icon: Car, color: 'text-rose-400', message: 'Traffic analyzed' },
  { id: 'transitiq', name: 'TransitIQ', icon: Train, color: 'text-emerald-400', message: 'Metro schedules loaded' },
  { id: 'urbansense', name: 'UrbanSense', icon: Building2, color: 'text-violet-400', message: 'Events detected' },
  { id: 'chronos', name: 'Chronos', icon: AlertTriangle, color: 'text-amber-400', message: 'Future traffic predicted' }
];

export default function AgentAnimation() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    // Quickly run through the agents
    const interval = setInterval(() => {
      setActiveIdx((prev) => {
        if (prev < AGENTS.length) return prev + 1;
        return prev;
      });
    }, 400); // 400ms per agent

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-left w-full max-w-sm mx-auto">
      <div className="flex flex-col gap-3 w-full">
        <AnimatePresence>
          {AGENTS.slice(0, activeIdx).map((agent, i) => {
            const Icon = agent.icon;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 text-slate-300"
              >
                <Icon size={18} className={agent.color} />
                <p className="font-bold w-24">{agent.name}</p>
                <CheckCircle2 size={16} className="text-emerald-500" />
                <p className="text-sm text-slate-400">{agent.message}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {activeIdx < AGENTS.length ? (
          (() => {
            const ActiveAgent = AGENTS[activeIdx];
            const ActiveIcon = ActiveAgent.icon;
            return (
              <motion.div
                key="current"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-slate-300 mt-2"
              >
                <ActiveIcon size={18} className={`${ActiveAgent.color} animate-pulse`} />
                <p className="font-bold w-24">{ActiveAgent.name}</p>
                <Loader2 size={16} className="text-pulse-400 animate-spin" />
                <p className="text-sm text-slate-500">Connecting...</p>
              </motion.div>
            );
          })()
        ) : (
          <motion.div
            key="pulsemind"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 text-white mt-6 bg-pulse-500/10 border border-pulse-500/30 p-4 rounded-2xl"
          >
            <Brain size={24} className="text-pulse-400 animate-pulse" />
            <p className="font-black text-lg">PulseMind</p>
            <Loader2 size={18} className="text-pulse-400 animate-spin ml-auto" />
            <p className="text-sm text-pulse-400 font-medium animate-pulse">Generating recommendation...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
