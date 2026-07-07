import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FeedbackSlider from '../components/ui/feedback-slider';
import { Feedback } from '../components/ui/feedback';
import { TestimonialCarousel } from '../components/ui/testimonial';
import type { TestimonialData } from '../components/ui/testimonial';
import { supabase } from '../lib/supabase';

const fallbackReviews: TestimonialData[] = [
  {
    id: 1,
    name: "Arjun Reddy",
    role: "Route Suggestions",
    avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=arjun",
    quote: "PulseBLR completely changed my commute to RMZ Ecospace. It suggested taking the metro and a short auto ride instead of sitting in traffic for 2 hours on ORR. Pure magic!",
    accent: "#38bdf8"
  },
  {
    id: 2,
    name: "Priya Sharma",
    role: "Feature Request",
    avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=priya",
    quote: "I love the 'Avoid Tolls & Traffic' feature. It found a backroad through Indiranagar that I didn't even know existed. Saves me 25 minutes every morning.",
    accent: "#a855f7"
  }
];

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<TestimonialData[]>(fallbackReviews);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data && !error) {
        const formattedReviews: TestimonialData[] = data.map((item) => ({
          id: item.id,
          name: item.email ? item.email.split('@')[0] : 'PulseBLR User',
          role: item.category,
          quote: item.message,
          avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${item.id}`,
          accent: "#38bdf8"
        }));
        
        // If we have real reviews, show them. Otherwise fallback to placeholders.
        if (formattedReviews.length > 0) {
          setReviews(formattedReviews);
        } else {
          setReviews(fallbackReviews);
        }
      } else {
        setReviews(fallbackReviews);
      }
    };
    
    fetchReviews();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col relative overflow-x-hidden font-inter">
      {/* Top Navigation */}
      <nav className="flex items-center p-6 md:px-12 relative z-10 w-full">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start relative z-10 w-full px-4 md:px-8 py-4 md:py-8 space-y-12 md:space-y-24 pb-32">
        
        {/* Step 1: Overall Experience Slider */}
        <div className="w-full max-w-lg h-[400px] md:h-[500px] max-h-[70vh] flex flex-col items-center space-y-4">
          <FeedbackSlider className="w-full h-full" />
        </div>

        {/* Step 2: Inline Quick Feedback for thoughts/bugs */}
        <div className="w-full max-w-lg flex flex-col items-center pt-8 space-y-4">
          <h4 className="text-white/80 font-medium mb-4 text-center">Tell us what you loved or what we can improve</h4>
          <div className="bg-white rounded-3xl p-2 w-full flex justify-center">
            <Feedback type="inline" label="Write a review" />
          </div>
        </div>

        {/* Step 3: Real User Testimonials */}
        <div className="w-full max-w-4xl pt-16 flex flex-col items-center border-t border-white/10">
          <h4 className="text-white font-semibold text-3xl mb-12 text-center">Community Suggestions</h4>
          <TestimonialCarousel 
            items={reviews} 
            autoplay={true}
            autoplayMs={4000}
            variant="card"
          />
        </div>
        
      </main>

      {/* Ambient Background Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pulse-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
    </div>
  );
}
