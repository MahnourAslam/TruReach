# TrueReach

> **Know what was delivered. Learn what performs.**

![Version](https://img.shields.io/badge/version-hackathon%20MVP-E07A5F)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20TypeScript%20%7C%20Express-183A40)
![Built with Oriane](https://img.shields.io/badge/video%20intelligence-Oriane-5B6CFF)
![License](https://img.shields.io/badge/license-MIT-3D9970)

[![Run on Replit](https://replit.com/badge/github/MahnourAslam/TruReach)](https://replit.com/github/MahnourAslam/TruReach)

## What TrueReach Does

Brands can see views, likes, and sales after a creator posts, but those numbers do not explain how the brand was integrated into the video. TrueReach reviews the video itself and turns Oriane evidence into a clear delivery record.

### Core features

- Finds spoken brand mentions and their timestamps.
- Surfaces candidate product or logo appearances from sampled frames.
- Compares observed evidence with optional campaign requirements.
- Shows delivery checks beside available public engagement metrics.
- Estimates product-focused discussion time and creative segments.
- Keeps inferred, unavailable, and human-review-required results clearly labelled.
- Includes a curated CeraVe example for a dependable demonstration.

TrueReach supports human review. It does not make legal, sponsorship, or creator-payment decisions.

## How It Works

```text
Video URL + brand + campaign requirements
                  ↓
        Oriane transcript and frames
                  ↓
       Normalized AnalysisResult
                  ↓
 Evidence timeline + delivery checks + report
```

If a public video is not indexed by Oriane, the current Replit build can attempt a separate OpenAI, `yt-dlp`, and FFmpeg analysis. Any fallback source is identified in the report.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, TanStack Query
- **Backend:** Node.js, Express 5, Zod, esbuild
- **Video intelligence:** Oriane
- **Fallback analysis:** OpenAI, FFmpeg, `yt-dlp`
- **Contracts:** OpenAPI with Orval-generated clients
- **Workspace:** pnpm monorepo configured for Replit

## Run on Replit

1. Open the **Run on Replit** link above and import the public GitHub repository.
2. Connect Replit’s OpenAI AI Integration. The current API expects `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`.
3. Add `ORIANE_API_KEY` through Replit Secrets for live Oriane analysis.
4. Optionally add `ORIANE_FORCE_FIXTURE=true` to use the curated example.
5. Press **Run** and wait for the API and web artifacts to start.

Available interfaces:

- `/` — original TrueReach report
- `/true-reach-v2/` — enhanced contract and delivery-review interface
- `/api/healthz` — API health check

## Development Commands

Run these commands inside the imported Replit workspace. This original snapshot targets Replit's Linux environment and pnpm 10; its dependency overrides intentionally omit native packages for macOS and Windows.

```bash
pnpm install
pnpm run typecheck
pnpm run build
```

Run services individually when debugging:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/true-reach-v2 run dev
```

## Repository Guide

See [AGENTS.md](AGENTS.md) for the package map, coding conventions, security rules, and contribution workflow.

## Contributing

Contributions are welcome. Create a focused branch, run `pnpm build`, and open a pull request explaining the change and validation performed. Include screenshots for interface changes and never commit API keys.

## License

This project is available under the [MIT License](LICENSE).
