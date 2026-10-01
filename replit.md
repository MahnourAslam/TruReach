# TrueReach

TrueReach is a creator-sponsorship evidence tool that compares campaign requirements with timestamped video observations.

## Run and Operate

- Replit Run starts the API and registered web artifacts.
- `pnpm run typecheck` validates the complete workspace.
- `pnpm run build` type-checks and builds all packages.
- `pnpm --filter @workspace/api-spec run codegen` regenerates clients and Zod schemas after OpenAPI changes.

## Required Configuration

- Connect the Replit OpenAI AI Integration so the server receives `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`.
- Store `ORIANE_API_KEY` in Replit Secrets for live Oriane requests.
- Set `ORIANE_FORCE_FIXTURE=true` when demonstrating the curated fixture.
- Never expose server credentials to Vite/browser environment variables.

## Architecture

- `artifacts/true-reach/`: original interface at `/`.
- `artifacts/true-reach-v2/`: enhanced delivery-review interface at `/true-reach-v2/`.
- `artifacts/api-server/`: Express routes, Oriane adapter, normalization, fixture, and AI fallback.
- `lib/api-spec/openapi.yaml`: API contract source of truth.
- `lib/api-client-react/` and `lib/api-zod/`: generated consumers.

The frontend must consume normalized `AnalysisResult` objects rather than raw provider responses. Attribute public engagement to Oriane, label estimated video-derived metrics, and keep unavailable brand-owned metrics such as clicks or conversions distinct.

## Demo Notes

The curated CeraVe example is a public post used for illustration; its sponsorship status is not asserted. Oriane provides sampled frames rather than continuous licensed video. Treat visual similarity as candidate evidence and preserve human review.
