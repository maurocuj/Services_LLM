# agent.md

Guidance for coding agents working in this repository.

## Goal

This repo provides a lightweight LLM gateway with:

- `POST /chat` for streamed chat completions
- `POST /embed` for vector embeddings
- basic provider fail/report behavior and round-robin selection

## Source of truth

- Main runtime entrypoint: `index.ts`
- Active service implementations: `services/*.ts`
- Active shared types: `types.ts`

The `src/` folder is currently scaffold/partial refactor and is not the primary runtime path.

## How to run locally

```bash
bun install
bun run dev
```

Server defaults to port `3002` unless `PORT` is set.

## Required environment variables

- `GROQ_API_KEY` (if Groq chat service is enabled)
- `OPENROUTER_API_KEY` (if OpenRouter chat service is enabled)
- `GITHUB_TOKEN` (required for embeddings endpoint)
- `HUGGINGFACE_API_KEY` (required if HuggingFace embeddings are enabled)
- `HF_EMBED_MODEL` (optional HuggingFace embedding model)
- `HF_INFERENCE_PROVIDER` (optional HuggingFace provider override; otherwise uses auto)
- `AZURE_OPENAI_ENDPOINT` (required for Azure OpenAI embedding service)
- `AZURE_OPENAI_API_KEY` (required for Azure OpenAI embedding service)
- `AZURE_OPENAI_EMBED_MODEL` (optional, defaults to `text-embedding-3-small`)
- `GOOGLE_API_KEY` (only if Gemini service is enabled)

## API behavior notes

- `/chat` expects:
  - `messages`: array of `{ role, content }`
  - optional `service`: provider name (for example, `Groq`, `OpenRouter`)
- `/chat` returns streamed tokens via `text/event-stream`.
- `/embed` expects `input` as `string | string[]` and returns embedding objects.

## Provider toggles

Enabled providers are selected in `index.ts`:

- `servicesChat` controls chat providers.
- `servicesEmbed` controls embedding providers.

To enable/disable a provider, edit those arrays.

## Conventions to follow for changes

- Keep runtime changes in root-level files unless explicitly migrating to `src/`.
- Preserve existing response formats and status codes.
- Prefer small, focused edits over broad refactors.
- If touching provider logic, keep streaming contract (`AsyncIterable<string>`) intact.
- Avoid introducing new frameworks unless requested.

## Recommended checks after edits

```bash
bun run dev
```

Then verify:

1. `GET /health` responds with `status: ok`.
2. `POST /chat` streams text output.
3. `POST /embed` returns embeddings with configured provider token.
