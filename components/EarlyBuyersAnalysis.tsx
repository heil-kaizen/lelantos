import React, { useState, useMemo } from 'react';
import { TokenInfo, FirstBuyer, RecurringWallet } from '../types';
import { SolanaTrackerService } from '../services/solanaTrackerService';
import { Wallet, TrendingUp, DollarSign, Clock, AlertCircle, ArrowUp, ArrowDown, Search, X, Trophy, Copy, CheckCircle, Users, ExternalLink } from 'lucide-react';

interface EarlyBuyersAnalysisProps {
  tokens: TokenInfo[];
  apiKey: string;
}

export const EarlyBuyersAnalysis: React.FC<EarlyBuyersAnalysisProps> = ({ tokens, apiKey }) => {
  const [activeTab, setActiveTab] = useState<'early_buyers' | 'top_traders'>('early_buyers');
  const [recurringBuyers, setRecurringBuyers] = useState<RecurringWallet[]>([]);
  const [recurringTraders, setRecurringTraders] = useState<RecurringWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const tracker = useMemo(() => new SolanaTrackerService(apiKey), [apiKey]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatUSD = (val: number) => {
      return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const scanRecurringWallets = async () => {
    if (tokens.length < 2) {
        setError("Please analyze at least 2 tokens to find recurring wallets.");
        return;
    }

    setLoading(true);
    setError(null);
    setRecurringBuyers([]);
    setRecurringTraders([]);
    
    // Total requests = tokens.length * 2 (First Buyers + Top Traders)
    const totalRequests = tokens.length * 2;
    setProgress({ current: 0, total: totalRequests });

    const buyerMap = new Map<string, any[]>();
    const traderMap = new Map<string, any[]>();

    try {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            // 1. Fetch First Buyers
            try {
                const buyers = await tracker.getFirstBuyers(token.token);
                for (const b of buyers) {
                    if (!buyerMap.has(b.wallet)) buyerMap.set(b.wallet, []);
                    buyerMap.get(b.wallet)?.push({ ...b, tokenSymbol: token.symbol });
                }
            } catch (e) {
                console.warn(`Failed buyers for ${token.symbol}`, e);
            }
            setProgress(prev => ({ ...prev, current: prev.current + 1 }));

            // 2. Fetch Top Traders
            try {
                const traders = await tracker.getTopTraders(token.token);
                for (const t of traders) {
                    const wallet = t.wallet || t.owner || t.address;
                    if (wallet) {
                        if (!traderMap.has(wallet)) traderMap.set(wallet, []);
                        traderMap.get(wallet)?.push({ ...t, tokenSymbol: token.symbol });
                    }
                }
            } catch (e) {
                console.warn(`Failed traders for ${token.symbol}`, e);
            }
            setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }

        // Process Overlaps
        const processMap = (map: Map<string, any[]>, type: 'early_buyer' | 'top_trader'): RecurringWallet[] => {
            const results: RecurringWallet[] = [];
            for (const [address, entries] of map.entries()) {
                // Only keep if present in at least 2 tokens
                const uniqueTokens = new Set(entries.map(e => e.tokenSymbol));
                if (uniqueTokens.size >= 2) {
                    let totalPnl = 0;
                    let totalRoi = 0;
                    let wins = 0;

                    for (const e of entries) {
                        // Normalize PnL/ROI fields based on API response structure
                        const pnl = e.total || e.pnl || 0;
                        const roi = e.roi || (e.total_invested ? (e.total / e.total_invested) * 100 : 0);
                        
                        totalPnl += pnl;
                        totalRoi += roi;
                        if (pnl > 0) wins++;
                    }

                    results.push({
                        address,
                        type,
                        occurrences: uniqueTokens.size,
                        tokens: Array.from(uniqueTokens),
                        total_pnl: totalPnl,
                        avg_roi: totalRoi / entries.length,
                        win_rate: Math.round((wins / entries.length) * 100),
                        data_points: entries
                    });
                }
            }
            return results.sort((a, b) => b.occurrences - a.occurrences || b.total_pnl - a.total_pnl);
        };

        setRecurringBuyers(processMap(buyerMap, 'early_buyer'));
        setRecurringTraders(processMap(traderMap, 'top_trader'));

    } catch (err) {
        setError("Failed to complete scan. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="mt-12 space-y-8 border-t-4 border-skin-border pt-8">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
               <h2 className="text-2xl font-black text-skin-text flex items-center gap-2">
                   <Users className="text-skin-muted" />
                   Recurring Wallet Finder
               </h2>
               <p className="text-skin-muted text-sm font-medium mt-1">
                   Identify wallets that appear as Early Buyers or Top Traders across multiple tokens.
               </p>
           </div>
           
           <div className="flex items-center gap-2">
               {!loading && (recurringBuyers.length === 0 && recurringTraders.length === 0) && (
                   <button 
                       onClick={scanRecurringWallets}
                       className="bg-black text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                   >
                       <Search size={18} />
                       Scan for Recurring Wallets
                   </button>
               )}
           </div>
       </div>

       {loading && (
           <div className="bg-skin-card p-8 rounded-xl border-2 border-skin-border text-center">
               <div className="w-12 h-12 border-4 border-skin-border border-t-black rounded-full animate-spin mx-auto mb-4"></div>
               <h3 className="text-lg font-black text-skin-text">Scanning Wallets...</h3>
               <p className="text-skin-muted font-medium mb-4">Checking {tokens.length} tokens for recurring patterns.</p>
               <div className="w-full max-w-md mx-auto bg-skin-base h-4 rounded-full border-2 border-skin-border overflow-hidden">
                   <div 
                       className="h-full bg-green-500 transition-all duration-500 ease-out"
                       style={{ width: `${(progress.current / progress.total) * 100}%` }}
                   ></div>
               </div>
               <p className="text-xs font-bold mt-2 text-skin-muted">{progress.current} / {progress.total} requests completed</p>
           </div>
       )}

       {error && (
           <div className="bg-red-100 border-2 border-red-200 text-red-800 p-4 rounded-xl font-bold flex items-center gap-2">
               <AlertCircle size={20} />
               {error}
           </div>
       )}

       {!loading && (recurringBuyers.length > 0 || recurringTraders.length > 0) && (
           <div className="bg-skin-card rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)] overflow-hidden">
               {/* Tabs */}
               <div className="flex border-b-2 border-skin-border bg-skin-base">
                   <button
                       onClick={() => setActiveTab('early_buyers')}
                       className={`flex-1 py-4 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'early_buyers' ? 'bg-skin-card text-skin-text border-r-2 border-skin-border' : 'text-skin-muted hover:bg-skin-card/50'}`}
                   >
                       <Clock size={16} className={activeTab === 'early_buyers' ? 'text-blue-500' : ''} />
                       Recurring Early Buyers ({recurringBuyers.length})
                   </button>
                   <button
                       onClick={() => setActiveTab('top_traders')}
                       className={`flex-1 py-4 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'top_traders' ? 'bg-skin-card text-skin-text border-l-2 border-skin-border' : 'text-skin-muted hover:bg-skin-card/50'}`}
                   >
                       <Trophy size={16} className={activeTab === 'top_traders' ? 'text-yellow-500' : ''} />
                       Recurring Top Traders ({recurringTraders.length})
                   </button>
               </div>

               {/* Content */}
               <div className="overflow-x-auto max-h-[600px]">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-black text-white text-xs uppercase font-bold sticky top-0 z-10">
                           <tr>
                               <th className="px-6 py-4">Wallet</th>
                               <th className="px-6 py-4 text-center">Occurrences</th>
                               <th className="px-6 py-4">Tokens Found In</th>
                               <th className="px-6 py-4 text-right">Total PnL</th>
                               <th className="px-6 py-4 text-right">Avg ROI</th>
                               <th className="px-6 py-4 text-right">GMGN</th>
                               <th className="px-6 py-4 text-right">Action</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y-2 divide-skin-border/10 bg-skin-card">
                           {(activeTab === 'early_buyers' ? recurringBuyers : recurringTraders).map((wallet, i) => (
                               <tr key={i} className="hover:bg-skin-base transition-colors">
                                   <td className="px-6 py-4 font-mono font-bold text-xs text-skin-text">
                                       {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                       <span className="bg-skin-base border-2 border-skin-border px-2 py-1 rounded font-black text-xs">
                                           {wallet.occurrences}
                                       </span>
                                   </td>
                                   <td className="px-6 py-4">
                                       <div className="flex flex-wrap gap-1">
                                           {wallet.tokens.map(t => (
                                               <span key={t} className="text-[10px] bg-skin-muted/10 text-skin-text px-1.5 py-0.5 rounded font-bold border border-skin-border/20">
                                                   {t}
                                               </span>
                                           ))}
                                       </div>
                                   </td>
                                   <td className={`px-6 py-4 text-right font-black ${wallet.total_pnl > 0 ? 'text-green-600' : wallet.total_pnl < 0 ? 'text-red-600' : 'text-skin-text'}`}>
                                       {formatUSD(wallet.total_pnl)}
                                   </td>
                                   <td className="px-6 py-4 text-right font-bold text-skin-muted">
                                       {wallet.avg_roi.toFixed(0)}%
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                       <a 
                                           href={`https://gmgn.ai/sol/address/${wallet.address}`}
                                           target="_blank"
                                           rel="noopener noreferrer"
                                           className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 font-bold hover:underline"
                                       >
                                           View <ExternalLink size={14} />
                                       </a>
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                       <button 
                                           onClick={() => copyToClipboard(wallet.address)}
                                           className="p-2 text-skin-muted hover:text-skin-text hover:bg-skin-base rounded-lg border-2 border-transparent hover:border-skin-border transition-all"
                                           title="Copy Address"
                                       >
                                           {copied === wallet.address ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                                       </button>
                                   </td>
                               </tr>
                           ))}
                           {(activeTab === 'early_buyers' ? recurringBuyers : recurringTraders).length === 0 && (
                               <tr>
                                   <td colSpan={7} className="px-6 py-12 text-center text-skin-muted font-bold">
                                       No recurring wallets found in this category across the analyzed tokens.
                                   </td>
                               </tr>
                           )}
                       </tbody>
                   </table>
               </div>
           </div>
       )}
    </div>
  );
};
