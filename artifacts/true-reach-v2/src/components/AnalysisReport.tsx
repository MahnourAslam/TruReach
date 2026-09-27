import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { AnalysisResult } from '@workspace/api-client-react';
import { ContractScorecard } from './ContractScorecard';
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
        <ContractScorecard analysis={analysis} insights={insights} />
        <section className="summary-section" aria-labelledby="summary-title">
             <div className="section-title-row"><h2 id="summary-title">What we found in the post</h2><p>These observations help you review delivery, not replace watching the post.</p></div>
          <div className="summary-grid">
             <div className="stat stat-feature"><span className="mono">Brand appeared on screen</span><div><div className="stat-value" data-testid="text-visual-estimate">{insights.visualWindows.reduce((sum, window) => sum + window.sampleCount, 0)}<small> possible frames</small></div><span className="stat-label">Frames that may show the brand. Confirm in the original post.</span></div></div>
             <div className="stat"><span className="mono">Talked about the product</span><div><div className="stat-value" data-testid="text-product-talk">{insights.productSpeechSeconds == null ? '—' : `~${insights.productSpeechSeconds.toFixed(1)}s`}</div><span className="stat-label">Approximate time discussing use, benefits or comparisons.</span></div></div>
             <div className="stat"><span className="mono">Frames to review</span><div><div className="stat-value" data-testid="text-visual-candidates">{analysis.brand ? formatNumber(insights.matchedSampleCount) : '—'}<small> frames</small></div><span className="stat-label">{insights.visualWindows.length ? `Possible appearances around ${insights.visualWindows.slice(0, 2).map(window => formatTime(window.start)).join(' and ')}.` : 'No matching frames were found.'}</span></div></div>
             <div className="stat"><span className="mono">Said brand name out loud</span><div><div className="stat-value" data-testid="text-spoken-count">{analysis.brand ? summary.spokenMentionCount : '—'}<small> times</small></div><span className="stat-label">{summary.firstSpokenMentionSeconds != null ? `First heard at ${formatTime(summary.firstSpokenMentionSeconds)}.` : analysis.brand ? 'No mention found in the transcript.' : 'Add a brand to check spoken mentions.'}</span></div></div>
          </div>
        </section>
        <EvidenceReview key={analysis.videoUrl + analysis.fetchedAt} analysis={analysis} insights={insights} />
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
