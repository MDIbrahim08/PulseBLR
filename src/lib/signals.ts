import axios from 'axios';

// 1. Get User Coordinates
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    }
  });
};

// 2. Reverse Geocode (Get readable location from coordinates)
export const getReverseGeocode = async (lat: number, lon: number) => {
  try {
    // Using OpenStreetMap Nominatim (Free, no API key required)
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
      headers: { 'User-Agent': 'PulseBLRApp/1.0' }
    });
    return response.data.display_name;
  } catch (error) {
    console.error("Reverse Geocoding Error:", error);
    return "Bengaluru, Karnataka"; // Fallback
  }
};

// 2b. Forward Geocode (Get coordinates from readable location)
export const getForwardGeocode = async (address: string) => {
  try {
    let query = address;
    const lower = address.toLowerCase();
    if (!lower.includes('bengaluru') && !lower.includes('bangalore')) {
      query = `${address}, Bengaluru, Karnataka, India`;
    }
    const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
      headers: { 'User-Agent': 'PulseBLRApp/1.0' }
    });
    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error("Forward Geocoding Error:", error);
    return null;
  }
};

// 2c. Get Nearby Cafes (Overpass API)
export const getNearbyCafes = async (lat: number, lon: number) => {
  try {
    const query = `
      [out:json][timeout:10];
      (
        node["amenity"="cafe"](around:2000,${lat},${lon});
        node["amenity"="coworking_space"](around:2000,${lat},${lon});
      );
      out body 5;
    `;
    const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const elements = response.data.elements;
    if (elements && elements.length > 0) {
      // Filter out unnamed cafes and map to just the names
      const names = elements
        .filter((el: any) => el.tags && el.tags.name)
        .map((el: any) => el.tags.name);
      
      // Return up to 3 unique names
      return Array.from(new Set(names)).slice(0, 3);
    }
    return [];
  } catch (error) {
    console.error("Overpass API Error:", error);
    return [];
  }
};

// 3. Get Real Weather (Open-Meteo)
export const getLiveWeather = async (lat: number, lon: number) => {
  try {
    const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code&timezone=auto`);
    
    const current = response.data.current;
    
    // Basic WMO Weather code mapping
    let condition = "Clear";
    if (current.weather_code >= 51 && current.weather_code <= 67) condition = "Rainy";
    if (current.weather_code >= 71 && current.weather_code <= 77) condition = "Snow";
    if (current.weather_code >= 95) condition = "Thunderstorm";

    return {
      temperature: `${current.temperature_2m}°C`,
      precipitation: `${current.precipitation}mm`,
      condition: condition,
      summary: `${current.temperature_2m}°C, ${condition}, Precipitation: ${current.precipitation}mm`
    };
  } catch (error) {
    console.error("Weather API Error:", error);
    return { temperature: "N/A", precipitation: "0mm", condition: "Unknown", summary: "Weather data unavailable" };
  }
};

// 4. Get Real Route Data (OSRM - Free Routing)
export const getLiveRoute = async (startLat: number, startLon: number, endLat: number, endLon: number) => {
  try {
    // OSRM expects longitude,latitude
    const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`);
    
    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const durationMins = Math.round(route.duration / 60);
      const distanceKm = (route.distance / 1000).toFixed(1);
      
      return {
        durationMins,
        distanceKm,
        summary: `${distanceKm} km, estimated base driving time: ${durationMins} minutes.`
      };
    }
    return null;
  } catch (error) {
    console.error("Routing API Error:", error);
    return null;
  }
};
