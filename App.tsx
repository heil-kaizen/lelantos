import React, { useState } from 'react';
import { AnalysisForm } from './components/AnalysisForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { ApiKeyInput } from './components/ApiKeyInput';
import { SolanaTrackerService } from './services/solanaTrackerService';
import { AppStatus, AnalysisResult } from './types';
import { Activity } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(""); 

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-lime-300 selection:text-black relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Header */}
      <header className="border-b-2 border-black bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://raw.githubusercontent.com/heil-kaizen/lelantos/main/lelantos.webp" 
              alt="Lelantos Logo" 
              className="w-12 h-12 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
            <h1 className="text-3xl font-black text-black tracking-tight drop-shadow-sm">
              Lelantos
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-bold text-slate-600">
             {/* Github logo removed */}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-8 bg-red-100 border-2 border-black text-red-900 px-6 py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 font-bold">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-black animate-pulse"></div>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Controls */}
          <div className="lg:col-span-4 space-y-8">
            <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
            <AnalysisForm status={status} onAnalyze={handleAnalyze} />
            
            {/* Info Box */}
            <div className="bg-blue-50 p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm text-slate-800 leading-relaxed">
              <h4 className="font-black text-lg text-black mb-3 flex items-center gap-2">
                <span className="bg-blue-400 text-white w-6 h-6 rounded flex items-center justify-center border border-black text-xs">?</span>
                How this works
              </h4>
              <p className="mb-2 font-medium">
                1. We fetch the Top 100 holders for each token you provide via SolanaTracker.
              </p>
              <p className="mb-2 font-medium">
                2. We identify any wallet that appears in the Top 100 list for multiple tokens.
              </p>
              <p className="font-medium">
                3. We cross-reference these wallets to find coordinated activity or heavy overlapping exposure.
              </p>
            </div>
          </div>

          {/* Right Content: Results */}
          <div className="lg:col-span-8">
            {status === AppStatus.IDLE && (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20 border-2 border-dashed border-slate-300 rounded-xl bg-white/50">
                  <div className="bg-slate-100 p-6 rounded-full border-2 border-slate-200 mb-6">
                    <Activity size={48} className="opacity-40 text-slate-400" />
                  </div>
                  <p className="text-2xl font-black text-slate-300">Ready to analyze</p>
                  <p className="text-base font-medium mt-2">Enter your API Key and token addresses to start.</p>
               </div>
            )}

            {status === AppStatus.ANALYZING && (
              <div className="h-full flex flex-col items-center justify-center py-20">
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-black rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-2xl font-black text-black mb-3">Analyzing On-Chain Data</h3>
                <p className="text-slate-600 font-medium text-base max-w-md text-center bg-white px-6 py-3 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  Fetching token info and holder lists...
                  <br/>
                  <span className="text-xs text-slate-400 mt-1 block">Delays added to respect API rate limits.</span>
                </p>
              </div>
            )}

            {status === AppStatus.COMPLETED && results && (
              <ResultsDashboard results={results} />
            )}

            {status === AppStatus.ERROR && (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
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