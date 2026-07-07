import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FeedbackSlider from '../components/ui/feedback-slider';
import { Feedback } from '../components/ui/feedback';

export default function FeedbackPage() {
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
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full px-4 md:px-8 py-8 space-y-16">
        
        {/* Step 1: Overall Experience Slider */}
        <div className="w-full max-w-lg h-[600px] flex flex-col items-center space-y-4">
          <FeedbackSlider className="w-full h-full" />
        </div>

        {/* Step 2: Inline Quick Feedback for thoughts/bugs */}
        <div className="w-full max-w-lg flex flex-col items-center pt-8 border-t border-white/10 space-y-4">
          <h4 className="text-white/80 font-medium mb-4">Have specific suggestions or found a bug?</h4>
          <div className="bg-white rounded-3xl p-2 w-fit">
            <Feedback type="inline" label="Write a review" />
          </div>
        </div>
        
      </main>

      {/* Ambient Background Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pulse-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
    </div>
  );
}
