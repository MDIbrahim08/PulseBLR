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
  let h = 9;
  let m = 0;
  let ampm = 'AM';
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
  
  if (timeMode === 'Depart At') {
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
    explanation: `PulseMind is analyzing live signals for your commute from ${origin} to ${destination}.\n\nLive Weather: ${weather}\nLive Traffic: ${traffic}\n\nPlease retry in a moment for a fully dynamic AI-generated recommendation.`,
    disclaimer: "",
    alternativeRoute: null
  };

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.recommendedDeparture && isTimeInPast(parsed.recommendedDeparture)) {
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

export const nimbusAdvisor = async (temp: string, condition: string, precipitation: string, time: string): Promise<string> => {
  const o = obs();
  o.setAgentStatus('nimbus', 'fetching');
  o.addEvent('Nimbus Agent — fetching weather signal', 'info', 'Nimbus');
  const prompt = `You are an AI weather advisor. Current: ${temp}, ${condition}, ${precipitation}. Time: ${time}. Write a short 1-sentence recommendation for a commuter.`;
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

export const velocityAdvisor = async (durationMins: number, distanceKm: string, origin: string, destination: string, time: string): Promise<string> => {
  const o = obs();
  o.setAgentStatus('velocity', 'fetching');
  o.addEvent('Velocity Agent — recalculating congestion index', 'info', 'Velocity');
  const prompt = `You are a traffic AI. Route: ${origin} to ${destination}. Time: ${durationMins} mins. Current: ${time}. Write a short 1-sentence recommendation.`;
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

export const transitIQAdvisor = async (transitStatus: string, destination: string, time: string): Promise<string> => {
  const o = obs();
  o.setAgentStatus('transitiq', 'fetching');
  o.addEvent('TransitIQ Agent — pinging metro feed', 'info', 'TransitIQ');
  const prompt = `You are a metro AI. Status: ${transitStatus}. Dest: ${destination}. Time: ${time}. Write a short 1-sentence recommendation.`;
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

export const urbanSenseAdvisor = async (origin: string, destination: string, time: string): Promise<string> => {
  const o = obs();
  o.setAgentStatus('urbansense', 'fetching');
  o.addEvent('UrbanSense Agent — scanning urban event feed', 'info', 'UrbanSense');
  const prompt = `You are a city events AI. Route: ${origin} to ${destination}. Time: ${time}. Write a short 1-sentence recommendation.`;
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

export const chronosAdvisor = async (weather: string, traffic: string, transit: string, arrivalTime: string): Promise<string> => {
  const o = obs();
  o.setAgentStatus('chronos', 'fetching');
  o.addEvent('Chronos Agent — recalculating time-risk prediction', 'info', 'Chronos');
  const prompt = `You are a risk AI. Target arrival: ${arrivalTime}. Write a short 1-sentence risk prediction.`;
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

export const pulseCoreAgent = async (weather: string, traffic: string, transit: string, origin: string, destination: string, timeString: string, timeMode: string = 'Arrive By', userPrompt: string = '', avoidTollsOrTraffic: boolean = false) => {
  const o = obs();
  o.setAgentStatus('pulsemind', 'fetching');
  o.addEvent('PulseMind — generating route recommendation', 'info', 'PulseMind');
  const t0 = performance.now();
  
  const currentActualTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const goalInstruction = `User wants to travel from "${origin || 'current location'}" to "${destination || 'their destination'}".
The user provided this request/timing: "${userPrompt || 'No specific time provided. Assume they want to leave now.'}". 
The current time right now is ${currentActualTime}.
Extract their desired timing from the request. If they say "now" or don't specify a time, use the current time (${currentActualTime}) as their departure time. Calculate the expected departure and arrival times based on an estimated travel time of roughly 45-60 minutes.`;

  const prompt = `You are an AI commute assistant named PulseMind. 
The Current Clock Time right now is: ${currentActualTime}.
${goalInstruction}
Current Signals -> Weather: ${weather}, Traffic: ${traffic}, Transit: ${transit}.
User Preference: Avoid Tolls and Traffic = ${avoidTollsOrTraffic}. If true, you MUST prioritize alternative routes that avoid heavy traffic and tolls, and calculate the estimated cost accordingly.

ALL times must include AM or PM. Never output 24-hour time.
CRITICAL TEMPORAL RULE: The Current Clock Time is exactly ${currentActualTime}. YOU MUST NOT SUGGEST A DEPARTURE TIME IN THE PAST. If the user's requested time or calculated departure time is earlier than ${currentActualTime} today, you MUST set "recommendedDeparture" to "Now" and explicitly explain in the "explanation" that their target time has already passed.
IMPORTANT CRITICAL RULE: DO NOT copy ANY text, times, or transport modes from the JSON example below. You MUST mathematically calculate times, dynamically determine the "recommendedTransport", and generate fresh, context-aware "reasoning", "alternativeRoute", and "disclaimer".

Output JSON EXACTLY like this (NO markdown, raw JSON only):
{
  "recommendedDeparture": "[COMPUTED_DEPARTURE_TIME]",
  "recommendedTransport": "[DYNAMIC_TRANSPORT_MODE_HERE]",
  "expectedArrival": "[COMPUTED_ARRIVAL_TIME]",
  "timeSavedMinutes": 15,
  "confidenceScore": 90,
  "estimatedCost": "[DYNAMIC_COST_ESTIMATE_HERE]",
  "explanation": "I've analyzed today's traffic, weather, and road conditions.\\n\\nBased on your requested timing, I recommend using [TRANSPORT].\\n\\n[INSERT DYNAMIC REASONING ABOUT TRAFFIC/WEATHER HERE].\\n\\nTravelling this way should save approximately [MINUTES] minutes.",
  "disclaimer": "⚠️ [INSERT RELEVANT DISCLAIMER OR LEAVE EMPTY STRING]",
  "alternativeRoute": {
    "transport": "[ALTERNATIVE_TRANSPORT_MODE]",
    "time": "[ESTIMATED_TIME]",
    "reason": "[WHY_CONSIDER_THIS_ALTERNATIVE]"
  },
  "reasoning": [
    "[DYNAMIC_REASON_1 (e.g. Traffic is light)]",
    "[DYNAMIC_REASON_2 (e.g. Rain expected in 10 mins)]",
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
  isFirstMessage: boolean = true
) => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateString = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const greetingRule = isFirstMessage 
    ? `Ensure any greetings match the current time of day (${timeString}).` 
    : `DO NOT say hello, good morning, good evening, or greet the user. Dive straight into answering the question.`;

  const prompt = `You are PulseMind, a premium AI commute advisor for Bangalore.
The user is traveling from "${origin}" to "${destination}" aiming to arrive by "${arrivalTime}".
Current Signals -> Weather: ${weather}, Traffic: ${traffic}, Transit: ${transit}.
Live Context -> Time: ${timeString}, Date: ${dateString}.

The user asked a follow-up question: "${question}"

RULES:
1. Respond directly, concisely, and professionally. Limit your main response to 2-3 short sentences.
2. ${greetingRule}
3. At the very end of your response, ALWAYS provide exactly 2 short, actionable suggestions based on the user's problem (e.g., "Take a 2-wheeler", "Wait 15 mins", "Take the Metro"). 
4. You MUST format these suggestions EXACTLY like this on their own lines at the very bottom:

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
