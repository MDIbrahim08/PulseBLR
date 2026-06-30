<div align="center">
  <img src="public/logo.png" alt="PulseBLR Logo" width="120" />
  <h1>PulseBLR</h1>
  <p><strong>Agentic AI Commute Planner for Bangalore's Urban Chaos</strong></p>
</div>

---

## 🚀 The Problem
Google Maps gives you a path, but it doesn't give you a *strategy*. For urban commuters in highly congested cities like Bangalore, a simple distance calculation is not enough. A sudden downpour or a VIP movement can turn a 45-minute drive into a 2-hour nightmare. Commuters need a tool that reasons through real-time city data to recommend not just *how* to travel, but *exactly when* to leave.

## 💡 Our Solution
**PulseBLR** is an Agentic AI workflow that acts as your personal commute strategist. Instead of static routing, PulseBLR ingests live environmental signals (traffic, weather, distance) and feeds them into a Large Language Model (Google Gemini 1.5 Flash). The AI mathematically calculates optimal departure times, predicts dynamic costs, and recommends multi-modal transit options based on real-time city conditions.

---

## ✨ Key Features
- **Live Signal Ingestion:** Fetches real-time driving distances via the **OSRM API** and live precipitation/weather via the **Open-Meteo API**.
- **Agentic Routing (Gemini):** Uses strict JSON Schema Prompt Engineering to force the LLM to act as a reasoning engine, calculating optimal departure times based on live constraints.
- **Dynamic Cost Estimation:** Leverages the LLM's pre-trained knowledge to generate realistic cost estimates (e.g., Metro fares vs. Cab surge pricing).
- **Toll & Traffic Avoidance:** Users can toggle constraints that dynamically alter the AI's prompt payload, forcing it to find alternative routes and calculate the monetary savings.
- **Glassmorphism UI:** Built with Tailwind CSS for a premium, native-app-like experience in the browser.
- **Secure Authentication:** Backend powered by Supabase PostgreSQL for secure user session management.

---

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React Icons
- **Backend/Auth:** Supabase (PostgreSQL)
- **AI Engine:** Google Gemini 1.5 Flash API
- **External REST APIs:** OSRM (Routing), OpenStreetMap Nominatim (Geocoding), Open-Meteo (Weather), Overpass API (Local Context)
- **Deployment:** Netlify

---

## ⚙️ How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MDIbrahim08/PulseBLR.git
   cd PulseBLR
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your API keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to `http://localhost:5173`

---

## 🧠 Hackathon Bonus Task: Dynamic Costs & Tolls
We successfully implemented the bonus objective. By toggling the "Avoid Tolls & Traffic" switch on the dashboard, the app dynamically alters the constraint payload sent to the Gemini AI. The AI completely re-evaluates the route (often switching the user from Cabs to the Metro to bypass traffic) and mathematically generates a realistic dynamic cost estimation for the new route in INR.

---

<div align="center">
  <i>Built with ❤️ during the 2026 Hackathon.</i>
</div>
