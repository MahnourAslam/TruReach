import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { AnalysisResult } from '@workspace/api-client-react';
import { EvidenceReview } from './EvidenceReview';
import { formatDate, formatNumber, formatTime } from '../types/analysis';
import { getExposureInsights } from '../types/exposure';

type Props = { analysis: AnalysisResult; onBack: () => void; isExample: boolean };

export function AnalysisReport({ analysis, onBack, isExample }: Props) {
  const { summary, engagement } = analysis;
  const insights = getExposureInsights(analysis);
  const metrics = [
    ['Views', engagement.views], ['Likes', engagement.likes], ['Comments', engagement.comments],
    ['Shares', engagement.shares], ['Interactions', engagement.interactions],
  ] as const;

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
        <section className="summary-section" aria-labelledby="summary-title">
           <div className="section-title-row"><h2 id="summary-title">Product exposure <span className="serif" style={{color:'var(--rust)'}}> / demo readout</span></h2><p className="mono">ESTIMATES FROM SOURCE SAMPLES · REVIEW BEFORE CLAIMING VISIBILITY</p></div>
          <div className="summary-grid">
            <div className="stat stat-feature"><span className="mono">01 / ON-SCREEN SIGNAL</span><div><div className="stat-value" data-testid="text-visual-estimate">{insights.visualEstimatedSeconds == null ? '—' : `~${insights.visualEstimatedSeconds.toFixed(1)}s`}</div><span className="stat-label">{insights.visualEstimatedSeconds == null ? 'Not enough consecutive matched frames to estimate' : 'Estimated brand-reference match; product or logo not confirmed'}</span></div></div>
            <div className="stat"><span className="mono">02 / PRODUCT-FOCUSED TALK</span><div><div className="stat-value" data-testid="text-product-talk">{insights.productSpeechSeconds == null ? '—' : `~${insights.productSpeechSeconds.toFixed(1)}s`}</div><span className="stat-label">Inferred use, comparison or benefits; company backstory excluded</span></div></div>
            <div className="stat"><span className="mono">03 / VISUAL CHECK</span><div><div className="stat-value" data-testid="text-visual-candidates">{analysis.brand ? formatNumber(insights.matchedSampleCount) : '—'}<small> frames</small></div><span className="stat-label">Similarity candidates to inspect; not verified logo detections</span></div></div>
            <div className="stat"><span className="mono">04 / WHAT'S MEASURED</span><div><div className="stat-value stat-word">Sampled</div><span className="stat-label">Exact product/logo screen time requires the full video</span></div></div>
          </div>
          <div className="engagement-strip" aria-label="Source-reported engagement">
            {metrics.map(([label, value]) => <div className="engagement-cell" key={label}><span className="mono">{label}</span><strong data-testid={`text-engagement-${label.toLowerCase()}`}>{formatNumber(value)}</strong></div>)}
            <div className="engagement-cell"><span className="mono">ENGAGEMENT / VIEWS</span><strong data-testid="text-engagement-rate">{engagement.engagementRatePerViews == null ? 'Not available' : `${engagement.engagementRatePerViews.toLocaleString('en-US', {maximumFractionDigits:2})}%`}</strong></div>
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
          <li>Content or brand mentions do not confirm a paid sponsorship or commercial relationship.</li>
          {analysis.limitations.map((limitation, index) => <li key={index} data-testid={`text-limitation-${index}`}>{limitation}</li>)}
        </ul>
      </div></section>
    </main>
  );
}