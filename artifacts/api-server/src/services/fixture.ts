import type { IndexedVideo, OrianeFrame } from "./oriane";

/** Pre-loaded CeraVe fixture — real Oriane data, used when live call is unavailable. */
const FIXTURE_CONTENT: IndexedVideo = {
  id: "cnt_f52f470ea85fe389fc6dda606011",
  platform: "tiktok",
  platformId: "7687301269223968013",
  profileHandle: "mualesandro",
  caption: "Which one is your fave?? #skincare #skincareasmr #acne #acneproneskin #cerave ",
  publishedAt: "2026-09-19T17:35:19.000Z",
  duration: 27,
  viewsCount: 57400,
  likesCount: 1256,
  commentsCount: 26,
  sharesCount: 18,
  interactionsCount: 1300,
  engagementRatePerViews: 2.264808362369338,
  transcriptChunks: [
    { startSeconds: 0.022, endSeconds: 2.663, text: "What's better for your skin? CeraVe or Cetaphil?" },
    { startSeconds: 2.763, endSeconds: 4.822, text: "Well, we're about to find out because over the next couple weeks," },
    { startSeconds: 4.923, endSeconds: 9.663, text: "I'll be putting this to the test by using only CeraVe on one side of my face and Cetaphil on the other." },
    { startSeconds: 9.763, endSeconds: 12.503, text: "I don't know about you, but for the longest time, I thought they were part of the same company," },
    { startSeconds: 12.663, endSeconds: 13.603, text: "but turns out they're not." },
    { startSeconds: 13.743, endSeconds: 15.343, text: "CeraVe is owned by beauty conglomerate L'Oreal," },
    { startSeconds: 15.603, endSeconds: 19.183, text: "and Cetaphil is owned by Valderma Laboratories, a Swiss pharmaceutical company." },
    { startSeconds: 19.303, endSeconds: 21.043, text: "Both brands target people with sensitive skin." },
    { startSeconds: 21.242, endSeconds: 25.803, text: "However, I'm really curious if we'll notice any difference between the two sides of my face by the end of this experiment." },
    { startSeconds: 26.043, endSeconds: 27.742, text: "So stay tuned for the final result." },
  ],
  frames: [
    { timestampSeconds: 0.03, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/1_0.03.webp" },
    { timestampSeconds: 1.5, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/2_1.50.webp" },
    { timestampSeconds: 4.13, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/3_4.13.webp" },
    { timestampSeconds: 4.2, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/4_4.20.webp" },
    { timestampSeconds: 4.23, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/5_4.23.webp" },
    { timestampSeconds: 4.53, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/6_4.53.webp" },
    { timestampSeconds: 4.57, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/7_4.57.webp" },
    { timestampSeconds: 5.17, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/8_5.17.webp" },
    { timestampSeconds: 5.2, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/9_5.20.webp" },
    { timestampSeconds: 5.27, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/10_5.27.webp" },
    { timestampSeconds: 5.3, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/11_5.30.webp" },
    { timestampSeconds: 8.2, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/12_8.20.webp" },
    { timestampSeconds: 8.63, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/13_8.63.webp" },
    { timestampSeconds: 8.67, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/14_8.67.webp" },
    { timestampSeconds: 9.33, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/15_9.33.webp" },
    { timestampSeconds: 11.67, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/16_11.67.webp" },
    { timestampSeconds: 14.47, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/17_14.47.webp" },
    { timestampSeconds: 16.23, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/18_16.23.webp" },
    { timestampSeconds: 16.73, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/19_16.73.webp" },
    { timestampSeconds: 17.3, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/20_17.30.webp" },
    { timestampSeconds: 21.83, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/21_21.83.webp" },
    { timestampSeconds: 22.47, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/22_22.47.webp" },
    { timestampSeconds: 24.67, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/23_24.67.webp" },
    { timestampSeconds: 24.7, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/24_24.70.webp" },
    { timestampSeconds: 24.73, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/25_24.73.webp" },
    { timestampSeconds: 24.83, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/26_24.83.webp" },
    { timestampSeconds: 24.87, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/27_24.87.webp" },
    { timestampSeconds: 24.9, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/28_24.90.webp" },
  ],
};

/**
 * Similarity scores from the real Oriane visual-similarity search on the fixture post.
 * Keyed by frame URL so normalize-analysis can join them the same way it does for live data.
 */
const FIXTURE_VISUAL_FRAMES: OrianeFrame[] = [
  { timestampSeconds: 0.03, visualSimilarityScore: 0.858259379863739, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/1_0.03.webp" },
  { timestampSeconds: 1.5, visualSimilarityScore: 0.9288475513458252, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/2_1.50.webp" },
  { timestampSeconds: 4.13, visualSimilarityScore: 0.951100766658783, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/3_4.13.webp" },
  { timestampSeconds: 4.2, visualSimilarityScore: 0.9019320607185364, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/4_4.20.webp" },
  { timestampSeconds: 4.23, visualSimilarityScore: 0.9537736773490906, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/5_4.23.webp" },
  { timestampSeconds: 4.53, visualSimilarityScore: 0.8685965538024902, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/6_4.53.webp" },
  { timestampSeconds: 4.57, visualSimilarityScore: 0.8243961334228516, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/7_4.57.webp" },
  { timestampSeconds: 24.9, visualSimilarityScore: 0.9904550313949585, url: "https://oriane-frames.s3.us-east-1.amazonaws.com/tiktok/7687301269223968013/28_24.90.webp" },
];

export function getFixture(): { content: IndexedVideo; visualFrames: OrianeFrame[] } {
  return { content: FIXTURE_CONTENT, visualFrames: FIXTURE_VISUAL_FRAMES };
}
