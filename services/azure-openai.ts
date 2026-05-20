import OpenAI from 'openai';
import type { EmbedService, EmbeddingRequest, EmbeddingResponse } from '../types';

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const model = process.env.AZURE_OPENAI_EMBED_MODEL || 'text-embedding-3-small';

function resolveAzureConfig(rawEndpoint: string): { baseURL: string; apiVersion?: string } {
  const parsed = new URL(rawEndpoint);
  const apiVersion = parsed.searchParams.get('api-version') ?? undefined;

  const deploymentMatch = parsed.pathname.match(/\/openai\/deployments\/([^/]+)/);
  if (deploymentMatch) {
    const deployment = deploymentMatch[1];
    return {
      baseURL: `${parsed.origin}/openai/deployments/${deployment}`,
      apiVersion,
    };
  }

  return {
    baseURL: rawEndpoint,
    apiVersion,
  };
}

function createClient(): OpenAI {
  if (!endpoint) {
    throw new Error('Missing AZURE_OPENAI_ENDPOINT');
  }
  if (!apiKey) {
    throw new Error('Missing AZURE_OPENAI_API_KEY');
  }

  const { baseURL, apiVersion } = resolveAzureConfig(endpoint);

  return new OpenAI({
    baseURL,
    apiKey,
    ...(apiVersion ? { defaultQuery: { 'api-version': apiVersion } } : {}),
  });
}

export const azureOpenAIEmbedService: EmbedService = {
  name: 'AzureOpenAI-Embeddings',
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse[]> {
    const client = createClient();
    const response = await client.embeddings.create({
      model,
      input: request.input,
    });

    return response.data.map((item) => ({
      object: item.object,
      embedding: item.embedding,
      index: item.index,
    }));
  },
};
