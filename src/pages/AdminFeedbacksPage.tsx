import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Star, User } from 'lucide-react';
import { motion } from 'framer-motion';
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
      setFeedbacks((prev) => prev.filter((fb) => fb.id !== id));
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedbacks.map((fb, i) => (
              <BlurFade key={fb.id} delay={0.1 + (i * 0.05)} inView>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col h-full hover:bg-white/10 transition-colors group relative">
                  
                  {/* Delete Button (appears on hover) */}
                  <button
                    onClick={() => handleDelete(fb.id)}
                    className="absolute top-4 right-4 p-2 bg-red-500/20 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                    title="Delete Feedback"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-pulse-400">
                      <Star size={16} className="fill-pulse-400" />
                      <span className="font-bold">{fb.rating}/5</span>
                    </div>
                    <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                      {fb.category}
                    </span>
                  </div>

                  <p className="text-white/80 font-medium mb-6 flex-grow whitespace-pre-wrap">
                    "{fb.message}"
                  </p>

                  <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      <span>{fb.email || 'Anonymous'}</span>
                    </div>
                    <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
