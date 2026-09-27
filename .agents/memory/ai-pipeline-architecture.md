---
name: AI pipeline architecture
description: How the yt-dlp + OpenAI pipeline works, where it lives, and its known limitations.
---

## What it does
When Oriane doesn't have a video indexed, instead of serving the CeraVe fixture, the API server runs an AI pipeline:
1. Fetches video metadata (duration, uploader, engagement) with `yt-dlp --dump-json`
2. Downloads the video with yt-dlp (mp4)
3. In parallel: extracts audio → transcribes with `gpt-4o-mini-transcribe`; extracts frames every 2s with ffmpeg (768px wide JPEGs)
4. If brand provided: scores each frame with GPT-4o Vision (gpt-5.6-luna, low detail) — returns a 0.00–1.00 similarity score
5. Runs `normalizeAnalysis()` with `source: "ai"` — produces the same `AnalysisResult` shape as Oriane

## Key files
- `artifacts/api-server/src/services/ai-pipeline.ts` — main pipeline
- `artifacts/api-server/src/routes/analysis.ts` — wires AI pipeline into the `!content` branch
- `lib/integrations-openai-ai-server/` — Replit-managed OpenAI SDK client (no user API key needed)

## Integration setup
- `setupReplitAIIntegrations({ providerSlug: "openai" })` sets `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`
- `@workspace/integrations-openai-ai-server` added to api-server package.json and tsconfig.json references
- `yt-dlp` installed as a Nix system dependency

## Source enum
`AnalysisResult.source` was extended from `[oriane, fixture]` to `[oriane, fixture, ai]` in the OpenAPI spec. Codegen ran; Zod + React hooks updated.

## Current limitations / tech debt
- **Frames returned as base64 data URIs** — the pipeline embeds frames inline in the JSON response. For long videos this can produce 10-50MB responses. Should move to object storage (Replit App Storage) with URL references.
- **No streaming progress** — the pipeline takes 30–120s. The loading UI shows generic "Retrieving evidence…" with no step-level feedback.
- **gpt-4o-mini-transcribe segments** — the API may not always return timestamped segments; the pipeline falls back to a single chunk covering the full video.
- **MAX_FRAMES_FOR_BRAND = 30** — caps vision API calls to keep cost reasonable.

## Fallback chain
Oriane (live) → AI pipeline (for non-indexed videos) → CeraVe fixture (if pipeline fails)

**Why:** The fixture always worked but gave misleading CeraVe results for any URL. AI pipeline gives real analysis for any publicly accessible TikTok/Instagram post.

## Curly-quote gotcha (unrelated but important)
v1 SourceVideo.tsx uses typographic curly quotes (') in JSX string literals — these break Babel's JSX parser. Fix by assigning strings to variables outside JSX using double quotes.
