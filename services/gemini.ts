import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIService, ChatMessage } from '../types';

// ✅ Inicializa con API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export const geminiService: AIService = {
  name: 'Gemini-Service',
  async chat(messages: ChatMessage[]) {
    try {
      // ✅ Gemini espera otro formato
      const response = await genAI.getGenerativeModel({
        model: "gemini-2.5-flash-image", // ← versión correcta
      }).generateContentStream({
        contents: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [
            {
              text: Array.isArray(msg.content)
                ? msg.content
                    .filter((c: any) => c.type === 'text')
                    .map((c: any) => c.text)
                    .join('\n')
                : msg.content
            }
          ]
        }))
      });

      console.log('🤖 Gemini streaming...');

      // ✅ Stream correcto
      return (async function* () {
        for await (const chunk of response.stream) {
          const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) yield text;
        }
      })();
    } catch (error: any) {
      console.error('❌ Gemini error:', error);
      throw error;
    }
  }
};

