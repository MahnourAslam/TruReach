import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getGetExampleAnalysisQueryKey, useAnalyzeVideo, useGetExampleAnalysis } from '@workspace/api-client-react';
import type { AnalysisResult } from '@workspace/api-client-react';
import { Landing } from './components/Landing';
import { AnalysisReport } from './components/AnalysisReport';
import { SourceVideo } from './components/SourceVideo';
import { analysisError, isSupportedVideoUrl } from './types/analysis';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 60_000 } } });

function TrueReach() {
  const [videoUrl, setVideoUrl] = useState('');
  const [brand, setBrand] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isExample, setIsExample] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const example = useGetExampleAnalysis({ query: { queryKey: getGetExampleAnalysisQueryKey() } });
  const analysis = useAnalyzeVideo();

  function submit(url: string, candidateBrand: string, fromExample: boolean) {
    const trimmedUrl = url.trim();
    if (!isSupportedVideoUrl(trimmedUrl)) {
      setError('Enter a full TikTok video or Instagram reel/post URL. Short links are not supported.');
      return;
    }
    const exampleBrand = example.data && new URL(example.data.videoUrl).pathname === new URL(trimmedUrl).pathname
      ? example.data.brand
      : '';
    const effectiveBrand = candidateBrand.trim() || exampleBrand;
    if (effectiveBrand && !candidateBrand.trim()) setBrand(effectiveBrand);
    setError(null);
    setResult(null);
    setIsExample(fromExample);
    window.scrollTo({ top: 0, behavior: 'auto' });
    analysis.mutate({ data: { videoUrl: trimmedUrl, ...(effectiveBrand ? { brand: effectiveBrand } : {}) } }, {
      onSuccess: (data) => { setResult(data); window.scrollTo({ top: 0, behavior: 'smooth' }); },
      onError: (cause) => setError(analysisError(cause)),
    });
  }

  function reset() {
    analysis.reset();
    setResult(null);
    setError(null);
    setIsExample(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return <div className="site-shell">
    <header className="container topbar">
      <button type="button" className="wordmark" style={{border:0, background:'none', padding:0, color:'var(--ink)'}} onClick={reset} aria-label="TrueReach home" data-testid="button-home"><span className="wordmark-symbol" aria-hidden="true" /> true<span style={{color:'var(--rust)', marginLeft:-11}}>reach.</span></button>
      <div className="topbar-right mono">{!analysis.isPending && <a href={result ? '#review-title' : '#method-title'} data-testid="link-how-it-works">{result ? 'EXPLORE EVIDENCE' : 'HOW IT WORKS'}</a>}<span className="live-indicator">INDEPENDENT EVIDENCE VIEW</span></div>
    </header>
    {result ? <AnalysisReport analysis={result} isExample={isExample} onBack={reset} /> :
      analysis.isPending ? <main className="container loading-report" aria-busy="true" aria-label="Analyzing source post">
        <span className="mono eyebrow">LIVE SOURCE REVIEW</span>
        <h1 className="serif loading-headline" id="loading-title">Watch while we <em>check the post.</em></h1>
        <div className="contract-source-layout loading-source-layout">
          <SourceVideo videoUrl={videoUrl} />
          <div className="loading-source-results" role="status" aria-live="polite" data-testid="status-analysis-pending">
            <span className="mono eyebrow">CONTACTING ORIANE</span>
            <h2>Retrieving evidence…</h2>
            <p>The player comes from the platform. Separately, Oriane is returning the post's transcript, sampled frames, and public engagement. Results appear together when the request finishes; this is not live video tracking.</p>
            <div className="skeleton loading-source-line" /><div className="skeleton loading-source-line" /><div className="skeleton loading-source-line" />
          </div>
        </div>
      </main> :
        <Landing videoUrl={videoUrl} brand={brand} onVideoUrlChange={(value) => { setVideoUrl(value); if (!brand.trim() && example.data && isSupportedVideoUrl(value) && new URL(value).pathname === new URL(example.data.videoUrl).pathname) setBrand(example.data.brand); if (error) setError(null); }} onBrandChange={setBrand} onAnalyze={() => submit(videoUrl, brand, false)} onExample={() => { if (!example.data) return; setVideoUrl(example.data.videoUrl); setBrand(example.data.brand); submit(example.data.videoUrl, example.data.brand, true); }} example={example.data} exampleLoading={example.isLoading} exampleError={example.isError} onRetryExample={() => example.refetch()} analyzing={analysis.isPending} error={error} />}
    <footer className="container footer mono"><span>TRUEREACH / A CLOSER LOOK AT CREATOR EVIDENCE</span><span>OBSERVATIONS ARE NOT PROOF OF PAID SPONSORSHIP.</span><span>© {new Date().getFullYear()} TRUE REACH</span></footer>
  </div>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TrueReach /></QueryClientProvider>;
}

export default App;