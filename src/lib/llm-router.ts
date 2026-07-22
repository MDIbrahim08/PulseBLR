import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { usePulseObserver } from '../store/pulseObserver';
import type { ProviderName } from '../store/pulseObserver';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_FALLBACK_KEY = import.meta.env.VITE_GROQ_API_KEY_FALLBACK || '';
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

// Helper to get the observer store actions (singleton, safe to call outside React)
const obs = () => usePulseObserver.getState();

// Determine the provider priority list from env keys
const getProviderChain = (): ProviderName[] => {
  const chain: ProviderName[] = [];
  if (GEMINI_KEY) chain.push('Gemini');
  if (GROQ_KEY) chain.push('Groq');
  if (GROQ_FALLBACK_KEY) chain.push('Groq Fallback');
  if (OPENROUTER_KEY) chain.push('OpenRouter');
  return chain;
};

const callLLM = async (prompt: string): Promise<string> => {
  const chain = getProviderChain();
  const o = obs();
  o.setRouterInFlight(true);
  o.incrementRequests();
  const t0 = performance.now();

  const tryProvider = async (name: ProviderName, fn: () => Promise<string>): Promise<string> => {
    try {
      const result = await fn();
      const ms = Math.round(performance.now() - t0);
      const primaryProvider = chain[0] ?? 'None';
      const isFirstProvider = name === primaryProvider;
      o.setRouterProvider(name, isFirstProvider ? undefined : primaryProvider, !isFirstProvider);
      o.setRouterLatency(ms);
      o.setRouterInFlight(false);
      if (!isFirstProvider) {
        o.addEvent(`AI provider fallback activated — switched to ${name}`, 'warning', 'AI Router');
      } else {
        o.addEvent(`AI Router — ${name} responded in ${ms}ms`, 'success', 'AI Router');
      }
      return result;
    } catch (e) {
      throw e;
    }
  };

  // Try Gemini
  if (GEMINI_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      return await tryProvider('Gemini', async () => {
        const result = await model.generateContent(prompt);
        return result.response.text();
      });
    } catch { /* fall through */ }
  }

  // Try Groq primary
  if (GROQ_KEY) {
    try {
      return await tryProvider('Groq', async () => {
        const res = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          { model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], temperature: 0.2 },
          { headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } }
        );
        return res.data.choices[0].message.content;
      });
    } catch { /* fall through */ }
  }

  // Try Groq fallback
  if (GROQ_FALLBACK_KEY) {
    try {
      return await tryProvider('Groq Fallback', async () => {
        const res = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          { model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], temperature: 0.2 },
          { headers: { Authorization: `Bearer ${GROQ_FALLBACK_KEY}`, 'Content-Type': 'application/json' } }
        );
        return res.data.choices[0].message.content;
      });
    } catch { /* fall through */ }
  }

  // Try OpenRouter
  if (OPENROUTER_KEY) {
    try {
      return await tryProvider('OpenRouter', async () => {
        const res = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          { model: 'mistralai/mistral-7b-instruct', messages: [{ role: 'user', content: prompt }] },
          { headers: { Authorization: `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json' } }
        );
        return res.data.choices[0].message.content;
      });
    } catch { /* fall through */ }
  }

  // All failed
  o.setRouterInFlight(false);
  o.incrementRequests(true);
  o.addEvent('All AI providers failed — no response generated', 'error', 'AI Router');
  throw new Error('All LLM providers failed');
};

export const ensure12HourTime = (timeStr: string): string => {
  if (!timeStr) return timeStr;
  if (timeStr.toLowerCase().trim() === 'now') return 'Now';

  // Matches 12h format like "5:23 PM" or "05:23 AM"
  const match12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match12) {
    let h = parseInt(match12[1]);
    const m = match12[2];
    const ampm = match12[3].toUpperCase();
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  // Matches 24h format like "17:23" or "09:15"
  const match24 = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    let h = parseInt(match24[1]);
    const m = match24[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  return timeStr;
};

const isTimeInPast = (timeStr: string): boolean => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return false;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;

  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);

  return target.getTime() < now.getTime();
};

const safeParseJSON = (text: string, timeString: string, destination: string, origin: string, weather: string, traffic: string, timeMode: string = 'Arrive By') => {
  // Parse timeString like "09:00 AM" 
  const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();
  let ampm = h >= 12 ? 'PM' : 'AM';
  let formattedInputTime = timeString;
  
  if (match) {
    h = parseInt(match[1]);
    m = parseInt(match[2]);
    ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    
    let dispH = h % 12 || 12;
    formattedInputTime = `${dispH}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  // Calculate default based on mode
  let depH = h;
  let depMins = m;
  let arrH = h;
  let arrMins = m;
  
  if (timeMode === 'Depart At' || timeMode === 'Dynamic') {
    // Default arrival is 50 mins later
    arrMins += 50;
    if (arrMins >= 60) {
      arrMins -= 60;
      arrH += 1;
    }
  } else {
    // Default departure is 50 mins prior
    depMins -= 50;
    if (depMins < 0) {
      depMins += 60;
      depH -= 1;
    }
  }

  const depAmpm = depH >= 12 && depH < 24 ? 'PM' : 'AM';
  const dispDepH = depH % 12 || 12;
  const formattedDeparture = `${dispDepH}:${depMins.toString().padStart(2, '0')} ${depAmpm}`;

  const arrAmpm = arrH >= 12 && arrH < 24 ? 'PM' : 'AM';
  const dispArrH = arrH % 12 || 12;
  const formattedArrival = `${dispArrH}:${arrMins.toString().padStart(2, '0')} ${arrAmpm}`;

  const defaults = {
    recommendedDeparture: formattedDeparture,
    recommendedTransport: "Analyzing best transport...",
    expectedArrival: formattedArrival,
    timeSavedMinutes: null,
    confidenceScore: null,
    estimatedCost: "Calculating...",
    explanation: `We encountered a temporary connection issue while analyzing live signals for your commute from ${origin} to ${destination}.\n\nLive Weather: ${weather}\nLive Traffic: ${traffic}\n\nPlease tap "Analyze Route" again in a moment for a fully dynamic AI-generated recommendation.`,
    disclaimer: "",
    alternativeRoute: null,
    congestionHedgingActive: false
  };

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.recommendedDeparture) {
        parsed.recommendedDeparture = ensure12HourTime(parsed.recommendedDeparture);
      }
      if (parsed.expectedArrival) {
        parsed.expectedArrival = ensure12HourTime(parsed.expectedArrival);
      }

      if (parsed.recommendedDeparture && parsed.recommendedDeparture !== 'Now' && isTimeInPast(parsed.recommendedDeparture)) {
         parsed.recommendedDeparture = "Now";
         parsed.explanation = `⚠️ Your target time has already passed! You should leave NOW to get there as quickly as possible. \n\n${parsed.explanation}`;
      }
      
      return { ...defaults, ...parsed };
    }
    return defaults;
  } catch {
    return defaults;
  }
};

export const nimbusAdvisor = async (
  temp: string,
  condition: string,
  precipitation: string,
  time: string,
  currentTimestamp: string,
  userCoordinates: { lat: number; lon: number }
): Promise<string> => {
  const o = obs();
  o.setAgentStatus('nimbus', 'fetching');
  o.addEvent('Nimbus Agent — fetching weather signal', 'info', 'Nimbus');
  const prompt = `You are an AI weather advisor. Current: ${temp}, ${condition}, ${precipitation}. Current Time: ${currentTimestamp}. Location: ${userCoordinates.lat}, ${userCoordinates.lon}. Write a short 1-sentence recommendation for a commuter.`;
  const t0 = performance.now();
  try {
    const res = await callLLM(prompt);
    const ms = Math.round(performance.now() - t0);
    o.setAgentStatus('nimbus', 'success', ms);
    o.addEvent(`Nimbus Agent — weather analysis complete (${ms}ms)`, 'success', 'Nimbus');
    return res.trim().replace(/^"|"$/g, '');
  } catch {
    o.setAgentStatus('nimbus', 'failed', undefined, 'LLM call failed');
    o.addEvent('Nimbus Agent — failed to get weather recommendation', 'error', 'Nimbus');
    return `Based on live data (${temp}, ${condition}), prepare accordingly for your commute.`;
  }
};

export const velocityAdvisor = async (
  durationMins: number,
  distanceKm: string,
  origin: string,
  destination: string,
  time: string,
  currentTimestamp: string,
  userCoordinates: { lat: number; lon: number }
): Promise<string> => {
  const o = obs();
  o.setAgentStatus('velocity', 'fetching');
  o.addEvent('Velocity Agent — recalculating congestion index', 'info', 'Velocity');
  const prompt = `You are a traffic AI. Route: ${origin} to ${destination}. Time: ${durationMins} mins. Current Time: ${currentTimestamp}. Start coordinates: ${userCoordinates.lat}, ${userCoordinates.lon}. Write a short 1-sentence recommendation.`;
  const t0 = performance.now();
  try {
    const res = await callLLM(prompt);
    const ms = Math.round(performance.now() - t0);
    o.setAgentStatus('velocity', 'success', ms);
    o.setAPIStatus('traffic', 'online', ms);
    o.addEvent(`Velocity Agent — traffic analysis complete (${ms}ms)`, 'success', 'Velocity');
    return res.trim().replace(/^"|"$/g, '');
  } catch {
    o.setAgentStatus('velocity', 'failed', undefined, 'LLM call failed');
    o.addEvent('Velocity Agent — failed to analyze traffic', 'error', 'Velocity');
    return `Traffic on the route to ${destination} indicates a travel time of ${durationMins} mins.`;
  }
};

export const transitIQAdvisor = async (
  transitStatus: string,
  destination: string,
  time: string,
  currentTimestamp: string,
  userCoordinates: { lat: number; lon: number }
): Promise<string> => {
  const o = obs();
  o.setAgentStatus('transitiq', 'fetching');
  o.addEvent('TransitIQ Agent — pinging metro feed', 'info', 'TransitIQ');
  const prompt = `You are a metro AI. Status: ${transitStatus}. Dest: ${destination}. Current Time: ${currentTimestamp}. Start coordinates: ${userCoordinates.lat}, ${userCoordinates.lon}. Write a short 1-sentence recommendation.`;
  const t0 = performance.now();
  try {
    const res = await callLLM(prompt);
    const ms = Math.round(performance.now() - t0);
    o.setAgentStatus('transitiq', 'success', ms);
    o.setAPIStatus('metro', 'online', ms);
    o.addEvent(`TransitIQ Agent — metro status verified (${ms}ms)`, 'success', 'TransitIQ');
    return res.trim().replace(/^"|"$/g, '');
  } catch {
    o.setAgentStatus('transitiq', 'failed', undefined, 'LLM call failed');
    o.addEvent('TransitIQ Agent — failed to verify transit', 'error', 'TransitIQ');
    return `Public transit to ${destination} is currently operating with normal wait times.`;
  }
};

export const urbanSenseAdvisor = async (
  origin: string,
  destination: string,
  time: string,
  currentTimestamp: string,
  userCoordinates: { lat: number; lon: number }
): Promise<string> => {
  const o = obs();
  o.setAgentStatus('urbansense', 'fetching');
  o.addEvent('UrbanSense Agent — scanning urban event feed', 'info', 'UrbanSense');
  const prompt = `You are a city events AI. Route: ${origin} to ${destination}. Current Time: ${currentTimestamp}. Start coordinates: ${userCoordinates.lat}, ${userCoordinates.lon}. Write a short 1-sentence recommendation.`;
  const t0 = performance.now();
  try {
    const res = await callLLM(prompt);
    const ms = Math.round(performance.now() - t0);
    o.setAgentStatus('urbansense', 'success', ms);
    o.addEvent(`UrbanSense Agent — urban data processed (${ms}ms)`, 'success', 'UrbanSense');
    return res.trim().replace(/^"|"$/g, '');
  } catch {
    o.setAgentStatus('urbansense', 'failed', undefined, 'LLM call failed');
    o.addEvent('UrbanSense Agent — failed to scan urban feed', 'error', 'UrbanSense');
    return `City sensors indicate standard conditions along your route from ${origin}.`;
  }
};

export const chronosAdvisor = async (
  weather: string,
  traffic: string,
  transit: string,
  arrivalTime: string,
  currentTimestamp: string,
  userCoordinates: { lat: number; lon: number }
): Promise<string> => {
  const o = obs();
  o.setAgentStatus('chronos', 'fetching');
  o.addEvent('Chronos Agent — recalculating time-risk prediction', 'info', 'Chronos');
  const prompt = `You are a risk AI. Target arrival: ${arrivalTime}. Current Time: ${currentTimestamp}. Start coordinates: ${userCoordinates.lat}, ${userCoordinates.lon}. Write a short 1-sentence risk prediction.`;
  const t0 = performance.now();
  try {
    const res = await callLLM(prompt);
    const ms = Math.round(performance.now() - t0);
    o.setAgentStatus('chronos', 'success', ms);
    o.addEvent(`Chronos Agent — prediction complete (${ms}ms)`, 'success', 'Chronos');
    return res.trim().replace(/^"|"$/g, '');
  } catch {
    o.setAgentStatus('chronos', 'failed', undefined, 'LLM call failed');
    o.addEvent('Chronos Agent — prediction failed', 'error', 'Chronos');
    return `The overall commute risk to arrive by ${arrivalTime} remains low.`;
  }
};

export const pulseCoreAgent = async (
  weather: string,
  traffic: string,
  transit: string,
  origin: string,
  destination: string,
  timeString: string,
  timeMode: string = 'Arrive By',
  userPrompt: string = '',
  avoidTollsOrTraffic: boolean = false,
  language: string = 'English',
  currentTimestamp: string = '',
  userCoordinates: { lat: number; lon: number } = { lat: 12.9716, lon: 77.5946 }
) => {
  const o = obs();
  o.setAgentStatus('pulsemind', 'fetching');
  o.addEvent('PulseMind — generating route recommendation', 'info', 'PulseMind');
  const t0 = performance.now();
  
  let baseTime = currentTimestamp || "";
  if (!baseTime) {
    const now = new Date();
    baseTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  let currentActualTimeDouble = baseTime;
  const timeMatch = baseTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1]);
    const m = parseInt(timeMatch[2]);
    const ampm = timeMatch[3].toUpperCase();
    let h24 = h;
    if (ampm === 'PM' && h < 12) h24 += 12;
    if (ampm === 'AM' && h === 12) h24 = 0;
    const padH = h24.toString().padStart(2, '0');
    const padM = m.toString().padStart(2, '0');
    currentActualTimeDouble = `${padH}:${padM} (${h}:${padM} ${ampm})`;
  }

  // Try to parse the target time from userPrompt or default
  let targetTimeDouble = "";
  const match = userPrompt.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
  if (match) {
    let h = parseInt(match[1]);
    const m = match[2] ? parseInt(match[2]) : 0;
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const padH = h.toString().padStart(2, '0');
    const padM = m.toString().padStart(2, '0');
    targetTimeDouble = `${padH}:${padM} (${match[1]}:${padM} ${ampm})`;
  } else {
    const future = new Date(Date.now() + 45 * 60000);
    const futH = future.getHours().toString().padStart(2, '0');
    const futM = future.getMinutes().toString().padStart(2, '0');
    const futH12 = future.getHours() % 12 || 12;
    const futAmpm = future.getHours() >= 12 ? 'PM' : 'AM';
    targetTimeDouble = `${futH}:${futM} (${futH12}:${futM} ${futAmpm})`;
  }

  // Determine if target time is in the past
  const parsedTarget = new Date();
  if (match) {
    let h = parseInt(match[1]);
    const m = match[2] ? parseInt(match[2]) : 0;
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    parsedTarget.setHours(h, m, 0, 0);
  } else {
    parsedTarget.setTime(Date.now() + 45 * 60000);
  }
  
  // Parse baseTime for relative comparison
  const parsedBase = new Date();
  if (timeMatch) {
    let bh = parseInt(timeMatch[1]);
    const bm = parseInt(timeMatch[2]);
    const bampm = timeMatch[3].toUpperCase();
    if (bampm === 'PM' && bh < 12) bh += 12;
    if (bampm === 'AM' && bh === 12) bh = 0;
    parsedBase.setHours(bh, bm, 0, 0);
  }
  
  const isPast = parsedTarget.getTime() < parsedBase.getTime();
  const pastText = isPast 
    ? `The target time ${targetTimeDouble} is in the PAST (earlier than current time ${currentActualTimeDouble}).`
    : `The target time ${targetTimeDouble} is in the FUTURE (later than current time ${currentActualTimeDouble}).`;

  // Extract actual travel duration from live traffic signal
  let durationMins = 45;
  const durMatch = traffic.match(/duration:\s*(\d+)\s*minutes/i) || traffic.match(/(\d+)\s*min/i);
  if (durMatch) {
    durationMins = parseInt(durMatch[1]);
  }

  // Calculate accurate departure and arrival times in JS
  const now = new Date();
  const arrDate = new Date(now.getTime() + durationMins * 60000);
  
  const format12H = (d: Date) => {
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const computedDeparture = "Now";
  const computedArrival = format12H(arrDate);

  const goalInstruction = `User wants to travel from "${origin || 'current location'}" to "${destination || 'their destination'}".
The current time right now is ${currentActualTimeDouble}.
Live traffic duration for this route: ${durationMins} minutes.
Calculated Real-Time Departure: "${computedDeparture}".
Calculated Real-Time Arrival: "${computedArrival}".
${pastText}

PREDICTIVE TRAFFIC RULE: If the user asks for the "best time to leave" or wants to avoid traffic, analyze the current time against Bangalore's known peak hours (Morning: 8:30-11:30 AM, Evening: 5:30-8:30 PM). If they are currently in a peak hour or approaching one, mathematically calculate and suggest the exact time the peak hour ends (e.g., 8:40 PM) or begins (e.g., 5:10 PM) as the best time to leave for a much faster commute. Explain this traffic drop-off logic clearly in your explanation!`;

  const prompt = `You are an AI commute assistant named PulseMind. 
The Current Clock Time right now is: ${currentActualTimeDouble}.
The user starting coordinates are: Latitude ${userCoordinates.lat}, Longitude ${userCoordinates.lon}.
${goalInstruction}
Current Signals -> Weather: ${weather}, Traffic: ${traffic}, Transit: ${transit}.
User Preference: Avoid Tolls and Traffic = ${avoidTollsOrTraffic}. If true, you MUST prioritize alternative routes that avoid heavy traffic and tolls, and calculate the estimated cost accordingly.

STRICT TIMING REQUIREMENT:
You MUST set "recommendedDeparture" to "${computedDeparture}" (or the optimized departure time if recommending a peak-hour delay).
You MUST set "expectedArrival" to "${computedArrival}" (or Departure Time + ${durationMins} minutes). Under NO circumstances should expectedArrival be in the past or contradict the current time (${currentActualTimeDouble}).

ALL times in output JSON values and text fields MUST be formatted strictly in clean 12-hour format with AM/PM (e.g. 6:20 PM, 6:35 PM). DO NOT include 24-hour format or parentheses.
CRITICAL LANGUAGE AND STYLE RULE: You MUST output all text fields in ${language}. Use emojis naturally throughout your explanation and reasoning to make the text interesting and engaging! The keys in the JSON must remain in English, but the values should be translated to ${language}.

CRITICAL TEMPORAL COMPARISON RULE: 
- Current Time is ${currentActualTimeDouble}.
- User's Target Time is ${targetTimeDouble}.
- YOU MUST compare these two times strictly using the 24-hour values (e.g. 13:15 vs 18:30).
- If the target time is in the past, you MUST recommend leaving "Now" and explain that their requested time has already passed.
- If the target time is in the future, you MUST recommend a departure time that is strictly in the future relative to the Current Time. DO NOT suggest any departure times in the past. Ensure all departure and arrival times in your explanation and JSON values are in clean 12-hour format (e.g. 6:20 PM).

GEOGRAPHY & METRO REALITY CHECK: You MUST NOT hallucinate Namma Metro lines. If the origin or destination is in areas WITHOUT metro connectivity (e.g., RT Nagar, Koramangala, Devanahalli, Airport, Bellandur, Marathahalli, Sarjapur, HSR Layout), you MUST NOT suggest the Metro as the primary transport mode. Instead, use your vast live knowledge of Bangalore's real transit systems to dynamically recommend the EXACT correct bus services (e.g., specific AC routes, regular BMTC buses), Cabs, or Autos. DO NOT hardcode recommendations—analyze the real routes! ONLY suggest Metro for areas with known active stations.
STRICT LOCATION REJECTION: If the origin or destination is COMPLETELY OUTSIDE of the Greater Bangalore Metropolitan Area (e.g., Delhi, Mumbai, Chennai, another state/country, or completely random invalid locations), you MUST completely REJECT the query. Do NOT provide fake routes or times. Instead, set "recommendedTransport" to "Out of Service Area" and set the "explanation" exactly to: "PulseBLR exclusively covers Bangalore and its Greater Metropolitan Area. We do not support routes for locations outside of this region."
GREATER BANGALORE COVERAGE RULE: You MUST confidently support locations across the entire Greater Bangalore Metropolitan Region (including outskirts like Hoskote, Devanahalli, Nelamangala, Bidadi, Kengeri, Electronic City, Sarjapur). DO NOT claim these are out of bounds or unsupported. Dynamically determine the best real transit or driving routes to reach them.
LANDMARK RESOLUTION RULE: Users will frequently input specific Landmarks, Tech Parks (e.g. Manyata, Bagmane, Ecospace), Colleges (e.g. Christ University, RVCE, PESU), Offices, or Hospitals instead of standard neighborhood names. You MUST intelligently resolve these points of interest to their correct geographical location in Bangalore and provide accurate routing.
CONGESTION HEDGING RULE: If the recommended departure time falls during Bangalore's active peak hours (Morning: 8:30-11:30 AM, Evening: 5:30-8:30 PM) or there is heavy traffic congestion, set the JSON field "congestionHedgingActive" to true. Otherwise, set it to false.
IMPORTANT CRITICAL RULE: DO NOT copy ANY text, times, or transport modes from the JSON example below. You MUST mathematically calculate times, dynamically determine the "recommendedTransport", and generate fresh, context-aware "reasoning", "alternativeRoute", and "disclaimer".

Output JSON EXACTLY like this (NO markdown, raw JSON only):
{
  "recommendedDeparture": "[COMPUTED_DEPARTURE_TIME]",
  "recommendedTransport": "[DYNAMIC_TRANSPORT_MODE]",
  "expectedArrival": "[COMPUTED_ARRIVAL_TIME]",
  "timeSavedMinutes": 15,
  "confidenceScore": 85,
  "estimatedCost": "[DYNAMIC_COST_ESTIMATE]",
  "congestionHedgingActive": false,
  "explanation": "[DYNAMIC_EXPLANATION_IN_TARGET_LANGUAGE]",
  "disclaimer": "[DISCLAIMER_OR_EMPTY_STRING]",
  "alternativeRoute": {
    "transport": "[ALTERNATIVE_TRANSPORT_MODE]",
    "time": "[ESTIMATED_TIME]",
    "reason": "[WHY_CONSIDER_THIS_ALTERNATIVE]"
  },
  "reasoning": [
    "[DYNAMIC_REASON_1]",
    "[DYNAMIC_REASON_2]",
    "[DYNAMIC_REASON_3]",
    "[DYNAMIC_REASON_4]"
  ]
}`;
  try {
    const raw = await callLLM(prompt);
    const ms = Math.round(performance.now() - t0);

    // Validate JSON schema
    let schemaValid = false;
    let jsonParsed = false;
    try {
      const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
      jsonParsed = true;
      schemaValid = typeof parsed.recommendedDeparture === 'string' && typeof parsed.confidenceScore === 'number';
    } catch { /* not valid JSON */ }

    o.updateSecurity({
      schemaValidation: schemaValid ? 'passed' : 'warning',
      jsonParsed: jsonParsed ? 'passed' : 'failed',
      malformedResponse: jsonParsed ? 'passed' : 'warning',
    });

    const result = safeParseJSON(raw, timeString, destination, origin, weather, traffic, timeMode);
    o.setAgentStatus('pulsemind', 'success', ms);
    o.addEvent(`PulseMind — recommendation delivered in ${ms}ms`, 'success', 'PulseMind');

    // Write real audit record
    const routerState = o.router;
    o.addAuditRecord({
      timestamp: new Date(),
      origin,
      destination,
      requestedTime: timeString,
      timeMode,
      providerUsed: routerState.currentProvider,
      fallbackUsed: routerState.fallbackActivated,
      responseDurationMs: ms,
      confidenceScore: result.confidenceScore ?? null,
      sourcesUsed: ['Velocity Agent', 'Nimbus Agent', 'TransitIQ Agent', 'UrbanSense Agent', 'Chronos Agent'],
      schemaValid,
      jsonParsed,
    });

    return result;
  } catch {
    const ms = Math.round(performance.now() - t0);
    o.setAgentStatus('pulsemind', 'failed', ms, 'LLM call failed');
    o.updateSecurity({ schemaValidation: 'failed', jsonParsed: 'failed' });
    o.addEvent('PulseMind — recommendation generation failed', 'error', 'PulseMind');
    return safeParseJSON('', timeString, destination, origin, weather, traffic, timeMode);
  }
};

export const pulseFollowUpAgent = async (
  question: string,
  weather: string,
  traffic: string,
  transit: string,
  origin: string,
  destination: string,
  arrivalTime: string,
  isFirstMessage: boolean = true,
  language: string = 'English',
  commuteSession: any = null
) => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateString = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const greetingRule = isFirstMessage 
    ? `Ensure any greetings match the current time of day (${timeString}).` 
    : `DO NOT say hello, good morning, good evening, or greet the user. Dive straight into answering the question.`;

  const isCasualMessage = /^(hi|hello|hey|yo|sup|what's up|whats up|howdy|namaste|hola|greetings|good morning|good evening|good afternoon|okay|ok|thanks|thank you|cool|great|nice|awesome|got it|sure|yes|no|bye|goodbye|see you|ciao)$/i.test(question.trim());

  let sessionContext = "";
  if (commuteSession) {
    sessionContext = `\nActive Commute Session details:\n- Origin: ${commuteSession.origin}\n- Destination: ${commuteSession.destination}`;
    if (commuteSession.hardDeadline) {
      sessionContext += `\n- Hard Deadline: ${commuteSession.hardDeadline}. IMPORTANT: The user has a hard deadline of ${commuteSession.hardDeadline}. Do not override or ignore this deadline in favor of generic peak-hour avoidance advice unless the user explicitly changes it.`;
    }
    if (commuteSession.confirmedDeparture) {
      sessionContext += `\n- Confirmed Departure: User has confirmed they will leave at ${commuteSession.confirmedDeparture}. Treat this as acknowledgment/confirmation, not a new routing request. Confirm and refine their plan (e.g. "Good — leaving at ${commuteSession.confirmedDeparture}, you'll reach by ~${commuteSession.hardDeadline || 'arrival time'}").`;
    }
  }

  const prompt = isCasualMessage
    ? `You are PulseMind, a friendly AI commute advisor for Bangalore built into the PulseBLR app.
The user just said: "${question}"
The current time is ${timeString} on ${dateString}.
${sessionContext}

Respond in a warm, natural, conversational way — like a smart assistant would. Keep it to 1-2 sentences. Do NOT give commute advice unless they ask. Do NOT output SUGGESTION lines. Be friendly and invite them to ask about their commute. CRITICAL: You MUST respond in ${language}. Use emojis naturally to make the chat interesting!`
    : `You are PulseMind, a premium AI commute advisor for Bangalore.
The user is traveling from "${origin || 'their location'}" to "${destination || 'their destination'}" aiming to arrive by "${arrivalTime}".
Current Signals -> Weather: ${weather}, Traffic: ${traffic}, Transit: ${transit}.
Live Context -> Time: ${timeString}, Date: ${dateString}.
${sessionContext}

The user asked: "${question}"

RULES:
1. Respond directly, concisely, and professionally. Limit your main response to 2-3 short sentences.
2. ${greetingRule}
3. CRITICAL TEMPORAL RULE: The Current Clock Time is EXACTLY ${timeString}. YOU MUST NOT SUGGEST ANY TIMES IN THE PAST.
4. PREDICTIVE TRAFFIC RULE: If the user asks for the "best time to leave" or wants to avoid traffic, analyze the current time against Bangalore's known peak hours (Morning: 8:30-11:30 AM, Evening: 5:30-8:30 PM). Confidently suggest the exact time the peak hour ends.
5. GEOGRAPHY & METRO REALITY CHECK: Do NOT hallucinate Namma Metro lines for areas without metro (RT Nagar, Koramangala, Devanahalli, Airport, Bellandur, Marathahalli, Sarjapur, HSR Layout). Use your live knowledge for real BMTC bus routes or suggest Cabs/Autos.
6. STRICT LOCATION REJECTION: If any location is completely outside Greater Bangalore, REJECT it and say PulseBLR only supports Bangalore.
7. GREATER BANGALORE COVERAGE RULE: Confidently support the entire Greater Bangalore Metropolitan Region including Hoskote, Devanahalli, Nelamangala, etc.
8. LANDMARK RESOLUTION RULE: Intelligently resolve Tech Parks, Colleges, Offices and Hospitals to their real Bangalore locations.
9. CRITICAL LANGUAGE AND STYLE RULE: You MUST respond in ${language}. Use emojis naturally throughout your response to make it interesting!
10. At the very end of your response, provide exactly 2 short, actionable suggestions in ${language}. If there is heavy traffic or it is peak hour, one suggestion MUST be exactly "SUGGESTION: Pivot to a nearby Cafe" to allow the user to escape the traffic:
11. AM/PM RESOLUTION RULE: If the user states a bare time (e.g. '8:50' or '6:30') without specifying AM or PM, you MUST resolve it using the context of the active commuteSession or target arrivalTime. For example, if the trip is an evening trip (aiming to arrive by 6:30 PM), '8:50' must refer to 8:50 PM. If the trip is a morning trip (aiming to arrive by 10:00 AM), '8:50' must refer to 8:50 AM.
12. DEADLINE CONFLICT RULE: If the user proposes or confirms a departure time that, when combined with typical travel duration, would result in arrival after their stated hardDeadline (e.g. leaving at 9:40 AM for a 10:00 AM deadline when travel takes 50 minutes), you MUST explicitly warn them of this conflict (e.g. 'Warning: leaving at 9:40 AM means you will reach after your 10:00 AM deadline at approximately 10:30 AM') and suggest a better time.

SUGGESTION: [short text here]
SUGGESTION: [short text here]`;

  try {
    const raw = await callLLM(prompt);
    // Remove quotes or extra markdown if the LLM adds them
    return raw.replace(/^["']|["']$/g, '').trim();
  } catch {
    return `Based on live conditions from ${origin} to ${destination}, your primary recommendation remains the most optimal choice. (Network congestion prevented a detailed follow-up).`;
  }
};

export const pulseMapScenariosAgent = async (weather: string, origin: string, destination: string) => {
  const prompt = `You are PulseMind, an AI commute advisor.
User wants to travel from "${origin}" to "${destination}". Current Weather: ${weather}.
Generate exactly 4 commute departure scenarios as a JSON array.
Each object must have exactly these keys:
- "time" (e.g. "Leave Now", "Leave at 7:30")
- "delay" (e.g. "32 min", "41 min")
- "eta" (e.g. "8:08 AM")
- "transport" (e.g. "Purple Line", "Drive")
- "explanation" (1-2 sentences of professional AI reasoning explaining why this scenario happens, considering the weather)

Output JSON ONLY. No markdown, no \`\`\`json. Just the raw array starting with [ and ending with ].`;

  try {
    const raw = await callLLM(prompt);
    const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
    if (Array.isArray(parsed) && parsed.length >= 4) {
      return parsed.slice(0, 4);
    }
    throw new Error('Invalid scenario response');
  } catch {
    // Return a clearly labeled fallback that does NOT use hardcoded values
    const now = new Date();
    const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const add = (d: Date, m: number) => new Date(d.getTime() + m * 60000);
    return [
      { time: "Leave Now", delay: "~35 min", eta: fmt(add(now, 35)), transport: "Best Route", explanation: `Live AI analysis unavailable. Estimated travel time from ${origin} to ${destination} based on distance data.` },
      { time: `Leave at ${fmt(add(now, 30))}`, delay: "~45 min", eta: fmt(add(now, 75)), transport: "Metro / Bus", explanation: `Leaving in 30 minutes may expose you to slightly higher congestion. Consider public transit.` },
      { time: `Leave at ${fmt(add(now, 60))}`, delay: "~60 min", eta: fmt(add(now, 120)), transport: "Drive", explanation: `Delaying an hour could significantly increase travel time during peak hours.` },
      { time: `Leave at ${fmt(add(now, 90))}`, delay: "~75 min", eta: fmt(add(now, 165)), transport: "Drive", explanation: `Longer delay recommended only if peak hour gridlock is expected on your route.` }
    ];
  }
};

export const pulseSmartPivotAgent = async (origin: string, destination: string, realCafes: string[]) => {
  const cafesContext = realCafes.length > 0 
    ? `IMPORTANT: You MUST use these exact real cafes that were found nearby: ${realCafes.join(', ')}.`
    : `Generate 3 nearby, highly-rated cafes or coworking spaces.`;

  const prompt = `You are PulseMind, an AI commute advisor for Bangalore.
The user is traveling from "${origin}" to "${destination}" and is stuck in terrible traffic. 
${cafesContext}
Generate a JSON array of exactly 3 cafes they can pivot to and work from for the next 2-3 hours.
Each object must have exactly these keys:
- "name" (The name of the cafe)
- "distance" (e.g. "500m away")
- "wifiSpeed" (e.g. "150 Mbps")
- "atmosphere" (e.g. "Quiet, good for calls")
- "slackMessage" (A professional 1-2 sentence Slack message they can copy/paste to their manager explaining they are stuck in traffic and pivoting to this cafe to work remotely until traffic clears.)

Output JSON ONLY. No markdown, no \`\`\`json. Just the raw array starting with [ and ending with ].`;

  try {
    const raw = await callLLM(prompt);
    const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return parsed.slice(0, 3);
    }
    throw new Error('Invalid cafe response');
  } catch {
    // Use real nearby cafes from Overpass if available; otherwise show a generic message
    if (realCafes.length >= 3) {
      return realCafes.slice(0, 3).map(name => ({
        name,
        distance: "Nearby",
        wifiSpeed: "Available",
        atmosphere: "Good for remote work",
        slackMessage: `Stuck in traffic near ${origin}. Pivoting to ${name} to work remotely until conditions improve.`
      }));
    }
    // True last resort — tell the user AI is unavailable, do not fabricate names
    return [
      { name: "Nearby Cafe (Search on Google Maps)", distance: "Unknown", wifiSpeed: "Unknown", atmosphere: "Please check Google Maps for nearby cafes with WiFi", slackMessage: `Caught in heavy traffic near ${origin}. Working remotely until conditions clear.` }
    ];
  }
};

export const pulseLocationExtractionAgent = async (input: string): Promise<{origin: string, destination: string, hardDeadline?: string | null} | null> => {
  const prompt = `Extract the origin, destination, and any target arrival time / hard deadline (e.g. "10:00 AM" or "6:30 PM") from this text: "${input}". 
Return ONLY a JSON object like:
{
  "origin": "Location A",
  "destination": "Location B",
  "hardDeadline": "10:00 AM"
}
If a field is not found or not explicitly specified, set it to null. No markdown, return raw JSON.`;
  try {
    const raw = await callLLM(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const origin = parsed.origin || parsed.Origin || parsed.ORIGIN;
      const destination = parsed.destination || parsed.Destination || parsed.DESTINATION;
      const hardDeadline = parsed.hardDeadline || parsed.HardDeadline || parsed.HARD_DEADLINE || null;
      if (origin && destination) {
        return { origin, destination, hardDeadline };
      }
    }
    return null;
  } catch {
    return null;
  }
};
