import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is missing. Voice AI fallback to standard parsing.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
};

export const parsePosVoiceCommandAI = async (
  rawText: string,
  availableProducts: { id: string, name: string }[],
  availableCustomers: { id: string, name: string, phone: string }[]
) => {
  const ai = getAI();
  if (!ai) return null;

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
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest", 
      contents: prompt,
      config: {
        temperature: 0,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  action: { type: Type.STRING, enum: ["setCustomer", "addProduct", "newProduct", "unknown"] },
                  customerId: { type: Type.STRING, nullable: true },
                  productId: { type: Type.STRING, nullable: true },
                  quantity: { type: Type.NUMBER },
                  recognizedName: { type: Type.STRING },
                  unit: { type: Type.STRING, nullable: true }
                },
                required: ["action", "quantity", "recognizedName"]
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["items", "summary"]
        }
      }
    });

    if (response && response.text) {
      const cleanText = response.text.trim();
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
    if (error?.error?.code === 429 || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota")) {
      throw new Error("QUOTA_EXCEEDED");
    }
  }
  return null;
};
