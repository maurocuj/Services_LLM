# Services_LLM

Simple Bun + TypeScript API that routes chat and embedding requests across multiple LLM providers.

## What this service does

- Exposes `POST /chat` with streaming token responses (SSE).
- Exposes `POST /embed` for embeddings.
- Uses round-robin provider selection by default.
- Lets clients pin a specific chat provider per request.

## Stack

- Runtime: Bun
- Language: TypeScript (ESM)
- Providers included:
  - Chat: Groq, OpenRouter (Cerebras and Gemini present, currently disabled)
  - Embeddings: GitHub Models (`text-embedding-3-large`)

## Project layout

```text
.
├── index.ts                # Server entrypoint and routing
├── types.ts                # Shared request/service types
├── services/
│   ├── groq.ts             # Groq chat service
│   ├── openrouter.ts       # OpenRouter chat service
│   ├── github.ts           # GitHub embeddings service
│   ├── cerebras.ts         # Optional chat service (disabled)
│   └── gemini.ts           # Optional chat service (disabled)
├── src/                    # Scaffold/refactor area (mostly unused)
└── public/temp-uploads/
```

## Requirements

- Bun installed (`bun --version`)
- API keys for the providers you enable

## Environment variables

Set these in your environment (or in a local `.env` loaded by your process manager):

- `PORT` (optional, default: `3002`)
- `GROQ_API_KEY` (required if Groq is enabled)
- `OPENROUTER_API_KEY` (required if OpenRouter is enabled)
- `GITHUB_TOKEN` (required for `/embed`)
- `GOOGLE_API_KEY` (required only if Gemini is enabled)

## Install and run

```bash
bun install
bun run dev
```

Production run:

```bash
bun run start
```

## API

### Health check

`GET /health`

Response example:

```json
{
  "status": "ok",
  "chatServices": ["Groq", "OpenRouter"],
  "uptime": 123.45
}
```

### Chat

`POST /chat`

Body:

```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Say hello in one line." }
  ],
  "service": "Groq"
}
```

Notes:

- `service` is optional. If omitted (or not found), server uses round-robin.
- Response is streamed as `text/event-stream`.

### Embeddings

`POST /embed`

Body:

```json
{
  "input": "This is a document to embed"
}
```

`input` can also be an array of strings.

## Current behavior details

- Chat providers enabled by default are defined in `index.ts`.
- Embeddings currently route to `GitHub-Embeddings` only.
- There is duplicate type modeling between `types.ts` and `src/services/interfaces.ts`; active runtime path uses `types.ts`.

## Quick curl examples

```bash
curl -s http://localhost:3002/health
```

```bash
curl -N http://localhost:3002/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hola"}]}'
```

```bash
curl -s http://localhost:3002/embed \
  -H 'Content-Type: application/json' \
  -d '{"input":"embed this"}'
```
