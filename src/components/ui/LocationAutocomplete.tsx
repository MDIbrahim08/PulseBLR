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
        <div className="absolute top-full left-0 mt-2 w-[300px] sm:w-[350px] bg-[#111118] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          
          {/* Always show "Use Current Location" for Origin input at the top */}
          {type === 'origin' && (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 text-left"
            >
              <div className="bg-blue-500/20 p-1.5 rounded-lg text-blue-400">
                <Navigation size={16} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Use Current Location</p>
                <p className="text-white/40 text-xs">Detect automatically</p>
              </div>
            </button>
          )}

          <div className="max-h-[280px] overflow-y-auto">
            {isLoading && value.length >= 3 ? (
              <div className="p-4 flex items-center justify-center gap-2 text-white/50 text-sm">
                <Loader2 size={14} className="animate-spin" /> Fetching locations...
              </div>
            ) : options.length > 0 ? (
              options.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left"
                >
                  <MapPin size={16} className="text-white/40 mt-0.5 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-sm font-medium truncate w-full">
                      {item.display_name.split(',')[0]}
                    </span>
                    <span className="text-white/50 text-xs truncate w-full">
                      {item.display_name.split(',').slice(1).join(',')}
                    </span>
                  </div>
                </button>
              ))
            ) : value.length >= 3 ? (
              <div className="p-4 text-center text-white/50 text-sm">
                No locations found. Try being more specific.
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
