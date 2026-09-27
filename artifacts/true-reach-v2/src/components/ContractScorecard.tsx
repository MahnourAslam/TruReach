import type { AnalysisResult } from '@workspace/api-client-react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { getExposureInsights } from '../types/exposure';
import { formatNumber, formatTime } from '../types/analysis';
import { formatCheckTime } from '../types/delivery';
import type { CheckStatus, DeliveryCheck } from '../types/delivery';
import { SourceVideo } from './SourceVideo';

type Props = {
  analysis: AnalysisResult;
  insights: ReturnType<typeof getExposureInsights>;
};

// Cast analysis to access deliveryChecks which may not be in generated types yet
type AnalysisWithChecks = AnalysisResult & { deliveryChecks?: DeliveryCheck[] };

function StatusPill({ status }: { status: CheckStatus }) {
  const labels: Record<CheckStatus, string> = {
    verified: 'Found in post',
    not_detected: 'Not found',
    flag: 'Needs review',
    unknown: 'Could not check',
  };
  return (
    <span className={`delivery-pill delivery-pill-${status}`} aria-label={`Status: ${labels[status]}`}>
      <i aria-hidden="true" />
      {labels[status]}
    </span>
  );
}

function plainDetail(value: string): string {
  return value
    .replace(/Oriane(?:'s)?/gi, 'The analysis')
    .replace(/(?:≥|>=)\s*0\.85/gi, '')
    .replace(/visual similarity candidates?/gi, 'possible visual matches')
    .replace(/similarity candidates?/gi, 'possible matches')
    .replace(/sampled frames?/gi, 'checked frames')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function TimestampChip({ start, end }: { start: number; end?: number | null }) {
  const label = end != null && Math.abs(end - start) > 0.5
    ? `${formatCheckTime(start)}–${formatCheckTime(end)}`
    : formatCheckTime(start);
  return <span className="ts-chip mono">{label}</span>;
}

function DeliveryCheckRow({ check }: { check: DeliveryCheck }) {
  return (
    <div className="delivery-check-row" data-testid={`delivery-check-${check.id}`}>
      <span className={`delivery-status-mark delivery-status-mark-${check.status}`} aria-hidden="true">{check.status === 'verified' ? <Check size={17} strokeWidth={3} /> : check.status === 'not_detected' ? <X size={17} strokeWidth={3} /> : <AlertTriangle size={16} strokeWidth={2.5} />}</span>
      <div className="delivery-check-head">
        <span className="delivery-check-label">{check.label}</span>
        <StatusPill status={check.status as CheckStatus} />
      </div>
      {check.detail && <p className="delivery-check-detail">{plainDetail(check.detail)}</p>}
      {check.timestamps.length > 0 && (
        <div className="delivery-check-timestamps">
          {check.timestamps.slice(0, 6).map((ts, i) => (
            <TimestampChip key={i} start={ts.start} end={ts.end} />
          ))}
          {check.timestamps.length > 6 && <span className="ts-chip ts-chip-more mono">+{check.timestamps.length - 6} more</span>}
        </div>
      )}
    </div>
  );
}

export function ContractScorecard({ analysis, insights }: Props) {
  const casted = analysis as AnalysisWithChecks;
  const deliveryChecks: DeliveryCheck[] = casted.deliveryChecks ?? [];
  const { engagement } = analysis;

  return (
    <section className="contract-scorecard" aria-labelledby="contract-scorecard-title" data-testid="section-contract-scorecard">
      <div className="contract-scorecard-intro">
        <div>
          <span className="mono eyebrow">THE POST & WHAT WE FOUND</span>
          <h2 id="contract-scorecard-title" className="serif">See it for <em>yourself.</em></h2>
        </div>
        <p>The original post and a short summary, side by side. Check the evidence before signing off on delivery.</p>
      </div>

      {/* Source video + key signals — identical to v1 */}
      <div className="contract-source-layout" data-testid="panel-source-and-results">
        <SourceVideo videoUrl={analysis.videoUrl} />
        <div className="contract-source-results">
          <div className="contract-source-results-head">
            <div>
              <span className="mono eyebrow">POST CONTENT</span>
              <h3>What we found</h3>
            </div>
            <span className="mono">CHECK AGAINST THE ORIGINAL</span>
          </div>
          <dl className="contract-key-results">
            <div className="contract-key-result" data-testid="summary-contract-visual">
              <dt>Brand on screen</dt>
              <dd>
                <strong data-testid="text-summary-result-visual">
                  {insights.visualWindows.length === 0
                    ? 'No likely appearances found'
                    : `${insights.visualWindows.reduce((s, w) => s + w.sampleCount, 0)} possible frames · ${insights.visualWindows.map(w => formatTime(w.start)).join(', ')}`}
                </strong>
                <span>Possible appearances in checked frames. Open the post to confirm.</span>
              </dd>
            </div>
            <div className="contract-key-result" data-testid="summary-contract-spoken">
              <dt>Brand said aloud</dt>
              <dd>
                <strong data-testid="text-summary-result-spoken">
                  {!analysis.brand ? 'Add a brand to check' : analysis.summary.spokenMentionCount > 0 ? `${analysis.summary.spokenMentionCount} mention${analysis.summary.spokenMentionCount === 1 ? '' : 's'} of ${analysis.brand}` : 'No mention found'}
                </strong>
                <span>{analysis.summary.firstSpokenMentionSeconds != null ? `First heard at ${formatTime(analysis.summary.firstSpokenMentionSeconds)}. ` : ''}Based on the speech transcript.</span>
              </dd>
            </div>
            <div className="contract-key-result" data-testid="summary-contract-caption">
              <dt>Brand in caption</dt>
              <dd>
                <strong data-testid="text-summary-result-caption">
                  {analysis.summary.captionMentionsBrand == null ? 'Add a brand to check' : analysis.summary.captionMentionsBrand ? `Yes — ${analysis.brand} is mentioned` : 'No mention found'}
                </strong>
                <span>Checks the written caption, not text inside the video.</span>
              </dd>
            </div>
          </dl>
          <div className="contract-source-metrics" data-testid="panel-platform-metrics">
            <span className="mono">PUBLIC POST NUMBERS · AT TIME OF CHECK</span>
            <dl className="contract-metric-list">
              {[
                { label: 'Views', value: formatNumber(engagement.views) },
                { label: 'Likes', value: formatNumber(engagement.likes) },
                { label: 'Shares', value: formatNumber(engagement.shares) },
              ].map((m, i) => (
                <div className="contract-metric" key={m.label} data-testid={`metric-platform-${i}`}>
                  <dt>{m.label}</dt>
                  <dd><strong data-testid={`text-platform-value-${i}`}>{m.value}</strong></dd>
                </div>
              ))}
            </dl>
            <p data-testid="metric-platform-3" style={{fontSize:11, color:'var(--soft-ink)', marginTop:14, lineHeight:1.5}}>
              Public numbers, not private creator analytics. Comments: <strong>{formatNumber(engagement.comments)}</strong> · Engagement by views: <strong>{engagement.engagementRatePerViews != null ? `${engagement.engagementRatePerViews.toFixed(2)}%` : 'Not available'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Performance vs Delivery two-column */}
      <div className="perf-delivery-framing" aria-hidden="true">
        Two different questions. How many people saw it? And did the creator deliver what you asked for?
      </div>
      <div className="perf-delivery-grid" data-testid="panel-perf-delivery">

        {/* LEFT — Performance */}
        <section className="perf-col" aria-labelledby="perf-col-title">
          <div className="perf-col-head">
            <span className="mono eyebrow">HOW THE POST PERFORMED</span>
            <h3 id="perf-col-title">Audience response</h3>
            <p>Public views and interactions. These do not tell you whether your brief was followed.</p>
          </div>
          <dl className="perf-metric-list">
            {[
              { label: 'Views', value: formatNumber(engagement.views), real: true },
              { label: 'Likes', value: formatNumber(engagement.likes), real: true },
              { label: 'Comments', value: formatNumber(engagement.comments), real: true },
              { label: 'Shares', value: formatNumber(engagement.shares), real: true },
              { label: 'Engagement rate', value: engagement.engagementRatePerViews != null ? `${engagement.engagementRatePerViews.toFixed(2)}%` : 'Not available', real: true },
            ].map((m, i) => (
              <div key={`${m.label}-${i}`} className="perf-metric">
                <dt>{m.label}</dt>
                <dd>{m.value}</dd>
              </div>
            ))}
          </dl>
           <p className="perf-footnote">Sales, clicks, watch time and private reach are not available from the public post.</p>
        </section>

        {/* RIGHT — Delivery */}
        <section className="delivery-col" aria-labelledby="delivery-col-title">
          <div className="delivery-col-head">
            <span className="mono eyebrow">DID THE CREATOR DELIVER?</span>
            <h3 id="delivery-col-title">Your brief, checked</h3>
            <p>Each item you asked for is marked found, not found or needing your review.</p>
          </div>
          {deliveryChecks.length === 0 ? (
            <div className="delivery-empty" data-testid="delivery-empty">
              <p><strong>No requirements added yet.</strong> The post has been checked for brand mentions, but we cannot tell you if it met your brief without the brief.</p>
              <p style={{fontSize:12, marginTop:8}}>Start a new analysis and add the requirements from your agreement.</p>
            </div>
          ) : (
            <div className="delivery-checks-list" data-testid="delivery-checks-list">
              {deliveryChecks.map(check => (
                <DeliveryCheckRow key={check.id} check={check} />
              ))}
            </div>
          )}
           <p className="delivery-footnote">Visual appearances are possible matches from selected frames. Spoken checks depend on transcript accuracy. Confirm important decisions against the original post.</p>
        </section>
      </div>
    </section>
  );
}
