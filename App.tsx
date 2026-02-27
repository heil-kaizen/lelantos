import React, { useState, useEffect } from 'react';
import { AnalysisForm } from './components/AnalysisForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { ApiKeyInput } from './components/ApiKeyInput';
import { SolanaTrackerService } from './services/solanaTrackerService';
import { AppStatus, AnalysisResult } from './types';
import { Activity, Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'night';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(""); 
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleAnalyze = async (tokens: string[]) => {
    if (!apiKey) {
      setError("Please enter your SolanaTracker API Key in the sidebar.");
      return;
    }

    setStatus(AppStatus.ANALYZING);
    setError(null);
    setResults(null);

    try {
      const service = new SolanaTrackerService(apiKey);
      const result = await service.analyzeTokens({
        tokens,
        apiKey: apiKey
      });

      setResults(result);
      setStatus(AppStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during analysis.");
      setStatus(AppStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-skin-base text-skin-text font-sans selection:bg-lime-300 selection:text-black relative overflow-hidden transition-colors duration-300">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" 
           style={{ backgroundImage: 'radial-gradient(var(--color-text) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Header */}
      <header className="border-b-2 border-skin-border bg-skin-card sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://raw.githubusercontent.com/heil-kaizen/NOFace/main/lelantos.webp" 
              alt="Lelantos Logo" 
              className="w-12 h-12 rounded-full border-2 border-skin-border shadow-[2px_2px_0px_0px_var(--color-shadow)]"
            />
            <h1 className="text-3xl font-black text-skin-text tracking-tight drop-shadow-sm">
              Lelantos
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {/* Theme Toggle */}
             <div className="flex items-center bg-skin-base border-2 border-skin-border rounded-lg p-1 shadow-[2px_2px_0px_0px_var(--color-shadow)]">
                <button 
                  onClick={() => setTheme('light')}
                  className={`p-1.5 rounded ${theme === 'light' ? 'bg-skin-text text-skin-base' : 'text-skin-muted hover:text-skin-text'} transition-all`}
                  title="Light Mode"
                >
                  <Sun size={16} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`p-1.5 rounded ${theme === 'dark' ? 'bg-skin-text text-skin-base' : 'text-skin-muted hover:text-skin-text'} transition-all`}
                  title="Dark Mode"
                >
                  <Moon size={16} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => setTheme('night')}
                  className={`p-1.5 rounded ${theme === 'night' ? 'bg-skin-text text-skin-base' : 'text-skin-muted hover:text-skin-text'} transition-all`}
                  title="Night Mode"
                >
                  <Monitor size={16} strokeWidth={3} />
                </button>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-8 bg-red-100 border-2 border-skin-border text-red-900 px-6 py-4 rounded-xl shadow-[4px_4px_0px_0px_var(--color-shadow)] flex items-center gap-3 font-bold">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-black animate-pulse"></div>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Controls */}
          <div className="lg:col-span-4 space-y-8">
            <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
            <AnalysisForm status={status} onAnalyze={handleAnalyze} />
          </div>

          {/* Right Content: Results */}
          <div className="lg:col-span-8">
            {status === AppStatus.IDLE && (
               <div className="h-full flex flex-col items-center justify-center text-skin-muted py-20 border-2 border-dashed border-skin-muted/30 rounded-xl bg-skin-card/50">
                  <div className="bg-skin-base p-6 rounded-full border-2 border-skin-border mb-6">
                    <Activity size={48} className="opacity-40 text-skin-muted" />
                  </div>
                  <p className="text-2xl font-black text-skin-muted">Ready to analyze</p>
                  <p className="text-base font-medium mt-2">Enter your API Key and token addresses to start.</p>
               </div>
            )}

            {status === AppStatus.ANALYZING && (
              <div className="h-full flex flex-col items-center justify-center py-20">
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-skin-muted/20 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-skin-border rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-2xl font-black text-skin-text mb-3">Analyzing On-Chain Data</h3>
                <p className="text-skin-muted font-medium text-base max-w-md text-center bg-skin-card px-6 py-3 rounded-lg border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)]">
                  Fetching token info and holder lists...
                  <br/>
                  <span className="text-xs opacity-60 mt-1 block">Delays added to respect API rate limits.</span>
                </p>
              </div>
            )}

            {status === AppStatus.COMPLETED && results && (
              <ResultsDashboard results={results} theme={theme} apiKey={apiKey} />
            )}

            {status === AppStatus.ERROR && (
               <div className="h-full flex flex-col items-center justify-center text-skin-muted py-20">
                 <p className="font-bold text-lg">Analysis failed.</p>
                 <p>Please check the error message above.</p>
               </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
