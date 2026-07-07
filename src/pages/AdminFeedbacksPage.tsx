import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Star, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurFade } from '../components/ui/blur-fade';
import { Button } from '../components/ui/button-1';

interface Feedback {
  id: string;
  rating: number;
  category: string;
  message: string;
  email: string | null;
  created_at: string;
}

export default function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedbacks:', error);
    } else {
      setFeedbacks(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id);

    if (error) {
      alert(`Failed to delete: ${error.message}`);
    } else {
      setFeedbacks((prev) => {
        const newFeedbacks = prev.filter((fb) => fb.id !== id);
        // Adjust currentIndex if necessary
        if (currentIndex >= newFeedbacks.length) {
          setCurrentIndex(Math.max(0, newFeedbacks.length - 1));
        }
        return newFeedbacks;
      });
    }
  };

  const nextFeedback = () => {
    setCurrentIndex((prev) => (prev + 1) % feedbacks.length);
  };

  const prevFeedback = () => {
    setCurrentIndex((prev) => (prev - 1 + feedbacks.length) % feedbacks.length);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <BlurFade delay={0.1} inView>
              <h1 className="text-3xl font-bold font-schibsted tracking-tight">Admin Feedback Portal</h1>
            </BlurFade>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg font-mono text-sm text-pulse-400 border border-white/10">
            {feedbacks.length} Total Feedbacks
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pulse-500"></div>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-20 text-white/50 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-xl">No feedbacks found.</p>
            <p className="text-sm mt-2">Looks like it's quiet out there!</p>
          </div>
        ) : (
          <div className="relative w-full max-w-4xl mx-auto h-[500px] flex items-center justify-center mt-12">
            
            {feedbacks.length > 1 && (
              <button 
                onClick={prevFeedback} 
                className="absolute left-0 md:-left-12 z-20 p-4 bg-white/5 hover:bg-white/20 border border-white/10 rounded-full transition-all hover:scale-110 active:scale-95"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            <AnimatePresence mode="wait">
              {feedbacks[currentIndex] && (
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 100, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -100, scale: 0.9 }}
                  transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                  className="w-full max-w-2xl bg-white/5 border border-white/10 p-12 rounded-[2.5rem] relative flex flex-col items-center text-center shadow-2xl backdrop-blur-xl group"
                >
                  <button
                    onClick={() => handleDelete(feedbacks[currentIndex].id)}
                    className="absolute top-6 right-6 p-3 bg-red-500/10 text-red-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                    title="Delete Feedback"
                  >
                    <Trash2 size={20} />
                  </button>
                  
                  <div className="flex items-center gap-2 text-pulse-400 mb-8 bg-pulse-500/10 px-6 py-2 rounded-full border border-pulse-500/20">
                    <Star size={24} className="fill-pulse-400" />
                    <span className="font-bold text-2xl font-schibsted">{feedbacks[currentIndex].rating}/5</span>
                  </div>
                  
                  <p className="text-3xl md:text-4xl leading-tight font-schibsted font-semibold text-white mb-12">
                    "{feedbacks[currentIndex].message}"
                  </p>
                  
                  <div className="mt-auto flex flex-col items-center">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3 border border-white/20">
                      <User size={24} className="text-white/60" />
                    </div>
                    <p className="font-bold text-lg">{feedbacks[currentIndex].email || 'Anonymous User'}</p>
                    <p className="text-white/40 text-sm mt-1 uppercase tracking-wider font-bold">
                      {new Date(feedbacks[currentIndex].created_at).toLocaleDateString()} • {feedbacks[currentIndex].category}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {feedbacks.length > 1 && (
              <button 
                onClick={nextFeedback} 
                className="absolute right-0 md:-right-12 z-20 p-4 bg-white/5 hover:bg-white/20 border border-white/10 rounded-full transition-all hover:scale-110 active:scale-95"
              >
                <ChevronRight size={28} />
              </button>
            )}
            
            {/* Dots */}
            <div className="absolute -bottom-16 flex items-center justify-center gap-2">
              {feedbacks.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-pulse-500' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
