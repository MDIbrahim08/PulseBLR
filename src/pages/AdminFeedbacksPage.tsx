import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BlurFade } from '../components/ui/blur-fade';
import { CircularTestimonials } from '../components/ui/circular-testimonials';
import type { Testimonial } from '../components/ui/circular-testimonials';

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
      setFeedbacks((prev) => prev.filter((fb) => fb.id !== id));
    }
  };

  const formattedTestimonials: Testimonial[] = feedbacks.map((fb) => {
    let name = "Anonymous User";
    let src = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&q=80";
    
    if (fb.email && fb.email.includes('||')) {
      const parts = fb.email.split('||');
      name = parts[0] || name;
      src = parts[1] || src;
    } else if (fb.email) {
      src = fb.email; // Fallback if it was just a URL
    }

    return {
      id: fb.id,
      quote: fb.message,
      name: name,
      designation: `${fb.rating}/5 Stars - ${fb.category}`,
      src: src
    };
  });

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
          <div className="w-full flex items-center justify-center mt-12 max-w-[1024px] mx-auto">
            <CircularTestimonials 
              testimonials={formattedTestimonials} 
              autoplay={false} 
              onDelete={handleDelete}
              colors={{
                name: "#f7f7ff",
                designation: "#e1e1e1",
                testimony: "#f1f1f7",
                arrowBackground: "#0582CA",
                arrowForeground: "#141414",
                arrowHoverBackground: "#f7f7ff",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
