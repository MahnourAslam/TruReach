const ORIANE_ORIGIN = "https://connect.oriane.xyz";

export const EXAMPLE_VIDEO_URL =
  "https://www.tiktok.com/@mualesandro/video/7687301269223968013";
export const EXAMPLE_PLATFORM_ID = "7687301269223968013";
export const EXAMPLE_BRAND = "CeraVe";
export const EXAMPLE_LOGO_ASSET_ID = "ast_FaMOyUVSnOZmhhDCtuV1xGmnXGGg";
export const EXAMPLE_POSTER_URL =
  "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/5_4.23.webp";

export type Platform = "tiktok" | "instagram";

export interface IndexedVideo {
  id: string;
  platform: Platform;
  platformId: string;
  profileHandle: string;
  caption: string | null;
  publishedAt: string;
  duration: number | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  interactionsCount: number;
  engagementRatePerViews: number | null;
  transcriptChunks: Array<{
    startSeconds: number;
    endSeconds: number;
    text: string;
  }> | null;
  frames: OrianeFrame[] | null;
}

export interface OrianeFrame {
  timestampSeconds: number;
  visualSimilarityScore?: number;
  url: string;
}

interface SearchResponse {
  data?: { results?: IndexedVideo[] };
}

interface AssetResponse {
  data?: { id?: string };
}

export class OrianeServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function orianePost<T>(path: string, body: unknown): Promise<T> {
  const key = process.env.ORIANE_API_KEY;
  if (!key) {
    throw new OrianeServiceError("Oriane is not configured on this server.", 503);
  }

  let response: Response;
  try {
    response = await fetch(`${ORIANE_ORIGIN}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new OrianeServiceError("Oriane did not respond. Please try again.", 502);
  }

  if (!response.ok) {
    throw new OrianeServiceError(
      `Oriane could not complete the request (HTTP ${response.status}).`,
      502,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new OrianeServiceError("Oriane returned an unreadable response.", 502);
  }
}

export async function findIndexedVideo(
  platform: Platform,
  platformId: string,
): Promise<IndexedVideo | null> {
  const result = await orianePost<SearchResponse>(
    "/rest/contents/search?projection=full&limit=1",
    {
      operator: "and",
      filters: { platformId: { includes: [{ platform, platformId }] } },
    },
  );
  const match = result.data?.results?.[0];
  return match?.platformId === platformId && match.platform === platform
    ? match
    : null;
}

export async function findVisualCandidates(
  contentId: string,
  assetId: string,
): Promise<OrianeFrame[]> {
  const result = await orianePost<SearchResponse>(
    "/rest/contents/search?projection=full&limit=1",
    {
      operator: "and",
      filters: {
        id: { includes: [contentId] },
        visualSimilarity: {
          includes: { values: [{ assetId, minScore: 0.6 }] },
        },
      },
    },
  );
  return result.data?.results?.[0]?.frames ?? [];
}

export async function createBrandTextAsset(brand: string): Promise<string> {
  const result = await orianePost<AssetResponse>("/rest/assets", {
    type: "text",
    text: `${brand} brand logo or product packaging`,
  });
  if (!result.data?.id) {
    throw new OrianeServiceError("Oriane did not return a visual asset.", 502);
  }
  return result.data.id;
}

function decodeInstagramShortcode(shortcode: string): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let id = 0n;
  for (const character of shortcode) {
    const digit = alphabet.indexOf(character);
    if (digit < 0) throw new Error("Invalid Instagram shortcode.");
    id = id * 64n + BigInt(digit);
  }
  return id.toString();
}

export function parseVideoUrl(value: string): {
  platform: Platform;
  platformId: string;
  videoUrl: string;
} | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol)) return null;

  const host = url.hostname.toLowerCase();
  if (["tiktok.com", "www.tiktok.com", "m.tiktok.com"].includes(host)) {
    const match = url.pathname.match(/^\/@[\w.-]+\/video\/(\d{12,25})\/?$/);
    return match
      ? {
          platform: "tiktok",
          platformId: match[1],
          videoUrl: `https://www.tiktok.com${url.pathname}`,
        }
      : null;
  }

  if (["instagram.com", "www.instagram.com"].includes(host)) {
    const match = url.pathname.match(/^\/(reel|p)\/([A-Za-z0-9_-]+)\/?$/);
    if (!match) return null;
    return {
      platform: "instagram",
      platformId: decodeInstagramShortcode(match[2]),
      videoUrl: `https://www.instagram.com/${match[1]}/${match[2]}/`,
    };
  }
  return null;
}