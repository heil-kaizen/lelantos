import React, { useState, useEffect } from 'react';
import { AnalysisForm } from './components/AnalysisForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { EarlyBuyersAnalysis } from './components/EarlyBuyersAnalysis';
import { ConnectedWalletsAnalysis } from './components/ConnectedWalletsAnalysis';
import { SolanaTrackerService } from './services/solanaTrackerService';
import { AppStatus, AnalysisResult, AnalysisMode } from './types';
import { Activity, Sun, Moon, Monitor, Users, Clock, Trophy, Trash2, AlertCircle } from 'lucide-react';

type Theme = 'light' | 'dark' | 'night';

const App: React.FC = () => {
  const [status, setStatus] = useState<Record<AnalysisMode, AppStatus>>({
    [AnalysisMode.OVERLAPS]: AppStatus.IDLE,
    [AnalysisMode.EARLY_BUYERS]: AppStatus.IDLE,
    [AnalysisMode.TOP_TRADERS]: AppStatus.IDLE,
  });
  const [results, setResults] = useState<Record<AnalysisMode, AnalysisResult | null>>({
    [AnalysisMode.OVERLAPS]: null,
    [AnalysisMode.EARLY_BUYERS]: null,
    [AnalysisMode.TOP_TRADERS]: null,
  });
  const [activeModes, setActiveModes] = useState<AnalysisMode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const apiKey = import.meta.env.VITE_SOLANA_TRACKER_API_KEY || ""; 
  const heliusApiKey = import.meta.env.VITE_HELIUS_API_KEY || "";
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleAnalyze = async (tokens: string[], selectedMode: AnalysisMode) => {
    if (!apiKey) {
      setError("API Key not found. Please set VITE_SOLANA_TRACKER_API_KEY in your environment variables.");
      return;
    }

    // Add to active modes if not already present
    if (!activeModes.includes(selectedMode)) {
      setActiveModes(prev => [...prev, selectedMode]);
    }

    setStatus(prev => ({ ...prev, [selectedMode]: AppStatus.ANALYZING }));
    setError(null);

    try {
      const service = new SolanaTrackerService(apiKey);
      
      if (selectedMode === AnalysisMode.OVERLAPS) {
        const result = await service.analyzeTokens({
          tokens,
          apiKey: apiKey
        });
        setResults(prev => ({ ...prev, [AnalysisMode.OVERLAPS]: result }));
      } else {
        const processedTokens = await Promise.all(
          tokens.map(t => service.getTokenInfo(t))
        );
        const result = {
          overlaps: [],
          processedTokens,
          tokenMap: Object.fromEntries(processedTokens.map(t => [t.token, t])),
          timestamp: Date.now()
        };
        setResults(prev => ({ ...prev, [selectedMode]: result }));
      }

      setStatus(prev => ({ ...prev, [selectedMode]: AppStatus.COMPLETED }));
      
      // Scroll to the section after a short delay to allow rendering
      setTimeout(() => {
        const element = document.getElementById(`section-${selectedMode}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError(err.message || `An error occurred during ${selectedMode.toLowerCase()} analysis.`);
      setStatus(prev => ({ ...prev, [selectedMode]: AppStatus.ERROR }));
    }
  };

  const handleClearAll = () => {
    setActiveModes([]);
    setResults({
      [AnalysisMode.OVERLAPS]: null,
      [AnalysisMode.EARLY_BUYERS]: null,
      [AnalysisMode.TOP_TRADERS]: null,
    });
    setStatus({
      [AnalysisMode.OVERLAPS]: AppStatus.IDLE,
      [AnalysisMode.EARLY_BUYERS]: AppStatus.IDLE,
      [AnalysisMode.TOP_TRADERS]: AppStatus.IDLE,
    });
    setError(null);
  };

  const isAnyAnalyzing = Object.values(status).some(s => s === AppStatus.ANALYZING);

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
            <div className="lg:sticky lg:top-24 space-y-8">
              <AnalysisForm 
                status={isAnyAnalyzing ? AppStatus.ANALYZING : AppStatus.IDLE} 
                onAnalyze={handleAnalyze} 
              />
              
              {activeModes.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="w-full py-3 rounded-xl font-black text-sm transition-all border-2 border-skin-border bg-red-100 text-red-600 shadow-[4px_4px_0px_0px_var(--color-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--color-shadow)] active:shadow-none flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Clear All Results
                </button>
              )}

              {/* How it Works Section */}
              <div className="bg-skin-card p-6 rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)]">
                  <h3 className="text-lg font-black text-skin-text mb-3 flex items-center gap-2">
                      <Activity size={20} className="text-skin-muted" />
                      How it Works
                  </h3>
                  <p className="text-sm text-skin-muted font-medium leading-relaxed">
                      This tool scans the holder lists of the tokens you enter to find <strong className="text-skin-text">Overlapping Wallets</strong>—addresses that hold multiple tokens from your list.
                  </p>
                  <p className="text-sm text-skin-muted font-medium leading-relaxed mt-3">
                      Finding the same wallet across 2+ tokens often indicates a recurring trader, a coordinated group, or a 'smart wallet' following a specific narrative. We then analyze these wallets to reveal their PnL, win rate, and trading tags.
                  </p>
              </div>
            </div>
          </div>

          {/* Right Content: Results */}
          <div className="lg:col-span-8 space-y-12">
            {activeModes.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-skin-muted py-20 border-2 border-dashed border-skin-muted/30 rounded-xl bg-skin-card/50">
                  <div className="bg-skin-base p-6 rounded-full border-2 border-skin-border mb-6">
                    <Activity size={48} className="opacity-40 text-skin-muted" />
                  </div>
                  <p className="text-2xl font-black text-skin-muted">Ready to analyze</p>
                  <p className="text-base font-medium mt-2">Enter token addresses to start.</p>
               </div>
            )}

            {activeModes.map((activeMode) => (
              <div key={activeMode} id={`section-${activeMode}`} className="scroll-mt-24 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded border-2 border-skin-border shadow-[2px_2px_0px_0px_var(--color-shadow)] ${
                    activeMode === AnalysisMode.OVERLAPS ? 'bg-lime-300' : 
                    activeMode === AnalysisMode.EARLY_BUYERS ? 'bg-blue-300' : 'bg-yellow-300'
                  }`}>
                    {activeMode === AnalysisMode.OVERLAPS ? <Users size={20} /> : 
                     activeMode === AnalysisMode.EARLY_BUYERS ? <Clock size={20} /> : <Trophy size={20} />}
                  </div>
                  <h2 className="text-2xl font-black text-skin-text uppercase tracking-tight">
                    {activeMode.replace('_', ' ')} Analysis
                  </h2>
                </div>

                {status[activeMode] === AppStatus.ANALYZING && (
                  <div className="flex flex-col items-center justify-center py-12 bg-skin-card rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)]">
                    <div className="relative w-12 h-12 mb-4">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-skin-muted/20 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-skin-border rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="font-black text-skin-text">Analyzing Data...</p>
                  </div>
                )}

                {status[activeMode] === AppStatus.COMPLETED && results[activeMode] && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeMode === AnalysisMode.OVERLAPS ? (
                      <ResultsDashboard results={results[activeMode]!} theme={theme} apiKey={apiKey} heliusApiKey={heliusApiKey} />
                    ) : (
                      <div className="bg-skin-card p-6 rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)]">
                        <EarlyBuyersAnalysis 
                          tokens={results[activeMode]!.processedTokens} 
                          apiKey={apiKey} 
                          initialTab={activeMode === AnalysisMode.EARLY_BUYERS ? 'early_buyers' : 'top_traders'}
                        />
                      </div>
                    )}
                  </div>
                )}

                {status[activeMode] === AppStatus.ERROR && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl font-bold flex items-center gap-2">
                    <AlertCircle size={20} />
                    Failed to load {activeMode.toLowerCase()} data.
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

        {/* Connected Wallets Analysis Section */}
        <div className="mt-24">
            <ConnectedWalletsAnalysis heliusApiKey={heliusApiKey} />
        </div>

      </main>
    </div>
  );
};

export default App;
