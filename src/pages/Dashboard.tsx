import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, MessageSquareHeart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Planner from '../components/Planner';
import { supabase } from '../lib/supabase';
import VideoBackground from '../components/ui/VideoBackground';
import TextThree from '../components/ui/text-three';

export default function Dashboard() {
  const [userName, setUserName] = useState<string | null>(null);
  
  // Only show splash if we haven't shown it ever (or we can use localStorage to persist across tabs)
  const shouldShowSplash = !localStorage.getItem('hasShownSplash');
  const [showSplash, setShowSplash] = useState(shouldShowSplash);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.full_name) {
        setUserName(session.user.user_metadata.full_name.split(' ')[0]);
      }
    };
    fetchUser();
    
    if (shouldShowSplash) {
      // Mark it immediately so if they navigate away quickly it doesn't trigger again later
      localStorage.setItem('hasShownSplash', 'true');
      
      // Hide splash screen after 3.5 seconds
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowSplash]);

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden font-sans">
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <TextThree text={`Namaste ${userName || 'World'}!`} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Video Background Layer */}
      <VideoBackground />

      {/* Main UI Overlay */}
      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        
        {/* Navigation Bar */}
        <header className="w-full px-[120px] py-4 flex justify-between items-center bg-transparent relative z-50">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
             <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shadow-lg">
                <img src="/logo.png" alt="PulseBLR Logo" className="w-full h-full object-cover scale-150" />
             </div>
             <span className="font-schibsted font-semibold text-2xl tracking-[-1.44px] text-black">
                PulseBLR
             </span>
          </div>

          {/* Menu Items */}
          <nav className="flex items-center gap-8 font-schibsted font-medium text-[15px] tracking-[-0.2px] text-black/60">
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

          {/* Actions */}
          <div className="flex items-center gap-4 font-schibsted font-medium text-base tracking-[-0.2px]">
             <span className="text-black/70 font-semibold">{userName || 'Explorer'}</span>
             <button 
               onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
               className="flex items-center gap-2 w-[101px] justify-center py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-colors shadow-lg border border-black/10"
             >
               <LogOut size={16} /> Exit
             </button>
          </div>
        </header>

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
