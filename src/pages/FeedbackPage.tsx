import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Heart, Send, Frown, Sparkles, Star } from 'lucide-react';
import { BlurFade } from '../components/ui/blur-fade';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import FeedbackSlider from '../components/ui/feedback-slider';
import { Button } from '../components/ui/button-1';
import { Textarea } from '../components/ui/textarea';
import { supabase } from '../lib/supabase';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: slider, 1: text form, 2: thank you
  const [emotion, setEmotion] = useState(1); // 0: bad, 1: mid, 2: good
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    setSubmitError('');
    
    // Fallback if they didn't touch stars
    const rating = starRating > 0 ? starRating : [1, 3, 5][emotion];

    const { data: { session } } = await supabase.auth.getSession();
    const userName = session?.user?.user_metadata?.full_name || 'Anonymous User';
    const userAvatar = session?.user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&q=80';
    const profileString = `${userName}||${userAvatar}`;

    const { error } = await supabase
      .from('feedback')
      .insert([
        { 
          rating,
          category: 'User Journey',
          message: message.trim(),
          email: profileString
        }
      ]);

    setIsSubmitting(false);
    if (!error) {
      setStep(2);
    } else {
      console.error(error);
      setSubmitError(error.message || "Failed to submit feedback. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col relative overflow-x-hidden font-inter">
      <nav className="flex items-center p-6 md:px-12 relative z-10 w-full">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-start relative z-10 w-full px-4 md:px-8 py-8 md:py-16">
        <AnimatePresence mode="wait">
          
          {step === 0 && (
            <motion.div 
              key="step-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-lg flex flex-col items-center space-y-8"
            >
              <div className="h-[400px] md:h-[500px] max-h-[70vh] w-full">
                <FeedbackSlider value={emotion} onChange={setEmotion} className="w-full h-full" />
              </div>
              <Button 
                onClick={() => {
                  setStarRating([1, 3, 5][emotion]);
                  setStep(1);
                }}
                className="w-full max-w-[200px] text-lg py-6 bg-pulse-500 hover:bg-pulse-600 text-white rounded-full shadow-lg shadow-pulse-500/20"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div 
              key="step-1"
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-lg flex flex-col items-center space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold">Rate Your Experience</h3>
                <div className="flex items-center justify-center gap-2 pt-2 pb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setStarRating(star)}
                      className="focus:outline-none hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Star 
                        size={32} 
                        className={`transition-colors ${star <= starRating ? 'fill-pulse-500 text-pulse-500' : 'fill-white/10 text-white/20 hover:text-white/40'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <Textarea 
                value={message}
                onChange={(val) => {
                  setMessage(val || '');
                  if (submitError) setSubmitError('');
                }}
                placeholder="I really loved how..."
                className="min-h-[150px] bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
              />

              {submitError && (
                <div className="w-full text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                  {submitError}
                </div>
              )}

              <div className="flex gap-4 w-full">
                <Button 
                  onClick={() => setStep(0)}
                  variant="unstyled"
                  className="flex-1 flex items-center justify-center border border-white/20 text-white hover:bg-white/10 rounded-xl py-3 transition-colors duration-200 font-medium"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={message.trim().length < 10 || isSubmitting}
                  className="flex-1 flex items-center justify-center bg-pulse-500 hover:bg-pulse-600 text-white gap-2 rounded-xl py-3 shadow-lg shadow-pulse-500/20 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : message.trim().length < 10 ? 'Keep typing...' : 'Submit'} <Send size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
              className="w-full max-w-md flex flex-col items-center text-center space-y-6"
            >
              {emotion === 2 && (
                <div className="relative">
                  <motion.div 
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                    className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-green-400"
                  >
                    <Heart size={48} className="fill-green-400" />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-green-500/10 rounded-full blur-xl -z-10"
                  />
                </div>
              )}

              {emotion === 1 && (
                <motion.div 
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400"
                >
                  <CheckCircle2 size={48} />
                </motion.div>
              )}

              {emotion === 0 && (
                <motion.div 
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring' }}
                  className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center text-red-400"
                >
                  <Frown size={48} />
                </motion.div>
              )}

              <div className="space-y-2">
                <BlurFade delay={0.25} inView>
                  <h2 className="text-3xl font-bold">
                    {emotion === 2 ? goodMessage.title 
                      : emotion === 1 ? midMessage.title 
                      : badMessage.title}
                  </h2>
                </BlurFade>
                <BlurFade delay={0.5} inView>
                  <p className="text-white/60 text-lg">
                    {emotion === 2 
                      ? goodMessage.desc
                      : emotion === 1 
                        ? midMessage.desc
                        : badMessage.desc}
                  </p>
                </BlurFade>
              </div>

              <Button 
                onClick={() => navigate('/dashboard')}
                className="mt-8 bg-white text-black hover:bg-gray-200 rounded-full px-8 py-6"
              >
                Back to Dashboard
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Ambient Background Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pulse-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
    </div>
  );
}

const goodMessage = { 
  title: "Thank you! 🙏", 
  desc: "We truly appreciate your valuable feedback. Your positive thoughts fuel our team to build even better features for you." 
};

const midMessage = { 
  title: "Thank you for sharing. 📝", 
  desc: "We are committed to improving your experience based on your insights. Our team will review this closely." 
};

const badMessage = { 
  title: "Our sincere apologies. 📉", 
  desc: "We deeply apologize for the inconvenience. Your feedback is crucial, and we are taking immediate steps to resolve it." 
};
