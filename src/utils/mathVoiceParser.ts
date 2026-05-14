import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is missing. Voice AI math fallback to standard parsing.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
};

export const parseMathVoiceCommandAI = async (rawText: string): Promise<string | null> => {
  const ai = getAI();
  if (!ai) return null;

  const prompt = `
You are a high-speed mathematical expression extractor.
Input: A voice transcript in Bengali, English, or mixed.
Output: A valid JavaScript mathematical expression string (e.g., "500+302+112+70").

CONVERSION RULES (Apply strictly):
- Numbers: এক->1, দুই->2, তিন->3, চার->4, পাঁচ->5, ছয়->6, সাত->7, আট->8, নয়->9, শূন্য->0
- Tens: দশ/দশটি->10, কুড়ি->20, ত্রিশ->30, চল্লিশ->40, পঞ্চাশ->50, ৬০->60, ৭০->70, ৮০->80, ৯০->90
- Hundreds: একশো/একশ->100, দুইশ->200, তিনশো->300, চারশ->400, পাঁচশ->500, ছয়শ->600, সাতশো->700
- Multipliers: হাজার->1000, লাখ->100000
- Operators: প্লাস/যোগ/আরও/এন্ড/সাথে/মাইনাস/বিয়োগ/বাদ/ইনটু/গুণ/ভাগ/ডিভাইড -> "+", "-", "*", "/" accordingly.
- Bengali Digits: ১->1, ২->2, ৩->3, ৪->4, ৫->5, ৬->6, ৭->7, ৮->8, ৯->9, ০->0

BEHAVIOR:
1. Extract every number and operator mentioned in sequence.
2. If no operator is mentioned between numbers, assume addition (+).
3. Ignore filler words like "টাকা", "দাও", "করো", "হচ্ছে", "মোট", "হবে", "হলো", "সমান".
4. Handle long sequences (up to 40+ additions).
5. If an operator is at the end (e.g. "500 + 200 plus"), ignore the trailing operator.
6. Only output the math string. No text. 

Examples:
- "৫০০ প্লাস ২শ" -> 500+200
- "৫০২ প্লাস ৩শ ২ প্লাস ৭০ যোগ" -> 502+302+70
- "৭০২ প্লাস ৫০২ প্লাস ৩০২ প্লাস ১১২ প্লাস ৪০২ প্লাস ৬০২ প্লাস ৭০ হবে" -> 702+502+302+112+402+602+70
- "৫০০ যোগ ২০০ মাইনাস ৫০" -> 500+200-50
- "পাঁচশ দুই প্লাস ছয়শ সাত প্লাস আশি" -> 502+607+80

Transcript: "${rawText}"
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        temperature: 0,
        maxOutputTokens: 64,
      }
    });

    if (response && response.text) {
      const result = response.text.trim();
      return result === "ERROR" ? null : result;
    }
  } catch (error: any) {
    console.error("AI parse math voice command failed:", error);
  }
  return null;
};
