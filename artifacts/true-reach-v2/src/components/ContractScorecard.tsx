import type { AnalysisResult } from '@workspace/api-client-react';
import { AlertTriangle, Check, ChevronDown, X } from 'lucide-react';
import { getExposureInsights } from '../types/exposure';
import { formatNumber, formatTime } from '../types/analysis';
import { formatCheckTime } from '../types/delivery';
import type { CheckStatus, DeliveryCheck } from '../types/delivery';
import { SourceVideo } from './SourceVideo';

type Props = {
  analysis: AnalysisResult;
  insights: ReturnType<typeof getExposureInsights>;
};

function StatusPill({ status }: { status: CheckStatus }) {
  const labels: Record<CheckStatus, string> = {
    verified: 'Found in post',
    not_detected: 'Not found',
    flag: 'Needs review',
    unknown: 'Could not check',
  };
  return <span className={`delivery-pill delivery-pill-${status}`} aria-label={`Status: ${labels[status]}`}><i aria-hidden="true" />{labels[status]}</span>;
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
      <span className={`delivery-status-mark delivery-status-mark-${check.status}`} aria-hidden="true">
        {check.status === 'verified' ? <Check size={17} strokeWidth={3} /> : check.status === 'not_detected' ? <X size={17} strokeWidth={3} /> : <AlertTriangle size={16} strokeWidth={2.5} />}
      </span>
      <div className="delivery-check-head">
        <span className="delivery-check-label">{check.label}</span>
        <StatusPill status={check.status as CheckStatus} />
      </div>
      {check.detail && <p className="delivery-check-detail">{plainDetail(check.detail)}</p>}
      {check.timestamps.length > 0 && (
        <div className="delivery-check-timestamps">
          {check.timestamps.slice(0, 6).map((ts, i) => <TimestampChip key={i} start={ts.start} end={ts.end} />)}
          {check.timestamps.length > 6 && <span className="ts-chip ts-chip-more mono">+{check.timestamps.length - 6} more</span>}
        </div>
      )}
    </div>
  );
}

export function OriginalPostDisclosure({ analysis, insights }: Props) {
  return (
    <section className="report-block" aria-label="Watch the original post">
      <details className="original-post-disclosure">
        <summary><strong>Watch the original post</strong><span className="mono">OPEN SOURCE <ChevronDown size={19} aria-hidden="true" /></span></summary>
        <div className="original-post-content" data-testid="panel-source-and-results">
          <SourceVideo videoUrl={analysis.videoUrl} />
          <div className="original-post-notes">
            <h3>Quick checks in this post</h3>
            <dl className="contract-key-results">
              <div className="contract-key-result" data-testid="summary-contract-visual">
                <dt>Brand on screen</dt>
                <dd><strong data-testid="text-summary-result-visual">
                  {insights.visualWindows.length === 0
                    ? 'No likely appearances found'
                    : `${insights.visualWindows.reduce((sum, window) => sum + window.sampleCount, 0)} possible frames · ${insights.visualWindows.map(window => formatTime(window.start)).join(', ')}`}
                </strong><span>Possible appearances in checked frames. Open the post to confirm.</span></dd>
              </div>
              <div className="contract-key-result" data-testid="summary-contract-spoken">
                <dt>Brand said aloud</dt>
                <dd><strong data-testid="text-summary-result-spoken">
                  {!analysis.brand ? 'Add a brand to check' : analysis.summary.spokenMentionCount > 0
                    ? `${analysis.summary.spokenMentionCount} mention${analysis.summary.spokenMentionCount === 1 ? '' : 's'} of ${analysis.brand}`
                    : 'No mention found'}
                </strong><span>{analysis.summary.firstSpokenMentionSeconds != null ? `First heard at ${formatTime(analysis.summary.firstSpokenMentionSeconds)}. ` : ''}Based on the speech transcript.</span></dd>
              </div>
              <div className="contract-key-result" data-testid="summary-contract-caption">
                <dt>Brand in caption</dt>
                <dd><strong data-testid="text-summary-result-caption">
                  {analysis.summary.captionMentionsBrand == null ? 'Add a brand to check' : analysis.summary.captionMentionsBrand ? `Yes — ${analysis.brand} is mentioned` : 'No mention found'}
                </strong><span>Checks the written caption, not text inside the video.</span></dd>
              </div>
            </dl>
          </div>
        </div>
      </details>
    </section>
  );
}

export function ContractScorecard({ analysis }: Props) {
  const deliveryChecks: DeliveryCheck[] = analysis.deliveryChecks ?? [];
  const { engagement } = analysis;
  const metrics = [
    { label: 'Views', value: formatNumber(engagement.views) },
    { label: 'Likes', value: formatNumber(engagement.likes) },
    { label: 'Comments', value: formatNumber(engagement.comments) },
    { label: 'Shares', value: formatNumber(engagement.shares) },
    { label: 'Engagement rate', value: engagement.engagementRatePerViews != null ? `${engagement.engagementRatePerViews.toFixed(2)}%` : 'Not available' },
  ];

  return (
    <div className="contract-scorecard" data-testid="section-contract-scorecard">
      <div data-testid="panel-perf-delivery">
        <section className="report-block" aria-labelledby="contract-scorecard-title">
          <div className="report-block-heading">
            <div><span className="mono eyebrow">WHAT THE CREATOR DELIVERED</span><h2 id="contract-scorecard-title">Your brief, checked</h2></div>
            <p>Each requirement you added is marked found, not found, or needing your review.</p>
          </div>
          <div className="delivery-col" aria-labelledby="delivery-col-title">
            <div className="delivery-col-head">
              <span className="mono eyebrow">DELIVERY CHECKLIST</span>
              <h3 id="delivery-col-title">Did the creator follow the brief?</h3>
              <p>Use these findings alongside the original post when making a payment decision.</p>
            </div>
            {deliveryChecks.length === 0 ? (
              <div className="delivery-empty" data-testid="delivery-empty">
                <p><strong>No requirements added yet.</strong> The post has been checked for brand mentions, but we cannot tell you if it met your brief without the brief.</p>
                <p style={{fontSize:12, marginTop:8}}>Start a new analysis and add the requirements from your agreement.</p>
              </div>
            ) : (
              <div className="delivery-checks-list" data-testid="delivery-checks-list">
                {deliveryChecks.map(check => <DeliveryCheckRow key={check.id} check={check} />)}
              </div>
            )}
            <p className="delivery-footnote">Visual appearances are possible matches from selected frames. Spoken checks depend on transcript accuracy. Confirm important decisions against the original post.</p>
          </div>
        </section>

        <section className="report-block" aria-labelledby="perf-col-title">
          <div className="report-block-heading">
            <div><span className="mono eyebrow">POST PERFORMANCE</span><h2 id="perf-col-title">How the post performed</h2></div>
            <p>These numbers come from the platform. They show reach, not what was actually delivered.</p>
          </div>
          <div className="post-performance" data-testid="panel-platform-metrics">
            <dl className="perf-metric-list">
              {metrics.map((metric, index) => (
                <div className="perf-metric" key={metric.label} data-testid={index < 3 ? `metric-platform-${index}` : index === 3 ? 'metric-platform-3' : undefined}>
                  <dt>{metric.label}</dt>
                  <dd>{index < 3 ? <strong data-testid={`text-platform-value-${index}`}>{metric.value}</strong> : metric.value}</dd>
                </div>
              ))}
            </dl>
            <p className="perf-footnote">Public numbers at the time of this check, not private creator analytics. Sales, clicks, and watch time are not available here.</p>
          </div>
        </section>
      </div>
    </div>
  );
}