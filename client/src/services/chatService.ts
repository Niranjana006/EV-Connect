const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';

export const sendChatMessage = async (message: string) => {
  try {
    const prompt = `You are an EV charging expert for EVConnect app. Provide helpful, concise advice on EV charging, stations, troubleshooting, and related topics. Keep responses under 100 words.

User: ${message}

Assistant:`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        },
      }),
    });
    if (!res.ok) throw new Error(`Gemini API error: ${res.statusText}`);
    const data = await res.json();
    const response = data.candidates[0].content.parts[0].text.trim();
    return { response };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return { response: 'Sorry, I encountered an error. Try again or check your connection.' };
  }
};