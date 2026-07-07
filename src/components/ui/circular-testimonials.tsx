import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

export interface Testimonial {
  quote: string;
  name: string;
  designation: string;
  src: string;
  id?: string;
}

interface CircularTestimonialsProps {
  testimonials: Testimonial[];
  autoplay?: boolean;
  onDelete?: (id: string) => void;
  colors?: {
    name?: string;
    designation?: string;
    testimony?: string;
    arrowBackground?: string;
    arrowForeground?: string;
    arrowHoverBackground?: string;
  };
  fontSizes?: {
    name?: string;
    designation?: string;
    quote?: string;
  };
}

export const CircularTestimonials: React.FC<CircularTestimonialsProps> = ({
  testimonials,
  autoplay = false,
  onDelete,
  colors = {
    name: "#f7f7ff",
    designation: "#e1e1e1",
    testimony: "#f1f1f7",
    arrowBackground: "#0582CA",
    arrowForeground: "#141414",
    arrowHoverBackground: "#f7f7ff",
  },
  fontSizes = {
    name: "28px",
    designation: "20px",
    quote: "20px",
  },
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoplay || testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoplay, testimonials.length]);

  if (!testimonials || testimonials.length === 0) return null;

  const current = testimonials[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-8 items-center justify-center p-8 relative rounded-3xl bg-black overflow-hidden group">
      
      {onDelete && current.id && (
        <button 
          onClick={() => onDelete(current.id!)}
          className="absolute top-4 right-4 z-50 p-3 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={20} />
        </button>
      )}

      {/* Image Side */}
      <div className="w-full md:w-[400px] h-[300px] md:h-[400px] relative rounded-3xl overflow-hidden shadow-2xl flex-shrink-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={current.src || 'default'}
            src={current.src || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&q=80'}
            alt={current.name}
            initial={{ opacity: 0, scale: 1.1, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotate: -2 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>

      {/* Content Side */}
      <div className="w-full md:flex-1 flex flex-col justify-center space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div>
              <h3 
                className="font-bold font-schibsted" 
                style={{ color: colors.name, fontSize: fontSizes.name }}
              >
                {current.name || 'Anonymous User'}
              </h3>
              <p 
                className="font-medium" 
                style={{ color: colors.designation, fontSize: fontSizes.designation }}
              >
                {current.designation || 'PulseBLR User'}
              </p>
            </div>
            <p 
              className="leading-relaxed font-sans" 
              style={{ color: colors.testimony, fontSize: fontSizes.quote }}
            >
              "{current.quote}"
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {testimonials.length > 1 && (
          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={handlePrev}
              className="p-4 rounded-full transition-all flex items-center justify-center hover:scale-110 active:scale-95"
              style={{ backgroundColor: colors.arrowBackground, color: colors.arrowForeground }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.arrowHoverBackground!)}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = colors.arrowBackground!)}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNext}
              className="p-4 rounded-full transition-all flex items-center justify-center hover:scale-110 active:scale-95"
              style={{ backgroundColor: colors.arrowBackground, color: colors.arrowForeground }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.arrowHoverBackground!)}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = colors.arrowBackground!)}
            >
              <ChevronRight size={24} />
            </button>
            <span className="ml-4 text-sm text-white/50 font-mono">
              {currentIndex + 1} / {testimonials.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
