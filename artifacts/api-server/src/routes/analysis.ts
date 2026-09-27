import { Router, type IRouter } from "express";
import {
  AnalyzeVideoBody,
  AnalyzeVideoResponse,
  GetExampleAnalysisResponse,
} from "@workspace/api-zod";
import {
  createBrandTextAsset,
  EXAMPLE_BRAND,
  EXAMPLE_LOGO_ASSET_ID,
  EXAMPLE_PLATFORM_ID,
  EXAMPLE_POSTER_URL,
  EXAMPLE_VIDEO_URL,
  findIndexedVideo,
  findVisualCandidates,
  OrianeServiceError,
  parseVideoUrl,
  type OrianeFrame,
} from "../services/oriane";
import { normalizeAnalysis } from "../services/normalize-analysis";

const router: IRouter = Router();

router.get("/analysis/example", (_req, res): void => {
  res.setHeader("Cache-Control", "no-store");
  res.json(
    GetExampleAnalysisResponse.parse({
      videoUrl: EXAMPLE_VIDEO_URL,
      brand: EXAMPLE_BRAND,
      creator: "@mualesandro",
      caption: "Which one is your fave?? #skincare #skincareasmr #acne #acneproneskin #cerave ",
      posterUrl: EXAMPLE_POSTER_URL,
    }),
  );
});

router.post("/analysis", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const parsed = AnalyzeVideoBody.safeParse({
    videoUrl: typeof req.body?.videoUrl === "string" ? req.body.videoUrl.trim() : req.body?.videoUrl,
    brand: typeof req.body?.brand === "string" ? req.body.brand.trim() : req.body?.brand,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid video URL and a brand under 80 characters." });
    return;
  }
  const source = parseVideoUrl(parsed.data.videoUrl);
  if (!source) {
    res.status(400).json({
      error: "Use a full TikTok video or Instagram reel/post URL. Short links are not supported.",
    });
    return;
  }
  const brand = parsed.data.brand || null;

  try {
    const content = await findIndexedVideo(source.platform, source.platformId);
    if (!content) {
      res.status(404).json({
        error: "This video is not in Oriane's index yet. Try the example campaign.",
      });
      return;
    }

    const isExample =
      content.platform === "tiktok" &&
      content.platformId === EXAMPLE_PLATFORM_ID &&
      brand?.toLocaleLowerCase() === EXAMPLE_BRAND.toLocaleLowerCase();
    const limitations: string[] = [];
    let visualFrames: OrianeFrame[] = [];
    let reference: "logo" | "text" | null = null;
    if (brand) {
      try {
        const assetId = isExample
          ? EXAMPLE_LOGO_ASSET_ID
          : await createBrandTextAsset(brand);
        reference = isExample ? "logo" : "text";
        visualFrames = await findVisualCandidates(content.id, assetId);
      } catch (error) {
        req.log.warn(
          { providerStatus: error instanceof OrianeServiceError ? error.status : 502 },
          "Visual similarity was unavailable",
        );
        limitations.push(
          "Visual similarity was unavailable for this request; transcript and engagement evidence are still live.",
        );
      }
    }

    res.json(
      AnalyzeVideoResponse.parse(
        normalizeAnalysis(content, {
          videoUrl: source.videoUrl,
          brand,
          visualFrames,
          reference,
          limitations,
        }),
      ),
    );
  } catch (error) {
    const status = error instanceof OrianeServiceError ? error.status : 502;
    req.log.error({ providerStatus: status }, "Oriane analysis failed");
    res.status(status).json({
      error:
        error instanceof OrianeServiceError
          ? error.message
          : "Analysis could not be completed right now.",
    });
  }
});

export default router;