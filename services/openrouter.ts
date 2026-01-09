import {OpenRouter} from "@openrouter/sdk";
import type { AIService, ChatMessage } from '../type';

const openrouter = new OpenRouter();

export const openrouterService: AIService = {
  name: 'OpenRouter-Fetch',
  async chat(messages: ChatMessage[]) {
    // Filtra system para visión
    const visionMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-vl-7b-instruct:free',
        messages: visionMessages,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter ${response.status}: ${error}`);
    }

    // ✅ SSE streaming igual que GitHub
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    return (async function* () {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                const token = parsed.choices?.[0]?.delta?.content ?? '';
                if (token) yield token;
              } catch {}
            }
          }
        }
      } catch (error) {
        console.error('OpenRouter stream error:', error);
      }
    })();
  },
};
