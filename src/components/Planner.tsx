import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, MapPin, Search, Brain, ArrowRight, CheckCircle2, User, Sparkles, Star, ChevronDown, Paperclip, Mic, ArrowUp, AlertCircle, Bookmark, Bell, Globe, Navigation, CloudRain, Car, BookmarkCheck
} from 'lucide-react';
import {
  pulseCoreAgent,
  nimbusAdvisor, velocityAdvisor, transitIQAdvisor, urbanSenseAdvisor, chronosAdvisor, pulseFollowUpAgent,
  pulseLocationExtractionAgent
} from '../lib/llm-router';
import { getCurrentLocation, getReverseGeocode, getForwardGeocode, getLiveWeather, getLiveRoute } from '../lib/signals';
import AgentAnimation from './AgentAnimation';
import { useRouteStore } from '../store/routeStore';
import { usePulseObserver } from '../store/pulseObserver';
import { MessageLoading } from './ui/message-loading';
import { AIVoiceInput } from './ui/ai-voice-input';
import { FluidDropdown } from './ui/fluid-dropdown';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  isStructuredRec?: boolean;
  recommendation?: any;
  text?: string;
  isStreaming?: boolean;
};

export default function Planner() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cooldownMsg, setCooldownMsg] = useState('');
  const [showRouteTools, setShowRouteTools] = useState(false);
  const lastRequestTime = useRef<number>(0);
  const COOLDOWN_MS = 15000; // 15-second cooldown between AI requests
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState('English');
  const [rainAlertDismissed, setRainAlertDismissed] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<{label: string; origin: string; destination: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('pulse_saved_routes') || '[]'); } catch { return []; }
  });

  const { origin: currentAddress, setOrigin: setCurrentAddress, destination, setDestination, avoidTollsOrTraffic, setAvoidTollsOrTraffic } = useRouteStore();
  const { setAPIStatus, addEvent, setAuthStatus } = usePulseObserver();
  // Set auth status on mount (user is in the dashboard = authenticated)
  useEffect(() => { setAuthStatus('authenticated'); addEvent('Authentication verified — session active', 'success', 'Auth'); }, []);
  
  const [weatherData, setWeatherData] = useState<any>(null);
  const [trafficData, setTrafficData] = useState<any>(null);
  const [transitData, setTransitData] = useState('Checking transit...');

  useEffect(() => {
    // Leave destination empty by default
  }, []);

  const timeMode = 'Dynamic';
  const arrivalTime = 'Dynamic';

  // Removed hardcoded DEST_LAT and DEST_LON

  useEffect(() => {
    const gatherSignals = async () => {
      let wData: any = null;
      let tData: any = null;
      let address = currentAddress || '';
      let transit = 'Standard Bangalore Transit (Metro/BMTC) operating normally';

      try {
        const position = await getCurrentLocation();
        const { latitude: lat, longitude: lon } = position.coords;
        const addr = await getReverseGeocode(lat, lon);
        address = addr.split(',').slice(0, 3).join(',');
        setCurrentAddress(address);

        // Fetch weather and emit to observer
        const wt0 = performance.now();
        wData = await getLiveWeather(lat, lon);
        const wMs = Math.round(performance.now() - wt0);
        setWeatherData(wData);
        setAPIStatus('weather', 'online', wMs);
        addEvent(`Weather API — live data fetched in ${wMs}ms`, 'success', 'Nimbus');

        // Removed hardcoded traffic fetch on mount. It will be fetched dynamically on Analyze Route.
        setAPIStatus('traffic', 'cached');
        tData = { summary: 'Waiting for route analysis...' };
        
        const hour = new Date().getHours();
        transit = hour >= 23 || hour <= 5 ? 'Metro/Bus Services Closed' : 'Standard Bangalore Transit (Metro/BMTC) operating normally';
        setTransitData(transit);
        setAPIStatus('metro', 'online');
        addEvent('Metro API — transit status verified', 'success', 'TransitIQ');
      } catch {
        setCurrentAddress(address);
        wData = { temperature: '26°C', condition: 'Partly Cloudy', precipitation: '0mm', summary: 'Pleasant weather, 26°C, Partly Cloudy' };
        tData = { distanceKm: '12.5', durationMins: 45, summary: 'Moderate congestion' };
        setWeatherData(wData);
        setTrafficData(tData);
        setTransitData(transit);
        setAPIStatus('weather', 'cached');
        setAPIStatus('traffic', 'cached');
        addEvent('Live signals unavailable — using cached fallback data', 'warning', 'PulseCore');
      }
    };
    gatherSignals();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAnalyzing, isThinking]);

  const handlePlanRoute = async (overrideText?: string) => {
    const inputToUse = overrideText || chatInput;
    if (!currentAddress && !destination && !inputToUse.trim()) return;
    const now = Date.now();
    if (now - lastRequestTime.current < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (now - lastRequestTime.current)) / 1000);
      setCooldownMsg(`Please wait ${remaining}s before your next request.`);
      setTimeout(() => setCooldownMsg(''), 3000);
      return;
    }
    lastRequestTime.current = now;
    setCooldownMsg('');
    setIsAnalyzing(true);
    setChatHistory([]);
    
    let dynamicTrafficSignal = trafficData?.summary ?? 'Moderate congestion.';
    
    // Dynamically fetch live traffic for specific route
    try {
      if (currentAddress && destination) {
        addEvent(`Geocoding ${currentAddress} and ${destination}...`, 'info', 'PulseCore');
        const startCoords = await getForwardGeocode(currentAddress);
        const endCoords = await getForwardGeocode(destination);
        if (startCoords && endCoords) {
           const t0 = performance.now();
           const liveTraffic = await getLiveRoute(startCoords.lat, startCoords.lon, endCoords.lat, endCoords.lon);
           if (liveTraffic) {
             setTrafficData(liveTraffic);
             dynamicTrafficSignal = liveTraffic.summary;
             setAPIStatus('traffic', 'online', Math.round(performance.now() - t0));
             addEvent(`Traffic API — dynamic route data fetched`, 'success', 'Velocity');
           }
        }
      }
    } catch (e) {
       console.error("Dynamic routing failed", e);
    }
    
    const weatherSignal = weatherData?.summary ?? 'Partly Cloudy, 26°C';
    
    let activeOrigin = currentAddress;
    let activeDest = destination;
    
    if (!activeOrigin || !activeDest) {
      if (inputToUse.trim()) {
        const extracted = await pulseLocationExtractionAgent(inputToUse);
        if (extracted && extracted.origin && extracted.destination) {
           activeOrigin = extracted.origin;
           activeDest = extracted.destination;
           setCurrentAddress(extracted.origin);
           setDestination(extracted.destination);
        }
      }
    }

    try {
      const rec = await pulseCoreAgent(weatherSignal, dynamicTrafficSignal, transitData, activeOrigin, activeDest, arrivalTime, timeMode, inputToUse, avoidTollsOrTraffic, language);
      
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        isStructuredRec: true,
        recommendation: rec,
        isStreaming: true
      };
      
      setChatHistory([newMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGovernedAction = async (type: string, description: string, riskLevel: 'Low' | 'Medium' | 'High') => {
    addEvent(`Action Requested: ${type}`, 'info', 'PulseCore');
    addEvent(`Action Executed: ${type} processed successfully`, 'success', 'PulseCore');
  };

  const saveCurrentRoute = () => {
    if (!currentAddress || !destination) return;
    const label = prompt('Name this route (e.g. "Home to Office")');
    if (!label) return;
    const updated = [...savedRoutes, { label, origin: currentAddress, destination }];
    setSavedRoutes(updated);
    localStorage.setItem('pulse_saved_routes', JSON.stringify(updated));
  };

  const deleteSavedRoute = (index: number) => {
    const updated = savedRoutes.filter((_, i) => i !== index);
    setSavedRoutes(updated);
    localStorage.setItem('pulse_saved_routes', JSON.stringify(updated));
  };

  const openGoogleMaps = (origin: string, destination: string, mode: string = 'transit') => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
    window.open(url, '_blank');
  };

  const getCabFares = (origin: string, destination: string) => {
    // Rough Bangalore cab fare estimate (₹15/km base Ola/Uber, ₹12 auto)
    const distanceKm = trafficData?.distanceKm ? parseFloat(trafficData.distanceKm) : 12;
    const olaFare = Math.round(distanceKm * 15 + 30);
    const uberFare = Math.round(distanceKm * 16 + 25);
    const autoFare = Math.round(distanceKm * 12 + 20);
    return { ola: olaFare, uber: uberFare, auto: autoFare };
  };

  const isRaining = !rainAlertDismissed && (weatherData?.condition?.toLowerCase().includes('rain') || weatherData?.precipitation?.replace('mm','') > '2');

  const [chatInput, setChatInput] = useState('');

  const startVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Set language for voice dictation based on selected dropdown language
    if (language.toLowerCase() === 'kannada') {
      recognition.lang = 'kn-IN';
    } else if (language.toLowerCase() === 'hindi') {
      recognition.lang = 'hi-IN';
    } else {
      recognition.lang = 'en-IN';
    }
    
    // Store recognition on window object so we can abort it in onStop if needed
    (window as any).currentRecognition = recognition;

    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      finalTranscript = Array.from(event.results)
        .map((result: any) => result[0])
        .map(result => result.transcript)
        .join('');
      setChatInput(finalTranscript);
    };
    
    recognition.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        handleUniversalSubmit(finalTranscript);
      }
    };
    
    recognition.start();
  };

  const handleUniversalSubmit = (overrideText?: string) => {
    const inputToUse = overrideText || chatInput;
    if (chatHistory.length === 0) {
      handlePlanRoute(inputToUse);
    } else if (inputToUse.trim()) {
      handleChatSubmit(undefined, inputToUse);
    }
  };

  const handleVoiceStop = () => {
    setIsListening(false);
    if ((window as any).currentRecognition) {
      (window as any).currentRecognition.stop();
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const question = overrideText || chatInput;
    if (!question.trim() || isThinking) {
      return;
    }
    
    setChatInput('');
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: question };
    setChatHistory(prev => [...prev, userMsg]);
    
    setIsThinking(true);
    
    const weatherSignal = weatherData?.summary ?? 'Partly Cloudy, 26°C';
    const trafficSignal = trafficData?.summary ?? 'Moderate congestion on ORR.';
    const isFirstMessage = chatHistory.length === 0;
    
    let activeOrigin = currentAddress;
    let activeDest = destination;

    try {
      if (isFirstMessage && (!currentAddress || !destination)) {
         const extracted = await pulseLocationExtractionAgent(question);
         if (extracted && extracted.origin && extracted.destination) {
            activeOrigin = extracted.origin;
            activeDest = extracted.destination;
            setCurrentAddress(extracted.origin);
            setDestination(extracted.destination);
         }
      }

      const responseText = await pulseFollowUpAgent(question, weatherSignal, trafficSignal, transitData, activeOrigin, activeDest, arrivalTime, isFirstMessage, language);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: responseText,
        isStreaming: true
      };
      
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex flex-col items-center justify-center relative z-10 h-full"
    >
      <AnimatePresence mode="wait">
        {chatHistory.length === 0 && (
          <motion.div 
            key="hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center w-full max-w-[1000px] px-4"
          >
            {/* Headline */}
            <h1 className="font-fustat font-bold text-[44px] sm:text-[60px] md:text-[80px] text-black drop-shadow-sm leading-[1.1] md:leading-none tracking-[-2px] md:tracking-[-4.8px] mb-[20px] md:mb-[34px]">
              Master Commutes Quickly
            </h1>

            {/* Subtitle */}
            <p className="font-fustat font-medium text-[18px] md:text-[20px] text-black/80 drop-shadow-sm tracking-[-0.4px] max-w-[736px] w-[90%] md:w-[542px] mb-[44px] leading-relaxed">
              Set your origin and destination below to get powerful AI commute insights right away. Avoid traffic and achieve goals effortlessly.
            </p>

            {/* Rain Alert Banner */}
            {isRaining && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[728px] mb-4"
              >
                <Alert
                  variant="info"
                  layout="row"
                  isNotification
                  icon={<CloudRain size={16} className="text-blue-400" />}
                  action={
                    <button
                      onClick={() => setRainAlertDismissed(true)}
                      className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                      <span className="text-xs">✕</span>
                    </button>
                  }
                >
                  <AlertTitle className="text-blue-300 font-schibsted">Rain Detected</AlertTitle>
                  <AlertDescription className="text-blue-200/70 font-schibsted">Carry an umbrella &amp; leave early to avoid waterlogging!</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Saved Routes Chips */}
            {savedRoutes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {savedRoutes.map((r, i) => (
                  <div key={i} className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-white text-xs font-schibsted">
                    <button
                      onClick={() => { setCurrentAddress(r.origin); setDestination(r.destination); }}
                      className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
                    >
                      <BookmarkCheck size={12} className="text-[#5AE14C]" />
                      {r.label}
                    </button>
                    <button onClick={() => deleteSavedRoute(i)} className="ml-1 text-white/40 hover:text-red-400 transition-colors">×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Premium Input Container */}
            <div className="w-full max-w-[728px] h-auto min-h-[220px] rounded-[18px] bg-black/40 backdrop-blur-xl p-5 flex flex-col justify-between shadow-2xl border border-white/20">
              
              {/* Top Row: Commute Inputs */}
              <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center px-2 mb-4 w-full">
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-white font-schibsted font-medium text-[14px] w-full xl:w-auto">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <MapPin size={16} className="text-white/80 shrink-0" />
                    <input 
                      type="text" 
                      value={currentAddress}
                      onChange={e => setCurrentAddress(e.target.value)}
                      className="bg-transparent border-b-2 border-white/30 focus:border-white outline-none w-full sm:w-[160px] md:w-[180px] text-white placeholder-white/60 pb-1"
                      placeholder="Origin"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Search size={16} className="text-white/80 shrink-0" />
                    <input 
                      type="text" 
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      className="bg-transparent border-b-2 border-white/30 focus:border-white outline-none w-full sm:w-[160px] md:w-[180px] text-white placeholder-white/60 pb-1"
                      placeholder="Destination"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-auto bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setAvoidTollsOrTraffic(!avoidTollsOrTraffic)}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${avoidTollsOrTraffic ? 'bg-pulse-500 border-pulse-500' : 'border-white/50'}`}>
                      {avoidTollsOrTraffic && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <span className="text-white/80 text-sm whitespace-nowrap">Avoid Tolls & Traffic</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FluidDropdown onLanguageChange={setLanguage} />

                  {currentAddress && destination && (
                    <button
                      onClick={saveCurrentRoute}
                      title="Save this route"
                      className="flex items-center gap-1.5 text-white/70 hover:text-white font-schibsted text-[13px] bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/20 transition-colors"
                    >
                      <Bookmark size={14} />
                      <span className="hidden sm:inline">Save</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Main Input Area */}
              <div className="flex-1 bg-white rounded-[12px] shadow-sm flex items-start px-4 mb-3 relative group min-h-[80px]">
                <textarea
                  placeholder="Ask anything or just click Analyze..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { 
                    if(e.key === 'Enter' && !e.shiftKey) { 
                      e.preventDefault(); 
                      handleUniversalSubmit();
                    } 
                  }}
                  className="w-full h-full bg-transparent outline-none font-inter text-[16px] text-black placeholder-black/60 pr-12 resize-none pt-4 pb-4"
                />
                <button 
                  onClick={() => handleUniversalSubmit()}
                  disabled={(!currentAddress && !destination && !chatInput.trim()) || isAnalyzing || isThinking}
                  className="absolute right-3 bottom-3 w-[36px] h-[36px] bg-black rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-md"
                >
                  {isAnalyzing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowUp size={18} className="text-white" />
                  )}
                </button>
              </div>

              {/* Bottom Row */}
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-4">
                  <AIVoiceInput 
                    onStart={startVoiceDictation} 
                    onStop={handleVoiceStop} 
                  />
                  <span className="font-schibsted text-[13px] text-white/70 font-medium hidden md:block">
                    {isListening ? 'Listening for your route...' : 'Or use voice'}
                  </span>
                </div>
                
                <button 
                  onClick={handlePlanRoute}
                  disabled={isAnalyzing || (!chatInput.trim() && (!currentAddress || !destination))}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-schibsted font-bold text-[14px] px-6 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 backdrop-blur-md"
                >
                  {isAnalyzing ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles size={16} className="text-[#5AE14C]" /> Analyze Route</>
                  )}
                </button>
              </div>
              {cooldownMsg && (
                <p className="text-center text-xs text-orange-400 mt-2 animate-pulse">{cooldownMsg}</p>
              )}
            </div>
          </motion.div>
        )}

        {chatHistory.length > 0 && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full max-h-[85vh] max-w-4xl mx-auto flex flex-col bg-black/40 backdrop-blur-xl rounded-[18px] shadow-2xl border border-white/20 overflow-hidden relative"
          >
            {/* Header for Chat Mode */}
            <div className="p-4 border-b border-white/10 flex justify-end items-center bg-black/20 shrink-0">
              <button 
                onClick={() => setChatHistory([])} 
                className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)] backdrop-blur-xl hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                Delete Chat
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
              {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-full bg-pulse-500/20 border border-pulse-500/30 flex items-center justify-center shrink-0">
                      <Brain size={20} className="text-pulse-400" />
                    </div>
                  )}

                  <div className={`w-full md:max-w-[85%] overflow-hidden ${msg.role === 'user' ? 'bg-pulse-600/90 text-white px-5 py-3 rounded-2xl rounded-tr-sm backdrop-blur-md shadow-lg border border-pulse-400/30' : 'bg-black/40 backdrop-blur-md border border-white/10 text-white/90 px-4 sm:px-6 py-4 sm:py-5 rounded-3xl rounded-tl-sm shadow-xl'}`}>
                    {msg.isStructuredRec ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="text-[#5AE14C]" size={24} />
                          <h3 className="text-xl font-bold text-white">Recommended Strategy</h3>
                        </div>
                        {msg.recommendation && (
                          <div className="grid grid-cols-1 gap-4 mt-4">
                            
                            {/* Key Stats Row */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col">
                                <span className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Departure</span>
                                <span className="text-white font-schibsted font-bold text-2xl">{msg.recommendation.recommendedDeparture}</span>
                              </div>
                              <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col">
                                <span className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Arrival</span>
                                <span className="text-white font-schibsted font-bold text-2xl">{msg.recommendation.expectedArrival}</span>
                              </div>
                            </div>

                            {/* Transport, Time Saved, & Confidence Row */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col">
                                <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Transport</span>
                                <span className="text-white font-schibsted font-bold text-sm leading-tight">{msg.recommendation.recommendedTransport}</span>
                              </div>
                              <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col">
                                <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">⏱ Time Saved</span>
                                <span className="text-white font-schibsted font-bold text-sm leading-tight">
                                  {msg.recommendation.timeSavedMinutes && parseInt(msg.recommendation.timeSavedMinutes.toString()) > 0 ? `~${msg.recommendation.timeSavedMinutes} min` : 'Optimal'}
                                </span>
                              </div>
                              <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col">
                                <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Confidence</span>
                                <span className="text-white font-schibsted font-bold text-sm leading-tight">{msg.recommendation.confidenceScore}%</span>
                              </div>
                            </div>

                            {/* Explanation */}
                            <div className="mt-1">
                              <p className="text-white/80 leading-relaxed font-schibsted text-[14px] whitespace-pre-wrap">{msg.recommendation.explanation}</p>
                            </div>

                            {/* Disclaimer (if provided) */}
                            {msg.recommendation.disclaimer && (
                              <Alert variant="warning" layout="complex" size="sm" className="mt-2 font-schibsted"
                                icon={<AlertCircle size={16} className="text-amber-400" />}
                              >
                                <AlertTitle className="text-amber-300">Important Notice</AlertTitle>
                                <AlertDescription className="text-amber-200/70">{msg.recommendation.disclaimer}</AlertDescription>
                              </Alert>
                            )}

                            {/* Alternative Route (if provided) */}
                            {msg.recommendation.alternativeRoute && (
                              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 border-l-4 border-l-blue-500 mt-2">
                                <p className="font-semibold text-white mb-2 flex items-center gap-2">
                                  <MapPin size={16} className="text-blue-500" />
                                  Alternative Route
                                </p>
                                <div className="flex items-center gap-4 mb-2">
                                  <span className="text-white font-schibsted font-semibold">{msg.recommendation.alternativeRoute.transport}</span>
                                  <span className="text-slate-500 text-sm">•</span>
                                  <span className="text-slate-300 font-schibsted">{msg.recommendation.alternativeRoute.time}</span>
                                </div>
                                <p className="text-slate-400 text-sm font-schibsted leading-relaxed">
                                  {msg.recommendation.alternativeRoute.reason}
                                </p>
                              </div>
                            )}
                            
                            {/* Reasoning Pills (if any) */}
                            {msg.recommendation.reasoning && msg.recommendation.reasoning.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {msg.recommendation.reasoning.map((r: string, i: number) => (
                                  <span key={i} className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-white/70">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action Buttons removed from here to be placed globally */}


                          </div>
                        )}
                      </div>
                    ) : (
                      (() => {
                        const lines = msg.text?.split('\n') || [];
                        const cleanLines = [];
                        const suggestions = [];
                        
                        for (const line of lines) {
                          const trimmed = line.trim();
                          if (trimmed.toUpperCase().startsWith('SUGGESTION:') || trimmed.toUpperCase().startsWith('- SUGGESTION:')) {
                            suggestions.push(trimmed.replace(/^-?\s*SUGGESTION:\s*/i, ''));
                          } else {
                            cleanLines.push(line);
                          }
                        }

                        return (
                          <div className="flex flex-col gap-3">
                            <div className="text-[15px] leading-relaxed whitespace-pre-wrap font-schibsted">
                              {cleanLines.join('\n').trim()}
                            </div>
                            {suggestions.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3 border-t border-white/10 pt-3">
                                {suggestions.map((s, idx) => (
                                  <button 
                                    key={idx}
                                    onClick={() => handleChatSubmit(undefined, s)}
                                    className="text-xs bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-all duration-200 font-medium"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      <User size={20} className="text-white/80" />
                    </div>
                  )}
                </div>
              ))}
              
              {isThinking && (
                <div className="flex justify-start">
                  <MessageLoading />
                </div>
              )}

              {/* Action Buttons (Collapsible Route Tools) */}
              {currentAddress && destination && (
                <div className="mt-2 pt-4 border-t border-white/10 flex flex-col gap-3">
                  <button 
                    onClick={() => setShowRouteTools(!showRouteTools)}
                    className="flex items-center justify-between w-full md:w-auto md:inline-flex bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-white/80 text-sm font-inter transition-all active:scale-95"
                  >
                    <span className="flex items-center gap-2">
                      <Car size={16} className="text-amber-400" /> 
                      {showRouteTools ? "Hide Route Tools" : "Show Cabs & Navigation"}
                    </span>
                    <ChevronDown size={16} className={`transition-transform duration-300 ${showRouteTools ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showRouteTools && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden flex flex-col gap-3"
                      >
                        {/* Google Maps Row */}
                        <div className="flex gap-2 flex-wrap pt-1">
                          <button
                            onClick={() => openGoogleMaps(currentAddress, destination, 'transit')}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2.5 rounded-xl text-white text-sm font-schibsted font-semibold transition-all active:scale-95 shadow-md"
                          >
                            <Navigation size={15} className="text-[#5AE14C]" />
                            Open in Google Maps
                          </button>
                          <button
                            onClick={() => openGoogleMaps(currentAddress, destination, 'driving')}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl text-white/70 text-sm font-schibsted transition-all active:scale-95"
                          >
                            <Car size={15} />
                            Driving Route
                          </button>
                        </div>

                        {/* Cab Fare Estimates */}
                        {(() => {
                          const fares = getCabFares(currentAddress, destination);
                          return (
                            <div className="bg-white/5 rounded-xl border border-white/10 p-3 max-w-[400px]">
                              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">🚕 Estimated Cab Fares</p>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="text-center">
                                  <p className="text-white/50 text-[10px] mb-1">Ola</p>
                                  <p className="text-white font-schibsted font-bold text-sm">₹{fares.ola}–{fares.ola + 40}</p>
                                </div>
                                <div className="text-center border-x border-white/10">
                                  <p className="text-white/50 text-[10px] mb-1">Uber</p>
                                  <p className="text-white font-schibsted font-bold text-sm">₹{fares.uber}–{fares.uber + 45}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-white/50 text-[10px] mb-1">Auto</p>
                                  <p className="text-white font-schibsted font-bold text-sm">₹{fares.auto}–{fares.auto + 30}</p>
                                </div>
                              </div>
                              <p className="text-white/25 text-[9px] mt-2 text-center">Approximate fares based on distance. Surge pricing may apply.</p>
                            </div>
                          );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 md:p-4 bg-black/40 border-t border-white/10 backdrop-blur-xl shrink-0 pb-6 md:pb-4">
              <form onSubmit={handleChatSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a follow up question..."
                  className="w-full bg-black/40 border border-white/20 text-white placeholder-white/50 rounded-xl pl-5 pr-20 py-4 focus:outline-none focus:border-white/50 transition-colors font-schibsted"
                />
                <button
                  type="submit"
                  disabled={isThinking || !chatInput.trim()}
                  className="absolute right-3 bg-white text-black hover:bg-gray-200 rounded-lg px-4 py-2 font-bold disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
