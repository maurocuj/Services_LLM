import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";

const token = process.env["GITHUB_TOKEN"]!;
const endpoint = "https://models.github.ai";
const model = "meta/Llama-3.2-11B-Vision-Instruct";
const client = ModelClient(endpoint, new AzureKeyCredential(token));

export const githubService: AIService = {
  name: 'GitHub-Azure-Vision',
  async chat(messages: ChatMessage[]) {
    const response = await client
      .path("/inference/chat/completions")
      .post({
        body: {
          messages: messages as any,
          model,
          temperature: 1.0,
          max_tokens: 1000,
          stream: true,
        }
      });

    // ✅ response.body es STRING con SSE lines
    const sseString = response.body as string;

    return (async function* () {
      const lines = sseString.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const chunk = JSON.parse(data);
            const token = chunk.choices?.[0]?.delta?.content ?? '';
            if (token) yield token;
          } catch {}
        }
      }
    })();
  },
};
