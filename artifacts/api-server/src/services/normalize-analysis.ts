import type { IndexedVideo, OrianeFrame } from "./oriane";
import {
  EXAMPLE_BRAND,
  EXAMPLE_PLATFORM_ID,
} from "./oriane";

type TranscriptChunk = { start: number; end: number; text: string };
type ProcessedFrame = { timestamp: number; imageUrl: string; similarityScore: number | null };

const VISUAL_CANDIDATE_THRESHOLD_LEGACY = 0.8;
const VISUAL_CANDIDATE_THRESHOLD_V2 = 0.85;
const VISUAL_WINDOW_GAP_V2 = 1.5;

export type ContractRequirements = {
  brandVariants?: string[];
  minMentions?: number;
  productShown?: boolean;
  disclosureRequired?: boolean;
  competitors?: string[];
  requiredPhrase?: string | null;
  discountCode?: string | null;
  requiredCta?: string | null;
  minDurationSeconds?: number | null;
  maxDurationSeconds?: number | null;
};

export type CheckStatus = "verified" | "not_detected" | "flag" | "unknown";

export type DeliveryCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string | null;
  timestamps: Array<{ start: number; end?: number | null }>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function occurrences(text: string, brand: string): number {
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`,
    "giu",
  );
  return [...text.matchAll(pattern)].length;
}

function occurrencesAny(text: string, variants: string[]): boolean {
  return variants.some((v) => occurrences(text, v) > 0);
}

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function segmentLabel(chunk: TranscriptChunk, index: number, brand: string | null): string {
  if (/\b(stay tuned|follow for|link in bio|shop now)\b/i.test(chunk.text)) return "Closing cue";
  if (/\b(putting this to the test|using only|trying out|testing)\b/i.test(chunk.text)) return "Experiment plan";
  if (/\b(owned by|company|brand)\b/i.test(chunk.text)) return "Brand context";
  if (index === 0) return "Hook";
  if (brand && occurrences(chunk.text, brand) > 0) return "Brand mention";
  return "Story / context";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}

// ---------------------------------------------------------------------------
// Delivery checks engine
// ---------------------------------------------------------------------------

function computeDeliveryChecks(
  transcriptChunks: TranscriptChunk[],
  frames: ProcessedFrame[],
  caption: string | null,
  durationSeconds: number | null,
  brand: string | null,
  requirements: ContractRequirements,
): DeliveryCheck[] {
  const checks: DeliveryCheck[] = [];
  const variants = [
    brand ?? "",
    ...(requirements.brandVariants ?? []),
  ].filter(Boolean);

  // 1. Brand verbal mentions
  if (brand) {
    const matchingChunks = transcriptChunks.filter((c) => occurrencesAny(c.text, variants));
    const totalMentions = transcriptChunks.reduce(
      (sum, c) => sum + variants.reduce((s, v) => s + occurrences(c.text, v), 0),
      0,
    );
    const minMentions = requirements.minMentions ?? 2;
    const status: CheckStatus =
      totalMentions === 0 ? "not_detected" : totalMentions >= minMentions ? "verified" : "flag";
    const detail =
      totalMentions === 0
        ? `No verbal mention of "${brand}" found in transcript.`
        : `${totalMentions} mention${totalMentions > 1 ? "s" : ""} found (minimum required: ${minMentions}).`;
    checks.push({
      id: "brand_verbal",
      label: "Brand verbally mentioned",
      status,
      detail,
      timestamps: matchingChunks.map((c) => ({ start: c.start, end: c.end })),
    });

    // 2. First brand mention time
    const firstMention = matchingChunks[0];
    checks.push({
      id: "brand_first_mention",
      label: "First verbal mention",
      status: firstMention ? "verified" : "not_detected",
      detail: firstMention
        ? `First mention at ${formatTime(firstMention.start)}.`
        : `"${brand}" not spoken in the retrieved transcript.`,
      timestamps: firstMention ? [{ start: firstMention.start, end: firstMention.end }] : [],
    });
  }

  // 3. Product / logo shown (threshold 0.85, grouped within 1.5s)
  if (requirements.productShown !== false && brand) {
    const highFrames = frames
      .filter((f) => f.similarityScore !== null && f.similarityScore >= VISUAL_CANDIDATE_THRESHOLD_V2)
      .sort((a, b) => a.timestamp - b.timestamp);

    const windows: Array<{ start: number; end: number; peak: ProcessedFrame }> = [];
    let group: ProcessedFrame[] = [];
    const flushGroup = () => {
      if (!group.length) return;
      const peak = group.reduce((best, f) =>
        (f.similarityScore ?? 0) > (best.similarityScore ?? 0) ? f : best,
      );
      windows.push({ start: group[0].timestamp, end: group[group.length - 1].timestamp, peak });
      group = [];
    };
    for (const frame of highFrames) {
      if (group.length && frame.timestamp - group[group.length - 1].timestamp > VISUAL_WINDOW_GAP_V2) {
        flushGroup();
      }
      group.push(frame);
    }
    flushGroup();

    const status: CheckStatus = windows.length > 0 ? "verified" : "not_detected";
    const detail =
      windows.length === 0
        ? "No sampled frames scored ≥0.85 similarity. Product/logo was not detected in sampled frames — review the original video."
        : `${windows.length} estimated window${windows.length > 1 ? "s" : ""} from sampled frames scoring ≥0.85. Estimated — not continuous tracking.`;
    checks.push({
      id: "product_shown",
      label: "Product / logo on screen",
      status,
      detail,
      timestamps: windows.map((w) => ({ start: w.start, end: w.end })),
    });

    // 4. Product first appearance
    const firstFrame = highFrames[0];
    checks.push({
      id: "product_first_appear",
      label: "Product first appearance",
      status: firstFrame ? "verified" : "not_detected",
      detail: firstFrame
        ? `Earliest high-similarity frame at ${formatTime(firstFrame.timestamp)}.`
        : "No high-similarity frames found.",
      timestamps: firstFrame ? [{ start: firstFrame.timestamp }] : [],
    });
  }

  // 5. Brand in caption
  if (brand) {
    const found = caption ? occurrencesAny(caption, variants) : null;
    const hashtagMatch = caption
      ? variants.some((v) => caption.toLowerCase().includes(`#${v.toLowerCase().replace(/\s+/g, "")}`))
      : false;
    const status: CheckStatus =
      caption == null ? "unknown" : found || hashtagMatch ? "verified" : "not_detected";
    checks.push({
      id: "brand_in_caption",
      label: "Brand in caption",
      status,
      detail:
        caption == null
          ? "Caption was not retrieved."
          : found || hashtagMatch
            ? `"${brand}" or a variant appears in the caption.`
            : `"${brand}" not found in caption.`,
      timestamps: [],
    });
  }

  // 6. Required phrase
  if (requirements.requiredPhrase) {
    const phrase = requirements.requiredPhrase;
    const matchingChunk = transcriptChunks.find((c) =>
      c.text.toLowerCase().includes(phrase.toLowerCase()),
    );
    checks.push({
      id: "required_phrase",
      label: `Required phrase: "${phrase}"`,
      status: matchingChunk ? "verified" : "not_detected",
      detail: matchingChunk
        ? `Found at ${formatTime(matchingChunk.start)}: "${matchingChunk.text}"`
        : `Required phrase "${phrase}" not found in transcript.`,
      timestamps: matchingChunk ? [{ start: matchingChunk.start, end: matchingChunk.end }] : [],
    });
  }

  // 7. Discount code
  if (requirements.discountCode) {
    const code = requirements.discountCode;
    const codeLower = code.toLowerCase();
    const inTranscript = transcriptChunks.find((c) =>
      c.text.toLowerCase().includes(codeLower),
    );
    const inCaption = caption?.toLowerCase().includes(codeLower) ?? false;
    const status: CheckStatus = inTranscript || inCaption ? "verified" : "not_detected";
    const locations: string[] = [];
    if (inTranscript) locations.push(`transcript at ${formatTime(inTranscript.start)}`);
    if (inCaption) locations.push("caption");
    checks.push({
      id: "discount_code",
      label: `Discount code: "${code}"`,
      status,
      detail:
        status === "verified"
          ? `Found in: ${locations.join(", ")}.`
          : `Code "${code}" not found in transcript or caption.`,
      timestamps: inTranscript ? [{ start: inTranscript.start, end: inTranscript.end }] : [],
    });
  }

  // 8. CTA
  const ctaDefaults = [
    "link in bio",
    "use my code",
    "check out",
    "shop now",
    "swipe up",
    "click the link",
    "tap the link",
  ];
  const ctaPatterns = requirements.requiredCta
    ? [requirements.requiredCta, ...ctaDefaults]
    : ctaDefaults;
  const ctaChunk = transcriptChunks.find((c) =>
    ctaPatterns.some((p) => c.text.toLowerCase().includes(p.toLowerCase())),
  );
  checks.push({
    id: "cta",
    label: requirements.requiredCta
      ? `Required CTA: "${requirements.requiredCta}"`
      : "Call to action",
    status: ctaChunk ? "verified" : "not_detected",
    detail: ctaChunk
      ? `CTA found at ${formatTime(ctaChunk.start)}: "${ctaChunk.text}"`
      : "No call-to-action phrase found in transcript.",
    timestamps: ctaChunk ? [{ start: ctaChunk.start, end: ctaChunk.end }] : [],
  });

  // 9. Ad disclosure (UAE NMA rules)
  if (requirements.disclosureRequired) {
    const disclosurePatterns = [
      "#ad",
      "#sponsored",
      "#paidpartnership",
      "#paid_partnership",
      "paid partnership",
      "sponsored by",
      "#advertisement",
    ];
    const captionText = caption ?? "";
    const fullTranscript = transcriptChunks.map((c) => c.text).join(" ").toLowerCase();
    const captionLower = captionText.toLowerCase();

    const inCaption = disclosurePatterns.some((p) => captionLower.includes(p.toLowerCase()));
    const inTranscript = disclosurePatterns.some((p) => fullTranscript.includes(p.toLowerCase()));

    // UAE NMA: disclosure must be upfront (within first ~20 chars of caption)
    const isUpfront = disclosurePatterns.some((p) =>
      captionText.slice(0, 30).toLowerCase().includes(p.toLowerCase()),
    );

    let status: CheckStatus;
    let detail: string;
    if (!inCaption && !inTranscript) {
      status = "not_detected";
      detail =
        "No ad disclosure found (#ad, #sponsored, #paidpartnership, 'paid partnership', etc.). Required under UAE National Media Authority rules (mandatory since Feb 2026).";
    } else if (inCaption && isUpfront) {
      status = "verified";
      detail = "Disclosure found at the start of caption — compliant with UAE NMA upfront-disclosure requirement.";
    } else {
      status = "flag";
      detail =
        "Disclosure found, but not at the start of the caption. UAE NMA requires the label to be upfront and prominent, not buried mid-caption.";
    }
    checks.push({
      id: "ad_disclosure",
      label: "Ad disclosure (UAE NMA)",
      status,
      detail,
      timestamps: [],
    });
  }

  // 10. Competitor / exclusivity
  if (requirements.competitors && requirements.competitors.length > 0) {
    const flagged: Array<{ name: string; quote: string; start: number }> = [];
    for (const competitor of requirements.competitors) {
      for (const chunk of transcriptChunks) {
        if (chunk.text.toLowerCase().includes(competitor.toLowerCase())) {
          flagged.push({ name: competitor, quote: chunk.text, start: chunk.start });
        }
      }
      const captionText = caption ?? "";
      if (captionText.toLowerCase().includes(competitor.toLowerCase())) {
        if (!flagged.find((f) => f.name === competitor)) {
          flagged.push({ name: competitor, quote: `(in caption) ${captionText}`, start: -1 });
        }
      }
    }
    const status: CheckStatus = flagged.length > 0 ? "flag" : "verified";
    const detail =
      flagged.length > 0
        ? flagged
            .map((f) =>
              f.start >= 0
                ? `${f.name} at ${formatTime(f.start)}: "${f.quote}"`
                : `${f.name}: ${f.quote.slice(0, 100)}`,
            )
            .join("; ")
        : `No competitors (${requirements.competitors.join(", ")}) mentioned.`;
    checks.push({
      id: "competitors",
      label: "Exclusivity / competitors",
      status,
      detail,
      timestamps: flagged.filter((f) => f.start >= 0).map((f) => ({ start: f.start })),
    });
  }

  // 11. Video duration
  {
    const hasDurationReq =
      requirements.minDurationSeconds != null || requirements.maxDurationSeconds != null;
    if (durationSeconds == null) {
      if (hasDurationReq) {
        checks.push({
          id: "video_duration",
          label: "Video duration",
          status: "unknown",
          detail: "Duration not available in source data.",
          timestamps: [],
        });
      }
    } else {
      const min = requirements.minDurationSeconds ?? null;
      const max = requirements.maxDurationSeconds ?? null;
      const inRange =
        (min == null || durationSeconds >= min) && (max == null || durationSeconds <= max);
      const rangeText =
        min != null && max != null
          ? `${min}–${max}s`
          : min != null
            ? `≥${min}s`
            : max != null
              ? `≤${max}s`
              : null;
      checks.push({
        id: "video_duration",
        label: "Video duration",
        status: hasDurationReq ? (inRange ? "verified" : "flag") : "verified",
        detail: rangeText
          ? `${durationSeconds}s actual${inRange ? `, within ${rangeText}.` : `, outside required ${rangeText}.`}`
          : `${durationSeconds}s.`,
        timestamps: [],
      });
    }
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Main normalizer
// ---------------------------------------------------------------------------

export function normalizeAnalysis(
  content: IndexedVideo,
  input: {
    videoUrl: string;
    brand: string | null;
    visualFrames: OrianeFrame[];
    reference: "logo" | "text" | null;
    limitations: string[];
    source?: "oriane" | "fixture";
    requirements?: ContractRequirements | null;
  },
) {
  const { brand, visualFrames, reference } = input;
  const sourceType = input.source ?? "oriane";

  const transcriptChunks: TranscriptChunk[] = (content.transcriptChunks ?? [])
    .filter(
      (chunk) =>
        Number.isFinite(chunk.startSeconds) &&
        Number.isFinite(chunk.endSeconds) &&
        typeof chunk.text === "string",
    )
    .map((chunk) => ({
      start: chunk.startSeconds,
      end: chunk.endSeconds,
      text: chunk.text,
    }))
    .sort((a, b) => a.start - b.start);

  const visualScores = new Map(
    visualFrames
      .filter((frame) => Number.isFinite(frame.visualSimilarityScore))
      .map((frame) => [frame.url, frame.visualSimilarityScore as number]),
  );

  const frames: ProcessedFrame[] = (content.frames ?? [])
    .filter((frame) => Number.isFinite(frame.timestampSeconds) && typeof frame.url === "string")
    .map((frame) => ({
      timestamp: frame.timestampSeconds,
      imageUrl: frame.url,
      similarityScore: safeNumber(visualScores.get(frame.url)),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const spokenEvents = brand
    ? transcriptChunks
        .filter((chunk) => occurrences(chunk.text, brand) > 0)
        .map((chunk, index) => ({
          id: `speech-${index}-${chunk.start}`,
          type: "spoken_mention" as const,
          start: chunk.start,
          end: chunk.end,
          label: `${brand} spoken`,
          text: chunk.text,
          imageUrl: null,
          similarityScore: null,
        }))
    : [];

  const visualEvents = frames
    .filter((frame) => frame.similarityScore !== null && frame.similarityScore >= VISUAL_CANDIDATE_THRESHOLD_LEGACY)
    .map((frame, index) => ({
      id: `visual-${index}-${frame.timestamp}`,
      type: "visual_candidate" as const,
      start: frame.timestamp,
      end: frame.timestamp,
      label: "Visual similarity candidate",
      text:
        reference === "logo"
          ? `Compared with a ${brand} reference logo. Review the frame before confirming brand visibility.`
          : `Compared with a text description of ${brand}. Review the frame before confirming brand visibility.`,
      imageUrl: frame.imageUrl,
      similarityScore: frame.similarityScore,
    }));

  const closingEvents = transcriptChunks
    .filter((chunk) => /\b(stay tuned|follow for|link in bio|shop now)\b/i.test(chunk.text))
    .map((chunk, index) => ({
      id: `closing-${index}-${chunk.start}`,
      type: "closing_phrase" as const,
      start: chunk.start,
      end: chunk.end,
      label: "Possible closing call to action",
      text: chunk.text,
      imageUrl: null,
      similarityScore: null,
    }));

  const events = [...spokenEvents, ...visualEvents, ...closingEvents].sort(
    (a, b) => a.start - b.start,
  );

  const spokenMentionCount = brand
    ? transcriptChunks.reduce((sum, chunk) => sum + occurrences(chunk.text, brand), 0)
    : 0;

  const deliveryChecks: DeliveryCheck[] =
    input.requirements
      ? computeDeliveryChecks(
          transcriptChunks,
          frames,
          content.caption ?? null,
          safeNumber(content.duration),
          brand,
          input.requirements,
        )
      : [];

  return {
    source: sourceType,
    fetchedAt: new Date().toISOString(),
    videoUrl: input.videoUrl,
    platform: content.platform,
    creator: `@${content.profileHandle}`,
    caption: content.caption ?? null,
    publishedAt: content.publishedAt ?? null,
    durationSeconds: safeNumber(content.duration),
    brand,
    engagement: {
      views: safeNumber(content.viewsCount),
      likes: safeNumber(content.likesCount),
      comments: safeNumber(content.commentsCount),
      shares: safeNumber(content.sharesCount),
      interactions: safeNumber(content.interactionsCount),
      engagementRatePerViews: safeNumber(content.engagementRatePerViews),
    },
    summary: {
      spokenMentionCount,
      visualCandidateCount: visualEvents.length,
      firstSpokenMentionSeconds: spokenEvents[0]?.start ?? null,
      captionMentionsBrand: brand ? occurrences(content.caption ?? "", brand) > 0 : null,
      visualDurationNote:
        "Oriane returns sampled frames with similarity scores, not continuous product/logo tracking. The displayed timestamps are the first and last samples in a matching group, not measured visibility time. Confirm product appearance and any duration requirement against the original full video.",
    },
    transcriptChunks,
    frames,
    events,
    creativeSegments: transcriptChunks.map((chunk, index) => ({
      ...chunk,
      label: segmentLabel(chunk, index, brand),
      inferred: true,
    })),
    limitations: [
      ...(sourceType === "fixture"
        ? ["This report uses pre-loaded fixture data because the live Oriane request was unavailable."]
        : []),
      "This is an evidence snapshot, not a determination that a paid sponsorship or contract exists.",
      "Creative segment labels and closing cues are inferred from transcript wording, not Oriane classifications.",
      "Product-focused speaking time is an estimate inferred from transcript wording; company history and closing cues are excluded, but context may still require human review.",
      "Engagement values reflect Oriane's indexed snapshot and may differ from current platform counts.",
      ...(brand
        ? ["Visual similarity indicates candidates, not confirmed logo or product detection; on-screen text can also score highly."]
        : ["No brand supplied: brand-specific speech and visual checks were not run."]),
      ...(content.platform === "tiktok" && content.platformId === EXAMPLE_PLATFORM_ID && brand === EXAMPLE_BRAND
        ? ["The CeraVe example is a public post used for illustration; its sponsorship status is unverified."]
        : []),
      ...input.limitations,
    ],
    deliveryChecks,
  };
}
