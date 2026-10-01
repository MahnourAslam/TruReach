# Repository Guidelines

## Project Structure & Module Organization

TrueReach is a pnpm workspace built for Replit. The primary interfaces are `artifacts/true-reach/` and `artifacts/true-reach-v2/`; shared API routes and analysis services live in `artifacts/api-server/`. Treat `lib/api-spec/openapi.yaml` as the API source of truth. Generated React clients and Zod schemas live in `lib/api-client-react/` and `lib/api-zod/`. Curated demo evidence is stored under `attached_assets/`.

## Build, Test, and Development Commands

- `pnpm install`: install workspace dependencies.
- `pnpm run typecheck`: validate libraries, applications, and scripts.
- `pnpm run build`: type-check and build every package.
- `pnpm --filter @workspace/api-server run dev`: start the API service.
- `pnpm --filter @workspace/true-reach-v2 run dev`: start the enhanced web interface.
- `pnpm --filter @workspace/api-spec run codegen`: regenerate API clients after contract changes.

## Coding Style & Naming Conventions

Use two-space indentation, `PascalCase` React components, `camelCase` functions, and focused modules. Keep provider-specific shapes inside server adapters; UI components should consume only normalized `AnalysisResult` data. Run Prettier and TypeScript checks before committing.

## Testing Guidelines

Add `*.test.ts` or `*.test.tsx` files beside the behavior they cover. Prioritize URL validation, normalization, delivery-check logic, fixture behavior, loading/error states, and timestamp seeking. Until automated coverage is expanded, `pnpm run build` is the required baseline check.

## Commit & Pull Request Guidelines

Use short imperative commit subjects such as `Improve evidence timeline`. Pull requests should explain the user-visible change, list validation performed, link relevant issues, and include screenshots for UI changes. Keep generated API files synchronized with the OpenAPI contract.

## Security & Evidence Rules

Store `ORIANE_API_KEY` and integration credentials only in Replit Secrets. Never commit or log keys. Label inferred durations and fallback results, separate public platform metrics from brand-owned analytics, and avoid presenting candidate visual matches as confirmed compliance.
