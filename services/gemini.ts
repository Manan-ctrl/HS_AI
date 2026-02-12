import { GoogleGenAI, Modality } from "@google/genai";
import { Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class GeminiService {
  static async generateInsight(transactions: Transaction[]): Promise<string> {
    try {
      const summary = transactions.slice(0, 10).map(t => 
        `${t.date}: ${t.type} of ₹${t.amount} for ${t.description} (${t.category})`
      ).join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these recent transactions and give a one-sentence financial tip or observation for an Indian user:\n${summary}`,
      });
      return response.text || "Keep tracking your expenses to get better insights.";
    } catch (e) {
      console.error("Insight error", e);
      return "Unable to generate insights at the moment.";
    }
  }

  static async categorizeTransaction(description: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Categorize this transaction description into a standard financial category (e.g., Food, Transport, Utilities, Entertainment, Housing, Health). Return ONLY the category name.\nDescription: ${description}`,
      });
      return response.text?.trim() || "Other";
    } catch (e) {
      return "Other";
    }
  }

  static async chat(message: string, history: string[]): Promise<{ text: string; groundingUrls?: { title: string; uri: string }[] }> {
    const context = `Previous conversation context:\n${history.join('\n')}\nUser: ${message}\nSystem: You are Aijaz, a helpful and professional financial assistant for an Indian user. Use Rupees (₹) for currency. Provide smart, actionable financial advice.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: context,
        config: {
          // Single mode with search grounding enabled for the best information quality
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text || "I couldn't generate a response.";
      const groundingUrls: { title: string; uri: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            groundingUrls.push({ title: chunk.web.title || "Source", uri: chunk.web.uri });
          }
        });
      }

      return { text, groundingUrls };
    } catch (error) {
      console.error("Chat error", error);
      return { text: "Sorry, I encountered an error processing your request." };
    }
  }

  static async generateTTSBase64(text: string): Promise<string | null> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }
            }
          }
        }
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) {
      console.error("TTS generation failed", e);
      return null;
    }
  }
}