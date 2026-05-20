import { HfInference } from '@huggingface/inference';
import type { EmbedService, EmbeddingRequest, EmbeddingResponse } from '../types';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
const model = process.env.HF_EMBED_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
type HfFeatureExtractionArgs = Parameters<typeof hf.featureExtraction>[0];
const provider = "hf-inference" as HfFeatureExtractionArgs['provider'];

function normalizeEmbeddings(raw: number[] | number[][]): EmbeddingResponse[] {
  if (Array.isArray(raw[0])) {
    return (raw as number[][]).map((embedding, index) => ({
      object: 'embedding',
      embedding,
      index,
    }));
  }

  return [
    {
      object: 'embedding',
      embedding: raw as number[],
      index: 0,
    },
  ];
}

export const huggingfaceService: EmbedService = {
  name: 'HuggingFace-Embeddings',
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse[]> {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('Missing HUGGINGFACE_API_KEY');
    }

    const output = await hf.featureExtraction({
      model,
      ...(provider ? { provider } : {}),
      inputs: request.input,
    });

    return normalizeEmbeddings(output as number[] | number[][]);
  },
};
