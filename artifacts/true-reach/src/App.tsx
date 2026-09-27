import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getGetExampleAnalysisQueryKey, useAnalyzeVideo, useGetExampleAnalysis } from '@workspace/api-client-react';
import type { AnalysisResult } from '@workspace/api-client-react';
import { Landing } from './components/Landing';
import { AnalysisReport } from './components/AnalysisReport';
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
    setError(null);
    setResult(null);
    setIsExample(fromExample);
    analysis.mutate({ data: { videoUrl: trimmedUrl, ...(candidateBrand.trim() ? { brand: candidateBrand.trim() } : {}) } }, {
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
      <div className="topbar-right mono"><a href={result ? '#review-title' : '#method-title'} data-testid="link-how-it-works">{result ? 'EXPLORE EVIDENCE' : 'HOW IT WORKS'}</a><span className="live-indicator">INDEPENDENT EVIDENCE VIEW</span></div>
    </header>
    {result ? <AnalysisReport analysis={result} isExample={isExample} onBack={reset} /> :
      analysis.isPending ? <main className="container loading-report" aria-busy="true" aria-label="Analyzing source post"><span className="mono eyebrow">CONTACTING EVIDENCE SOURCE</span><div className="skeleton loading-title" /><div className="skeleton loading-sub" /><div className="loading-grid">{[0,1,2,3].map((item) => <div className="skeleton" key={item} />)}</div><div className="skeleton loading-large" /><p style={{color:'var(--soft-ink)', marginTop:20}}>Retrieving post data, transcript, sampled frames, and engagement. This can take a moment.</p></main> :
        <Landing videoUrl={videoUrl} brand={brand} onVideoUrlChange={(value) => { setVideoUrl(value); if (error) setError(null); }} onBrandChange={setBrand} onAnalyze={() => submit(videoUrl, brand, false)} onExample={() => { if (!example.data) return; setVideoUrl(example.data.videoUrl); setBrand(example.data.brand); submit(example.data.videoUrl, example.data.brand, true); }} example={example.data} exampleLoading={example.isLoading} exampleError={example.isError} onRetryExample={() => example.refetch()} analyzing={analysis.isPending} error={error} />}
    <footer className="container footer mono"><span>TRUEREACH / A CLOSER LOOK AT CREATOR EVIDENCE</span><span>OBSERVATIONS ARE NOT PROOF OF PAID SPONSORSHIP.</span><span>© {new Date().getFullYear()} TRUE REACH</span></footer>
  </div>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TrueReach /></QueryClientProvider>;
}

export default App;