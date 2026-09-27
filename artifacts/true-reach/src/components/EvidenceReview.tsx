import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';
import type { AnalysisResult } from '@workspace/api-client-react';
import { formatTime } from '../types/analysis';
import type { getExposureInsights } from '../types/exposure';

type Props = { analysis: AnalysisResult; insights: ReturnType<typeof getExposureInsights> };

export function EvidenceReview({ analysis, insights }: Props) {
  const duration = useMemo(() => Math.max(1, analysis.durationSeconds ?? 0, ...analysis.events.map((event) => event.end), ...analysis.frames.map((frame) => frame.timestamp), ...analysis.transcriptChunks.map((chunk) => chunk.end)), [analysis]);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showSourcePlayer, setShowSourcePlayer] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const tiktokId = analysis.platform === 'tiktok' ? analysis.videoUrl.match(/\/video\/(\d+)/)?.[1] : null;
  const sortedFrames = useMemo(() => [...analysis.frames].sort((a, b) => a.timestamp - b.timestamp), [analysis.frames]);
  const sortedEvents = useMemo(() => analysis.events.filter((event) => event.type === 'visual_candidate').sort((a, b) => a.start - b.start), [analysis.events]);
  const currentFrame = sortedFrames.length ? sortedFrames.reduce((closest, frame) => Math.abs(frame.timestamp - time) < Math.abs(closest.timestamp - time) ? frame : closest, sortedFrames[0]) : null;
  const activeEvent = sortedEvents.find((event) => event.id === selectedId && time >= event.start - .25 && time <= Math.max(event.end, event.start + 1.5))
    ?? sortedEvents.find((event) => time >= event.start && time <= Math.max(event.end, event.start + 1.5));

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      setTime((previous) => {
        const next = Math.min(duration, previous + .1);
        return next;
      });
    }, 100);
    return () => window.clearInterval(interval);
  }, [playing, duration]);

  useEffect(() => {
    if (playing && time >= duration) setPlaying(false);
  }, [playing, time, duration]);

  function seek(value: number, id: string | null = null) {
    setTime(Math.max(0, Math.min(duration, value)));
    setSelectedId(id);
  }

  return (
    <>
      <section className="review-section" aria-labelledby="review-title">
        <div className="section-title-row"><h2 id="review-title">What happened <span className="serif" style={{color:'var(--rust)'}}> / in the post</span></h2><p className="mono">SELECT A MOMENT TO INSPECT THE SOURCE EVIDENCE</p></div>
        <div className="insight-panels">
          <div className="insight-panel">
            <span className="mono eyebrow">ON SCREEN / BRAND-REFERENCE MATCH</span>
            <h3>Possible product or logo visibility</h3>
            <p>Only windows supported by at least two consecutive similar frames are estimated. A match is not proof that a product or logo appears.</p>
            {insights.visualWindows.length ? insights.visualWindows.map((window, index) =>
              <button type="button" className="insight-row visual-insight" key={`${window.start}-${index}`} onClick={() => { setPlaying(false); setShowSourcePlayer(false); seek(window.peak.timestamp); document.getElementById('frame-viewer')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} data-testid={`button-visual-window-${index}`}>
                <img src={window.peak.imageUrl} alt={`Candidate source frame sampled at ${window.peak.timestamp.toFixed(1)} seconds`} loading="lazy" />
                <span><strong>{window.start.toFixed(1)}–{window.end.toFixed(1)}s <small>estimated window</small></strong><em>{window.sampleCount} adjacent matched samples · inspect frame</em></span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : <p className="empty-evidence">No sustained visual window can be estimated from these samples. This does not establish that the product was absent.</p>}
          </div>
          <div className="insight-panel">
            <span className="mono eyebrow">SPEECH / PRODUCT USE OR COMPARISON</span>
            <h3>Actually discussing the product</h3>
            <p>Transcript-based estimate for use, comparison and benefits. Company history and passing name-drops are not counted.</p>
            {insights.productSpeechSegments.length ? insights.productSpeechSegments.map((chunk, index) =>
              <button type="button" className="insight-row speech-insight" key={`${chunk.start}-${index}`} onClick={() => { setPlaying(false); setShowSourcePlayer(false); seek(chunk.start); document.getElementById('frame-viewer')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} data-testid={`button-product-talk-${index}`}>
                <span className="mono">{chunk.start.toFixed(1)}–{chunk.end.toFixed(1)}s</span>
                <span>{chunk.text}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : <p className="empty-evidence">No product-focused speech could be inferred from the available transcript.</p>}
          </div>
        </div>
        <div className="review-layout">
          <div className="viewer" id="frame-viewer">
            <div className="viewer-heading"><span className="mono">{showSourcePlayer ? 'ORIGINAL POST / TIKTOK' : 'FRAME REVIEW / NOT VIDEO PLAYBACK'}</span><span className="mono">{sortedFrames.length} FRAME{sortedFrames.length === 1 ? '' : 'S'}</span></div>
            {tiktokId && <button type="button" className="source-toggle mono" onClick={() => { setPlaying(false); setShowSourcePlayer((value) => !value); }}>{showSourcePlayer ? 'VIEW SAMPLED FRAMES' : 'WATCH SOURCE VIDEO'}</button>}
            {showSourcePlayer && tiktokId ? (
              <div className="source-player">
                <iframe title="Original TikTok video, provided by TikTok" src={`https://www.tiktok.com/embed/v2/${tiktokId}`} loading="lazy" allow="fullscreen; autoplay; encrypted-media" allowFullScreen />
                <p>Source playback is supplied by TikTok and cannot sync to the evidence timeline. If it does not load here, <a href={analysis.videoUrl} target="_blank" rel="noopener noreferrer">open the original video</a>.</p>
              </div>
            ) : (
              <div className="frame-stage" aria-live="polite">
                {currentFrame ? <img key={currentFrame.imageUrl} src={currentFrame.imageUrl} alt={`Oriane sampled frame at ${formatTime(currentFrame.timestamp)}`} data-testid="image-current-frame" /> : <div className="frame-placeholder">No sampled frames were returned for this post. Timecoded transcript and event evidence remain available.</div>}
                {currentFrame && <span className="stage-tag mono">NEAREST SAMPLE {formatTime(currentFrame.timestamp)} · {Math.abs(currentFrame.timestamp - time).toFixed(1)}S FROM PLAYHEAD</span>}
                <span className="stage-time mono" data-testid="text-current-time">{formatTime(time)} / {formatTime(duration)}</span>
              </div>
            )}
            <p className="viewer-note">The timed review displays Oriane's nearest available sampled frame, not continuous footage. The timestamp on each frame can differ from the timeline playhead.</p>
          </div>
          <div className="evidence-panel">
            <div className="panel-top"><h3>Moment by moment</h3><button type="button" className="secondary-btn" style={{padding:'5px 0'}} onClick={() => { if (time >= duration) seek(0); setPlaying((value) => !value); }} data-testid="button-play-review" aria-label={playing ? 'Pause timed frame review' : 'Play timed frame review'}>{playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />} {playing ? 'Pause' : 'Review'}</button></div>
            <div className="timeline-wrap">
              <div className="timeline-top mono"><span>00:00</span><span>DRAG TO SCRUB</span><span>{formatTime(duration)}</span></div>
              <div className="timeline">
                <div className="timeline-track" />
                <div className="timeline-fill" style={{width:`${time / duration * 100}%`}} />
                {sortedEvents.map((event) => <span key={event.id} className={`timeline-marker ${event.type}`} style={{left:`${event.start / duration * 100}%`}} aria-hidden="true" />)}
                {insights.productSpeechSegments.map((chunk) => <span key={`talk-${chunk.start}`} className="timeline-marker spoken_mention" style={{left:`${chunk.start / duration * 100}%`}} aria-hidden="true" />)}
                <span className="timeline-thumb" style={{left:`${time / duration * 100}%`}} />
                <input className="timeline-range" data-testid="input-timeline-scrubber" type="range" min="0" max={duration} step=".1" value={time} onChange={(event) => seek(Number(event.target.value))} aria-label="Seek through analyzed post" aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`} />
              </div>
              <div className="timeline-legend mono"><span><i /> PRODUCT-FOCUSED SPEECH</span><span><i className="visual" /> VISUAL CANDIDATE</span></div>
            </div>
            <div className="events-header mono"><span>SAMPLED VISUAL MATCHES</span><span>{sortedEvents.length} CANDIDATES</span></div>
            <div className="events-list" role="group" aria-label="Timecoded events">
              {sortedEvents.length ? sortedEvents.map((event) =>
                <button type="button" key={event.id} className={`event-row ${activeEvent?.id === event.id ? 'active' : ''}`} onClick={() => { setPlaying(false); seek(event.start, event.id); }} aria-current={activeEvent?.id === event.id ? 'true' : undefined} data-testid={`button-seek-event-${event.id}`}>
                  <span className="event-time mono">{formatTime(event.start)}</span>
                  <span><span className="event-label">{event.label}</span><span className="event-text">{event.text || (event.type === 'visual_candidate' ? 'Similarity-based candidate in a sampled frame; not verified logo visibility.' : 'Timecoded observation from source analysis.')}{event.similarityScore != null ? ` · Similarity candidate ${event.similarityScore.toFixed(3)}` : ''}</span></span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              ) : <div className="empty-evidence">No timecoded events were returned by the source for this post.</div>}
            </div>
          </div>
        </div>
      </section>
      <details className="transcript-disclosure">
        <summary>Show full transcript <span className="mono">OPTIONAL SOURCE DETAIL</span></summary>
        <section className="transcript-section" aria-labelledby="transcript-title">
          <div><h2 id="transcript-title" className="serif">Transcript.</h2><p className="aside-note">Select a line to move the frame review to that point in the post. Transcript timing comes from Oriane.</p></div>
          <div className="transcript-list">
            {analysis.transcriptChunks.length ? analysis.transcriptChunks.map((chunk, index) =>
              <button className={`transcript-row ${time >= chunk.start && time <= chunk.end ? 'active' : ''}`} type="button" onClick={() => { setPlaying(false); seek(chunk.start); }} key={`${chunk.start}-${index}`} data-testid={`button-seek-transcript-${index}`}><span className="mono">{formatTime(chunk.start)}</span><span>{chunk.text}</span></button>
            ) : <p className="empty-evidence">No transcript chunks were returned for this post.</p>}
          </div>
        </section>
      </details>
    </>
  );
}