import type { AnalysisResult } from '@workspace/api-client-react';

type Frame = AnalysisResult['frames'][number];
type Chunk = AnalysisResult['transcriptChunks'][number];

export type VisualWindow = {
  start: number;
  end: number;
  peak: Frame;
  sampleCount: number;
};

const MATCH_THRESHOLD = 0.8;
const MAX_GAP_SECONDS = 0.8;
const MAX_EDGE_SECONDS = 0.75;

// A single matched image can be text or an unrelated object. Only consecutive
// positive samples form a duration proxy, bounded by neighboring sample times.
export function getExposureInsights(analysis: AnalysisResult) {
  const frames = [...analysis.frames].sort((a, b) => a.timestamp - b.timestamp);
  const visualWindows: VisualWindow[] = [];
  let group: number[] = [];
  const flush = () => {
    if (group.length < 2) { group = []; return; }
    const firstIndex = group[0];
    const lastIndex = group[group.length - 1];
    const first = frames[firstIndex];
    const last = frames[lastIndex];
    const previous = frames[firstIndex - 1];
    const next = frames[lastIndex + 1];
    const start = Math.max(0, first.timestamp - Math.min(MAX_EDGE_SECONDS, previous ? (first.timestamp - previous.timestamp) / 2 : MAX_EDGE_SECONDS));
    const end = Math.min(
      analysis.durationSeconds ?? Number.POSITIVE_INFINITY,
      last.timestamp + Math.min(MAX_EDGE_SECONDS, next ? (next.timestamp - last.timestamp) / 2 : MAX_EDGE_SECONDS),
    );
    const peak = group.map((index) => frames[index]).reduce((best, frame) =>
      (frame.similarityScore ?? 0) > (best.similarityScore ?? 0) ? frame : best,
    );
    visualWindows.push({ start, end: Math.max(start, end), peak, sampleCount: group.length });
    group = [];
  };

  frames.forEach((frame, index) => {
    if (frame.similarityScore == null || frame.similarityScore < MATCH_THRESHOLD) { flush(); return; }
    if (group.length && frame.timestamp - frames[group[group.length - 1]].timestamp > MAX_GAP_SECONDS) flush();
    group.push(index);
  });
  flush();

  const productSpeechSegments: Chunk[] = analysis.brand ? analysis.transcriptChunks.filter((chunk) => {
    const text = chunk.text.toLowerCase();
    // Exclude ownership, company history, and generic closing phrases even
    // when they say the brand's name.
    if (/\b(owned by|same company|conglomerate|laborator(?:y|ies)|pharmaceutical company|turns out|stay tuned|follow for)\b/i.test(text)) return false;
    return /\b(skin|product|cream|serum|ingredient|apply|applying|using|use|testing|test|try|trying|compare|comparison|better|difference|results?|sensitive|acne|experiment|performance|works?)\b/i.test(text);
  }) : [];

  return {
    visualWindows,
    visualEstimatedSeconds: visualWindows.length
      ? visualWindows.reduce((sum, window) => sum + window.end - window.start, 0)
      : null,
    productSpeechSegments,
    productSpeechSeconds: productSpeechSegments.length
      ? productSpeechSegments.reduce((sum, chunk) => sum + Math.max(0, chunk.end - chunk.start), 0)
      : null,
    matchedSampleCount: frames.filter((frame) => frame.similarityScore != null && frame.similarityScore >= MATCH_THRESHOLD).length,
  };
}