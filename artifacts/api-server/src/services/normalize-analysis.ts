import type { IndexedVideo, OrianeFrame } from "./oriane";
import {
  EXAMPLE_BRAND,
  EXAMPLE_PLATFORM_ID,
} from "./oriane";

type TranscriptChunk = { start: number; end: number; text: string };

const VISUAL_CANDIDATE_THRESHOLD = 0.8;

function occurrences(text: string, brand: string): number {
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`,
    "giu",
  );
  return [...text.matchAll(pattern)].length;
}

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function segmentLabel(chunk: TranscriptChunk, index: number, brand: string | null): string {
  if (/\b(stay tuned|follow for|link in bio|shop now)\b/i.test(chunk.text)) {
    return "Closing cue";
  }
  if (/\b(putting this to the test|using only|trying out|testing)\b/i.test(chunk.text)) {
    return "Experiment plan";
  }
  if (/\b(owned by|company|brand)\b/i.test(chunk.text)) {
    return "Brand context";
  }
  if (index === 0) return "Hook";
  if (brand && occurrences(chunk.text, brand) > 0) return "Brand mention";
  return "Story / context";
}

export function normalizeAnalysis(
  content: IndexedVideo,
  input: {
    videoUrl: string;
    brand: string | null;
    visualFrames: OrianeFrame[];
    reference: "logo" | "text" | null;
    limitations: string[];
  },
) {
  const { brand, visualFrames, reference } = input;
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
  const frames = (content.frames ?? [])
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
    .filter((frame) => frame.similarityScore !== null && frame.similarityScore >= VISUAL_CANDIDATE_THRESHOLD)
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

  return {
    source: "oriane" as const,
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
      // Oriane returns this rate in percentage points, e.g. 2.26 means 2.26%.
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
      "This is an evidence snapshot, not a determination that a paid sponsorship or contract exists.",
      "Creative segment labels and closing cues are inferred from transcript wording, not Oriane classifications.",
      "Product-focused speaking time is an estimate inferred from transcript wording; company history and closing cues are excluded, but context may still require human review.",
      "Engagement values reflect Oriane's indexed snapshot and may differ from current platform counts.",
      ...(brand
        ? [
            "Visual similarity indicates candidates, not confirmed logo or product detection; on-screen text can also score highly.",
          ]
        : ["No brand supplied: brand-specific speech and visual checks were not run."]),
      ...(content.platform === "tiktok" && content.platformId === EXAMPLE_PLATFORM_ID && brand === EXAMPLE_BRAND
        ? ["The CeraVe example is a public post used for illustration; its sponsorship status is unverified."]
        : []),
      ...input.limitations,
    ],
  };
}