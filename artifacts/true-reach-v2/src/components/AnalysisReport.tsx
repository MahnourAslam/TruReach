import { ArrowLeft, ArrowUpRight, ChevronDown, FileSearch2, ShieldCheck } from 'lucide-react';
import type { AnalysisResult, DeliveryCheck } from '@workspace/api-client-react';

const formatNumber = (value: number | null) => value == null ? '—' : new Intl.NumberFormat('en-US').format(value);
const formatTime = (value: number) => {
  const safe = Math.max(0, value);
  const minutes = Math.floor(safe / 60);
  const seconds = (safe % 60).toFixed(1).padStart(4, '0');
  return `${minutes}:${seconds}`;
};
const formatDuration = (value: number | null) => value == null ? '—' : `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;

function CheckRow({ check, index }: { check: DeliveryCheck; index: number }) {
  const isVisual = check.id === 'product_shown' || check.id === 'product_first_appear';
  const detail = isVisual && !check.detail?.toLowerCase().includes('estimated from sampled frames')
    ? `${check.detail ? `${check.detail} ` : ''}(Estimated from sampled frames)`
    : check.detail;
  const statusText = { verified: 'Verified', not_detected: 'Not detected', flag: 'Flag', unknown: 'Unknown' }[check.status];
  return <div className="check-row" style={{ animationDelay: `${Math.min(index * 65, 700)}ms` }} data-testid={`row-delivery-check-${check.id}`}>
    <span className={`status-pill ${check.status}`} data-testid={`status-delivery-check-${check.id}`}>{check.status === 'verified' ? <ShieldCheck size={12} /> : <span style={{ fontSize: 12, lineHeight: 0 }}>•</span>}{statusText}</span>
    <div className="check-content"><h3>{check.label}</h3>
      {check.timestamps.length > 0 && <div className="time-chips">{check.timestamps.map((timestamp, idx) => <span className="time-chip" key={`${timestamp.start}-${idx}`}>{formatTime(timestamp.start)}{timestamp.end != null ? `–${formatTime(timestamp.end)}` : ''}</span>)}</div>}
      {detail && <p>{detail}</p>}
    </div>
  </div>;
}

export function AnalysisReport({ result, onBack }: { result: AnalysisResult; onBack: () => void }) {
  const checks = result.deliveryChecks;
  const verified = checks.filter(item => item.status === 'verified').length;
  const missing = checks.filter(item => item.status === 'not_detected').length;
  const flagged = checks.filter(item => item.status === 'flag').length;
  const verdictClass = flagged ? 'flag' : missing ? 'missing' : '';
  const recommendation = flagged ? 'Review flagged items before releasing payment.' : missing ? 'Some required deliverables were not detected. Confirm with the original video.' : 'No issues found. This post meets the contract requirements.';
  const metrics = [
    ['Views', formatNumber(result.engagement.views)],
    ['Likes', formatNumber(result.engagement.likes)],
    ['Comments', formatNumber(result.engagement.comments)],
    ['Shares', formatNumber(result.engagement.shares)],
    ['Interactions', formatNumber(result.engagement.interactions)],
    ['Engagement rate', result.engagement.engagementRatePerViews == null ? '—' : `${result.engagement.engagementRatePerViews.toFixed(2)}%`],
    ['Duration', formatDuration(result.durationSeconds)],
  ];
  const frames = result.frames.filter(frame => frame.similarityScore != null).sort((a, b) => (b.similarityScore ?? 0) - (a.similarityScore ?? 0)).slice(0, 6);
  return <main className="report-wrap">
    <button type="button" onClick={onBack} className="back-button" data-testid="button-back-to-form"><ArrowLeft size={15} /> New analysis</button>
    <div className="report-top">
      <div>
        <span className="eyebrow" style={{ color: '#a65e43' }}>Sponsorship delivery report <span style={{ color: '#93a59a' }}> / {new Date(result.fetchedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>
        <h1 data-testid="text-report-creator">{result.creator}</h1>
        <div className="report-meta">
          <span className="platform-badge">{result.platform}</span>
          <span className="source-badge" data-testid="status-report-source">{result.source === 'oriane' ? 'Live data' : 'Demo data'}</span>
          <a className="report-link" href={result.videoUrl} target="_blank" rel="noopener noreferrer" data-testid="link-original-video">{result.videoUrl} <ArrowUpRight size={13} style={{ flex: 'none' }} /></a>
        </div>
      </div>
      <div className="report-ident"><span className="eyebrow" style={{ color: '#8ba198' }}>Brand under review</span><strong data-testid="text-report-brand">{result.brand || 'Not specified'}</strong></div>
    </div>

    {checks.length > 0 && <div className={`verdict ${verdictClass}`} data-testid="status-report-verdict">
      <div className="verdict-count"><strong>{checks.length}</strong><span className="eyebrow">Checks run</span></div>
      <div className="verdict-copy"><span>{verified} verified · {missing} not detected · {flagged} flag</span><strong>{recommendation}</strong></div>
    </div>}

    <div className="report-grid" style={checks.length ? undefined : { marginTop: 30 }}>
      <section className="panel performance">
        <header className="panel-head"><div><span className="eyebrow" style={{ color: '#82968a' }}>Performance · via Oriane</span><h2>What it reached</h2></div><span className="panel-index">01</span></header>
        <div className="metric-list">
          {metrics.map(([label, value]) => <div className="metric-row" key={label}><span>{label}</span><strong data-testid={`text-metric-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</strong></div>)}
          {['Reach', 'Watch time', 'Completion rate', 'Clicks', 'Sales'].map(label => <div className="metric-row unavailable" key={label}><span>{label}</span><strong>Connect analytics</strong></div>)}
        </div>
        {result.caption && <div className="subsection"><h3 className="eyebrow">Post caption</h3><p className="caption" data-testid="text-post-caption">{result.caption}</p></div>}
        {frames.length > 0 && <div className="subsection"><h3 className="eyebrow">Sampled frames · visual similarity to brand reference</h3><div className="frames-grid">{frames.map((frame, index) => <div className="frame" key={`${frame.timestamp}-${index}`}><div className="frame-image"><img src={frame.imageUrl} alt={`Video frame sampled at ${formatTime(frame.timestamp)}`} loading="lazy" data-testid={`img-frame-${index}`} /></div><div className="frame-info"><span>{formatTime(frame.timestamp)}</span><span>{((frame.similarityScore ?? 0) * ((frame.similarityScore ?? 0) <= 1 ? 100 : 1)).toFixed(0)}%</span></div></div>)}</div></div>}
      </section>

      <section className="panel delivery">
        <header className="panel-head"><div><span className="eyebrow">Delivery · automated checks</span><h2>What was delivered</h2></div><span className="panel-index">02</span></header>
        {checks.length ? <div className="delivery-list">{checks.map((check, index) => <CheckRow check={check} index={index} key={`${check.id}-${index}`} />)}</div> :
          <div className="empty-delivery"><span className="empty-icon"><FileSearch2 size={22} strokeWidth={1.5} /></span><h3>No checks to review</h3><p>No contract requirements were set. Enter requirements to run delivery checks.</p></div>}
      </section>
    </div>

    <p className="report-footer">This report informs the payment review — it does not set or reduce the creator's fee. Visual windows are estimated from sampled frame matches, not continuous tracking.</p>
    <details className="disclosure"><summary data-testid="button-full-transcript">Full transcript <ChevronDown size={17} /></summary><div className="disclosure-body">{result.transcriptChunks.length ? result.transcriptChunks.map((chunk, index) => <div className="transcript-row" key={`${chunk.start}-${index}`}><time>{formatTime(chunk.start)}–{formatTime(chunk.end)}</time><span>{chunk.text}</span></div>) : <p className="caption">No transcript was available for this post.</p>}</div></details>
    <details className="disclosure"><summary data-testid="button-notes-limitations">Notes & limitations <ChevronDown size={17} /></summary><div className="disclosure-body">{result.limitations.length ? <ul className="limitations-list">{result.limitations.map((note, index) => <li key={index}>{note}</li>)}</ul> : <p className="caption">No additional limitations reported.</p>}</div></details>
  </main>;
}