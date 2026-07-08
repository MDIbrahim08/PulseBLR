import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, MessageSquareHeart, Star, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Planner from '../components/Planner';
import { supabase } from '../lib/supabase';
import VideoBackground from '../components/ui/VideoBackground';
import { AnimatedHamburger } from '../components/ui/animated-hamburger';

export default function Dashboard() {
  const [userName, setUserName] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.full_name) {
        setUserName(session.user.user_metadata.full_name.split(' ')[0]);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden font-sans">
      {/* Video Background Layer */}
      <VideoBackground />

      {/* Main UI Overlay */}
      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        
        {/* Navigation Bar */}
        <header className="w-full px-4 md:px-[120px] py-4 flex justify-between items-center bg-transparent relative z-50">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer z-50" onClick={() => navigate('/dashboard')}>
             <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shadow-lg bg-black/90">
                <img src="/logo.png" alt="PulseBLR Logo" className="w-full h-full object-cover scale-[1.3]" />
             </div>
             <span className="font-schibsted font-semibold text-xl md:text-2xl tracking-tight text-black">
                PulseBLR
             </span>
          </div>

          {/* Desktop Menu Items */}
          <nav className="hidden md:flex items-center gap-8 font-schibsted font-medium text-[15px] tracking-[-0.2px] text-black/60">
             <button 
               onClick={() => navigate('/dashboard')} 
               className="transition-all duration-300 relative text-black"
             >
               Commute Planner
               <motion.div layoutId="nav-pill" className="absolute -bottom-1 left-0 w-full h-[2px] bg-black" />
             </button>
             <button 
               onClick={() => navigate('/smart-pivot')} 
               className="flex items-center gap-1 transition-all duration-300 relative hover:text-black/80"
             >
               Smart Pivot
             </button>
             <button 
               onClick={() => navigate('/feedback')} 
               className="flex items-center gap-1 transition-all duration-300 relative hover:text-black/80"
             >
               <MessageSquareHeart size={14} className="opacity-60" />
               Feedback
             </button>
             <button 
               onClick={() => navigate('/admin/feedbacks')} 
               className="flex items-center gap-1 transition-all duration-300 relative hover:text-black/80 text-orange-600 font-semibold"
             >
               Admin Portal
             </button>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4 font-schibsted font-medium text-base tracking-[-0.2px]">
             <span className="text-black/70 font-semibold">{userName || 'Explorer'}</span>
             <button 
               onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
               className="flex items-center gap-2 w-[101px] justify-center py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-colors shadow-lg border border-black/10"
             >
               <LogOut size={16} /> Exit
             </button>
          </div>

          {/* Mobile Menu Toggle */}
          <AnimatedHamburger 
            isOpen={isMobileMenuOpen} 
            toggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          />
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 w-full h-screen bg-white/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-8 pt-20"
            >
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }} className="text-2xl font-semibold text-black">Commute Planner</button>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/smart-pivot'); }} className="text-2xl font-semibold text-black">Smart Pivot</button>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/feedback'); }} className="text-2xl font-semibold text-black flex items-center gap-2"><MessageSquareHeart size={24}/> Feedback</button>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/admin/feedbacks'); }} className="text-2xl font-semibold text-orange-600">Admin Portal</button>
              <div className="w-full max-w-[200px] h-[1px] bg-black/10 my-4" />
              <button 
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
                className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl text-lg shadow-lg"
              >
                <LogOut size={20} /> Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Main Content Container */}
        <main className="flex-1 w-full h-full relative z-0 flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden pt-20 pb-20">
          
          <AnimatePresence mode="wait">
            <motion.div
              key="planner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center justify-center"
            >
              <Planner />
            </motion.div>
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}
