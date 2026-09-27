---
name: TrueReach v2 architecture
description: What v2 is, how it differs from v1, and the key decisions behind the rebuild.
---

## What v2 is
A separate artifact at `/true-reach-v2/`. V1 at `/true-reach/` is never touched. Both share the same `artifacts/api-server`.

## Source layout
v2 `src/` was rebuilt by copying every file from v1 verbatim, then layering improvements on top. Files kept from v2 scaffold (not replaced): `main.tsx`, `components/error-boundary.tsx`, `components/ui/`, `hooks/`, `lib/utils.ts`.

## v2 improvements applied
1. **ContractRequirements form** in `Landing.tsx` — collapsible panel below the URL form. Pre-fills CeraVe defaults when "Try example campaign" is clicked. Comma-separated fields for brandVariants and competitors.
2. **Requirements passed through `useAnalyzeVideo`** — App.tsx holds `requirements` state, passes as `{ requirements }` in the mutation data object.
3. **ContractScorecard replaced** — new two-column Performance vs Delivery layout. Left = muted Oriane engagement metrics + greyed "Connect analytics" rows. Right = `analysis.deliveryChecks` rows with colored status pills (verified/not_detected/flag/unknown) and timestamp chips.
4. **Verdict banner** in `AnalysisReport.tsx` — counts verified/not_detected/flag from `deliveryChecks`; shows a one-line recommendation ("Hold for review" or "Ready for payment review"). Hidden when deliveryChecks is empty.
5. **Updated footer** — "THIS REPORT INFORMS PAYMENT REVIEW — IT DOES NOT SET OR REDUCE THE CREATOR'S FEE."
6. **Visual threshold 0.85, gap 1.5s** in `types/exposure.ts` (v1 uses 0.80 / 0.8s). Matches the backend delivery engine.

## Key type
`DeliveryCheck` and `ContractRequirements` are defined locally in `src/types/delivery.ts`. `analysis.deliveryChecks` is accessed via a cast (`AnalysisWithChecks`) because the generated client type may not include it yet.

## Curly-quote gotcha
The SourceVideo.tsx disclaimer strings use curly Unicode apostrophes (') in v1. These break Babel JSX parsing when used inside single-quoted string literals. Fix: assign the string to a variable above the JSX return, using regular `"..."` delimiters with unicode escapes.

**Why:** JSX string literal parsing treats the curly right-single-quote (U+2019) as a closing quote delimiter.

**How to apply:** Any time you copy string content from v1 that contains typographic quotes into a JSX expression, extract to a variable with double quotes or use `\u2019`.
