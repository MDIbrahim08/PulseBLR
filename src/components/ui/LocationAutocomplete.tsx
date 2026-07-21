import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { getCurrentLocation, getReverseGeocode } from '../../lib/signals';
import { useClickOutside } from './use-click-outside';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'origin' | 'destination';
  className?: string;
}

export function LocationAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Enter location...", 
  type = 'destination',
  className 
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(containerRef, () => {
    setIsOpen(false);
  });

  useEffect(() => {
    // Only search if user has typed at least 3 characters and the dropdown is open
    if (value.length < 3 || !isOpen) {
      setOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Bias towards Bangalore and Devanahalli
        let query = value;
        const lower = value.toLowerCase();
        if (!lower.includes('bengaluru') && !lower.includes('bangalore') && !lower.includes('devanahalli')) {
          query = `${value}, Bengaluru, Karnataka`;
        }

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`,
          { headers: { 'User-Agent': 'PulseBLRApp/1.0' } }
        );
        const data = await res.json();
        setOptions(data);
      } catch (e) {
        console.error("Autocomplete fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value, isOpen]);

  const handleSelect = (item: any) => {
    const parts = item.display_name.split(',');
    const cleanAddress = parts.slice(0, 3).join(',').trim();
    onChange(cleanAddress);
    setIsOpen(false);
  };

  const handleUseCurrentLocation = async () => {
    setIsDetecting(true);
    setIsOpen(false);
    try {
      const position = await getCurrentLocation();
      const addr = await getReverseGeocode(position.coords.latitude, position.coords.longitude);
      const cleanAddr = addr.split(',').slice(0, 3).join(',').trim();
      onChange(cleanAddr);
    } catch (e: any) {
      console.warn("Manual geolocation request failed:", e);
      if (e.code === 1) {
        alert("Location permission denied. Please enable it in your browser.");
      } else {
        alert("Could not retrieve your location. Please type it manually.");
      }
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative w-full flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="bg-transparent border-b-2 border-white/30 focus:border-white outline-none w-full text-white placeholder-white/60 pb-1"
        />
        
        {isDetecting && (
          <div className="absolute right-0">
            <Loader2 size={14} className="text-white/70 animate-spin" />
          </div>
        )}
      </div>

      {isOpen && (value.length >= 3 || type === 'origin') && (
        <div className="absolute top-full left-0 mt-3 w-full min-w-[280px] sm:min-w-[350px] max-w-[90vw] bg-[#09090b]/80 backdrop-blur-3xl border border-white/[0.08] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-50 overflow-hidden ring-1 ring-white/[0.02] p-1.5">
          
          {/* Always show "Use Current Location" for Origin input at the top */}
          {type === 'origin' && (
            <div className="mb-1.5">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-pulse-500/10 transition-all duration-300 text-left bg-pulse-500/5 group border border-pulse-500/20"
              >
                <div className="bg-pulse-500/20 p-2 rounded-[10px] text-pulse-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_-3px_rgba(14,165,233,0.3)]">
                  <Navigation size={16} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-white/90 text-[13px] font-semibold tracking-wide group-hover:text-white transition-colors">Use Current Location</p>
                  <p className="text-pulse-400/70 text-[11px] font-medium mt-0.5 tracking-wider">DETECT AUTOMATICALLY</p>
                </div>
              </button>
            </div>
          )}

          <div className="max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-1">
            {isLoading && value.length >= 3 ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3 text-white/40 text-sm font-medium">
                <Loader2 size={20} className="animate-spin text-pulse-400" /> 
                <span>Searching locations...</span>
              </div>
            ) : options.length > 0 ? (
              options.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-start gap-3.5 px-3 py-3 rounded-xl hover:bg-white/[0.06] transition-all duration-200 text-left group"
                >
                  <div className="bg-white/[0.04] border border-white/[0.05] p-2 rounded-[10px] text-white/30 group-hover:text-white/90 group-hover:bg-white/[0.08] transition-all duration-300 shrink-0 mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div className="flex flex-col min-w-0 justify-center">
                    <span className="text-white/80 group-hover:text-white text-[13px] font-medium truncate w-full tracking-wide transition-colors">
                      {item.display_name.split(',')[0]}
                    </span>
                    <span className="text-white/30 group-hover:text-white/50 text-[11px] truncate w-full mt-1 leading-relaxed transition-colors">
                      {item.display_name.split(',').slice(1).join(',').trim()}
                    </span>
                  </div>
                </button>
              ))
            ) : value.length >= 3 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <div className="bg-white/[0.03] p-3 rounded-full mb-2">
                  <MapPin size={20} className="text-white/20" />
                </div>
                <p className="text-white/60 text-[13px] font-medium tracking-wide">No locations found</p>
                <p className="text-white/30 text-[11px]">Try a different search term.</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
