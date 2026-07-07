import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareHeart, Star, Send, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CATEGORIES = ['General Feedback', 'UI/UX', 'AI Accuracy', 'Route Suggestions', 'Bug Report', 'Feature Request'];

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [category, setCategory] = useState('General Feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a star rating before submitting.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Please write at least 10 characters in your feedback.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Sanitize inputs before storing
      const sanitize = (str: string) => str.replace(/<[^>]*>/g, '').trim().slice(0, 2000);

      const { error: dbError } = await supabase
        .from('feedback')
        .insert({
          rating,
          category,
          message: sanitize(message),
          email: email ? sanitize(email).slice(0, 254) : null,
          created_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Feedback submission failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050510] overflow-hidden font-sans flex items-center justify-center">
      {/* Gradient background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a2e] via-[#050510] to-[#0a1a0a]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pulse-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-12">
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-schibsted">Back to Dashboard</span>
        </button>

        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center shadow-2xl"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-emerald-400" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Thank you! 🙏</h2>
              <p className="text-white/60 font-schibsted leading-relaxed mb-8">
                Your feedback has been received and will help us make PulseBLR better for every commuter in Bangalore.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-white text-black font-semibold px-8 py-3 rounded-xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
              >
                Back to Dashboard
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pulse-600 to-emerald-600 flex items-center justify-center shadow-lg">
                  <MessageSquareHeart size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Share Your Feedback</h1>
                  <p className="text-white/50 text-sm font-schibsted">Help us improve PulseBLR for everyone</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Star Rating */}
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-3 font-schibsted">
                    How would you rate your experience?
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition-all duration-150 hover:scale-125 active:scale-110"
                      >
                        <Star
                          size={32}
                          className={`transition-colors ${
                            star <= (hoveredRating || rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-white/20'
                          }`}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-3 text-white/60 text-sm font-schibsted">
                        {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-3 font-schibsted">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-schibsted font-medium transition-all ${
                          category === cat
                            ? 'bg-pulse-600 text-white border border-pulse-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-3 font-schibsted">
                    Your Feedback <span className="text-white/30 font-normal">(required)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    maxLength={2000}
                    placeholder="Tell us what you think — what's working well, what could be improved, or any features you'd love to see..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 font-schibsted text-sm resize-none focus:outline-none focus:border-pulse-500/50 focus:bg-white/8 transition-all"
                  />
                  <p className="text-right text-white/30 text-xs mt-1">{message.length}/2000</p>
                </div>

                {/* Email (optional) */}
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-3 font-schibsted">
                    Email <span className="text-white/30 font-normal">(optional — if you'd like a reply)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={254}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 font-schibsted text-sm focus:outline-none focus:border-pulse-500/50 focus:bg-white/8 transition-all"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm font-schibsted">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full group flex items-center justify-center gap-2 bg-gradient-to-r from-pulse-600 to-pulse-500 hover:from-pulse-500 hover:to-pulse-400 text-white font-semibold py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 shadow-[0_0_25px_rgba(14,165,233,0.3)] hover:shadow-[0_0_35px_rgba(14,165,233,0.5)]"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                      Submit Feedback
                      <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
