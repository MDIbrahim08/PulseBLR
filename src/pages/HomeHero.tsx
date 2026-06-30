import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const FadeIn = ({ children, delay = 0, duration = 1000, className = "" }: any) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

const AnimatedHeading = ({ text, initialDelay = 200 }: { text: string; initialDelay?: number }) => {
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartAnimation(true);
    }, initialDelay);
    return () => clearTimeout(timer);
  }, [initialDelay]);

  const lines = text.split('\n');
  const charDelay = 30; // ms per char

  return (
    <h1
      className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal mb-4 text-white"
      style={{ letterSpacing: '-0.04em' }}
    >
      {lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
          <span className="inline-block whitespace-nowrap">
            {line.split('').map((char, charIndex) => {
              const delay = lineIndex * lines[0].length * charDelay + charIndex * charDelay;
              return (
                <span
                  key={charIndex}
                  className="inline-block transition-all duration-500 ease-out"
                  style={{
                    opacity: startAnimation ? 1 : 0,
                    transform: startAnimation ? 'translateX(0)' : 'translateX(-18px)',
                    transitionDelay: `${delay}ms`,
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </span>
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </h1>
  );
};

export default function HomeHero() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0]);
      } else if (user?.email) {
        setUserName(user.email.split('@')[0]);
      }
    });
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans">
      {/* Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-auto">
        
        {/* Navbar */}
        <div className="px-6 md:px-12 lg:px-16 pt-6">
          <nav className="liquid-glass rounded-xl px-4 py-2 flex items-center justify-between">
            <div className="text-white text-2xl font-semibold tracking-tight">
              PulseBLR
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm text-gray-100 hover:text-gray-300 transition-colors">Commute</a>
            </div>

            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Launch Dashboard
            </button>
          </nav>
        </div>

        {/* Hero Content Bottom */}
        <div className="px-6 md:px-12 lg:px-16 flex-1 flex flex-col justify-end pb-12 lg:pb-16">
          <div className="lg:grid lg:grid-cols-2 lg:items-end">
            
            {/* Left Column */}
            <div>
              <AnimatedHeading key={userName} text={`Namaste ${userName ? userName + ',' : 'Explorer,'}\nMastering commutes\nwith intelligence and action.`} />
              
              <FadeIn delay={800} duration={1000}>
                <p className="text-base md:text-lg text-gray-300 mb-5 max-w-xl">
                  We analyze live city signals and craft strategies that redefine how you travel.
                </p>
              </FadeIn>

              <FadeIn delay={1200} duration={1000} className="flex flex-wrap gap-4">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Launch Dashboard
                </button>
                <button className="liquid-glass border border-white/20 text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-300">
                  Explore Signals
                </button>
              </FadeIn>
            </div>

            {/* Right Column */}
            <div className="mt-8 lg:mt-0 flex lg:items-end justify-start lg:justify-end">
              <FadeIn delay={1400} duration={1000}>
                <div className="liquid-glass border border-white/20 px-6 py-3 rounded-xl inline-block">
                  <span className="text-lg md:text-xl lg:text-2xl font-light text-white">
                    Intelligence. Optimization. Action.
                  </span>
                </div>
              </FadeIn>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
