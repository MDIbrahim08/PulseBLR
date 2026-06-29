import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export const pulseCoreAgent = async (weather: string, traffic: string, transit: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are PulseMind, the core reasoning engine for an Urban Mobility App in Bengaluru.
      Your job is to take live city signals and output the smartest commute decision.

      Current City Signals:
      - Weather: ${weather}
      - Traffic: ${traffic}
      - Transit: ${transit}

      Respond with a JSON object containing:
      {
        "recommendedDeparture": "e.g. 7:15 AM",
        "recommendedTransport": "e.g. Metro",
        "timeSavedMinutes": 31,
        "confidenceScore": 96,
        "reasoning": [
          "Heavy rain expected after 7:40 AM.",
          "Traffic congestion increasing."
        ]
      }
      Do NOT include markdown formatting or \`\`\`json in your response, just the raw JSON.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse the JSON string
    return JSON.parse(responseText);
  } catch (error) {
    console.error("PulseCore AI Error:", error);
    return null;
  }
};
