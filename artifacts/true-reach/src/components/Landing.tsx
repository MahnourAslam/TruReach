import { ArrowRight, ArrowUpRight, Link2 } from 'lucide-react';
import type { AnalysisExample } from '@workspace/api-client-react';
import poster from '@assets/oriane-test/top-logo-frame-2-4.23s.webp';

type LandingProps = {
  videoUrl: string;
  brand: string;
  onVideoUrlChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onAnalyze: () => void;
  onExample: () => void;
  example?: AnalysisExample;
  exampleLoading: boolean;
  exampleError: boolean;
  onRetryExample: () => void;
  analyzing: boolean;
  error: string | null;
};

export function Landing({ videoUrl, brand, onVideoUrlChange, onBrandChange, onAnalyze, onExample, example, exampleLoading, exampleError, onRetryExample, analyzing, error }: LandingProps) {
  return (
    <>
      <main>
        <section className="container hero" aria-labelledby="landing-title">
          <div className="hero-copy">
            <div className="section-index mono"><span className="dash" /> CREATOR EVIDENCE, MADE LEGIBLE <span> / 01</span></div>
            <h1 id="landing-title" className="serif">Look <em>closer.</em><br />Know more.</h1>
            <p className="hero-description">One post. The moments that matter. Examine spoken mentions, visual candidates, and engagement in a single, traceable view.</p>
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
            <div className="method-head"><div><span className="mono" style={{color:'#e0a28e'}}>THE METHOD / 02</span><h2 id="method-title" className="serif">From post to<br /><em>proof points.</em></h2></div><p>Good evidence can withstand a second look. TrueReach keeps the original source, timecoded observations, and their limitations in view.</p></div>
            <div className="method-grid">
              <div className="method-item"><span className="mono number">01 / SOURCE</span><h3>Start with the post.</h3><p>Submit a video link or open the indexed example. The analysis reports when source evidence was fetched.</p></div>
              <div className="method-item"><span className="mono number">02 / OBSERVE</span><h3>Follow the timeline.</h3><p>Jump between spoken mentions, sampled visual candidates, and transcript moments alongside the frame review.</p></div>
              <div className="method-item"><span className="mono number">03 / INTERPRET</span><h3>Keep the caveats.</h3><p>Similarity is a candidate signal, not logo proof. A sampled frame cannot establish exact visibility duration.</p></div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}