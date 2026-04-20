import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import type { EmbedService, EmbeddingRequest, EmbeddingResponse } from "../types";

const token = process.env["GITHUB_TOKEN"]!;
const endpoint = "https://models.github.ai";
const model = "openai/text-embedding-3-large";
const client = ModelClient(endpoint, new AzureKeyCredential(token));

export const githubService: EmbedService = {
  name: "GitHub-Embeddings",

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse[]> {
    const response = await (client as any)
      .path("/inference/embeddings")
      .post({
        body: {
          model,
          input: request.input, // string | string[]
        },
      });

    if (isUnexpected(response)) {
      throw new Error(
        (response.body as any)?.error?.message ?? "Unknown embeddings error"
      );
    }

    const body = response.body as any;
    // body.data es un array de objetos: { object, embedding, index } [web:56][web:57]
    const data = body.data ?? [];

    const result: EmbeddingResponse[] = data.map((item: any) => ({
      object: item.object,
      embedding: item.embedding,
      index: item.index,
    }));

    return result;
  },
};
