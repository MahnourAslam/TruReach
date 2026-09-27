import type { AnalysisResult } from '@workspace/api-client-react';
import { getContractReadout } from '../types/contract';
import { getExposureInsights } from '../types/exposure';
import { SourceVideo } from './SourceVideo';

type Props = {
  analysis: AnalysisResult;
  insights: ReturnType<typeof getExposureInsights>;
};

const statusLabels = {
  observed: 'Observed signal',
  review: 'Needs review',
  missing: 'No evidence in snapshot',
} as const;

export function ContractScorecard({ analysis, insights }: Props) {
  const { checks, platformMetrics, trackingMetrics } = getContractReadout(analysis, insights);

  return (
    <section className="contract-scorecard" aria-labelledby="contract-scorecard-title" data-testid="section-contract-scorecard">
      <div className="contract-scorecard-intro">
        <div>
          <span className="mono eyebrow">SOURCE & EVIDENCE / 01</span>
          <h2 id="contract-scorecard-title" className="serif">See the post. <em>Read the evidence.</em></h2>
        </div>
        <p>The original post sits beside Oriane’s source readout. Review both before deciding whether a deliverable meets your brief.</p>
      </div>

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
            {checks.map((check, index) => (
              <div className="contract-key-result" key={check.id} data-testid={`summary-contract-${check.id}`}>
                <dt>{['Visual samples', 'Spoken mention', 'Closing cue'][index]}</dt>
                <dd>
                  <strong data-testid={`text-summary-result-${check.id}`}>{check.result}</strong>
                  <span>{[
                    'Similarity candidates only; product visibility and the 5-second requirement need full-video review.',
                    'Transcript wording is not proof of product discussion.',
                    'Possible wording is not a verified campaign CTA.',
                  ][index]}</span>
                </dd>
              </div>
            ))}
          </dl>
          <div className="contract-source-metrics" data-testid="panel-platform-metrics">
            <span className="mono">PUBLIC ENGAGEMENT / ORIANE INDEXED SNAPSHOT</span>
            <dl className="contract-metric-list">
              {platformMetrics.slice(0, 3).map((metric, index) => (
                <div className="contract-metric" key={`${metric.label}-${index}`} data-testid={`metric-platform-${index}`}>
                  <dt>{metric.label}</dt>
                  <dd><strong data-testid={`text-platform-value-${index}`}>{metric.value}</strong><span>{metric.note}</span></dd>
                </div>
              ))}
            </dl>
            <p data-testid="metric-platform-3">
              Public engagement, not creator analytics. {platformMetrics[3].label}: <strong data-testid="text-platform-value-3">{platformMetrics[3].value}</strong> — {platformMetrics[3].note}.
            </p>
          </div>
        </div>
      </div>

      <div className="contract-secondary">
        <div className="contract-secondary-intro">
          <h3>Compare with a brief</h3>
          <p>Example requirements for a human review, not an automated pass or fail.</p>
        </div>
        <div className="contract-brief" data-testid="panel-example-criteria">
          <div className="contract-brief-label">
            <span className="mono">ILLUSTRATIVE BRIEF</span>
            <span className="contract-brief-rule" aria-hidden="true" />
            <span className="contract-brief-disclaimer" data-testid="text-criteria-disclaimer">Example criteria / not an uploaded contract</span>
          </div>
          <p data-testid="text-example-criteria">Product clearly visible for at least 5 seconds <span aria-hidden="true">+</span> brand verbally mentioned <span aria-hidden="true">+</span> CTA included</p>
          <div className="contract-brief-signals" aria-label="At-a-glance evidence status">
            {checks.map((check, index) => (
              <span key={check.id} data-testid={`status-brief-${check.id}`}>
                <b>{['Visual timing', 'Brand speech', 'CTA'][index]}</b>
                {statusLabels[check.status]}
              </span>
            ))}
          </div>
          <span className="contract-brief-caption">These are review prompts, not a determination of delivery.</span>
        </div>
      </div>

      <div className="contract-checks-head">
        <h3>Requirement by requirement</h3>
        <span className="mono">SOURCE SIGNAL ≠ VERIFIED DELIVERY</span>
      </div>
      <ol className="contract-checks" aria-label="Illustrative creative requirements and evidence">
        {checks.map((check, index) => (
          <li className="contract-check" key={check.id} data-testid={`row-contract-check-${check.id}`}>
            <span className="contract-check-number mono" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div className="contract-check-requirement">
              <span className="mono">THE REQUIREMENT</span>
              <h4 data-testid={`text-contract-requirement-${check.id}`}>{check.requirement}</h4>
            </div>
            <div className="contract-check-finding">
              <span className="mono">WHAT THE SOURCE SAYS</span>
              <strong data-testid={`text-contract-result-${check.id}`}>{check.result}</strong>
              <p data-testid={`text-contract-detail-${check.id}`}>{check.detail}</p>
            </div>
            <span className={`contract-status contract-status-${check.status} mono`} data-testid={`status-contract-check-${check.id}`} aria-label={`Review status: ${statusLabels[check.status]}`}>
              <i aria-hidden="true" />{statusLabels[check.status]}
            </span>
          </li>
        ))}
      </ol>
      <p className="contract-checks-note" data-testid="text-contract-evidence-caveat">
        A sampled similarity frame is not a timed product or logo detection. A transcript mention is not necessarily product discussion; possible CTA wording is not a verified call to action. Review the original post before determining delivery.
      </p>

      <div className="contract-metrics">
        <section className="contract-metric-panel contract-tracking-panel" aria-labelledby="contract-tracking-title" data-testid="panel-brand-tracking">
          <div className="contract-metric-heading">
            <div><span className="mono eyebrow">OUTSIDE THE SOURCE</span><h3 id="contract-tracking-title" className="serif">What this post can't report.</h3></div>
            <p>Clicks, code use and sales live in your campaign reporting, not the video analysis.</p>
          </div>
          <dl className="contract-metric-list">
            {trackingMetrics.map((metric, index) => (
              <div className="contract-metric" key={`${metric.label}-${index}`} data-testid={`metric-tracking-${index}`}>
                <dt>{metric.label}</dt>
                <dd><strong data-testid={`text-tracking-value-${index}`}>{metric.value}</strong><span>{metric.note}</span></dd>
              </div>
            ))}
          </dl>
          <p className="contract-metric-footnote">Clicks, code uses and attributed sales require brand-side tracking; they are unavailable here.</p>
        </section>
      </div>
    </section>
  );
}