import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowUpRight, ChevronDown, FileCheck2, Plus, X } from 'lucide-react';
import type { AnalysisExample, AnalysisInput, ContractRequirements } from '@workspace/api-client-react';

type Props = {
  example?: AnalysisExample;
  exampleLoading: boolean;
  exampleError: boolean;
  onRetryExample: () => void;
  error: string | null;
  onSubmit: (data: AnalysisInput) => void;
};

function TagField({ label, hint, placeholder, values, onChange, id }: { label: string; hint?: string; placeholder: string; values: string[]; onChange: (values: string[]) => void; id: string }) {
  const [draft, setDraft] = useState('');
  const add = (text: string) => {
    const entries = text.split(',').map(item => item.trim()).filter(Boolean);
    if (entries.length) onChange([...values, ...entries.filter(item => !values.some(existing => existing.toLowerCase() === item.toLowerCase()))]);
    setDraft('');
  };
  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add(draft);
    } else if (event.key === 'Backspace' && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };
  return <div className="field">
    <label className="field-label" htmlFor={id}>{label} {hint && <span className="field-hint">{hint}</span>}</label>
    <div className="tag-box">
      {values.map(value => <span className="chip" key={value}>{value}<button type="button" aria-label={`Remove ${value}`} data-testid={`button-remove-${id}-${value}`} onClick={() => onChange(values.filter(item => item !== value))}><X size={12} /></button></span>)}
      <input id={id} data-testid={`input-${id}`} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={handleKey} onBlur={() => { if (draft.trim()) add(draft); }} placeholder={values.length ? 'Add another…' : placeholder} />
    </div>
  </div>;
}

function Toggle({ label, hint, checked, onChange, id }: { label: string; hint: string; checked: boolean; onChange: (value: boolean) => void; id: string }) {
  return <div className="toggle-row">
    <div><strong>{label}</strong><small>{hint}</small></div>
    <button type="button" role="switch" aria-checked={checked} aria-label={label} data-testid={`switch-${id}`} className={`switch ${checked ? 'active' : ''}`} onClick={() => onChange(!checked)} />
  </div>;
}

export function AnalysisForm({ example, exampleLoading, exampleError, onRetryExample, error, onSubmit }: Props) {
  const [videoUrl, setVideoUrl] = useState('');
  const [brand, setBrand] = useState('');
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  const [requirementsTouched, setRequirementsTouched] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [brandVariants, setBrandVariants] = useState<string[]>([]);
  const [minMentions, setMinMentions] = useState('2');
  const [productShown, setProductShown] = useState(false);
  const [disclosureRequired, setDisclosureRequired] = useState(false);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [requiredPhrase, setRequiredPhrase] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [requiredCta, setRequiredCta] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');

  useEffect(() => {
    if (example && !dirty) {
      setVideoUrl(example.videoUrl);
      setBrand(example.brand);
    }
  }, [example, dirty]);

  const applyExample = () => {
    if (!example) return;
    setVideoUrl(example.videoUrl);
    setBrand(example.brand);
    setBrandVariants(['CeraVe', 'Cera V']);
    setMinMentions('2');
    setProductShown(true);
    setDisclosureRequired(true);
    setCompetitors(['Cetaphil']);
    setRequiredPhrase('');
    setDiscountCode('');
    setRequiredCta('');
    setMinDuration('');
    setMaxDuration('');
    setRequirementsOpen(true);
    setRequirementsTouched(true);
    setDirty(true);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requirements: ContractRequirements = {};
    if (requirementsTouched) {
      if (brandVariants.length) requirements.brandVariants = brandVariants;
      if (minMentions !== '') requirements.minMentions = Number(minMentions);
      if (productShown) requirements.productShown = true;
      if (disclosureRequired) requirements.disclosureRequired = true;
      if (competitors.length) requirements.competitors = competitors;
      if (requiredPhrase.trim()) requirements.requiredPhrase = requiredPhrase.trim();
      if (discountCode.trim()) requirements.discountCode = discountCode.trim();
      if (requiredCta.trim()) requirements.requiredCta = requiredCta.trim();
      if (minDuration !== '') requirements.minDurationSeconds = Number(minDuration);
      if (maxDuration !== '') requirements.maxDurationSeconds = Number(maxDuration);
    }
    onSubmit({ videoUrl: videoUrl.trim(), ...(brand.trim() ? { brand: brand.trim() } : {}), ...(Object.keys(requirements).length ? { requirements } : {}) });
  };

  return <main className="page-wrap landing-grid">
    <section className="intro">
      <div className="intro-label eyebrow">The sponsorship audit desk</div>
      <h1>Proof of<br /><em>delivery.</em></h1>
      <p className="intro-copy">Performance is already tracked by a dozen tools. Delivery — what the creator actually put in the video — has never been checked automatically. That's this.</p>
      <div className="intro-rule" />
      <div className="intro-foot"><FileCheck2 size={25} strokeWidth={1.3} /><span><strong>Evidence before assumptions.</strong><br />Review verbal mentions, product visibility and contract compliance in one measured report.</span></div>
    </section>

    <section className="form-card" aria-label="Analyse a video">
      <div className="form-head"><div><span className="eyebrow" style={{ color: '#a66046' }}>New analysis</span><h2>Start with a post</h2></div><span className="eyebrow form-number">01 / 02</span></div>
      <form onSubmit={submit}>
        <div className="form-main">
          <label className="field"><span className="field-label">Video URL <span className="field-hint">TikTok or Instagram</span></span><input required type="url" className="text-input" data-testid="input-video-url" placeholder="https://www.tiktok.com/@creator/video/…" value={videoUrl} onChange={event => { setVideoUrl(event.target.value); setDirty(true); }} /></label>
          <label className="field"><span className="field-label">Brand name <span className="field-hint">Optional</span></span><input className="text-input" maxLength={80} data-testid="input-brand" placeholder="e.g. CeraVe" value={brand} onChange={event => { setBrand(event.target.value); setDirty(true); }} /></label>
          <button type="button" className="requirements-trigger" aria-expanded={requirementsOpen} data-testid="button-contract-requirements" onClick={() => { setRequirementsOpen(!requirementsOpen); if (!requirementsOpen) setRequirementsTouched(true); }}>
            <span className="req-trigger-left"><span className="req-icon"><FileCheck2 size={17} strokeWidth={1.6} /></span><span><span className="req-trigger-title">Contract requirements</span><span className="req-trigger-sub">Set the terms you need to verify</span></span></span><ChevronDown size={17} className={`chevron ${requirementsOpen ? 'open' : ''}`} />
          </button>
          {requirementsOpen && <div className="requirements-body">
            <div className="req-group"><div className="eyebrow group-title">01 / Brand presence</div>
              <TagField id="brand-variants" label="Accepted brand spellings" hint="Press Enter or comma" placeholder="Add a variant…" values={brandVariants} onChange={setBrandVariants} />
              <label className="field"><span className="field-label">Minimum spoken mentions</span><input type="number" min="0" step="1" className="text-input" data-testid="input-min-mentions" value={minMentions} onChange={event => setMinMentions(event.target.value)} /></label>
            </div>
            <div className="req-group"><div className="eyebrow group-title">02 / Product & compliance</div>
              <Toggle id="product-shown" label="Product or logo shown" hint="Check sampled frames for visibility" checked={productShown} onChange={setProductShown} />
              <Toggle id="disclosure-required" label="Ad disclosure required" hint="Check for #ad or sponsored disclosure" checked={disclosureRequired} onChange={setDisclosureRequired} />
              <TagField id="competitors" label="Competitors to flag" hint="Press Enter or comma" placeholder="Add a competitor…" values={competitors} onChange={setCompetitors} />
            </div>
            <div className="req-group"><div className="eyebrow group-title">03 / Specific deliverables</div>
              <label className="field"><span className="field-label">Required phrase</span><input className="text-input" data-testid="input-required-phrase" placeholder="Words that must be spoken" value={requiredPhrase} onChange={event => setRequiredPhrase(event.target.value)} /></label>
              <label className="field"><span className="field-label">Discount code</span><input className="text-input" data-testid="input-discount-code" placeholder="e.g. REACH15" value={discountCode} onChange={event => setDiscountCode(event.target.value)} /></label>
              <label className="field"><span className="field-label">Call to action</span><input className="text-input" data-testid="input-required-cta" placeholder="e.g. Shop through the link in bio" value={requiredCta} onChange={event => setRequiredCta(event.target.value)} /></label>
            </div>
            <div className="req-group"><div className="eyebrow group-title">04 / Duration</div>
              <div className="field-grid"><label className="field"><span className="field-label">Minimum <span className="field-hint">Seconds</span></span><input type="number" min="0" step="0.1" className="text-input" data-testid="input-min-duration" placeholder="No minimum" value={minDuration} onChange={event => setMinDuration(event.target.value)} /></label><label className="field"><span className="field-label">Maximum <span className="field-hint">Seconds</span></span><input type="number" min="0" step="0.1" className="text-input" data-testid="input-max-duration" placeholder="No maximum" value={maxDuration} onChange={event => setMaxDuration(event.target.value)} /></label></div>
            </div>
          </div>}
        </div>
        <div className="form-actions">
          {error && <div className="error-box" role="alert" data-testid="status-analysis-error"><strong>Analysis could not be completed.</strong><br />{error} Check the URL and try again.</div>}
          <button type="submit" className="primary-button" data-testid="button-analyse-video"><span>Analyse video</span><ArrowUpRight size={18} /></button>
          <button type="button" className="example-button" onClick={applyExample} disabled={!example || exampleLoading} data-testid="button-try-example"><Plus size={14} /> {exampleLoading ? 'Loading example…' : 'Try the CeraVe example'}</button>
          {exampleError && <button type="button" className="example-button" onClick={onRetryExample} data-testid="button-retry-example">Example unavailable. Retry</button>}
          <div className="form-note">Evidence is retrieved and assessed against the terms you set.</div>
        </div>
      </form>
    </section>
  </main>;
}