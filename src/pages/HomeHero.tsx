import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AnimatedTabs } from '../components/ui/animated-tabs';

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
  const [isAboutOpen, setIsAboutOpen] = useState(false);

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
              <button onClick={() => setIsAboutOpen(true)} className="text-sm text-gray-100 hover:text-gray-300 transition-colors">About App</button>
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
                <button 
                  onClick={() => setIsAboutOpen(true)}
                  className="liquid-glass border border-white/20 text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-300"
                >
                  About PulseBLR
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

      {/* About Modal */}
      {isAboutOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-lg transition-opacity" 
            onClick={() => setIsAboutOpen(false)} 
          />
          
          {/* Premium Glassmorphic Modal Content */}
          <div className="relative p-[1px] rounded-3xl max-w-3xl w-full shadow-[0_0_50px_rgba(90,225,76,0.15)] animate-in fade-in zoom-in-95 duration-300 bg-gradient-to-br from-white/30 via-white/5 to-transparent max-h-[95vh] flex flex-col">
            <div className="relative bg-[#0a0a0a]/90 backdrop-blur-2xl rounded-[23px] p-6 md:p-8 w-full h-full border border-white/10 overflow-y-auto flex flex-col no-scrollbar">
              
              {/* Decorative Glow */}
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-pulse-500/20 rounded-full blur-[100px] pointer-events-none" />
              
              <button 
                onClick={() => setIsAboutOpen(false)} 
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition-all border border-white/10 hover:scale-105 z-20"
              >
                ✕
              </button>
              
              <div className="relative z-10 flex-1 flex flex-col">
                <h2 className="text-3xl md:text-4xl font-bold mb-2 font-schibsted bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                  Welcome to PulseBLR 🚀
                </h2>
                <p className="text-white/60 text-sm md:text-base font-inter mb-6 max-w-lg">
                  The ultimate AI-powered commute operating system built exclusively to beat Bangalore's chaotic traffic.
                </p>
                
                <div className="mb-6 flex-1">
                  <AnimatedTabs 
                    tabs={[
                      {
                        id: "tab1",
                        label: "Core AI",
                        content: (
                          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 h-full">
                            <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-xl hover:bg-white/5 transition-colors">
                              <span className="text-2xl mb-3 block text-pulse-400">🧠</span>
                              <h3 className="font-schibsted font-bold text-white mb-2 text-lg">AI Route Planner</h3>
                              <p className="text-white/60 text-sm leading-relaxed font-inter">Analyzes live traffic, weather, and transit data to suggest the absolute fastest path.</p>
                            </div>
                            <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-xl hover:bg-white/5 transition-colors">
                              <span className="text-2xl mb-3 block text-blue-400">🌧️</span>
                              <h3 className="font-schibsted font-bold text-white mb-2 text-lg">Live Rain Alerts</h3>
                              <p className="text-white/60 text-sm leading-relaxed font-inter">Proactive banners warn you of rain or waterlogging before you even leave.</p>
                            </div>
                          </div>
                        )
                      },
                      {
                        id: "tab2",
                        label: "Actionable",
                        content: (
                          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 h-full">
                            <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-xl hover:bg-white/5 transition-colors">
                              <span className="text-2xl mb-3 block text-amber-400">🚕</span>
                              <h3 className="font-schibsted font-bold text-white mb-2 text-lg">Instant Cab Fares</h3>
                              <p className="text-white/60 text-sm leading-relaxed font-inter">Live Ola, Uber, &amp; Auto fare estimates based on actual RTO per-km rates.</p>
                            </div>
                            <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-xl hover:bg-white/5 transition-colors">
                              <span className="text-2xl mb-3 block text-purple-400">🗺️</span>
                              <h3 className="font-schibsted font-bold text-white mb-2 text-lg">1-Tap Google Maps</h3>
                              <p className="text-white/60 text-sm leading-relaxed font-inter">Zero clunky in-app maps. We generate a deep-link to open Google Maps instantly.</p>
                            </div>
                          </div>
                        )
                      },
                      {
                        id: "tab3",
                        label: "Smart Tools",
                        content: (
                          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 h-full">
                            <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-xl hover:bg-white/5 transition-colors">
                              <span className="text-2xl mb-3 block text-emerald-400">💾</span>
                              <h3 className="font-schibsted font-bold text-white mb-2 text-lg">Saved Routes</h3>
                              <p className="text-white/60 text-sm leading-relaxed font-inter">Save "Home to Office" and reload it every morning with a single tap.</p>
                            </div>
                            <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-xl hover:bg-white/5 transition-colors">
                              <span className="text-2xl mb-3 block text-pink-400">🎙️</span>
                              <h3 className="font-schibsted font-bold text-white mb-2 text-lg">Voice &amp; Languages</h3>
                              <p className="text-white/60 text-sm leading-relaxed font-inter">Ask questions using your voice in English, Kannada, or Hindi.</p>
                            </div>
                          </div>
                        )
                      }
                    ]} 
                  />
                </div>
                
                <div className="pt-4 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 mt-auto">
                  <p className="text-xs text-white/40 italic font-inter text-center md:text-left">
                    Built to save your time, your money, and your sanity.
                  </p>
                  <button 
                    onClick={() => { setIsAboutOpen(false); navigate('/dashboard'); }}
                    className="w-full md:w-auto bg-pulse-600 hover:bg-pulse-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-pulse-500/25 hover:shadow-pulse-500/40 hover:scale-105 active:scale-95 shrink-0"
                  >
                    Launch Planner →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
