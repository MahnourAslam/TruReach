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
import { normalizeAnalysis, type ContractRequirements } from "../services/normalize-analysis";
import { getFixture } from "../services/fixture";

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
    requirements: req.body?.requirements ?? undefined,
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

  const brand = (parsed.data.brand as string | undefined) || (
    source.platform === "tiktok" && source.platformId === EXAMPLE_PLATFORM_ID
      ? EXAMPLE_BRAND
      : null
  );

  // ContractRequirements come through as an unvalidated object from the body —
  // cast it. The OpenAPI Zod validator doesn't yet know about this field (it
  // was added to the spec and will be picked up after codegen), so we parse it
  // permissively here.
  const requirements: ContractRequirements | null =
    parsed.data.requirements != null &&
    typeof parsed.data.requirements === "object" &&
    !Array.isArray(parsed.data.requirements)
      ? (parsed.data.requirements as ContractRequirements)
      : null;

  const forceFixture = process.env.ORIANE_FORCE_FIXTURE === "true";

  // -----------------------------------------------------------------------
  // Primary path: live Oriane data
  // Fallback path: pre-loaded fixture on any error (demo safety)
  // -----------------------------------------------------------------------
  try {
    if (forceFixture) {
      throw new Error("ORIANE_FORCE_FIXTURE enabled — skipping live call");
    }

    const content = await findIndexedVideo(source.platform, source.platformId);
    if (!content) {
      // This URL is not in Oriane's index — fall back to fixture so demo never errors
      req.log.warn({ videoUrl: source.videoUrl }, "Video not indexed; serving fixture");
      const fixture = getFixture();
      res.json(
        AnalyzeVideoResponse.parse(
          normalizeAnalysis(fixture.content, {
            videoUrl: source.videoUrl,
            brand,
            visualFrames: fixture.visualFrames,
            reference: "logo",
            limitations: ["This video is not yet indexed by Oriane; the report below uses the pre-loaded CeraVe example."],
            source: "fixture",
            requirements,
          }),
        ),
      );
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
          source: "oriane",
          requirements,
        }),
      ),
    );
  } catch (error) {
    // ---- Fallback: serve fixture on any failure ----
    const isForced = forceFixture || (error instanceof Error && error.message.includes("ORIANE_FORCE_FIXTURE"));
    if (!isForced) {
      req.log.warn(
        { providerStatus: error instanceof OrianeServiceError ? error.status : 502 },
        "Oriane unavailable — serving fixture",
      );
    }
    const fixture = getFixture();
    const limitations: string[] = isForced
      ? []
      : ["Live Oriane analysis was unavailable; this report uses pre-loaded fixture data. Results reflect the CeraVe demo post."];
    try {
      res.json(
        AnalyzeVideoResponse.parse(
          normalizeAnalysis(fixture.content, {
            videoUrl: source.videoUrl,
            brand: brand ?? EXAMPLE_BRAND,
            visualFrames: fixture.visualFrames,
            reference: "logo",
            limitations,
            source: "fixture",
            requirements,
          }),
        ),
      );
    } catch (parseError) {
      req.log.error({ parseError }, "Fixture normalization failed");
      res.status(502).json({ error: "Analysis could not be completed right now." });
    }
  }
});

export default router;
