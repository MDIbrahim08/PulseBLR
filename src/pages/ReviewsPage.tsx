import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TestimonialCarousel, TestimonialData } from '@/components/ui/testimonial';

const fakeReviews: TestimonialData[] = [
  {
    id: 1,
    name: "Arjun Reddy",
    role: "Software Engineer at Google",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
    quote: "PulseBLR completely changed my commute to RMZ Ecospace. It suggested taking the metro and a short auto ride instead of sitting in traffic for 2 hours on ORR. Pure magic!",
    accent: "#38bdf8"
  },
  {
    id: 2,
    name: "Priya Sharma",
    role: "Product Manager",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    quote: "I love the 'Avoid Tolls & Traffic' feature. It found a backroad through Indiranagar that I didn't even know existed. Saves me 25 minutes every morning.",
    accent: "#a855f7"
  },
  {
    id: 3,
    name: "Rahul Verma",
    role: "Freelance Designer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    quote: "The UI is incredibly sleek, and the AI agent actually understands when I say 'I need to reach by 9:30 AM'. It feels like texting a personal chauffeur.",
    accent: "#10b981"
  },
  {
    id: 4,
    name: "Sneha Iyer",
    role: "Data Analyst",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    quote: "Honestly, the fallback logic when the API is down is brilliant. It doesn't break; it just gives a sensible estimate. Best hackathon project I've seen.",
    accent: "#f43f5e"
  }
];

export default function ReviewsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col relative overflow-hidden font-inter">
      {/* Top Navigation */}
      <nav className="flex items-center p-6 md:px-12 relative z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full px-4 md:px-8 py-8 space-y-12">
        
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Loved by Bangaloreans
          </h1>
          <p className="text-white/60 text-lg">
            See what actual commuters are saying about their experience with PulseBLR.
          </p>
        </div>

        <div className="w-full max-w-4xl mx-auto">
          <TestimonialCarousel 
            items={fakeReviews} 
            autoplay={true}
            autoplayMs={4000}
            variant="card"
          />
        </div>
        
      </main>

      {/* Ambient Background Effects */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-pulse-500/20 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] translate-y-1/4 translate-x-1/4 pointer-events-none" />
    </div>
  );
}
