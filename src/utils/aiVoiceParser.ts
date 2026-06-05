export const parsePosVoiceCommandAI = async (
  rawText: string,
  availableProducts: { id: string, name: string }[],
  availableCustomers: { id: string, name: string, phone: string }[]
) => {
  const productListStr = availableProducts.map(p => `${p.id}:::${p.name}`).join("\n");
  const customerListStr = availableCustomers.map(c => `${c.id}:::${c.name}:::${c.phone}`).join("\n");

  const prompt = `
You are an intelligent POS assistant helping extract intents from voice queries in Bengali, Arabic, and English.
The user may want to:
1. Set a customer (e.g., "customer John" or "কাস্টমার করিম")
2. Add one or multiple products at once (e.g., "flour, 2kg sugar, onion" or "ময়দা, ২ কেজি চিনি, পেঁয়াজ")

Transcript: "${rawText.replace(/"/g, "'")}"

Available Products (ID:::NAME):
${productListStr}

Available Customers (ID:::NAME:::PHONE):
${customerListStr}

Rules:
1. Output strictly valid JSON without any markdown formatting. Ensure the JSON is complete and not truncated.
2. If the transcript is in English but represents a Bengali word (transliteration, e.g., "moyda" for "ময়দা"), match it correctly.
3. Identified items should be returned in the "items" array.
4. If a word is ambiguous, favor the matching product NAME from the list above.
`;

  try {
    const response = await fetch('/api/gemini/voice-parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        config: {
          model: "gemini-1.5-flash-latest",
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.text) {
      const cleanText = data.text.trim();
      try {
        return JSON.parse(cleanText);
      } catch (parseError) {
        console.error("JSON parse failed. Text:", cleanText);
        // Fallback: try to extract JSON if there's garbage
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          try {
            return JSON.parse(cleanText.slice(start, end + 1));
          } catch (e) {}
        }
        return { items: [], summary: "Error parsing AI response" };
      }
    }
  } catch (error: any) {
    console.error("AI parse voice command failed:", error);
    if (error?.message?.includes("QUOTA") || error?.message?.includes("429")) {
      throw new Error("QUOTA_EXCEEDED");
    }
  }
  return null;
};
