import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Wifi, Copy, CheckCircle2, Navigation, Compass, ArrowRight } from 'lucide-react';
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
      setPivotOrigin(addr.split(',').slice(0, 2).join(',').trim());
    } catch (err) {
      console.warn("Geolocation failed or denied.");
      alert("Could not retrieve live location. Please type your location manually.");
    }
    setGettingLocation(false);
  };

  const handlePivot = async () => {
    if (!pivotOrigin) {
      alert("Please enter your current location or use live GPS.");
      return;
    }
    setIsAnalyzing(true);
    const destName = globalDestination || "Manyata Tech Park";

    try {
      let lat = 12.9716;
      let lon = 77.5946;
      
      const geo = await getForwardGeocode(pivotOrigin);
      if (geo) {
        lat = geo.lat;
        lon = geo.lon;
      }

      const realCafes = await getNearbyCafes(lat, lon);
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
      className="w-full max-w-5xl px-4 md:px-8 pb-24 flex flex-col items-center mx-auto"
    >
      <div className="w-full flex flex-col gap-8 mt-6">

        {/* Clean Executive Card Header */}
        <div className="bg-[#121218] border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
              <Compass size={24} className="text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                AI Smart Pivot
              </h1>
              <p className="text-white/40 font-semibold text-xs tracking-wider uppercase mt-0.5">
                Commute Escape Hatch
              </p>
            </div>
          </div>

          <p className="text-sm md:text-base text-white/70 font-normal leading-relaxed mb-8 max-w-3xl">
            Stuck in heavy congestion? Pivot to a verified nearby workspace or cafe with high-speed Wi-Fi, and automatically copy a professional status update for your manager.
          </p>

          {!isAnalyzed ? (
            <div className="p-6 md:p-8 border border-white/10 rounded-xl bg-white/[0.02]">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-white/70 font-medium">Scanning live nearby workspaces & Wi-Fi signals...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5 w-full max-w-xl mx-auto">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Current Location / Junction</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={pivotOrigin}
                        onChange={(e) => setPivotOrigin(e.target.value)}
                        placeholder="e.g. Silk Board, Marathahalli, ORR" 
                        className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 transition-colors placeholder:text-white/30"
                      />
                      <button 
                        onClick={handleLiveLocation}
                        disabled={gettingLocation}
                        type="button"
                        className="bg-white/5 hover:bg-white/10 text-sky-400 px-4 py-3 rounded-xl transition-colors shrink-0 border border-white/10 disabled:opacity-50 flex items-center justify-center"
                        title="Use Live GPS"
                      >
                        <Navigation size={18} className={gettingLocation ? "animate-spin" : ""} />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={handlePivot}
                    type="button"
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 mt-1"
                  >
                    <Coffee size={18} />
                    {gettingLocation ? 'Locating...' : 'Find Workspaces Nearby'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Workspaces Near {pivotOrigin}</h3>
                <button 
                  onClick={() => setIsAnalyzed(false)}
                  className="text-xs text-white/50 hover:text-white underline"
                >
                  Change Location
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {cafes.map((cafe, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                    
                    {/* Left Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-lg font-bold text-white">{cafe.name}</h4>
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-md flex items-center gap-1.5">
                          <Wifi size={12} /> {cafe.wifiSpeed}
                        </span>
                        <span className="text-white/40 text-xs flex items-center gap-1 font-medium">
                          <Navigation size={12} /> {cafe.distance}
                        </span>
                      </div>

                      <p className="text-white/50 text-xs">{cafe.atmosphere}</p>

                      <div className="bg-black/40 border border-white/5 p-3 rounded-lg text-xs text-white/80 font-mono leading-relaxed mt-2">
                        "{cafe.slackMessage}"
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-row md:flex-col gap-2 w-full md:w-44 shrink-0">
                      <button 
                        onClick={() => copyToClipboard(`slack-${i}`, cafe.slackMessage)}
                        type="button"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition-all border border-white/10"
                      >
                        {copiedId === `slack-${i}` ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        {copiedId === `slack-${i}` ? 'Copied' : 'Copy Slack Msg'}
                      </button>
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.name + ' ' + pivotOrigin)}`, '_blank')}
                        type="button"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                      >
                        Route <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
