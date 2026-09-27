import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { AnalysisResult } from '@workspace/api-client-react';
import { EvidenceReview } from './EvidenceReview';
import { formatDate, formatNumber, formatTime } from '../types/analysis';

type Props = { analysis: AnalysisResult; onBack: () => void; isExample: boolean };

export function AnalysisReport({ analysis, onBack, isExample }: Props) {
  const { summary, engagement } = analysis;
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
          <div className="section-title-row"><h2 id="summary-title">At a glance <span className="serif" style={{color:'var(--rust)'}}> / exposure</span></h2><p className="mono">SOURCE-REPORTED OBSERVATIONS, NOT A SPONSORSHIP VERDICT</p></div>
          <div className="summary-grid">
            <div className="stat stat-feature"><span className="mono">01 / SPOKEN MENTIONS</span><div><div className="stat-value" data-testid="text-spoken-mentions">{analysis.brand ? formatNumber(summary.spokenMentionCount) : '—'}</div><span className="stat-label">{analysis.brand ? 'Timecoded spoken brand mentions' : 'Supply a brand to check mentions'}</span></div></div>
            <div className="stat"><span className="mono">02 / VISUAL EVIDENCE</span><div><div className="stat-value" data-testid="text-visual-candidates">{analysis.brand ? formatNumber(summary.visualCandidateCount) : '—'}</div><span className="stat-label">{analysis.brand ? 'Similarity-based visual candidates' : 'Supply a brand to compare frames'}</span></div></div>
            <div className="stat"><span className="mono">03 / FIRST MENTION</span><div><div className="stat-value" data-testid="text-first-mention">{formatTime(summary.firstSpokenMentionSeconds)}</div><span className="stat-label">First spoken brand mention</span></div></div>
            <div className="stat"><span className="mono">04 / CAPTION</span><div><div className="stat-value" data-testid="text-caption-mention">{summary.captionMentionsBrand == null ? '—' : summary.captionMentionsBrand ? 'Yes' : 'No'}</div><span className="stat-label">Brand mentioned in caption{summary.captionMentionsBrand == null ? ' · not determined' : ''}</span></div></div>
          </div>
          <div className="engagement-strip" aria-label="Source-reported engagement">
            {metrics.map(([label, value]) => <div className="engagement-cell" key={label}><span className="mono">{label}</span><strong data-testid={`text-engagement-${label.toLowerCase()}`}>{formatNumber(value)}</strong></div>)}
            <div className="engagement-cell"><span className="mono">ENGAGEMENT / VIEWS</span><strong data-testid="text-engagement-rate">{engagement.engagementRatePerViews == null ? 'Not available' : `${engagement.engagementRatePerViews.toLocaleString('en-US', {maximumFractionDigits:2})}%`}</strong></div>
          </div>
        </section>
        <EvidenceReview key={analysis.videoUrl + analysis.fetchedAt} analysis={analysis} />
        <section className="creative-section" aria-labelledby="creative-title">
           <div className="creative-head"><div><span className="mono eyebrow">THE STRUCTURE / 04</span><h2 id="creative-title" className="serif">Transcript-derived sequence.</h2></div><p>TrueReach suggests these labels from Oriane's timecoded transcript. They are interpretations, not source-classified scenes.</p></div>
          {analysis.creativeSegments.length ? <div className="creative-list">
            {analysis.creativeSegments.map((segment, index) => <div className="creative-card" key={`${segment.start}-${index}`} data-testid={`card-creative-segment-${index}`}><span className="mono">{formatTime(segment.start)} — {formatTime(segment.end)} {segment.inferred ? ' / INFERRED' : ' / OBSERVED'}</span><h3>{segment.label}</h3><p>{segment.text}</p></div>)}
          </div> : <div className="empty-evidence">No creative segments were returned for this post.</div>}
        </section>
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