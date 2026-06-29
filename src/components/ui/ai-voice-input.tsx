import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square } from 'lucide-react';

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
}

export function AIVoiceInput({ onStart, onStop }: AIVoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<number | null>(null);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (onStop) onStop(duration);
      setDuration(0);
    } else {
      setIsListening(true);
      if (onStart) onStart();
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence>
        {isListening && (
          <>
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-pulse-500/30"
            />
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
              className="absolute inset-0 rounded-full bg-pulse-500/20"
            />
          </>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleListening}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-colors backdrop-blur-md shadow-lg border ${
          isListening 
            ? 'bg-pulse-500 border-pulse-400 text-white' 
            : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
        }`}
      >
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div key="recording" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
              <Square size={16} fill="currentColor" />
            </motion.div>
          ) : (
            <motion.div key="mic" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
              <Mic size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
