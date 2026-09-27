---
name: TrueReach v2 architecture
description: What changed for v2, where the new code lives, and what must stay intact for v1.
---

## Rule
v1 (`artifacts/true-reach/`) must never be touched. All backend additions to the shared API server are additive and non-breaking: new optional fields, new `deliveryChecks` array (always present, empty when no requirements sent), `source` enum now includes `fixture`.

## Key files

- `artifacts/api-server/src/services/fixture.ts` — inline CeraVe fixture data (IndexedVideo + OrianeFrame[]). Used as demo-safety fallback on any Oriane failure. Inlined as TS constants to avoid esbuild path issues.
- `artifacts/api-server/src/services/normalize-analysis.ts` — delivery checks engine (11 checks). Visual similarity threshold v2 = 0.85, grouping window = 1.5s. Shared with v1 but v1 doesn't send requirements so it always gets an empty deliveryChecks array.
- `artifacts/api-server/src/routes/analysis.ts` — fixture fallback pattern: try Oriane, catch ANY error (incl. 404/unindexed), serve fixture. `ORIANE_FORCE_FIXTURE=true` env var skips live call entirely.
- `lib/api-spec/openapi.yaml` — added ContractRequirements, DeliveryCheckStatus, DeliveryCheckTimestamp, DeliveryCheck schemas; `source` enum = [oriane, fixture]; `deliveryChecks` required array on AnalysisResult.
- `artifacts/true-reach-v2/` — new react-vite artifact at /true-reach-v2/. Built by design subagent with editorial aesthetic (mineral paper, petrol ink, terracotta accents, Instrument Serif + DM Sans).

## Delivery check IDs (in order)
brand_verbal, brand_first_mention, product_shown, product_first_appear, brand_in_caption, required_phrase, discount_code, cta, ad_disclosure, competitors, video_duration

**Why:** brand_verbal and brand_first_mention only run when `brand` is set. product_shown and product_first_appear only run when `requirements.productShown !== false && brand`. ad_disclosure only runs when `requirements.disclosureRequired`. competitors only runs when competitors list is non-empty.

## Status semantics
verified = evidence found; not_detected = checked, nothing found; flag = reviewer should confirm; unknown = required data (transcript/caption) was null. Never treat unknown as not_detected.

## CeraVe fixture visual frames
8 frames have similarity scores (stored in FIXTURE_VISUAL_FRAMES). Frames at 4.13–4.57s cluster into one window (~0.85–0.95 scores). Frame at 24.9s is isolated with score 0.99. Both windows > 0.85 threshold → product_shown = verified.
