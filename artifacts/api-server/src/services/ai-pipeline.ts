/**
 * AI pipeline: download a TikTok/Instagram video, transcribe its audio,
 * sample frames, and run brand-detection via GPT-4o Vision.
 *
 * Returns data in the same shape as normalizeAnalysis() so the rest of the
 * system is completely unaware of the source difference.
 */

import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { promisify } from "node:util";
import { openai } from "@workspace/integrations-openai-ai-server";
import type { ContractRequirements, DeliveryCheck } from "./normalize-analysis.js";
import { normalizeAnalysis } from "./normalize-analysis.js";

const execFileAsync = promisify(execFile);

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const FRAME_INTERVAL_SECONDS = 2;   // extract one frame every N seconds
const SIMILARITY_MODEL = "gpt-5.6-luna"; // cheaper for vision classification
const TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";
const MAX_FRAMES_FOR_BRAND = 30;    // cap to control cost

// ──────────────────────────────────────────────
// Shell helpers
// ──────────────────────────────────────────────

async function run(cmd: string, args: string[]): Promise<string> {
  const { stdout, stderr } = await execFileAsync(cmd, args, { maxBuffer: 50 * 1024 * 1024 });
  if (stderr && process.env.NODE_ENV !== "production") {
    process.stderr.write(`[ai-pipeline] ${cmd}: ${stderr.slice(0, 300)}\n`);
  }
  return stdout.trim();
}

// ──────────────────────────────────────────────
// Download
// ──────────────────────────────────────────────

async function downloadVideo(videoUrl: string, outDir: string): Promise<string> {
  const outTemplate = path.join(outDir, "video.%(ext)s");
  await execFileAsync("yt-dlp", [
    "--no-playlist",
    "--format", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
    "--merge-output-format", "mp4",
    "--output", outTemplate,
    "--no-progress",
    "--quiet",
    videoUrl,
  ], { maxBuffer: 10 * 1024 * 1024 });

  const files = await fs.readdir(outDir);
  const videoFile = files.find(f => f.startsWith("video."));
  if (!videoFile) throw new Error("yt-dlp did not produce an output file");
  return path.join(outDir, videoFile);
}

// ──────────────────────────────────────────────
// Metadata extraction (duration, title, uploader)
// ──────────────────────────────────────────────

async function getVideoMeta(videoUrl: string): Promise<{
  duration: number | null;
  title: string;
  uploader: string;
  description: string;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  uploadDate: string | null;
  platform: string;
}> {
  try {
    const raw = await run("yt-dlp", [
      "--dump-json",
      "--no-playlist",
      "--no-download",
      "--quiet",
      videoUrl,
    ]);
    const meta = JSON.parse(raw);
    const platform =
      meta.extractor_key?.toLowerCase().includes("tiktok") ? "tiktok" :
      meta.extractor_key?.toLowerCase().includes("instagram") ? "instagram" :
      "unknown";
    return {
      duration: typeof meta.duration === "number" ? meta.duration : null,
      title: meta.title ?? "",
      uploader: meta.uploader ?? meta.channel ?? "",
      description: meta.description ?? "",
      viewCount: typeof meta.view_count === "number" ? meta.view_count : null,
      likeCount: typeof meta.like_count === "number" ? meta.like_count : null,
      commentCount: typeof meta.comment_count === "number" ? meta.comment_count : null,
      uploadDate: meta.upload_date
        ? `${meta.upload_date.slice(0, 4)}-${meta.upload_date.slice(4, 6)}-${meta.upload_date.slice(6, 8)}T00:00:00Z`
        : null,
      platform,
    };
  } catch {
    return {
      duration: null, title: "", uploader: "",
      description: "", viewCount: null, likeCount: null,
      commentCount: null, uploadDate: null, platform: "unknown",
    };
  }
}

// ──────────────────────────────────────────────
// Frame extraction
// ──────────────────────────────────────────────

async function extractFrames(
  videoPath: string,
  outDir: string,
  intervalSeconds: number,
): Promise<Array<{ timestamp: number; filePath: string }>> {
  const framesDir = path.join(outDir, "frames");
  await fs.mkdir(framesDir, { recursive: true });

  await execFileAsync("ffmpeg", [
    "-i", videoPath,
    "-vf", `fps=1/${intervalSeconds},scale=768:-1`,
    "-q:v", "3",
    path.join(framesDir, "frame_%04d.jpg"),
    "-y",
  ], { maxBuffer: 50 * 1024 * 1024 });

  const frameFiles = (await fs.readdir(framesDir))
    .filter(f => f.endsWith(".jpg"))
    .sort();

  return frameFiles.map((file, index) => ({
    timestamp: index * intervalSeconds,
    filePath: path.join(framesDir, file),
  }));
}

// ──────────────────────────────────────────────
// Audio extraction + transcription
// ──────────────────────────────────────────────

async function extractAndTranscribe(
  videoPath: string,
  outDir: string,
): Promise<Array<{ start: number; end: number; text: string }>> {
  const audioPath = path.join(outDir, "audio.mp3");
  await execFileAsync("ffmpeg", [
    "-i", videoPath,
    "-vn",
    "-ar", "16000",
    "-ac", "1",
    "-b:a", "64k",
    audioPath,
    "-y",
  ], { maxBuffer: 20 * 1024 * 1024 });

  const audioBuffer = await fs.readFile(audioPath);
  const { File } = await import("node:buffer");

  // Wrap as a File for the OpenAI SDK
  const audioFile = new File([audioBuffer], "audio.mp3", { type: "audio/mpeg" });

  const transcription = await (openai.audio.transcriptions as any).create({
    model: TRANSCRIPTION_MODEL,
    file: audioFile,
    response_format: "json",
    timestamp_granularities: ["segment"],
  });

  type Segment = { start?: number; end?: number; text?: string };
  const segments: Segment[] = (transcription as any).segments ?? [];

  if (segments.length > 0) {
    return segments.map((seg) => ({
      start: seg.start ?? 0,
      end: seg.end ?? 0,
      text: (seg.text ?? "").trim(),
    })).filter(s => s.text.length > 0);
  }

  // Fallback: whole text as a single chunk
  const text = typeof transcription === "string"
    ? transcription
    : (transcription as any).text ?? "";
  if (!text.trim()) return [];
  return [{ start: 0, end: 0, text: text.trim() }];
}

// ──────────────────────────────────────────────
// Brand similarity via GPT-4o Vision
// ──────────────────────────────────────────────

async function scoreBrandSimilarity(
  framePath: string,
  brand: string,
): Promise<number> {
  const imageData = await fs.readFile(framePath);
  const base64 = imageData.toString("base64");

  const response = await openai.chat.completions.create({
    model: SIMILARITY_MODEL,
    max_completion_tokens: 10,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64}`,
              detail: "low",
            },
          },
          {
            type: "text",
            text: `Rate how prominently the brand "${brand}" (its product, packaging, or logo) is visible in this frame. Reply with ONLY a number between 0.00 and 1.00. 0.00 = not visible at all, 1.00 = clearly central and prominent.`,
          },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "0";
  const score = parseFloat(raw);
  return Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : 0;
}

// ──────────────────────────────────────────────
// Frame upload: store as data URIs for inline use
// (In production, upload to object storage and return URLs)
// ──────────────────────────────────────────────

async function frameToDataUri(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

// ──────────────────────────────────────────────
// Public entry point
// ──────────────────────────────────────────────

export async function runAIPipeline(input: {
  videoUrl: string;
  brand: string | null;
  requirements?: ContractRequirements | null;
}): Promise<ReturnType<typeof normalizeAnalysis>> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "truereach-ai-"));

  try {
    // 1. Fetch metadata first (fast, no download needed)
    const meta = await getVideoMeta(input.videoUrl);

    // 2. Download video
    const videoPath = await downloadVideo(input.videoUrl, tmpDir);

    // 3. Transcription + frame extraction in parallel
    const [transcriptChunks, rawFrames] = await Promise.all([
      extractAndTranscribe(videoPath, tmpDir).catch((err) => {
        process.stderr.write(`[ai-pipeline] transcription failed: ${err.message}\n`);
        return [] as Array<{ start: number; end: number; text: string }>;
      }),
      extractFrames(videoPath, tmpDir, FRAME_INTERVAL_SECONDS),
    ]);

    // 4. Brand similarity scoring
    const framesToScore = input.brand
      ? rawFrames.slice(0, MAX_FRAMES_FOR_BRAND)
      : [];

    const similarityScores = input.brand && framesToScore.length > 0
      ? await Promise.all(
          framesToScore.map(f => scoreBrandSimilarity(f.filePath, input.brand!).catch(() => 0))
        )
      : [];

    // 5. Build frame evidence list (convert to data URIs)
    const frameEvidence = await Promise.all(
      rawFrames.map(async (f, i) => ({
        timestamp: f.timestamp,
        imageUrl: await frameToDataUri(f.filePath),
        similarityScore: i < similarityScores.length ? similarityScores[i] : null,
      }))
    );

    // 6. Build the IndexedVideo-compatible shape for normalizeAnalysis
    const platform = meta.platform || "tiktok";
    const profileHandle = meta.uploader
      ? meta.uploader.replace(/^@/, "")
      : "unknown";

    // normalizeAnalysis expects OrianeFrame[] for visual scoring
    // We pass the frames directly since we already computed similarity
    const indexedVideo = {
      platform,
      profileHandle,
      caption: meta.description || null,
      publishedAt: meta.uploadDate || null,
      duration: meta.duration,
      viewsCount: meta.viewCount,
      likesCount: meta.likeCount,
      commentsCount: meta.commentCount,
      sharesCount: null,
      interactionsCount: null,
      engagementRatePerViews: null,
      transcriptChunks: transcriptChunks.map(c => ({
        startSeconds: c.start,
        endSeconds: c.end,
        text: c.text,
      })),
      frames: frameEvidence.map(f => ({
        timestampSeconds: f.timestamp,
        url: f.imageUrl,
      })),
    };

    // Build a visual frames map so normalizeAnalysis can pick up similarity scores
    const visualFrames = frameEvidence.map(f => ({
      url: f.imageUrl,
      visualSimilarityScore: f.similarityScore,
    }));

    return normalizeAnalysis(indexedVideo as any, {
      videoUrl: input.videoUrl,
      brand: input.brand,
      visualFrames: visualFrames as any,
      reference: input.brand ? "text" : null,
      limitations: [
        "This analysis was run by the TrueReach AI pipeline, not Oriane. Transcript accuracy depends on audio quality. Brand similarity scores are GPT-4o Vision estimates, not verified detections.",
        "Frame extraction interval: one frame every 2 seconds. Short appearances between intervals may be missed.",
      ],
      source: "ai" as any,
      requirements: input.requirements ?? undefined,
    });
  } finally {
    // Clean up temp directory
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
