import type { AnalysisResult } from '@workspace/api-client-react';
import { getContractReadout } from '../types/contract';
import { getExposureInsights } from '../types/exposure';

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
          <span className="mono eyebrow">CREATIVE ACCOUNTABILITY / 01</span>
          <h2 id="contract-scorecard-title" className="serif">The brief, <em>against</em> the evidence.</h2>
        </div>
        <p>Know what the post shows, what still needs a human check, and what the source cannot measure before signing off on creator deliverables.</p>
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
        <span className="contract-brief-caption">A useful review starts with the agreement—not a view count.</span>
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
        <section className="contract-metric-panel" aria-labelledby="contract-platform-title" data-testid="panel-platform-metrics">
          <div className="contract-metric-heading">
            <div><span className="mono eyebrow">01 / SOURCE SNAPSHOT</span><h3 id="contract-platform-title" className="serif">Platform numbers.</h3></div>
            <p>Public post engagement indexed by Oriane at the time of analysis; not creator analytics.</p>
          </div>
          <dl className="contract-metric-list">
            {platformMetrics.map((metric, index) => (
              <div className="contract-metric" key={`${metric.label}-${index}`} data-testid={`metric-platform-${index}`}>
                <dt>{metric.label}</dt>
                <dd><strong data-testid={`text-platform-value-${index}`}>{metric.value}</strong><span>{metric.note}</span></dd>
              </div>
            ))}
          </dl>
          <p className="contract-metric-footnote">Average watch time is unavailable from this source snapshot.</p>
        </section>
        <section className="contract-metric-panel contract-tracking-panel" aria-labelledby="contract-tracking-title" data-testid="panel-brand-tracking">
          <div className="contract-metric-heading">
            <div><span className="mono eyebrow">02 / OUTSIDE THIS SOURCE</span><h3 id="contract-tracking-title" className="serif">Brand-side outcomes.</h3></div>
            <p>A post analysis cannot see into your campaign reporting.</p>
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