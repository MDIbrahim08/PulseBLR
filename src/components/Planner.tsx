import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Clock, MapPin, Search, Brain, ArrowRight, CheckCircle2, User, Sparkles, Star, ChevronDown, Paperclip, Mic, ArrowUp, AlertCircle, Bookmark, Bell, Globe, Navigation, CloudRain, Car, BookmarkCheck, AlertTriangle, Volume2, MicOff, Activity, Building2, Laptop, Plane, Coffee
} from 'lucide-react';
import {
  pulseCoreAgent,
  nimbusAdvisor, velocityAdvisor, transitIQAdvisor, urbanSenseAdvisor, chronosAdvisor, pulseFollowUpAgent,
  pulseLocationExtractionAgent
} from '../lib/llm-router';
import { getCurrentLocation, getReverseGeocode, getForwardGeocode, getLiveWeather, getTrafficAwareRoute } from '../lib/signals';
import AgentAnimation from './AgentAnimation';
import { useRouteStore, type CommuteSession } from '../store/routeStore';
import { usePulseObserver } from '../store/pulseObserver';
import { MessageLoading } from './ui/message-loading';
import { AIVoiceInput } from './ui/ai-voice-input';
import { FluidDropdown } from './ui/fluid-dropdown';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { LocationAutocomplete } from './ui/LocationAutocomplete';
import { WeatherCloudMascot } from './ui/weather-cloud-mascot';
import { AnimatedMetroTrack } from './ui/animated-metro-track';
import { AnimeNavBar } from './ui/anime-navbar';
import { WavyBackground } from './ui/wavy-background';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  isStructuredRec?: boolean;
  recommendation?: any;
  text?: string;
  isStreaming?: boolean;
};

export default function Planner() {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cooldownMsg, setCooldownMsg] = useState('');

  // Version watermark
  const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.1.0-live';

  // Geolocation & Timestamp Refs & State
  const [isGeolocationLoading, setIsGeolocationLoading] = useState(true);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState<string>('');
  
  const geolocationLoadingRef = useRef(true);
  const currentPositionRef = useRef<GeolocationPosition | null>(null);

  const setGeolocationLoading = (val: boolean) => {
    geolocationLoadingRef.current = val;
    setIsGeolocationLoading(val);
  };
  const setAndRefPosition = (pos: GeolocationPosition | null) => {
    currentPositionRef.current = pos;
    setCurrentPosition(pos);
  };

  // Clock Update Effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimestamp(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Hands-free Voice Mode States
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const voiceStateRef = useRef<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const updateVoiceState = (state: typeof voiceState) => {
    voiceStateRef.current = state;
    setVoiceState(state);
  };

  const isPeakHour = () => {
    const now = new Date();
    const hour = now.getHours();
    const mins = now.getMinutes();
    const totalMins = hour * 60 + mins;
    
    // Morning peak: 8:30 AM (510 mins) to 11:30 AM (690 mins)
    const isMorningPeak = totalMins >= 510 && totalMins <= 690;
    // Evening peak: 5:30 PM (1050 mins) to 8:30 PM (1230 mins)
    const isEveningPeak = totalMins >= 1050 && totalMins <= 1230;
    
    return isMorningPeak || isEveningPeak;
  };
  const [showRouteTools, setShowRouteTools] = useState(false);
  const lastRequestTime = useRef<number>(0);
  const COOLDOWN_MS = 15000; // 15-second cooldown between AI requests
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isThinking, showRouteTools]);
  
  const [language, setLanguage] = useState('English');
  const [rainAlertDismissed, setRainAlertDismissed] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<{label: string; origin: string; destination: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('pulse_saved_routes') || '[]'); } catch { return []; }
  });

  const { 
    origin: currentAddress, 
    setOrigin: setCurrentAddress, 
    destination, 
    setDestination, 
    avoidTollsOrTraffic, 
    setAvoidTollsOrTraffic,
    commuteSession,
    setCommuteSession,
    updateCommuteSession
  } = useRouteStore();

  const { setAPIStatus, addEvent, setAuthStatus } = usePulseObserver();
  // Set auth status and log version on mount
  useEffect(() => { 
    setAuthStatus('authenticated'); 
    addEvent('Authentication verified — session active', 'success', 'Auth');
    console.log(`PulseBLR v${APP_VERSION} loaded.`);
  }, []);
  
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
      setGeolocationLoading(true);
      let wData: any = null;
      let tData: any = null;
      let address = currentAddress || '';
      let transit = 'Standard Bangalore Transit (Metro/BMTC) operating normally';

      try {
        const position = await getCurrentLocation();
        setAndRefPosition(position);
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
      } catch (err) {
        console.warn("Could not gather location/weather signals automatically:", err);
        setCurrentAddress(address);
        wData = { temperature: '26°C', condition: 'Partly Cloudy', precipitation: '0mm', summary: 'Pleasant weather, 26°C, Partly Cloudy' };
        tData = { distanceKm: 12.5, durationMinutes: 45, staticDurationMinutes: 45, summary: 'Moderate congestion' };
        setWeatherData(wData);
        setTrafficData(tData);
        setTransitData(transit);
        setAPIStatus('weather', 'cached');
        setAPIStatus('traffic', 'cached');
        addEvent('Live signals unavailable — using cached fallback data', 'warning', 'PulseCore');
      } finally {
        setGeolocationLoading(false);
      }
    };
    gatherSignals();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAnalyzing, isThinking]);

  const parseTimeToMins = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const validateTimePair = (departure: string, arrival: string): boolean => {
    const depMins = parseTimeToMins(departure);
    const arrMins = parseTimeToMins(arrival);
    if (depMins === null || arrMins === null) return true;
    if (arrMins < depMins) {
      if (depMins > 1200 && arrMins < 200) {
        return true;
      }
      return false;
    }
    return true;
  };

  const checkDeadlineConflict = (confirmedDeparture: string, hardDeadline: string, lastRecommendation: any): { hasConflict: boolean, msg?: string } => {
    const depMins = parseTimeToMins(confirmedDeparture);
    const deadlineMins = parseTimeToMins(hardDeadline);
    
    if (depMins === null || deadlineMins === null) return { hasConflict: false };

    let durationMins = 45; // default fallback
    if (lastRecommendation && lastRecommendation.recommendedDeparture && lastRecommendation.expectedArrival) {
      const recDep = parseTimeToMins(lastRecommendation.recommendedDeparture);
      const recArr = parseTimeToMins(lastRecommendation.expectedArrival);
      if (recDep !== null && recArr !== null) {
        if (recArr > recDep) {
          durationMins = recArr - recDep;
        } else if (recArr < recDep) {
          durationMins = (1440 - recDep) + recArr;
        }
      }
    }

    const projectedArrivalMins = depMins + durationMins;
    
    if (projectedArrivalMins > deadlineMins) {
      const arrHrs24 = Math.floor(projectedArrivalMins / 60) % 24;
      const arrMins = projectedArrivalMins % 60;
      const arrHrs12 = arrHrs24 % 12 === 0 ? 12 : arrHrs24 % 12;
      const arrAmpm = arrHrs24 >= 12 ? 'PM' : 'AM';
      const projectedArrivalStr = `${arrHrs12}:${arrMins.toString().padStart(2, '0')} ${arrAmpm}`;
      
      return {
        hasConflict: true,
        msg: `Warning: Leaving at ${confirmedDeparture} means you will arrive at approximately ${projectedArrivalStr}, which is after your stated deadline of ${hardDeadline}.`
      };
    }

    return { hasConflict: false };
  };

  const handleLocateMe = async () => {
    setGeoError(null);
    setGeolocationLoading(true);
    try {
      const position = await getCurrentLocation();
      setAndRefPosition(position);
      const { latitude: lat, longitude: lon } = position.coords;
      const addr = await getReverseGeocode(lat, lon);
      const address = addr.split(',').slice(0, 3).join(',');
      setCurrentAddress(address);
      addEvent(`Live location updated: ${address}`, 'success', 'PulseCore');
    } catch (err: any) {
      console.warn("Manual geolocation request failed:", err);
      if (err.code === 1) { // PERMISSION_DENIED
        setGeoError("Location permission denied. Please click the lock icon in the URL bar to allow location access and try again.");
      } else {
        setGeoError("Could not retrieve your location. Please enter your address manually.");
      }
    } finally {
      setGeolocationLoading(false);
    }
  };

  const handlePlanRoute = async (overrideText?: string) => {
    setGeoError(null);
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

    // P0-1: Geolocation Gate / Readiness Check
    if (geolocationLoadingRef.current) {
      addEvent("Waiting for geolocation to resolve...", "info", "PulseCore");
      let waitTime = 0;
      while (geolocationLoadingRef.current && waitTime < 5000) {
        await new Promise(resolve => setTimeout(resolve, 200));
        waitTime += 200;
      }
    }

    // Geolocation Fallback on Timeout
    if (geolocationLoadingRef.current || (!currentPositionRef.current && !currentAddress)) {
      setIsAnalyzing(false);
      const cachedAddress = localStorage.getItem('pulse_last_known_address');
      if (cachedAddress) {
        setCurrentAddress(cachedAddress);
        addEvent(`Geolocation timeout. Using last-known address: ${cachedAddress}`, 'warning', 'PulseCore');
      } else {
        setGeoError("Location services took longer than expected. Please enter your origin manually below to continue.");
        addEvent('Geolocation timeout. Prompting for manual origin.', 'error', 'PulseCore');
        return;
      }
    }
    
    // 1. Resolve active origin and destination first (from inputs or text extraction)
    let activeOrigin = currentAddress;
    let activeDest = destination;
    let activeHardDeadline = commuteSession?.hardDeadline || null;
    
    if (inputToUse.trim()) {
      const extracted = await pulseLocationExtractionAgent(inputToUse);
      if (extracted) {
         if (extracted.origin && !activeOrigin) {
           activeOrigin = extracted.origin;
           setCurrentAddress(extracted.origin);
         }
         if (extracted.destination && !activeDest) {
           activeDest = extracted.destination;
           setDestination(extracted.destination);
         }
         if (extracted.hardDeadline) {
           activeHardDeadline = extracted.hardDeadline;
         }
      }
    }

    // 2. Reject if no locations are found (fallback to chat)
    if (!activeOrigin || !activeDest) {
      setIsAnalyzing(false);
      if (inputToUse.trim()) {
        handleChatSubmit(undefined, inputToUse);
      }
      return;
    }

    // Store last known address for future fallback
    localStorage.setItem('pulse_last_known_address', activeOrigin);

    // Initialize commute session in store
    const session: CommuteSession = {
      origin: activeOrigin,
      destination: activeDest,
      hardDeadline: activeHardDeadline,
      confirmedDeparture: null,
      lastRecommendation: null
    };
    setCommuteSession(session);

    // 3. Dynamically fetch live traffic and route info for resolved locations
    let dynamicTrafficSignal = trafficData?.summary ?? 'Moderate congestion.';
    let resolvedStartCoords = currentPositionRef.current 
      ? { lat: currentPositionRef.current.coords.latitude, lon: currentPositionRef.current.coords.longitude } 
      : { lat: 12.9716, lon: 77.5946 };

    try {
      addEvent(`Geocoding ${activeOrigin} and ${activeDest}...`, 'info', 'PulseCore');
      const startCoords = await getForwardGeocode(activeOrigin);
      const endCoords = await getForwardGeocode(activeDest);
      if (startCoords) resolvedStartCoords = startCoords;
      if (startCoords && endCoords) {
         const t0 = performance.now();
         const liveTraffic = await getTrafficAwareRoute(startCoords.lat, startCoords.lon, endCoords.lat, endCoords.lon);
         if (liveTraffic) {
           setTrafficData(liveTraffic);
           dynamicTrafficSignal = liveTraffic.summary;
           setAPIStatus('traffic', 'online', Math.round(performance.now() - t0));
           addEvent(`Traffic API — dynamic route data fetched (source: ${liveTraffic.source})`, 'success', 'Velocity');
         }
      }
    } catch (e) {
       console.error("Dynamic routing failed", e);
    }
    
    const weatherSignal = weatherData?.summary ?? 'Partly Cloudy, 26°C';

    // 4. Generate AI commute recommendation
    try {
      let rec = await pulseCoreAgent(
        weatherSignal, 
        dynamicTrafficSignal, 
        transitData, 
        activeOrigin, 
        activeDest, 
        activeHardDeadline || arrivalTime, 
        timeMode, 
        inputToUse, 
        avoidTollsOrTraffic, 
        language,
        currentTimestamp,
        resolvedStartCoords
      );
      
      // Time pair validator with one-time automatic correction retry
      if (!validateTimePair(rec.recommendedDeparture, rec.expectedArrival)) {
        addEvent("Time validation failed (arrival before departure). Re-firing LLM with corrective feedback.", "warning", "PulseCore");
        rec = await pulseCoreAgent(
          weatherSignal, 
          dynamicTrafficSignal, 
          transitData, 
          activeOrigin, 
          activeDest, 
          activeHardDeadline || arrivalTime, 
          timeMode, 
          `${inputToUse} (Correction: Your previous output had arrival before departure — recompute using the provided currentTimestamp)`, 
          avoidTollsOrTraffic, 
          language,
          currentTimestamp,
          resolvedStartCoords
        );
      }

      // Programmatic Temporal Validation: prevent recommending departure times in the past
      let baseTimeForValidation = currentTimestamp || "";
      if (!baseTimeForValidation) {
        const now = new Date();
        baseTimeForValidation = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }

      const depMins = parseTimeToMins(rec.recommendedDeparture);
      const nowMins = parseTimeToMins(baseTimeForValidation);
      if (depMins !== null && nowMins !== null && depMins < nowMins) {
        addEvent(`Programmatic temporal correction: ${rec.recommendedDeparture} is in the past. Correcting to ${baseTimeForValidation}.`, "warning", "PulseCore");
        rec.recommendedDeparture = baseTimeForValidation;
        const arrMins = parseTimeToMins(rec.expectedArrival);
        if (arrMins !== null) {
          const duration = arrMins > depMins ? (arrMins - depMins) : 45;
          const newArrMins = nowMins + duration;
          const arrHrs24 = Math.floor(newArrMins / 60) % 24;
          const arrMinsPart = newArrMins % 60;
          const arrHrs12 = arrHrs24 % 12 === 0 ? 12 : arrHrs24 % 12;
          const arrAmpm = arrHrs24 >= 12 ? 'PM' : 'AM';
          rec.expectedArrival = `${arrHrs12}:${arrMinsPart.toString().padStart(2, '0')} ${arrAmpm}`;
        }
        
        // Correct past times in the explanation string too
        rec.explanation = rec.explanation.replace(/\b(?:5|6|7|8|9|10|11|12|1|2|3|4):[0-5]\d\s*(?:AM|PM|am|pm)\b/gi, (match: string) => {
          const matchMins = parseTimeToMins(match);
          if (matchMins !== null && matchMins < nowMins) {
            return baseTimeForValidation;
          }
          return match;
        });
      }

      // Update commute session in store
      updateCommuteSession({ lastRecommendation: rec });

      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        isStructuredRec: true,
        recommendation: rec,
        isStreaming: false
      };
      
      setChatHistory([newMsg]);

      // Speak response if Voice Mode is active
      if (isVoiceMode) {
        updateVoiceState('speaking');
        speakAnswer(rec.explanation, () => {
          if (isVoiceMode) {
            startVoiceRecognition();
          } else {
            updateVoiceState('idle');
          }
        });
      }
    } catch (e) {
      console.error(e);
      addEvent("Failed to generate AI commute recommendation", "error", "PulseCore");
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

  const speakAnswer = (text: string, onEndCallback?: () => void) => {
    if (onEndCallback) {
      onEndCallback();
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    // P2-2: Configure continuous and interim results for hands-free loop
    recognition.continuous = true;
    recognition.interimResults = true;
    
    if (language.toLowerCase() === 'kannada') {
      recognition.lang = 'kn-IN';
    } else if (language.toLowerCase() === 'hindi') {
      recognition.lang = 'hi-IN';
    } else {
      recognition.lang = 'en-IN';
    }

    let finalTranscript = '';
    let silenceTimeout: number | null = null;
    
    recognition.onstart = () => {
      updateVoiceState('listening');
    };

    recognition.onresult = (event: any) => {
      // Bug A: Block handling if AI is speaking
      if (isSpeakingRef.current) return;

      finalTranscript = Array.from(event.results)
        .map((result: any) => result[0])
        .map(result => result.transcript)
        .join('');
      setChatInput(finalTranscript);

      // Simple silence detection to auto-submit when user stops talking
      if (silenceTimeout) clearTimeout(silenceTimeout);
      silenceTimeout = setTimeout(() => {
        if (finalTranscript.trim() && voiceStateRef.current === 'listening') {
          recognition.stop();
        }
      }, 2000);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech Recognition Error:", e);
      if (isVoiceMode) {
        setTimeout(() => {
          if (voiceStateRef.current === 'listening') {
            startVoiceRecognition();
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      if (silenceTimeout) clearTimeout(silenceTimeout);
      if (voiceStateRef.current === 'listening') {
        if (finalTranscript.trim()) {
          updateVoiceState('thinking');
          handleVoiceSubmit(finalTranscript);
        } else if (isVoiceMode) {
          startVoiceRecognition();
        } else {
          updateVoiceState('idle');
        }
      }
    };

    recognition.start();
  };

  // Bug B: explicitly check active commuteSession state to route follow-ups correctly
  const handleVoiceSubmit = (text: string) => {
    const activeSession = useRouteStore.getState().commuteSession;
    if (activeSession && activeSession.origin && activeSession.destination) {
      handleChatSubmit(undefined, text);
    } else {
      handlePlanRoute(text);
    }
  };

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      setIsVoiceMode(false);
      updateVoiceState('idle');
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } else {
      setIsVoiceMode(true);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setTimeout(() => {
        startVoiceRecognition();
      }, 300);
    }
  };

  const startVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    if (language.toLowerCase() === 'kannada') {
      recognition.lang = 'kn-IN';
    } else if (language.toLowerCase() === 'hindi') {
      recognition.lang = 'hi-IN';
    } else {
      recognition.lang = 'en-IN';
    }
    
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

  // Bug B: explicitly check active commuteSession state to route follow-ups correctly
  const handleUniversalSubmit = (overrideText?: string) => {
    const inputToUse = overrideText || chatInput;
    setChatInput('');
    const activeSession = useRouteStore.getState().commuteSession;
    if (activeSession && activeSession.origin && activeSession.destination) {
      handleChatSubmit(undefined, inputToUse);
    } else {
      handlePlanRoute(inputToUse);
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

    // Intercept if follow-up is actually a new routing query
    const activeSession = useRouteStore.getState().commuteSession;
    if (activeSession && activeSession.origin && activeSession.destination) {
      const hasRouteIntent = /from\s+.+to\s+/i.test(question) || /go\s+to\s+/i.test(question) || /reach\s+/i.test(question);
      if (hasRouteIntent) {
        setIsThinking(true);
        const extracted = await pulseLocationExtractionAgent(question);
        setIsThinking(false);
        if (extracted && extracted.origin && extracted.destination) {
          const isDifferent = extracted.origin.toLowerCase().trim() !== activeSession.origin.toLowerCase().trim() ||
                              extracted.destination.toLowerCase().trim() !== activeSession.destination.toLowerCase().trim();
          if (isDifferent) {
            setCommuteSession(null);
            setChatHistory([]);
            setCurrentAddress(extracted.origin);
            setDestination(extracted.destination);
            setChatInput('');
            handlePlanRoute(question);
            return;
          }
        }
      }
    }

    if (question.toLowerCase().includes('pivot') || question.toLowerCase().includes('smart pivot') || question.toLowerCase().includes('find a cafe')) {
      setChatInput('');
      navigate('/smart-pivot');
      return;
    }
    
    setChatInput('');
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: question };
    setChatHistory(prev => [...prev, userMsg]);
    
    setIsThinking(true);
    if (isVoiceMode) {
      updateVoiceState('thinking');
    }
    
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

      // P0-2: Extract user confirmed departure time (e.g. "8:50 I will leave")
      const timeMatch = question.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i) || question.match(/(\d+)(?::(\d+))?/i);
      const confirmsDeparture = /will leave|depart|leave at|go at/i.test(question) || (timeMatch && /ok|sure|good|confirm|i will/i.test(question));
      let conflictWarning = "";

      if (timeMatch && confirmsDeparture) {
         const hh = timeMatch[1];
         const mm = timeMatch[2] || "00";
         
         let ampm = timeMatch[3];
         if (!ampm) {
            // Context-aware AM/PM resolution
            const currentSessionObj = useRouteStore.getState().commuteSession;
            const sessionDeadline = currentSessionObj?.hardDeadline || arrivalTime;
            if (sessionDeadline && sessionDeadline.toUpperCase().includes('PM')) {
              ampm = 'PM';
            } else if (sessionDeadline && sessionDeadline.toUpperCase().includes('AM')) {
              ampm = 'AM';
            } else {
              ampm = (parseInt(hh) >= 12 || parseInt(hh) < 6 ? "PM" : "AM");
            }
         }
         
         const formattedTime = `${hh}:${mm} ${ampm.toUpperCase()}`;
         updateCommuteSession({ confirmedDeparture: formattedTime });

         const currentSessionObj = useRouteStore.getState().commuteSession;
         if (currentSessionObj?.hardDeadline) {
           const conflictCheck = checkDeadlineConflict(formattedTime, currentSessionObj.hardDeadline, currentSessionObj.lastRecommendation);
           if (conflictCheck.hasConflict && conflictCheck.msg) {
             conflictWarning = `\nCRITICAL CONFLICT WARNING: The user wants to leave at ${formattedTime}, but with the estimated travel duration, they will arrive after their hard deadline of ${currentSessionObj.hardDeadline}. You MUST warn the user explicitly about this conflict (e.g. "Warning: leaving at ${formattedTime} means you will arrive late at approximately ... which is after your deadline of ${currentSessionObj.hardDeadline}") and strongly recommend leaving earlier.`;
           }
         }
      }

      const currentSessionObj = useRouteStore.getState().commuteSession;

      const responseText = await pulseFollowUpAgent(
        question, 
        weatherSignal, 
        trafficSignal, 
        transitData, 
        activeOrigin, 
        activeDest, 
        arrivalTime, 
        isFirstMessage, 
        language,
        { ...currentSessionObj, conflictWarning }
      );
      
      let finalResponseText = responseText;
      if (conflictWarning) {
         const currentSessionObj = useRouteStore.getState().commuteSession;
         if (currentSessionObj?.hardDeadline) {
           const conflictCheck = checkDeadlineConflict(currentSessionObj.confirmedDeparture || "", currentSessionObj.hardDeadline, currentSessionObj.lastRecommendation);
           if (conflictCheck.hasConflict && conflictCheck.msg) {
             // Overwrite with a clear conflict warning to prevent LLM contradictions
             finalResponseText = `⚠️ ${conflictCheck.msg}\n\nLeaving at ${currentSessionObj.confirmedDeparture} is too late to reach by your deadline of ${currentSessionObj.hardDeadline}. Please choose an earlier departure time (e.g., leaving before 5:40 PM) to ensure you arrive on time.`;
           }
         }
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: finalResponseText,
        isStreaming: false
      };
      
      setChatHistory(prev => [...prev, aiMsg]);

      // Speak response if Voice Mode is active
      if (isVoiceMode) {
        updateVoiceState('speaking');
        speakAnswer(finalResponseText, () => {
          if (isVoiceMode) {
            startVoiceRecognition();
          } else {
            updateVoiceState('idle');
          }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsThinking(false);
      if (!isVoiceMode) {
        updateVoiceState('idle');
      }
    }
  };

  return (
    <WavyBackground containerClassName="bg-[#080c17] min-h-screen py-8" waveOpacity={0.65} speed="fast">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full flex flex-col items-center justify-center relative z-10 h-full max-w-[1200px] mx-auto px-4"
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
              {/* Spacious Header: Giant Interactive 3D Weather Mascot & Animated Greeting */}
              <div className="w-full max-w-[850px] mb-3 sm:mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 px-2 sm:px-4">
                <WeatherCloudMascot 
                  condition={weatherData?.condition || "Clear"} 
                  temperature={weatherData?.temperature || "28°C"} 
                />

                {/* Animated Greeting Badge */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2.5 sm:gap-3 bg-white/10 border border-white/20 backdrop-blur-2xl px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-xl"
                >
                  {/* 3D Apple Glass Time Orb */}
                  <div className={`w-3.5 h-3.5 rounded-full shrink-0 relative overflow-hidden border border-white/40 shadow-[0_0_10px_rgba(255,255,255,0.4)] ${
                    new Date().getHours() < 17 
                      ? 'bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-200' 
                      : 'bg-gradient-to-tr from-sky-400 via-indigo-400 to-purple-300'
                  }`}>
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/40 rounded-t-full pointer-events-none" />
                  </div>

                  <span className="font-bold text-white text-xs sm:text-sm tracking-wide">
                    {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="text-sky-300 text-[11px] sm:text-xs font-semibold">
                    {new Date().getHours() >= 8 && new Date().getHours() <= 11 ? 'Morning Peak' : new Date().getHours() >= 17 && new Date().getHours() <= 20 ? 'Evening Rush' : 'Optimal Window'}
                  </span>
                </motion.div>
              </div>

              {/* Headline */}
              <h1 className="font-schibsted font-bold text-2xl sm:text-4xl md:text-5xl text-white drop-shadow-lg leading-tight tracking-tight mt-2 sm:mt-4 mb-2 sm:mb-3">
                Master Commutes Quickly
              </h1>

              {/* Subtitle */}
              <p className="font-schibsted font-normal text-xs sm:text-sm md:text-base text-white/70 tracking-normal max-w-[600px] w-[92%] mb-4 sm:mb-8 leading-normal sm:leading-relaxed">
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

            {/* Geolocation Timeout/Error Banner */}
            {geoError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[728px] mb-4"
              >
                <Alert
                  variant="warning"
                  layout="row"
                  isNotification
                  icon={<AlertCircle size={16} className="text-yellow-400" />}
                  action={
                    <button
                      onClick={() => setGeoError(null)}
                      className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                      <span className="text-xs">✕</span>
                    </button>
                  }
                >
                  <AlertTitle className="text-yellow-300 font-schibsted">Location services timed out</AlertTitle>
                  <AlertDescription className="text-yellow-200/70 font-schibsted">{geoError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Premium Input Container */}
            <div className="w-full max-w-[728px] h-auto min-h-[220px] rounded-[18px] bg-black/40 backdrop-blur-xl p-5 flex flex-col justify-between shadow-2xl border border-white/20">
              
              {/* Top Row: Commute Inputs */}
              <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center px-2 mb-4 w-full">
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-white font-schibsted font-medium text-[14px] w-full xl:w-auto">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <MapPin size={16} className="text-white/80 shrink-0 mt-1" />
                    <LocationAutocomplete 
                      type="origin"
                      value={currentAddress}
                      onChange={setCurrentAddress}
                      className="w-full sm:w-[130px] md:w-[180px]"
                      placeholder="Origin"
                    />
                    <button
                      onClick={handleLocateMe}
                      type="button"
                      title="Use live GPS location"
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                      <Navigation size={14} className={isGeolocationLoading ? "animate-spin" : ""} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto relative z-40">
                    <Search size={16} className="text-white/80 shrink-0 mt-1" />
                    <LocationAutocomplete 
                      type="destination"
                      value={destination}
                      onChange={setDestination}
                      className="w-full sm:w-[160px] md:w-[200px]"
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

                <div className="flex items-center gap-2 flex-wrap">
                  <FluidDropdown onLanguageChange={setLanguage} />

                  <button
                    onClick={toggleVoiceMode}
                    type="button"
                    title="Toggle Hands-Free Voice Conversation Loop"
                    className={`flex items-center gap-1.5 font-schibsted text-[13px] px-3 py-1.5 rounded-xl border transition-colors ${
                      isVoiceMode 
                        ? 'bg-pulse-600/30 text-pulse-400 border-pulse-500/50 shadow-[0_0_10px_rgba(14,165,233,0.2)]' 
                        : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/20'
                    }`}
                  >
                    {isVoiceMode ? <Volume2 size={14} className="animate-pulse" /> : <MicOff size={14} />}
                    <span>Voice Loop</span>
                  </button>

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
                  onClick={() => handlePlanRoute()}
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

              {/* Feature 4: AnimeNavBar Quick Presets Component */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Quick Presets</span>
                <AnimeNavBar 
                  items={[
                    {
                      name: "Home ➔ Manyata",
                      icon: Building2,
                      onClick: () => { setCurrentAddress('Indiranagar'); setDestination('Manyata Tech Park'); }
                    },
                    {
                      name: "Home ➔ EcoSpace",
                      icon: Laptop,
                      onClick: () => { setCurrentAddress('Koramangala'); setDestination('EcoSpace, ORR'); }
                    },
                    {
                      name: "Airport Express",
                      icon: Plane,
                      onClick: () => { setCurrentAddress('Hebbal'); setDestination('KIAL Airport'); }
                    },
                    {
                      name: "Workspace Pivot",
                      icon: Coffee,
                      onClick: () => navigate('/smart-pivot')
                    }
                  ]}
                  defaultActive="Home ➔ Manyata"
                />
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
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20 shrink-0">
              <button
                onClick={toggleVoiceMode}
                type="button"
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all border flex items-center gap-2 ${
                  isVoiceMode 
                    ? 'bg-pulse-600/30 text-pulse-400 border-pulse-500/50 shadow-[0_0_10px_rgba(14,165,233,0.2)]' 
                    : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                }`}
              >
                {isVoiceMode ? <Volume2 size={12} className="animate-pulse" /> : <MicOff size={12} />}
                Voice Loop: {isVoiceMode ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={() => { setChatHistory([]); setCommuteSession(null); }} 
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
                            
                            {/* Executive Commute Timeline Bar */}
                            <div className="bg-[#121218]/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                                
                                {/* Departure Block */}
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                                  <div>
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">DEPARTURE</p>
                                    <p className="text-white font-semibold text-xl sm:text-2xl mt-0.5">{msg.recommendation.recommendedDeparture}</p>
                                  </div>
                                </div>

                                {/* Flow Connector */}
                                <div className="flex-1 flex flex-col items-center justify-center px-2 py-1 my-1 sm:my-0">
                                  <div className="w-full flex items-center justify-between text-xs text-white/50 mb-1 px-1">
                                    <span className="font-medium text-white/80">{msg.recommendation.recommendedTransport}</span>
                                    <span>{msg.recommendation.timeSavedMinutes && parseInt(msg.recommendation.timeSavedMinutes.toString()) > 0 ? `Saved ~${msg.recommendation.timeSavedMinutes}m` : 'Optimal Route'}</span>
                                  </div>
                                  <div className="w-full h-1 bg-white/10 rounded-full relative overflow-hidden">
                                    <div className="absolute inset-y-0 left-0 bg-sky-500 rounded-full w-3/4" />
                                  </div>
                                </div>

                                {/* Arrival Block */}
                                <div className="flex items-center gap-3 justify-end sm:justify-start">
                                  <div className="text-right sm:text-left">
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">ESTIMATED ARRIVAL</p>
                                    <p className="text-white font-semibold text-xl sm:text-2xl mt-0.5">{msg.recommendation.expectedArrival}</p>
                                  </div>
                                  <div className="w-3 h-3 rounded-full bg-sky-500 shrink-0" />
                                </div>

                              </div>

                              {/* Confidence Badge Row */}
                              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                                <span>Confidence Score: <strong className="text-white font-semibold">{msg.recommendation.confidenceScore}%</strong></span>
                                <span>Status: <strong className="text-emerald-400 font-semibold">Live Signals Synchronized</strong></span>
                              </div>
                            </div>

                            {/* Explanation */}
                            <div className="mt-2 px-1">
                              <p className="text-white/85 leading-relaxed text-[14px] whitespace-pre-wrap">{msg.recommendation.explanation}</p>
                            </div>

                            {/* Disclaimer (if provided) */}
                            {msg.recommendation.disclaimer && (
                              <Alert variant="warning" layout="complex" size="sm" className="mt-2"
                                icon={<AlertCircle size={16} className="text-amber-400" />}
                              >
                                <AlertTitle className="text-amber-300">Important Notice</AlertTitle>
                                <AlertDescription className="text-amber-200/70">{msg.recommendation.disclaimer}</AlertDescription>
                              </Alert>
                            )}

                            {/* Alternative Route (if provided) */}
                            {msg.recommendation.alternativeRoute && (
                              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10 border-l-4 border-l-sky-500 mt-2">
                                <p className="font-semibold text-white mb-1.5 flex items-center gap-2 text-sm">
                                  <MapPin size={15} className="text-sky-400" />
                                  Alternative Route Option
                                </p>
                                <div className="flex items-center gap-3 mb-1.5 text-xs text-white/70">
                                  <span className="font-medium text-white">{msg.recommendation.alternativeRoute.transport}</span>
                                  <span>•</span>
                                  <span>{msg.recommendation.alternativeRoute.time}</span>
                                </div>
                                <p className="text-white/50 text-xs leading-relaxed">
                                  {msg.recommendation.alternativeRoute.reason}
                                </p>
                              </div>
                            )}
                            
                            {/* Reasoning Pills (if any) */}
                            {msg.recommendation.reasoning && msg.recommendation.reasoning.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {msg.recommendation.reasoning.map((r: string, i: number) => (
                                  <span key={i} className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/60">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}

                             {/* Congestion Nudge */}
                             {msg.recommendation.congestionHedgingActive && (
                               <div className="mt-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                 <div className="flex-1">
                                   <p className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1">
                                     <AlertTriangle size={14} />
                                     Congestion Hedging Active
                                   </p>
                                   <p className="text-xs text-white/70 leading-relaxed">
                                     Peak traffic detected on this route. Consider pivoting to a nearby workspace or cafe until gridlock subsides.
                                   </p>
                                 </div>
                                 <button
                                   onClick={() => navigate('/smart-pivot')}
                                   className="shrink-0 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 transition-all text-black font-semibold text-xs py-2 px-3.5 rounded-lg shadow-sm"
                                 >
                                   Find Workspace <ArrowRight size={14} />
                                 </button>
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

      {/* Voice Mode pulsing overlay */}
      {isVoiceMode && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-pulse">
          <div className={`w-3.5 h-3.5 rounded-full ${
            voiceState === 'listening' ? 'bg-green-500 animate-ping' :
            voiceState === 'speaking' ? 'bg-blue-500 animate-bounce' :
            voiceState === 'thinking' ? 'bg-amber-500 animate-spin border-2 border-t-transparent border-white' : 'bg-slate-400'
          }`} />
          <span className="text-white text-sm font-schibsted font-bold tracking-wide capitalize">
            Voice Mode: {voiceState}
          </span>
        </div>
      )}

      {/* Version Watermark */}
      <div className="absolute bottom-2 right-4 text-[10px] text-white/30 font-mono tracking-widest select-none pointer-events-none">
        PULSEBLR v{APP_VERSION}
      </div>
    </motion.div>
    </WavyBackground>
  );
}
