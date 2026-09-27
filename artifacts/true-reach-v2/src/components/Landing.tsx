import { useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronDown, Link2, Settings2 } from 'lucide-react';
import type { AnalysisExample } from '@workspace/api-client-react';
import poster from '@assets/oriane-test/top-logo-frame-2-4.23s.webp';
import type { ContractRequirements } from '../types/delivery';

type LandingProps = {
  videoUrl: string;
  brand: string;
  requirements: ContractRequirements | null;
  onVideoUrlChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onRequirementsChange: (reqs: ContractRequirements | null) => void;
  onAnalyze: () => void;
  onExample: () => void;
  example?: AnalysisExample;
  exampleLoading: boolean;
  exampleError: boolean;
  onRetryExample: () => void;
  analyzing: boolean;
  error: string | null;
};

function splitTags(value: string): string[] {
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

function joinTags(arr: string[] | undefined): string {
  return (arr ?? []).join(', ');
}

export function Landing({ videoUrl, brand, requirements, onVideoUrlChange, onBrandChange, onRequirementsChange, onAnalyze, onExample, example, exampleLoading, exampleError, onRetryExample, analyzing, error }: LandingProps) {
  const [reqOpen, setReqOpen] = useState(false);

  const req = requirements ?? {};

  function updateReq(patch: Partial<ContractRequirements>) {
    onRequirementsChange({ ...req, ...patch });
  }

  const activeCount = Object.values(req).filter(v => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)).length;

  return (
    <>
      <main>
        <section className="container hero" aria-labelledby="landing-title">
          <div className="hero-copy">
            <div className="section-index mono"><span className="dash" /> CREATOR EVIDENCE, MADE LEGIBLE <span> / 01</span></div>
            <h1 id="landing-title" className="serif">Look <em>closer.</em><br />Know more.</h1>
            <p className="hero-description">One post. The moments that matter. Examine spoken mentions, visual candidates, and delivery against your brief in a single, traceable view.</p>
            <form className="form-panel" onSubmit={(event) => { event.preventDefault(); onAnalyze(); }}>
              <label className="form-label mono" htmlFor="video-url">PASTE A VIDEO URL</label>
              <div className="input-row">
                <Link2 className="input-icon" size={17} strokeWidth={1.8} aria-hidden="true" />
                <input id="video-url" data-testid="input-video-url" type="url" inputMode="url" autoComplete="url" placeholder="https://www.tiktok.com/@creator/video/..." value={videoUrl} onChange={(event) => onVideoUrlChange(event.target.value)} aria-invalid={!!error} aria-describedby={error ? 'analysis-error' : undefined} maxLength={500} />
              </div>
              <div className="form-bottom">
                <input className="brand-input" data-testid="input-brand" aria-label="Brand to look for, optional" placeholder="Brand to look for (optional)" value={brand} onChange={(event) => onBrandChange(event.target.value)} maxLength={80} />
                <button className="primary-btn" data-testid="button-analyze" type="submit" disabled={analyzing}>{analyzing ? 'Analyzing post…' : 'Analyze post'} <ArrowRight size={17} aria-hidden="true" /></button>
              </div>
              {error && <div id="analysis-error" className="form-error" role="alert" data-testid="status-analysis-error">{error}</div>}

              {/* Contract Requirements Panel */}
              <div className="req-panel">
                <button type="button" className="req-panel-toggle" onClick={() => setReqOpen(v => !v)} aria-expanded={reqOpen} data-testid="button-toggle-requirements">
                  <span className="req-panel-toggle-left">
                    <Settings2 size={13} aria-hidden="true" />
                    <span className="mono">CONTRACT REQUIREMENTS</span>
                    {activeCount > 0 && <span className="req-active-badge">{activeCount} set</span>}
                  </span>
                  <ChevronDown size={14} className={`req-chevron${reqOpen ? ' req-chevron-open' : ''}`} aria-hidden="true" />
                </button>
                {reqOpen && (
                  <div className="req-fields" data-testid="panel-requirements">
                    <div className="req-hint mono">Only requirements you set here will be checked. Pre-filled when you load the example campaign.</div>

                    <div className="req-row">
                      <label className="req-label" htmlFor="req-variants">Brand name variants <span>(comma-separated)</span></label>
                      <input id="req-variants" className="req-input" data-testid="input-req-variants" placeholder="e.g. CeraVe, Cera V" value={joinTags(req.brandVariants)} onChange={e => updateReq({ brandVariants: splitTags(e.target.value) })} maxLength={200} />
                    </div>

                    <div className="req-row">
                      <label className="req-label" htmlFor="req-competitors">Competitor / exclusivity brands <span>(comma-separated)</span></label>
                      <input id="req-competitors" className="req-input" data-testid="input-req-competitors" placeholder="e.g. Cetaphil, Neutrogena" value={joinTags(req.competitors)} onChange={e => updateReq({ competitors: splitTags(e.target.value) })} maxLength={200} />
                    </div>

                    <div className="req-row req-row-inline">
                      <div className="req-col">
                        <label className="req-label" htmlFor="req-mentions">Min verbal mentions</label>
                        <input id="req-mentions" className="req-input req-input-sm" data-testid="input-req-mentions" type="number" min={1} max={20} placeholder="2" value={req.minMentions ?? ''} onChange={e => updateReq({ minMentions: e.target.value ? Number(e.target.value) : undefined })} />
                      </div>
                      <div className="req-col">
                        <label className="req-label" htmlFor="req-min-dur">Min duration (s)</label>
                        <input id="req-min-dur" className="req-input req-input-sm" data-testid="input-req-min-duration" type="number" min={1} placeholder="—" value={req.minDurationSeconds ?? ''} onChange={e => updateReq({ minDurationSeconds: e.target.value ? Number(e.target.value) : null })} />
                      </div>
                      <div className="req-col">
                        <label className="req-label" htmlFor="req-max-dur">Max duration (s)</label>
                        <input id="req-max-dur" className="req-input req-input-sm" data-testid="input-req-max-duration" type="number" min={1} placeholder="—" value={req.maxDurationSeconds ?? ''} onChange={e => updateReq({ maxDurationSeconds: e.target.value ? Number(e.target.value) : null })} />
                      </div>
                    </div>

                    <div className="req-row req-row-toggles">
                      <label className="req-toggle-label">
                        <input type="checkbox" data-testid="input-req-product-shown" checked={req.productShown === true} onChange={e => updateReq({ productShown: e.target.checked || undefined })} />
                        <span>Product / logo must appear on screen</span>
                      </label>
                      <label className="req-toggle-label">
                        <input type="checkbox" data-testid="input-req-disclosure" checked={req.disclosureRequired === true} onChange={e => updateReq({ disclosureRequired: e.target.checked || undefined })} />
                        <span>Ad disclosure required (UAE NMA)</span>
                      </label>
                    </div>

                    <div className="req-row">
                      <label className="req-label" htmlFor="req-phrase">Required spoken phrase <span>(optional)</span></label>
                      <input id="req-phrase" className="req-input" data-testid="input-req-phrase" placeholder="e.g. gentle on skin" value={req.requiredPhrase ?? ''} onChange={e => updateReq({ requiredPhrase: e.target.value || null })} maxLength={120} />
                    </div>

                    <div className="req-row req-row-inline">
                      <div className="req-col req-col-wide">
                        <label className="req-label" htmlFor="req-code">Discount / promo code <span>(optional)</span></label>
                        <input id="req-code" className="req-input" data-testid="input-req-discount-code" placeholder="e.g. SAVE20" value={req.discountCode ?? ''} onChange={e => updateReq({ discountCode: e.target.value || null })} maxLength={40} />
                      </div>
                      <div className="req-col req-col-wide">
                        <label className="req-label" htmlFor="req-cta">Required CTA phrase <span>(optional)</span></label>
                        <input id="req-cta" className="req-input" data-testid="input-req-cta" placeholder="e.g. link in bio" value={req.requiredCta ?? ''} onChange={e => updateReq({ requiredCta: e.target.value || null })} maxLength={80} />
                      </div>
                    </div>

                    {activeCount > 0 && (
                      <button type="button" className="req-clear mono" onClick={() => onRequirementsChange(null)}>
                        Clear all requirements
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="example-row">
                <span className="mono">OR EXPLORE A PUBLIC POST · SPONSORSHIP UNVERIFIED</span>
                {exampleError ? <button className="secondary-btn" type="button" onClick={onRetryExample} data-testid="button-retry-example">Retry example <ArrowRight size={15} /></button> :
                  <button className="secondary-btn" type="button" onClick={onExample} disabled={exampleLoading || analyzing || !example} data-testid="button-try-example">{exampleLoading ? 'Loading example…' : 'Try example campaign'} <ArrowUpRight size={16} aria-hidden="true" /></button>}
              </div>
              {exampleError && <p className="form-error" role="alert" data-testid="status-example-error">The example details are unavailable right now. Retry to load them.</p>}
            </form>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-grid" /><div className="art-orbit" /><span className="art-cross one" /><span className="art-cross two" />
            <div className="art-card"><img src={poster} alt="Sampled frame from the example TikTok post showing a CeraVe product held toward the camera" /></div>
            <div className="art-label top"><span className="mono eyebrow">ILLUSTRATIVE SOURCE FRAME</span><strong>Candidate only / 00:04</strong></div>
            <div className="art-label bottom"><span className="mono eyebrow">EXAMPLE POST</span><strong>Evidence, not assumption.</strong></div>
          </div>
        </section>
        <div className="container hero-foot mono"><span>BUILT FOR THE QUESTION AFTER THE PITCH.</span><span>NO SPONSORSHIP CLAIMS INFERRED FROM A POST.</span><span>SCROLL TO SEE HOW IT WORKS ↓</span></div>
        <section className="method-section" aria-labelledby="method-title">
          <div className="container">
            <div className="method-head"><div><span className="mono" style={{color:'#e0a28e'}}>THE METHOD / 02</span><h2 id="method-title" className="serif">From post to<br /><em>proof points.</em></h2></div><p>Good evidence can withstand a second look. TrueReach keeps the original source, timecoded observations, and delivery against your brief in view.</p></div>
            <div className="method-grid">
              <div className="method-item"><span className="mono number">01 / SOURCE</span><h3>Start with the post.</h3><p>Submit a video link or open the indexed example. The analysis reports when source evidence was fetched.</p></div>
              <div className="method-item"><span className="mono number">02 / OBSERVE</span><h3>Follow the timeline.</h3><p>Jump between spoken mentions, sampled visual candidates, and transcript moments alongside the frame review.</p></div>
              <div className="method-item"><span className="mono number">03 / DELIVER</span><h3>Check the brief.</h3><p>Set contract requirements before analyzing. Each one gets a status — verified, not detected, or flagged for review.</p></div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
