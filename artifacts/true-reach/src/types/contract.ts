import type { AnalysisResult } from '@workspace/api-client-react';
import { formatNumber } from './analysis';
import type { getExposureInsights } from './exposure';

type Status = 'observed' | 'review' | 'missing';
type Check = {
  id: string;
  requirement: string;
  result: string;
  detail: string;
  status: Status;
};
type Metric = { label: string; value: string; note: string };

export function getContractReadout(
  analysis: AnalysisResult,
  insights: ReturnType<typeof getExposureInsights>,
): { checks: Check[]; platformMetrics: Metric[]; trackingMetrics: Metric[] } {
  const matched = insights.visualWindows;
  const spoken = analysis.summary.spokenMentionCount;
  const closing = analysis.events.find((event) => event.type === 'closing_phrase');

  return {
    checks: [
      {
        id: 'visibility',
        requirement: 'Product clearly visible for at least 5 seconds',
        result: matched.length === 0
          ? 'Visibility time not measurable'
          : `${matched.reduce((sum, window) => sum + window.sampleCount, 0)} matched samples · ${matched.map((window) => `${window.start.toFixed(2)}–${window.end.toFixed(2)}s`).join(', ')}`,
        detail: matched.length === 0
          ? 'No adjacent high-similarity samples were found. That does not prove the product was absent; continuous footage is needed to check the 5-second requirement.'
          : 'These are Oriane similarity scores on sampled frames, not confirmed product or logo detections. The timestamps bracket samples, not a visibility duration. Review the full video to assess the 5-second requirement.',
        status: 'review',
      },
      {
        id: 'spoken',
        requirement: 'Brand verbally mentioned',
        result: !analysis.brand ? 'Brand not specified' : spoken > 0 ? `${analysis.brand} appears in transcript` : 'No mention found in transcript',
        detail: spoken > 0
          ? `${spoken} transcript mention${spoken === 1 ? '' : 's'}${analysis.summary.firstSpokenMentionSeconds != null ? `; first at ${analysis.summary.firstSpokenMentionSeconds.toFixed(1)}s` : ''}. This checks spoken wording, not whether the creator discusses the product.`
          : 'A missing transcript mention is not proof that it was never spoken. Review the original audio.',
        status: spoken > 0 ? 'observed' : 'review',
      },
      {
        id: 'cta',
        requirement: 'Call to action included',
        result: closing ? 'Possible closing cue' : 'No CTA evidence found',
        detail: closing
          ? `Transcript cue at ${closing.start.toFixed(1)}s: “${closing.text}” — review whether this satisfies the campaign’s actual CTA.`
          : 'No closing cue was identified in the transcript. A visual CTA or another phrasing may still appear in the original video.',
        status: closing ? 'review' : 'missing',
      },
    ],
    platformMetrics: [
      { label: 'Views', value: formatNumber(analysis.engagement.views), note: 'Oriane indexed snapshot' },
      { label: 'Likes', value: formatNumber(analysis.engagement.likes), note: 'Oriane indexed snapshot' },
      { label: 'Shares', value: formatNumber(analysis.engagement.shares), note: 'Oriane indexed snapshot' },
      { label: 'Avg watch time', value: 'Not available', note: 'Needs creator/platform analytics' },
    ],
    trackingMetrics: [
      { label: 'Link clicks', value: 'Not connected', note: 'Needs campaign link tracking' },
      { label: 'Code uses', value: 'Not connected', note: 'Needs promo-code reporting' },
      { label: 'Attributed sales', value: 'Not connected', note: 'Needs conversion data' },
    ],
  };
}