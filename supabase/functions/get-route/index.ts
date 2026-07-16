import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// CORS headers to allow calls from browsers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { startLat, startLon, endLat, endLon } = await req.json()
    
    // Get environment secrets
    const TOMTOM_KEY = Deno.env.get('TOMTOM_API_KEY') || ''
    const HERE_KEY = Deno.env.get('HERE_API_KEY') || ''
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check daily quota
    const today = new Date().toISOString().split('T')[0]
    let tomtomAllowed = false
    
    if (TOMTOM_KEY) {
      // Fetch or insert usage record for today
      const { data: usage, error: fetchError } = await supabase
        .from('api_usage')
        .select('count')
        .eq('date', today)
        .maybeSingle()

      if (fetchError) {
        console.error("Error fetching usage:", fetchError)
      }

      const count = usage ? usage.count : 0
      if (count < 2400) {
        tomtomAllowed = true
      }
    }

    let routeResult = null

    // 1. Try TomTom
    if (tomtomAllowed && TOMTOM_KEY) {
      try {
        const response = await fetch(`https://api.tomtom.com/routing/1/calculateRoute/${startLat},${startLon}:${endLat},${endLon}/json?traffic=true&key=${TOMTOM_KEY}`)
        if (response.ok) {
          const data = await response.json()
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0]
            routeResult = {
              distanceKm: parseFloat((route.summary.lengthInMeters / 1000).toFixed(1)),
              durationMinutes: Math.round(route.summary.travelTimeInSeconds / 60),
              staticDurationMinutes: Math.round(route.summary.noTrafficTravelTimeInSeconds / 60),
              source: 'tomtom'
            }

            // Increment usage in Supabase database
            const { data: row } = await supabase.from('api_usage').select('count').eq('date', today).maybeSingle();
            if (row) {
              await supabase.from('api_usage').update({ count: row.count + 1 }).eq('date', today);
            } else {
              await supabase.from('api_usage').insert({ date: today, count: 1 });
            }
          }
        }
      } catch (err) {
        console.error("TomTom Routing failed:", err)
      }
    }

    // 2. Try HERE Fallback
    if (!routeResult && HERE_KEY) {
      try {
        const response = await fetch(`https://router.hereapi.com/v8/routes?transportMode=car&origin=${startLat},${startLon}&destination=${endLat},${endLon}&return=summary&departureTime=now&apiKey=${HERE_KEY}`)
        if (response.ok) {
          const data = await response.json()
          if (data.routes && data.routes.length > 0) {
            const section = data.routes[0].sections[0]
            const dur = section.summary.duration
            routeResult = {
              distanceKm: parseFloat((section.summary.length / 1000).toFixed(1)),
              durationMinutes: Math.round(dur / 60),
              staticDurationMinutes: Math.round(section.summary.baseDuration ? section.summary.baseDuration / 60 : dur / 60),
              source: 'here'
            }
          }
        }
      } catch (err) {
        console.error("HERE Routing failed:", err)
      }
    }

    // 3. Fallback to OSRM
    if (!routeResult) {
      try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`)
        if (response.ok) {
          const data = await response.json()
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0]
            const durationMins = Math.round(route.duration / 60)
            routeResult = {
              distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
              durationMinutes: durationMins,
              staticDurationMinutes: durationMins,
              source: 'osrm-fallback'
            }
          }
        }
      } catch (err) {
        console.error("OSRM Fallback Routing failed:", err)
      }
    }

    if (!routeResult) {
      throw new Error("All routing providers failed")
    }

    return new Response(JSON.stringify(routeResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
