import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAnalyzeVideo, useGetExampleAnalysis, type AnalysisInput, type AnalysisResult } from '@workspace/api-client-react';
import { AnalysisForm } from './components/AnalysisForm';
import { AnalysisReport } from './components/AnalysisReport';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

function LoadingStage() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setPhase(current => Math.min(current + 1, 1)), 2700);
    return () => window.clearInterval(timer);
  }, []);
  return <main className="loading-stage" aria-live="polite">
    <span className="eyebrow" style={{ color: '#b56648' }}>Analysis in progress / 02</span>
    <h1 data-testid="status-loading-message">{phase === 0 ? 'Retrieving evidence from Oriane…' : 'Running delivery checks…'}</h1>
    <p>Building a clear record of what was published and what the contract asked for.</p>
    <div className="progress-track"><div className="progress-line" /></div>
    <div className="loading-steps"><div className="loading-step active"><span>01 &nbsp; Retrieve post & engagement</span><span>{phase ? 'Complete' : 'In progress'}</span></div><div className={`loading-step ${phase ? 'active' : ''}`}><span>02 &nbsp; Match content against terms</span><span>{phase ? 'In progress' : 'Waiting'}</span></div><div className="loading-step"><span>03 &nbsp; Prepare evidence report</span><span>Waiting</span></div></div>
    <div style={{ marginTop: 44, display: 'grid', gap: 10 }} aria-hidden="true"><div className="skeleton" style={{ height: 15, width: '78%' }} /><div className="skeleton" style={{ height: 15, width: '61%' }} /><div className="skeleton" style={{ height: 15, width: '69%' }} /></div>
  </main>;
}

function TrueReach() {
  const exampleQuery = useGetExampleAnalysis();
  const analysis = useAnalyzeVideo();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const submit = (data: AnalysisInput) => {
    analysis.mutate({ data }, { onSuccess: response => { setResult(response); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
  };
  const back = () => {
    setResult(null);
    analysis.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const error = analysis.error ? (analysis.error instanceof Error ? analysis.error.message : 'The source could not be reached.') : null;
  return <div className="app-shell">
    <header className="topbar">
      <div className="brandmark" aria-label="TrueReach"><span className="mark">t.</span><span>TrueReach</span></div>
      <div className="topbar-right"><span className="eyebrow">Delivery verified.</span><span className="topbar-line" /><span className="eyebrow">Independent evidence desk</span></div>
    </header>
    <div style={{ display: analysis.isPending || result ? 'none' : undefined }}><AnalysisForm example={exampleQuery.data} exampleLoading={exampleQuery.isLoading} exampleError={exampleQuery.isError} onRetryExample={() => { void exampleQuery.refetch(); }} error={error} onSubmit={submit} /></div>
    {analysis.isPending ? <LoadingStage /> : result ? <AnalysisReport result={result} onBack={back} /> : null}
    <footer className="bottom-strip"><span>TrueReach / Sponsorship intelligence</span><span>Clarity on the record.</span></footer>
  </div>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TrueReach /></QueryClientProvider>;
}

export default App;