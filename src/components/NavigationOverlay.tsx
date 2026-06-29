import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, X, AlertCircle, ArrowRight, Train, CheckCircle2 } from 'lucide-react';

const carIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div class="w-8 h-8 rounded-full bg-pulse-500 border-[3px] border-white shadow-[0_0_15px_rgba(14,165,233,0.5)] flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Helper for dynamic map centering on the car
function CarTracker({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 16, { animate: true, duration: 1 });
  }, [position, map]);
  return null;
}

const INSTRUCTIONS = [
  "Head north towards CMH Road",
  "Continue for 400m",
  "Board Purple Line Metro at Indiranagar",
  "Exit at Nagawara Station",
  "Walk 350m to destination",
  "Arriving at Manyata Tech Park"
];

export default function NavigationOverlay({ routeLine, onClose }: { routeLine: [number, number][]; onClose: () => void }) {
  const [carIndex, setCarIndex] = useState(0);
  const [instructionIdx, setInstructionIdx] = useState(0);
  const [eta, setEta] = useState(32);
  const [showAlternative, setShowAlternative] = useState(false);

  useEffect(() => {
    if (!routeLine || routeLine.length === 0) return;

    const interval = setInterval(() => {
      setCarIndex(prev => {
        if (prev < routeLine.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [routeLine]);

  // Simulate ETA reduction and instructions
  useEffect(() => {
    const etaInterval = setInterval(() => {
      setEta(prev => Math.max(0, prev - 1));
    }, 3000);

    const instrInterval = setInterval(() => {
      setInstructionIdx(prev => Math.min(INSTRUCTIONS.length - 1, prev + 1));
    }, 5000);

    const altTimeout = setTimeout(() => {
      setShowAlternative(true);
    }, 8000);

    return () => {
      clearInterval(etaInterval);
      clearInterval(instrInterval);
      clearTimeout(altTimeout);
    };
  }, []);

  if (!routeLine || routeLine.length === 0) return null;

  const currentPos = routeLine[carIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col"
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-start pointer-events-none">
        
        {/* Turn by turn */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-6 rounded-3xl shadow-2xl max-w-md w-full pointer-events-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-pulse-500 rounded-2xl flex items-center justify-center">
              <Navigation size={24} className="text-white transform -rotate-45" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{INSTRUCTIONS[instructionIdx]}</p>
              <p className="text-pulse-400 font-bold">{Math.max(10, 400 - (carIndex * 10))}m away</p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="w-14 h-14 bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-all pointer-events-auto shadow-xl"
        >
          <X size={24} />
        </button>
      </div>

      {/* Reroute Alert */}
      <AnimatePresence>
        {showAlternative && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-36 left-6 z-10 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 p-5 rounded-2xl shadow-2xl max-w-sm pointer-events-auto"
          >
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 size={24} className="text-emerald-400" />
              <p className="font-bold text-white text-lg">Better route detected.</p>
            </div>
            <p className="text-emerald-100/70 text-sm mb-4">Traffic cleared on alternate path. Save 5 mins.</p>
            <button 
              onClick={() => setShowAlternative(false)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors"
            >
              Switch Route
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <div className="flex-1 relative bg-slate-900">
        <MapContainer 
          center={currentPos} zoom={16} 
          className="w-full h-full z-0 outline-none" 
          zoomControl={false}
        >
          <CarTracker position={currentPos} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png" opacity={0.5} />
          
          <Polyline positions={routeLine} pathOptions={{ color: '#0ea5e9', weight: 8, opacity: 0.6 }} />
          <Polyline positions={routeLine.slice(0, carIndex)} pathOptions={{ color: '#0ea5e9', weight: 8, opacity: 1 }} />
          
          <Marker position={currentPos} icon={carIcon} />
        </MapContainer>
        
        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pt-20 pb-8 px-6 pointer-events-none">
          <div className="max-w-4xl mx-auto flex justify-between items-end pointer-events-auto">
            
            <div>
              <p className="text-6xl font-black text-emerald-400 drop-shadow-lg">{eta} <span className="text-3xl">min</span></p>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-xl font-bold text-white drop-shadow-md">8:08 AM</p>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <p className="text-lg font-medium text-slate-300 drop-shadow-md">12.5 km</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="px-8 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 font-bold rounded-2xl transition-colors backdrop-blur-md"
            >
              Exit Navigation
            </button>
            
          </div>
        </div>
      </div>
    </motion.div>
  );
}
