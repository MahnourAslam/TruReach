import { ArrowLeft, ArrowUpRight, Mic2, ScanEye, MoveUpRight } from 'lucide-react';
import type { AnalysisResult } from '@workspace/api-client-react';
import { ContractScorecard, OriginalPostDisclosure } from './ContractScorecard';
import { EvidenceReview } from './EvidenceReview';
import { formatDate, formatNumber, formatTime } from '../types/analysis';
import { getExposureInsights } from '../types/exposure';

type Props = { analysis: AnalysisResult; onBack: () => void; isExample: boolean };

type DeliveryCheckLike = { status: string };

function VerdictBanner({ checks }: { checks: DeliveryCheckLike[] }) {
  const verified = checks.filter(c => c.status === 'verified').length;
  const notDetected = checks.filter(c => c.status === 'not_detected').length;
  const flags = checks.filter(c => c.status === 'flag').length;
  const unknown = checks.filter(c => c.status === 'unknown').length;
  const needsReview = notDetected > 0 || flags > 0 || unknown > 0;
  const headline = checks.length === 0 ? 'No brief to check yet.' : needsReview ? 'Review before approving.' : 'All checks passed.';
  const recommendation = checks.length === 0
    ? 'This post was analyzed, but no contract requirements were added. Add your brief to get a delivery decision.'
    : needsReview
      ? 'At least one requirement is missing or needs a closer look. Review the checklist and original post before making a payment decision.'
      : 'We found evidence for every requirement you added. Review the source before making a final payment decision.';

  return (
    <div className={`verdict-banner ${checks.length === 0 ? 'verdict-empty' : needsReview ? 'verdict-review' : 'verdict-good'}`} data-testid="verdict-banner" role="status">
      <span className="verdict-kicker mono">YOUR DELIVERY DECISION, AT A GLANCE</span>
      <h2 className="verdict-headline">{headline}</h2>
      <div className="verdict-counts">
        {verified > 0 && <span className="verdict-count verdict-verified" data-testid="verdict-verified">{verified} met</span>}
        {notDetected > 0 && <span className="verdict-count verdict-not-detected" data-testid="verdict-not-detected">{notDetected} not found</span>}
        {(flags > 0 || unknown > 0) && <span className="verdict-count verdict-flag" data-testid="verdict-flag">{flags + unknown} need review</span>}
      </div>
      <p className="verdict-recommendation" data-testid="verdict-recommendation">{recommendation}</p>
    </div>
  );
}

export function AnalysisReport({ analysis, onBack, isExample }: Props) {
  const { summary } = analysis;
  const insights = getExposureInsights(analysis);
  const deliveryChecks = (analysis as { deliveryChecks?: DeliveryCheckLike[] }).deliveryChecks ?? [];
  const firstAppearance = analysis.deliveryChecks
    .filter(check => check.id === 'visual-first-appearance' || check.id === 'verbal-first-mention')
    .flatMap(check => check.timestamps.map(timestamp => timestamp.start))
    .filter(time => Number.isFinite(time) && time >= 0)
    .sort((a, b) => a - b)[0];
  const visibilitySeconds = insights.visualWindows.reduce((sum, window) => sum + Math.max(0, window.end - window.start), 0);
  const firstCta = analysis.events.filter(event => event.type === 'closing_phrase' && Number.isFinite(event.start)).sort((a, b) => a.start - b.start)[0];
  const keyEvents = analysis.events
    .filter(event => Number.isFinite(event.start) && event.start >= 0 && (
      event.type === 'spoken_mention' && (!!analysis.brand || !!event.text?.trim()) ||
      event.type === 'visual_candidate' && (!!event.imageUrl || !!event.text?.trim()) ||
      event.type === 'closing_phrase' && (!!event.text?.trim() || !!event.label?.trim())
    ))
    .sort((a, b) => a.start - b.start);

  return (
    <main>
      <div className="container report-top">
        <button className="back-btn mono" onClick={onBack} type="button" data-testid="button-new-analysis"><ArrowLeft size={15} /> NEW ANALYSIS</button>
        <div className="report-intro">
          <div><span className="mono eyebrow">{analysis.platform.toUpperCase()} POST REPORT</span><h1 className="serif">Did they <em>deliver?</em></h1></div>
          <div className="report-meta"><span className="source-pill mono" data-testid="text-source"><i /> Live analysis</span></div>
        </div>
        <div className="report-subline">
          <span data-testid="text-creator"><strong>{analysis.creator}</strong>{analysis.brand ? `  ·  Looking for ${analysis.brand}` : '  ·  Brand not specified'}{analysis.publishedAt ? `  ·  Posted ${formatDate(analysis.publishedAt)}` : ''}</span>
          <a href={analysis.videoUrl} target="_blank" rel="noopener noreferrer" data-testid="link-original-video">Watch original on {analysis.platform} <ArrowUpRight size={15} /></a>
        </div>
        <div className="report-subline" style={{marginTop:0, paddingTop:14, borderBottom:0, fontSize:12}}>
          <span data-testid="text-fetched-at">Checked {formatDate(analysis.fetchedAt)}</span>
          <span>{isExample ? 'Example post · sponsorship not confirmed' : 'Post content checked · sponsorship not confirmed'}</span>
        </div>
      </div>
      <div className="container report-body">
        <VerdictBanner checks={deliveryChecks} />
        <section className="report-block" aria-labelledby="summary-title">
          <div className="report-block-heading"><div><span className="mono eyebrow">THE FIVE THINGS TO KNOW</span><h2 id="summary-title">At a glance</h2></div><p>The essential timing and delivery signals from this post.</p></div>
          <div className="hero-metrics">
            <div className="hero-metric"><strong className="hero-metric-number">{firstAppearance == null ? '—' : formatTime(firstAppearance)}</strong><div><span className="hero-metric-caption">First brand appearance</span><span className="hero-metric-note">First time seen or heard</span></div></div>
            <div className="hero-metric"><strong className="hero-metric-number" data-testid="text-visual-estimate">{visibilitySeconds.toFixed(1)}s</strong><div><span className="hero-metric-caption">Estimated brand visibility</span><span className="hero-metric-note" data-testid="text-visual-candidates">{analysis.brand ? `${formatNumber(insights.matchedSampleCount)} possible frames checked` : 'Add a brand to check frames'}</span></div></div>
            <div className="hero-metric"><strong className="hero-metric-number" data-testid="text-product-talk">{insights.productSpeechSeconds == null ? '—' : `${Math.round(insights.productSpeechSeconds)}s`}</strong><div><span className="hero-metric-caption">Creator talked about the product</span><span className="hero-metric-note">From the speech transcript</span></div></div>
            <div className="hero-metric"><strong className="hero-metric-number">{firstCta ? formatTime(firstCta.start) : '—'}</strong><div><span className="hero-metric-caption">Call to action timing</span><span className="hero-metric-note">First closing message</span></div></div>
            <div className="hero-metric"><strong className="hero-metric-number" data-testid="text-spoken-count">{summary.spokenMentionCount}</strong><div><span className="hero-metric-caption">Times brand was said out loud</span><span className="hero-metric-note">Based on the transcript</span></div></div>
          </div>
        </section>
        <OriginalPostDisclosure analysis={analysis} insights={insights} />
        <section className="report-block" aria-labelledby="event-log-title">
          <div className="report-block-heading"><div><span className="mono eyebrow">IN ORDER OF APPEARANCE</span><h2 id="event-log-title">What happened, when</h2></div><p>A timestamped record of brand mentions, possible product appearances and the call to action.</p></div>
          <div className="event-log">
            {keyEvents.length ? keyEvents.map(event => (
              <div className="event-log-row" key={event.id}>
                <time className="event-log-time mono">{formatTime(event.start)}</time>
                <span className={`event-log-icon ${event.type}`} aria-hidden="true">{event.type === 'spoken_mention' ? <Mic2 size={21} /> : event.type === 'visual_candidate' ? <ScanEye size={21} /> : <MoveUpRight size={21} />}</span>
                <div className="event-log-copy"><strong>{event.type === 'spoken_mention' ? analysis.brand ? `Said “${analysis.brand}”` : 'Brand name said out loud' : event.type === 'visual_candidate' ? 'Product spotted on screen' : 'Call to action'}</strong><span>{event.type === 'visual_candidate' ? 'Possible match — confirm in the original post.' : event.type === 'closing_phrase' && event.text ? `“${event.text}”` : event.type === 'spoken_mention' && event.text ? `“${event.text}”` : 'Found in the post.'}</span></div>
              </div>
            )) : <div className="event-log-empty">No key moments were available for this post. Check the original for context.</div>}
          </div>
        </section>
        <ContractScorecard analysis={analysis} insights={insights} />
        <div className="report-evidence-tail"><EvidenceReview key={analysis.videoUrl + analysis.fetchedAt} analysis={analysis} insights={insights} /></div>
        {analysis.caption && <section className="transcript-section" style={{paddingBottom:60}} aria-labelledby="caption-title"><div><span className="mono eyebrow">POST CAPTION</span><h2 id="caption-title" className="serif">What the caption says</h2></div><div style={{borderTop:'1px solid var(--line)', paddingTop:22, lineHeight:1.7, whiteSpace:'pre-wrap'}} data-testid="text-caption">{analysis.caption}</div></section>}
      </div>
      <section className="limitations-section" aria-labelledby="limits-title"><div className="container limitations-layout">
         <div><span className="mono eyebrow">BEFORE YOU DECIDE</span><h2 className="serif" id="limits-title">What to check yourself</h2><p>Use this report alongside the original post and your agreement.</p></div>
        <ul className="limitations-list">
          <li data-testid="text-visual-duration-note">{summary.visualDurationNote}</li>
           <li>Possible visual matches are not confirmation that the product or logo appeared. Open the original post to verify them.</li>
           <li>Selected frames cannot tell you exactly how long the product was visible.</li>
          <li>This report informs the payment review — it does not set or reduce the creator's fee.</li>
          <li>Content or brand mentions do not confirm a paid sponsorship or commercial relationship.</li>
          {analysis.limitations.map((limitation, index) => <li key={index} data-testid={`text-limitation-${index}`}>{limitation}</li>)}
        </ul>
      </div></section>
    </main>
  );
}
