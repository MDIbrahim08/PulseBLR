import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Wifi, Copy, CheckCircle2, Navigation, AlertTriangle, ArrowRight } from 'lucide-react';
import { useRouteStore } from '../store/routeStore';
import { getCurrentLocation, getReverseGeocode, getForwardGeocode, getNearbyCafes } from '../lib/signals';
import { pulseSmartPivotAgent } from '../lib/llm-router';
import { GradientCard } from './ui/gradient-card';

export default function SmartPivot() {
  const { origin: globalOrigin, destination: globalDestination } = useRouteStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [cafes, setCafes] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pivotOrigin, setPivotOrigin] = useState(globalOrigin || '');
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleLiveLocation = async () => {
    setGettingLocation(true);
    try {
      const loc = await getCurrentLocation();
      const addr = await getReverseGeocode(loc.coords.latitude, loc.coords.longitude);
      setPivotOrigin(addr);
    } catch (err) {
      console.warn("Geolocation failed or denied.");
      alert("Please enable location permissions in your browser.");
    }
    setGettingLocation(false);
  };

  const handlePivot = async () => {
    if (!pivotOrigin) {
      alert("Please enter a location or use live location first.");
      return;
    }
    setIsAnalyzing(true);
    const destName = globalDestination || "Manyata Tech Park";

    try {
      // 1. Try to get lat/lon for the pivotOrigin
      let lat = 13.045; // fallback Manyata
      let lon = 77.6206;
      
      const geo = await getForwardGeocode(pivotOrigin);
      if (geo) {
        lat = geo.lat;
        lon = geo.lon;
      }

      // 2. Fetch REAL nearby cafes from OSM Overpass API
      const realCafes = await getNearbyCafes(lat, lon);

      // 3. Feed the real cafes into the AI so it doesn't hallucinate
      const dynamicCafes = await pulseSmartPivotAgent(pivotOrigin, destName, realCafes as string[]);
      if (dynamicCafes && dynamicCafes.length > 0) {
        setCafes(dynamicCafes);
      }
    } catch (err) {
      console.error(err);
    }
    
    setIsAnalyzing(false);
    setIsAnalyzed(true);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="w-full max-w-5xl px-4 md:px-8 pb-24 flex flex-col items-center"
    >
      <div className="w-full flex flex-col gap-12 mt-6">

        {/* Hero Section */}
        <GradientCard className="p-8 md:p-12">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/10 blur-[100px] rounded-full -mr-40 -mt-40 pointer-events-none transition-all duration-500" />
          
          <div className="relative z-10 flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center border border-rose-500/30">
              <AlertTriangle size={24} className="text-rose-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">AI Smart Pivot</h1>
              <p className="text-slate-400 font-medium mt-1">The Commute Escape Hatch</p>
            </div>
          </div>

          <p className="text-lg text-slate-300 font-medium leading-relaxed mb-10 relative z-10">
            Stuck in massive Outer Ring Road gridlock? Don't waste hours in traffic. Let PulseMind instantly pivot you to a highly-rated workspace nearby, complete with a drafted Slack message for your manager.
          </p>

          {!isAnalyzed ? (
            <div className="relative z-10 flex flex-col items-center justify-center py-10 border border-slate-800/60 rounded-3xl bg-slate-950/50">
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-lg text-slate-300 font-medium">Scanning for nearby workspaces & WiFi...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 w-full max-w-md px-4">
                  <div className="w-full flex flex-col gap-3">
                    <label className="text-sm font-medium text-slate-400 self-start">Where are you stuck?</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={pivotOrigin}
                        onChange={(e) => setPivotOrigin(e.target.value)}
                        placeholder="e.g. Silk Board Junction" 
                        className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-pulse-500 transition-colors"
                      />
                      <button 
                        onClick={handleLiveLocation}
                        disabled={gettingLocation}
                        className="bg-slate-800 hover:bg-slate-700 text-pulse-400 px-4 py-3 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                        title="Use Live Location"
                      >
                        <Navigation size={20} className={gettingLocation ? "animate-spin" : ""} />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={handlePivot}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-colors shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center justify-center gap-3 mt-2"
                  >
                    <Coffee size={20} />
                    Trigger Escape Hatch
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative z-10 flex flex-col max-h-[60vh]">
              <h3 className="text-xl font-bold text-white mb-4 shrink-0">Recommended Pivots Near {pivotOrigin}</h3>
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-4">
                {cafes.map((cafe, i) => (
                  <GradientCard key={i} className="p-6 flex flex-col md:flex-row gap-6 hover:scale-[1.01] transition-transform duration-300">
                    
                    {/* Left Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-2xl font-bold text-slate-100">{cafe.name}</h4>
                        <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                          <Wifi size={12} /> {cafe.wifiSpeed}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium text-slate-400 mb-4">
                        <span className="flex items-center gap-1"><Navigation size={14} /> {cafe.distance}</span>
                        <span>•</span>
                        <span>{cafe.atmosphere}</span>
                      </div>
                      <div className="relative p-[1px] rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 overflow-hidden">
                        <p className="text-slate-300 bg-slate-900/90 backdrop-blur-sm p-4 rounded-xl text-sm italic font-medium">
                          "{cafe.slackMessage}"
                        </p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-3 justify-center md:w-48 shrink-0">
                      <button 
                        onClick={() => copyToClipboard(`slack-${i}`, cafe.slackMessage)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all shadow-md border border-slate-700 hover:border-slate-500"
                      >
                        {copiedId === `slack-${i}` ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        {copiedId === `slack-${i}` ? 'Copied Message' : 'Copy Slack Msg'}
                      </button>
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.name + ' ' + pivotOrigin)}`, '_blank')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pulse-600 to-pulse-500 hover:from-pulse-500 hover:to-pulse-400 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                      >
                        Route Here <ArrowRight size={16} />
                      </button>
                    </div>
                  </GradientCard>
                ))}
              </div>
            </div>
          )}
        </GradientCard>
      </div>
    </motion.div>
  );
}
