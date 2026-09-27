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
            <div className="section-index mono"><span className="dash" /> THE CREATOR POST CHECKER</div>
            <h1 id="landing-title" className="serif">Creator post<br /><em>check</em></h1>
            <p className="hero-description">Check a creator’s post against your brief. See whether they said your brand name, showed the product, and included the disclosure you asked for.</p>
            <form className="form-panel" onSubmit={(event) => { event.preventDefault(); onAnalyze(); }}>
              <label className="form-label mono" htmlFor="video-url">Paste a TikTok or Instagram post link</label>
              <div className="input-row">
                <Link2 className="input-icon" size={17} strokeWidth={1.8} aria-hidden="true" />
                <input id="video-url" data-testid="input-video-url" type="url" inputMode="url" autoComplete="url" placeholder="https://www.tiktok.com/@creator/video/..." value={videoUrl} onChange={(event) => onVideoUrlChange(event.target.value)} aria-invalid={!!error} aria-describedby={error ? 'analysis-error' : undefined} maxLength={500} />
              </div>
              <div className="form-bottom">
                <input className="brand-input" data-testid="input-brand" aria-label="Brand name to check" placeholder="Your brand name" value={brand} onChange={(event) => onBrandChange(event.target.value)} maxLength={80} />
                <button className="primary-btn" data-testid="button-analyze" type="submit" disabled={analyzing}>{analyzing ? 'Checking post…' : 'Check this post'} <ArrowRight size={17} aria-hidden="true" /></button>
              </div>
              {error && <div id="analysis-error" className="form-error" role="alert" data-testid="status-analysis-error">{error}</div>}

              {/* Contract Requirements Panel */}
              <div className="req-panel">
                <button type="button" className="req-panel-toggle" onClick={() => setReqOpen(v => !v)} aria-expanded={reqOpen} data-testid="button-toggle-requirements">
                  <span className="req-panel-toggle-left">
                    <Settings2 size={13} aria-hidden="true" />
                     <span className="mono">Add what the creator promised</span>
                    {activeCount > 0 && <span className="req-active-badge">{activeCount} set</span>}
                  </span>
                  <ChevronDown size={14} className={`req-chevron${reqOpen ? ' req-chevron-open' : ''}`} aria-hidden="true" />
                </button>
                {reqOpen && (
                  <div className="req-fields" data-testid="panel-requirements">
                     <div className="req-hint mono">Optional. Add items from your agreement to get a clear delivery checklist. We only check what you enter.</div>

                    <div className="req-row">
                      <label className="req-label" htmlFor="req-variants">Other ways to say your brand <span>(separate with commas)</span></label>
                      <input id="req-variants" className="req-input" data-testid="input-req-variants" placeholder="e.g. CeraVe, Cera V" value={joinTags(req.brandVariants)} onChange={e => updateReq({ brandVariants: splitTags(e.target.value) })} maxLength={200} />
                    </div>

                    <div className="req-row">
                      <label className="req-label" htmlFor="req-competitors">Competitor names to watch for <span>(separate with commas)</span></label>
                      <input id="req-competitors" className="req-input" data-testid="input-req-competitors" placeholder="e.g. Cetaphil, Neutrogena" value={joinTags(req.competitors)} onChange={e => updateReq({ competitors: splitTags(e.target.value) })} maxLength={200} />
                    </div>

                    <div className="req-row req-row-inline">
                      <div className="req-col">
                        <label className="req-label" htmlFor="req-mentions">Times they must say the brand</label>
                        <input id="req-mentions" className="req-input req-input-sm" data-testid="input-req-mentions" type="number" min={1} max={20} placeholder="2" value={req.minMentions ?? ''} onChange={e => updateReq({ minMentions: e.target.value ? Number(e.target.value) : undefined })} />
                      </div>
                      <div className="req-col">
                        <label className="req-label" htmlFor="req-min-dur">Minimum video length (seconds)</label>
                        <input id="req-min-dur" className="req-input req-input-sm" data-testid="input-req-min-duration" type="number" min={1} placeholder="—" value={req.minDurationSeconds ?? ''} onChange={e => updateReq({ minDurationSeconds: e.target.value ? Number(e.target.value) : null })} />
                      </div>
                      <div className="req-col">
                        <label className="req-label" htmlFor="req-max-dur">Maximum video length (seconds)</label>
                        <input id="req-max-dur" className="req-input req-input-sm" data-testid="input-req-max-duration" type="number" min={1} placeholder="—" value={req.maxDurationSeconds ?? ''} onChange={e => updateReq({ maxDurationSeconds: e.target.value ? Number(e.target.value) : null })} />
                      </div>
                    </div>

                    <div className="req-row req-row-toggles">
                      <label className="req-toggle-label">
                        <input type="checkbox" data-testid="input-req-product-shown" checked={req.productShown === true} onChange={e => updateReq({ productShown: e.target.checked || undefined })} />
                        <span>Product or logo must appear on screen</span>
                      </label>
                      <label className="req-toggle-label">
                        <input type="checkbox" data-testid="input-req-disclosure" checked={req.disclosureRequired === true} onChange={e => updateReq({ disclosureRequired: e.target.checked || undefined })} />
                        <span>Post must disclose that it is an ad</span>
                      </label>
                    </div>

                    <div className="req-row">
                      <label className="req-label" htmlFor="req-phrase">Required spoken phrase <span>(optional)</span></label>
                      <input id="req-phrase" className="req-input" data-testid="input-req-phrase" placeholder="e.g. gentle on skin" value={req.requiredPhrase ?? ''} onChange={e => updateReq({ requiredPhrase: e.target.value || null })} maxLength={120} />
                    </div>

                    <div className="req-row req-row-inline">
                      <div className="req-col req-col-wide">
                        <label className="req-label" htmlFor="req-code">Discount code to include <span>(optional)</span></label>
                        <input id="req-code" className="req-input" data-testid="input-req-discount-code" placeholder="e.g. SAVE20" value={req.discountCode ?? ''} onChange={e => updateReq({ discountCode: e.target.value || null })} maxLength={40} />
                      </div>
                      <div className="req-col req-col-wide">
                        <label className="req-label" htmlFor="req-cta">Action to ask viewers to take <span>(optional)</span></label>
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
                <span className="mono">Want to see a report first?</span>
                {exampleError ? <button className="secondary-btn" type="button" onClick={onRetryExample} data-testid="button-retry-example">Retry example <ArrowRight size={15} /></button> :
                  <button className="secondary-btn" type="button" onClick={onExample} disabled={exampleLoading || analyzing || !example} data-testid="button-try-example">{exampleLoading ? 'Loading example…' : 'View a sample report'} <ArrowUpRight size={16} aria-hidden="true" /></button>}
              </div>
              {exampleError && <p className="form-error" role="alert" data-testid="status-example-error">The example details are unavailable right now. Retry to load them.</p>}
            </form>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-grid" /><div className="art-orbit" /><span className="art-cross one" /><span className="art-cross two" />
            <div className="art-card"><img src={poster} alt="Frame from an example TikTok post showing a CeraVe product held toward the camera" /></div>
            <div className="art-label top"><span className="mono eyebrow">ON SCREEN</span><strong>Product spotted · 00:04</strong></div>
            <div className="art-label bottom"><span className="mono eyebrow">THE RECEIPT</span><strong>Every claim has a moment.</strong></div>
          </div>
        </section>
        <div className="container hero-foot mono"><span>A CLEARER WAY TO REVIEW CREATOR POSTS.</span><span>POST CONTENT DOES NOT CONFIRM A PAID PARTNERSHIP.</span><span>SEE HOW IT WORKS BELOW ↓</span></div>
        <section className="method-section" aria-labelledby="method-title">
          <div className="container">
            <div className="method-head"><div><span className="mono" style={{color:'#e0a28e'}}>HOW IT WORKS</span><h2 id="method-title" className="serif">A receipt for<br /><em>every post.</em></h2></div><p>See what was found, when it happened, and which parts of your agreement need another look. All next to the original post.</p></div>
            <div className="method-grid">
              <div className="method-item"><span className="mono number">01 / ADD THE POST</span><h3>Paste the link.</h3><p>Start with a TikTok or Instagram post. Add the brand you want to check.</p></div>
              <div className="method-item"><span className="mono number">02 / SEE THE MOMENTS</span><h3>Find what happened.</h3><p>Read spoken mentions and inspect possible product appearances at their exact timestamps.</p></div>
              <div className="method-item"><span className="mono number">03 / CHECK THE BRIEF</span><h3>Make the call.</h3><p>Compare the evidence with what your creator promised. See what passed and what needs your review.</p></div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
