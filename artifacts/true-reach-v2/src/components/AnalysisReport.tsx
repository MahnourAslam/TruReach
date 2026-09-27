import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { AnalysisResult } from '@workspace/api-client-react';
import { ContractScorecard } from './ContractScorecard';
import { EvidenceReview } from './EvidenceReview';
import { formatDate, formatNumber } from '../types/analysis';
import { getExposureInsights } from '../types/exposure';
import type { CheckStatus } from '../types/delivery';

type Props = { analysis: AnalysisResult; onBack: () => void; isExample: boolean };

type DeliveryCheckLike = { status: string };

function VerdictBanner({ checks }: { checks: DeliveryCheckLike[] }) {
  if (checks.length === 0) return null;
  const verified = checks.filter(c => c.status === 'verified').length;
  const notDetected = checks.filter(c => c.status === 'not_detected').length;
  const flags = checks.filter(c => c.status === 'flag').length;

  let recommendation = '';
  if (notDetected > 0 || flags > 0) {
    const issues: string[] = [];
    if (notDetected > 0) issues.push(`${notDetected} required item${notDetected > 1 ? 's' : ''} not detected`);
    if (flags > 0) issues.push(`${flags} item${flags > 1 ? 's' : ''} flagged for review`);
    recommendation = `Hold for review — ${issues.join(' and ')}.`;
  } else if (verified > 0) {
    recommendation = 'All checked requirements verified — ready for payment review.';
  }

  return (
    <div className="verdict-banner" data-testid="verdict-banner" role="status">
      <div className="verdict-counts">
        {verified > 0 && <span className="verdict-count verdict-verified" data-testid="verdict-verified">{verified} verified</span>}
        {notDetected > 0 && <span className="verdict-count verdict-not-detected" data-testid="verdict-not-detected">{notDetected} not detected</span>}
        {flags > 0 && <span className="verdict-count verdict-flag" data-testid="verdict-flag">{flags} flag</span>}
      </div>
      {recommendation && <p className="verdict-recommendation" data-testid="verdict-recommendation">{recommendation}</p>}
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
          <div><span className="mono eyebrow">EVIDENCE FILE / {analysis.platform.toUpperCase()}</span><h1 className="serif">The <em>closer</em> look.</h1></div>
          <div className="report-meta"><span className="source-pill mono" data-testid="text-source"><i /> LIVE {analysis.source.toUpperCase()} ANALYSIS</span></div>
        </div>
        <div className="report-subline">
          <span data-testid="text-creator"><strong>{analysis.creator}</strong>{analysis.brand ? `  ·  Looking for ${analysis.brand}` : '  ·  Brand not specified'}{analysis.publishedAt ? `  ·  Posted ${formatDate(analysis.publishedAt)}` : ''}</span>
          <a href={analysis.videoUrl} target="_blank" rel="noopener noreferrer" data-testid="link-original-video">Watch original on {analysis.platform} <ArrowUpRight size={15} /></a>
        </div>
        <div className="report-subline" style={{marginTop:0, paddingTop:14, borderBottom:0, fontSize:12}}>
          <span data-testid="text-fetched-at">Evidence fetched {formatDate(analysis.fetchedAt)}</span>
          <span>{isExample ? 'Example post · paid sponsorship not verified' : 'Observed evidence · no sponsorship determination'}</span>
        </div>
      </div>
      <div className="container report-body">
        <VerdictBanner checks={deliveryChecks} />
        <ContractScorecard analysis={analysis} insights={insights} />
        <section className="summary-section" aria-labelledby="summary-title">
            <div className="section-title-row"><h2 id="summary-title">Evidence details <span className="serif" style={{color:'var(--rust)'}}> / exposure</span></h2><p className="mono">ESTIMATES FROM SOURCE SAMPLES · REVIEW BEFORE CLAIMING VISIBILITY</p></div>
          <div className="summary-grid">
            <div className="stat stat-feature"><span className="mono">01 / ON-SCREEN SIGNAL</span><div><div className="stat-value" data-testid="text-visual-estimate">{insights.visualWindows.reduce((sum, window) => sum + window.sampleCount, 0)}<small> frames</small></div><span className="stat-label">Adjacent high-similarity samples ≥0.85; product visibility duration is not measured</span></div></div>
            <div className="stat"><span className="mono">02 / PRODUCT-FOCUSED TALK</span><div><div className="stat-value" data-testid="text-product-talk">{insights.productSpeechSeconds == null ? '—' : `~${insights.productSpeechSeconds.toFixed(1)}s`}</div><span className="stat-label">Inferred use, comparison or benefits; company backstory excluded</span></div></div>
            <div className="stat"><span className="mono">03 / VISUAL CHECK</span><div><div className="stat-value" data-testid="text-visual-candidates">{analysis.brand ? formatNumber(insights.matchedSampleCount) : '—'}<small> frames</small></div><span className="stat-label">Similarity candidates ≥0.85 to inspect; not verified logo detections</span></div></div>
            <div className="stat"><span className="mono">04 / WHAT'S MEASURED</span><div><div className="stat-value stat-word">Sampled</div><span className="stat-label">Exact product/logo screen time requires the full video</span></div></div>
          </div>
        </section>
        <EvidenceReview key={analysis.videoUrl + analysis.fetchedAt} analysis={analysis} insights={insights} />
        {analysis.caption && <section className="transcript-section" style={{paddingBottom:60}} aria-labelledby="caption-title"><div><span className="mono eyebrow">POST CONTEXT / 05</span><h2 id="caption-title" className="serif">The caption.</h2></div><div style={{borderTop:'1px solid var(--line)', paddingTop:22, lineHeight:1.7, whiteSpace:'pre-wrap'}} data-testid="text-caption">{analysis.caption}</div></section>}
      </div>
      <section className="limitations-section" aria-labelledby="limits-title"><div className="container limitations-layout">
        <div><span className="mono eyebrow">READ WITH CARE / 06</span><h2 className="serif" id="limits-title">What this <em>doesn't</em> say.</h2><p>The strongest read is an honest one. These boundaries are part of the evidence, not fine print.</p></div>
        <ul className="limitations-list">
          <li data-testid="text-visual-duration-note">{summary.visualDurationNote}</li>
          <li>Visual similarity scores identify candidates, not verified logos or proof of a brand appearance.</li>
          <li>Sampled frames cannot establish an exact duration of visibility. Review the original post for full motion and context.</li>
          <li>This report informs the payment review — it does not set or reduce the creator's fee.</li>
          <li>Content or brand mentions do not confirm a paid sponsorship or commercial relationship.</li>
          {analysis.limitations.map((limitation, index) => <li key={index} data-testid={`text-limitation-${index}`}>{limitation}</li>)}
        </ul>
      </div></section>
    </main>
  );
}
