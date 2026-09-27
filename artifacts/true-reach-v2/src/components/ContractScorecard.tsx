import type { AnalysisResult } from '@workspace/api-client-react';
import { getExposureInsights } from '../types/exposure';
import { formatNumber } from '../types/analysis';
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
    verified: 'Verified',
    not_detected: 'Not detected',
    flag: 'Flag',
    unknown: 'Unknown',
  };
  return (
    <span className={`delivery-pill delivery-pill-${status}`} aria-label={`Status: ${labels[status]}`}>
      <i aria-hidden="true" />
      {labels[status]}
    </span>
  );
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
      <div className="delivery-check-head">
        <span className="delivery-check-label">{check.label}</span>
        <StatusPill status={check.status as CheckStatus} />
      </div>
      {check.detail && <p className="delivery-check-detail">{check.detail}</p>}
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

const GREYED_PERFORMANCE = [
  { label: 'Reach', note: 'Connect analytics' },
  { label: 'Watch time', note: 'Connect analytics' },
  { label: 'Completion rate', note: 'Connect analytics' },
  { label: 'Link clicks', note: 'Connect analytics' },
  { label: 'Code uses', note: 'Connect analytics' },
  { label: 'Conversions', note: 'Connect analytics' },
  { label: 'Sales', note: 'Connect analytics' },
];

export function ContractScorecard({ analysis, insights }: Props) {
  const casted = analysis as AnalysisWithChecks;
  const deliveryChecks: DeliveryCheck[] = casted.deliveryChecks ?? [];
  const { engagement } = analysis;

  return (
    <section className="contract-scorecard" aria-labelledby="contract-scorecard-title" data-testid="section-contract-scorecard">
      <div className="contract-scorecard-intro">
        <div>
          <span className="mono eyebrow">SOURCE & EVIDENCE / 01</span>
          <h2 id="contract-scorecard-title" className="serif">See the post. <em>Read the evidence.</em></h2>
        </div>
        <p>The original post sits beside Oriane's source readout. Review both before deciding whether a deliverable meets your brief.</p>
      </div>

      {/* Source video + key signals — identical to v1 */}
      <div className="contract-source-layout" data-testid="panel-source-and-results">
        <SourceVideo videoUrl={analysis.videoUrl} />
        <div className="contract-source-results">
          <div className="contract-source-results-head">
            <div>
              <span className="mono eyebrow">ORIANE / SOURCE READOUT</span>
              <h3>What we can see.</h3>
            </div>
            <span className="mono">SIGNALS, NOT SIGN-OFF</span>
          </div>
          <dl className="contract-key-results">
            <div className="contract-key-result" data-testid="summary-contract-visual">
              <dt>Visual samples</dt>
              <dd>
                <strong data-testid="text-summary-result-visual">
                  {insights.visualWindows.length === 0
                    ? 'No windows ≥0.85'
                    : `${insights.visualWindows.reduce((s, w) => s + w.sampleCount, 0)} matched samples · ${insights.visualWindows.map(w => `${w.start.toFixed(2)}–${w.end.toFixed(2)}s`).join(', ')}`}
                </strong>
                <span>Estimated windows from frames ≥0.85 similarity — not continuous tracking.</span>
              </dd>
            </div>
            <div className="contract-key-result" data-testid="summary-contract-spoken">
              <dt>Spoken mention</dt>
              <dd>
                <strong data-testid="text-summary-result-spoken">
                  {!analysis.brand ? 'Brand not specified' : analysis.summary.spokenMentionCount > 0 ? `${analysis.brand} in transcript (${analysis.summary.spokenMentionCount}×)` : 'No mention in transcript'}
                </strong>
                <span>Transcript wording is not proof of product discussion.</span>
              </dd>
            </div>
            <div className="contract-key-result" data-testid="summary-contract-caption">
              <dt>Caption</dt>
              <dd>
                <strong data-testid="text-summary-result-caption">
                  {analysis.summary.captionMentionsBrand == null ? 'No brand set' : analysis.summary.captionMentionsBrand ? `${analysis.brand} in caption` : 'Not in caption'}
                </strong>
                <span>Caption text only; does not check on-screen overlays.</span>
              </dd>
            </div>
          </dl>
          <div className="contract-source-metrics" data-testid="panel-platform-metrics">
            <span className="mono">PUBLIC ENGAGEMENT / ORIANE INDEXED SNAPSHOT</span>
            <dl className="contract-metric-list">
              {[
                { label: 'Views', value: formatNumber(engagement.views) },
                { label: 'Likes', value: formatNumber(engagement.likes) },
                { label: 'Shares', value: formatNumber(engagement.shares) },
              ].map((m, i) => (
                <div className="contract-metric" key={m.label} data-testid={`metric-platform-${i}`}>
                  <dt>{m.label}</dt>
                  <dd><strong data-testid={`text-platform-value-${i}`}>{m.value}</strong><span>Oriane indexed snapshot</span></dd>
                </div>
              ))}
            </dl>
            <p data-testid="metric-platform-3" style={{fontSize:11, color:'var(--soft-ink)', marginTop:14, lineHeight:1.5}}>
              Public engagement, not creator analytics. Comments: <strong>{formatNumber(engagement.comments)}</strong> · Engagement rate: <strong>{engagement.engagementRatePerViews != null ? `${engagement.engagementRatePerViews.toFixed(2)}%` : 'Not available'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Performance vs Delivery two-column */}
      <div className="perf-delivery-framing" aria-hidden="true">
        Performance is already tracked by a dozen tools. Delivery — what the creator actually put in the video — has never been checked automatically. That's this.
      </div>
      <div className="perf-delivery-grid" data-testid="panel-perf-delivery">

        {/* LEFT — Performance */}
        <section className="perf-col" aria-labelledby="perf-col-title">
          <div className="perf-col-head">
            <span className="mono eyebrow">PERFORMANCE</span>
            <h3 id="perf-col-title">Tracked elsewhere</h3>
            <p>These numbers exist in your analytics tools. They tell you how the post performed, not what it contained.</p>
          </div>
          <dl className="perf-metric-list">
            {[
              { label: 'Views', value: formatNumber(engagement.views), real: true },
              { label: 'Likes', value: formatNumber(engagement.likes), real: true },
              { label: 'Comments', value: formatNumber(engagement.comments), real: true },
              { label: 'Shares', value: formatNumber(engagement.shares), real: true },
              { label: 'Engagement rate', value: engagement.engagementRatePerViews != null ? `${engagement.engagementRatePerViews.toFixed(2)}%` : 'Not available', real: true },
              ...GREYED_PERFORMANCE,
            ].map((m, i) => (
              <div key={`${m.label}-${i}`} className={`perf-metric${!('real' in m && m.real) ? ' perf-metric-grey' : ''}`}>
                <dt>{m.label}</dt>
                <dd>{'value' in m ? m.value : <span className="mono" style={{fontSize:10}}>{'note' in m ? m.note : ''}</span>}</dd>
              </div>
            ))}
          </dl>
          <p className="perf-footnote">Reach, watch time, completion, clicks, code uses, conversions, and sales require brand-side or platform analytics — unavailable here.</p>
        </section>

        {/* RIGHT — Delivery */}
        <section className="delivery-col" aria-labelledby="delivery-col-title">
          <div className="delivery-col-head">
            <span className="mono eyebrow">DELIVERY</span>
            <h3 id="delivery-col-title">What the video contained</h3>
            <p>Each requirement you set is checked against Oriane's evidence. Only enabled requirements appear.</p>
          </div>
          {deliveryChecks.length === 0 ? (
            <div className="delivery-empty" data-testid="delivery-empty">
              <p>No contract requirements were set for this analysis.</p>
              <p className="mono" style={{fontSize:10, marginTop:8}}>GO BACK → ADD REQUIREMENTS → RE-ANALYZE</p>
            </div>
          ) : (
            <div className="delivery-checks-list" data-testid="delivery-checks-list">
              {deliveryChecks.map(check => (
                <DeliveryCheckRow key={check.id} check={check} />
              ))}
            </div>
          )}
          <p className="delivery-footnote">Visual windows are estimated from sampled frame matches, not continuous tracking. Transcript checks depend on speech-recognition accuracy.</p>
        </section>
      </div>
    </section>
  );
}
