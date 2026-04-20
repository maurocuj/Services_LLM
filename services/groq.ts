import { Groq } from 'groq-sdk';
import type {AIService, ChatMessage} from '../types';

const groq = new Groq();
const GROQ_TPM_LIMIT = 8000;
const GROQ_TOKEN_BUFFER = 256;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function getMessageText(message: ChatMessage): string {
  if (typeof message.content === 'string') return message.content;
  return message.content
    .filter(part => part.type === 'text' && typeof part.text === 'string')
    .map(part => part.text as string)
    .join('\n');
}

function getCompletionBudget(messages: ChatMessage[], maxCap: number): number {
  const promptTokens = messages.reduce((total, message) => total + estimateTokens(getMessageText(message)), 0);
  const available = GROQ_TPM_LIMIT - promptTokens - GROQ_TOKEN_BUFFER;
  return Math.max(256, Math.min(maxCap, available));
}

// server-bun/src/services/groq.ts
export const groqService: AIService = {
  name: 'Groq',
  async chat(messages: ChatMessage[]) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const textMessages = messages.map(msg => ({
      role: msg.role,
      content: getMessageText(msg)
    }));
    
    // 🆕 Detectar si es visión (tiene imagen)
    const hasVision = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(part => part.type === 'image_url')
    );

    if (hasVision) {
      // 👁️ VISION MODE - Array multimodal SIEMPRE válido en Groq
      const chatCompletion = await groq.chat.completions.create({
        messages: messages as any,
        model: "meta-llama/llama-4-scout-17b-16e-instruct", // ✅ Modelo VISION
        temperature: 1,
        max_completion_tokens: 1024,
        stream: false, // JSON mode no soporta streaming
        response_format: { type: 'json_object' },
      });

      return (async function* () {
        yield chatCompletion.choices[0]?.message?.content || '{}';
      })();
    }

    // Texto puro - String simple
    if (textMessages.some(msg => msg.content.includes('JSON') || msg.content.includes('Generate'))) {
      const maxCompletionTokens = getCompletionBudget(messages, 2048);

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'Responde SOLO con JSON válido, sin bloques de código, sin markdown.' },
          ...textMessages
        ],
        model: "openai/gpt-oss-120b",
        temperature: 1,
        max_completion_tokens: maxCompletionTokens,
        top_p: 1,
        reasoning_effort: "low",
        response_format: { type: 'json_object' },
        stream: false,
      });

      return (async function* () {
        yield chatCompletion.choices[0]?.message?.content || '{}';
      })();
    }

    // Chat normal con streaming
    const maxCompletionTokens = getCompletionBudget(messages, 3072);

    const chatCompletion = await groq.chat.completions.create({
      messages: textMessages,
      model: "openai/gpt-oss-120b",
      temperature: 1,
      max_completion_tokens: maxCompletionTokens,
      top_p: 1,
      reasoning_effort: "low",
      stream: true,
    });

    return (async function* () {
      for await (const chunk of chatCompletion) {
        yield chunk.choices[0]?.delta?.content || '';
      }
    })();
  }
}
