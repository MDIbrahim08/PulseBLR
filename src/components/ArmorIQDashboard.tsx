import React from 'react';
import { ShieldAlert } from 'lucide-react';

const ArmorIQDashboard: React.FC = () => {
  return (
    <div className="w-full h-full min-h-screen bg-[#030509] text-white flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 max-w-lg text-center shadow-2xl">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="text-emerald-400 w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold font-fustat mb-4">ArmorIQ Integration Pending</h1>
        <p className="text-white/60 font-inter leading-relaxed">
          The temporary simulated governance interface has been removed. ArmorIQ AI Governance will be fully enabled once the application connects to the official Enterprise Platform.
        </p>
      </div>
    </div>
  );
};

export default ArmorIQDashboard;
