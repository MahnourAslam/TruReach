type SourceVideoProps = {
  videoUrl: string;
  compact?: boolean;
};

export function SourceVideo({ videoUrl, compact = false }: SourceVideoProps) {
  let source: URL | null = null;
  try {
    const parsed = new URL(videoUrl);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') source = parsed;
  } catch {
    // An invalid or unsupported URL is never passed into an iframe or link.
  }

  const hostname = source?.hostname.toLowerCase() ?? '';
  const isTikTok = hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com');
  const isInstagram = hostname === 'instagram.com' || hostname.endsWith('.instagram.com');
  const videoId = isTikTok ? source?.pathname.match(/\/video\/([0-9]+)(?:\/|$)/)?.[1] : undefined;
  const originalUrl = (isTikTok || isInstagram) && source ? source.href : null;
  const platform = isTikTok ? 'TikTok' : isInstagram ? 'Instagram' : 'source';

  const disclaimerText = videoId
    ? "Playback is provided by TikTok, independent of Oriane's sampled evidence. It is not synced to the review timeline. If the embed is blocked, open the original post."
    : isInstagram
    ? "Review the original post on Instagram. Oriane's evidence is separate from source playback."
    : 'Only a valid TikTok or Instagram source link can be opened here.';

  return (
    <section className={`source-video${compact ? ' source-video--compact' : ''}`} aria-label="Original post" data-testid="panel-source-video">
      <div className="source-video-heading">
        <span className="mono">ORIGINAL POST / {platform.toUpperCase()}</span>
        {originalUrl && <a className="source-video-open" href={originalUrl} target="_blank" rel="noopener noreferrer" data-testid="link-source-video-original">Play on {platform} &#8599;</a>}
      </div>
      <div className="source-video-stage">
        {videoId ? (
          <iframe
            key={videoId}
            title="Original TikTok post, embedded from TikTok"
            src={`https://www.tiktok.com/player/v1/${videoId}?controls=1`}
            loading="lazy"
            allow="encrypted-media; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            data-testid="iframe-source-video"
          />
        ) : (
          <div className="source-video-unavailable" data-testid="state-source-video-unavailable">
            <p className="serif">{isInstagram ? 'Watch on Instagram.' : 'Open the original post.'}</p>
            <p>{isInstagram ? 'Instagram playback is available at the source, not simulated here.' : 'An embeddable TikTok video ID is not available for this link. The original is the source of record.'}</p>
          </div>
        )}
      </div>
      <div className="source-video-footer">
        <p data-testid="text-source-video-disclaimer">{disclaimerText}</p>
      </div>
    </section>
  );
}
