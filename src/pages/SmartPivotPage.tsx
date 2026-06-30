import React from 'react';
import SmartPivot from '../components/SmartPivot';
import { Cpu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SmartPivotPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans text-white flex flex-col overflow-hidden">
      {/* Navigation Bar */}
      <header className="w-full px-[120px] py-4 flex justify-between items-center bg-slate-950 border-b border-white/10 relative z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
           <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shadow-lg">
              <img src="/logo.png" alt="PulseBLR Logo" className="w-full h-full object-cover scale-150" />
           </div>
           <span className="font-schibsted font-semibold text-2xl tracking-[-1.44px] text-white">
              PulseBLR
           </span>
        </div>

        <nav className="flex items-center gap-8 font-schibsted font-medium text-[15px] tracking-[-0.2px] text-white/60">
           <button onClick={() => navigate('/dashboard')} className="hover:text-white/80 transition-colors">
             Commute Planner
           </button>
           <button onClick={() => navigate('/smart-pivot')} className="text-white relative">
             Smart Pivot
             <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-white" />
           </button>
           <button onClick={() => navigate('/armor-iq')} className="hover:text-white/80 transition-colors">
             ArmorIQ
           </button>
        </nav>

        <div className="flex items-center gap-4 font-schibsted font-medium text-base tracking-[-0.2px]">
           <span className="text-white/70 font-semibold">Explorer</span>
           <button 
             onClick={() => navigate('/login')}
             className="flex items-center gap-2 w-[101px] justify-center py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors shadow-lg border border-white/10"
           >
             <LogOut size={16} /> Exit
           </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full h-full flex flex-col items-center justify-start overflow-y-auto pt-10 pb-20">
        <SmartPivot />
      </main>
    </div>
  );
}
