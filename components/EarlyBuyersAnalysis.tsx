import React, { useState, useMemo } from 'react';
import { TokenInfo, FirstBuyer } from '../types';
import { SolanaTrackerService } from '../services/solanaTrackerService';
import { Wallet, TrendingUp, DollarSign, Clock, AlertCircle, ArrowUp, ArrowDown, Search, X, Trophy } from 'lucide-react';

interface EarlyBuyersAnalysisProps {
  tokens: TokenInfo[];
  apiKey: string;
}

export const EarlyBuyersAnalysis: React.FC<EarlyBuyersAnalysisProps> = ({ tokens, apiKey }) => {
  const [selectedToken, setSelectedToken] = useState<string>(tokens[0]?.token || '');
  const [buyers, setBuyers] = useState<FirstBuyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Wallet Analysis State
  const [analyzingWallet, setAnalyzingWallet] = useState<string | null>(null);
  const [walletPnl, setWalletPnl] = useState<any | null>(null);
  const [loadingPnl, setLoadingPnl] = useState(false);

  // Top Traders Sort State
  const [topTraderSort, setTopTraderSort] = useState<'total' | 'roi' | 'realized'>('total');

  const tracker = useMemo(() => new SolanaTrackerService(apiKey), [apiKey]);

  const fetchBuyers = async () => {
    if (!selectedToken) return;
    setLoading(true);
    setError(null);
    setBuyers([]);
    
    try {
      const data = await tracker.getFirstBuyers(selectedToken);
      if (data.length === 0) {
          setError("No early buyers found or API limit reached.");
      }
      setBuyers(data);
    } catch (err) {
      setError("Failed to fetch early buyers.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeWallet = async (wallet: string) => {
      setAnalyzingWallet(wallet);
      setLoadingPnl(true);
      setWalletPnl(null);
      try {
          const data = await tracker.getWalletPnL(wallet);
          setWalletPnl(data);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingPnl(false);
      }
  };

  const closeAnalysis = () => {
      setAnalyzingWallet(null);
      setWalletPnl(null);
  };

  const calculateROI = (buyer: FirstBuyer) => {
      if (buyer.total_invested === 0) return 0;
      return (buyer.total / buyer.total_invested) * 100;
  };

  const getClassification = (buyer: FirstBuyer) => {
      const roi = calculateROI(buyer);
      if (buyer.total > 0 && roi > 100) return { label: "Smart Early", color: "bg-purple-100 text-purple-800 border-purple-200" };
      if (buyer.total > 0) return { label: "Profitable", color: "bg-green-100 text-green-800 border-green-200" };
      if (buyer.holding > 0 && buyer.sell_transactions === 0) return { label: "Diamond Hand", color: "bg-blue-100 text-blue-800 border-blue-200" };
      return { label: "Exited / Weak", color: "bg-gray-100 text-gray-800 border-gray-200" };
  };

  const formatDate = (ms: number) => {
      return new Date(ms).toLocaleString();
  };

  const formatUSD = (val: number) => {
      return `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  // Derived Top Traders
  const topTraders = useMemo(() => {
      if (!buyers.length) return [];
      const sorted = [...buyers].sort((a, b) => {
          if (topTraderSort === 'total') return b.total - a.total;
          if (topTraderSort === 'roi') return calculateROI(b) - calculateROI(a);
          if (topTraderSort === 'realized') return b.realized - a.realized;
          return 0;
      });
      return sorted.slice(0, 10);
  }, [buyers, topTraderSort]);

  return (
    <div className="mt-12 space-y-8 border-t-4 border-skin-border pt-8">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
               <h2 className="text-2xl font-black text-skin-text flex items-center gap-2">
                   <Search className="text-skin-muted" />
                   Token Deep Dive
               </h2>
               <p className="text-skin-muted text-sm font-medium mt-1">Analyze first buyers and top traders for a specific token.</p>
           </div>
           
           <div className="flex items-center gap-2 bg-skin-card p-2 rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)]">
               <select 
                   className="bg-skin-base border-2 border-skin-border rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black"
                   value={selectedToken}
                   onChange={(e) => setSelectedToken(e.target.value)}
               >
                   {tokens.map(t => (
                       <option key={t.token} value={t.token}>{t.symbol} ({t.name})</option>
                   ))}
               </select>
               <button 
                   onClick={fetchBuyers}
                   disabled={loading}
                   className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center gap-2"
               >
                   {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search size={16} />}
                   Analyze
               </button>
           </div>
       </div>

       {error && (
           <div className="bg-red-100 border-2 border-red-200 text-red-800 p-4 rounded-xl font-bold flex items-center gap-2">
               <AlertCircle size={20} />
               {error}
           </div>
       )}

       {buyers.length > 0 && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               
               {/* Top Traders Section */}
               <div className="bg-skin-card rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)] overflow-hidden">
                   <div className="p-4 border-b-2 border-skin-border bg-skin-base flex justify-between items-center">
                       <h3 className="font-black text-lg flex items-center gap-2">
                           <Trophy className="text-yellow-500" />
                           Top 10 Traders
                       </h3>
                       <div className="flex bg-skin-card rounded-lg border-2 border-skin-border p-1">
                           {(['total', 'roi', 'realized'] as const).map(sort => (
                               <button
                                   key={sort}
                                   onClick={() => setTopTraderSort(sort)}
                                   className={`px-2 py-1 text-xs font-bold rounded capitalize ${topTraderSort === sort ? 'bg-black text-white' : 'text-skin-muted hover:text-skin-text'}`}
                               >
                                   {sort}
                               </button>
                           ))}
                       </div>
                   </div>
                   <div className="overflow-x-auto">
                       <table className="w-full text-sm text-left">
                           <thead className="bg-skin-base text-xs uppercase font-bold text-skin-muted border-b-2 border-skin-border">
                               <tr>
                                   <th className="px-4 py-3">Wallet</th>
                                   <th className="px-4 py-3 text-right">Total PnL</th>
                                   <th className="px-4 py-3 text-right">ROI</th>
                                   <th className="px-4 py-3 text-right">Realized</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-skin-border/20">
                               {topTraders.map((trader, i) => (
                                   <tr key={i} className="hover:bg-skin-base/50">
                                       <td className="px-4 py-3 font-mono font-bold text-xs">
                                           {trader.wallet.slice(0, 4)}...{trader.wallet.slice(-4)}
                                       </td>
                                       <td className={`px-4 py-3 text-right font-bold ${trader.total > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                           {formatUSD(trader.total)}
                                       </td>
                                       <td className="px-4 py-3 text-right font-bold">
                                           {calculateROI(trader).toFixed(0)}%
                                       </td>
                                       <td className="px-4 py-3 text-right text-skin-muted">
                                           {formatUSD(trader.realized)}
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               </div>

               {/* Early Buyers List */}
               <div className="bg-skin-card rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)] overflow-hidden lg:col-span-2">
                   <div className="p-4 border-b-2 border-skin-border bg-skin-base">
                       <h3 className="font-black text-lg flex items-center gap-2">
                           <Clock className="text-blue-500" />
                           Early Buyers (First 100)
                       </h3>
                   </div>
                   <div className="overflow-x-auto max-h-[600px]">
                       <table className="w-full text-sm text-left">
                           <thead className="bg-black text-white text-xs uppercase font-bold sticky top-0 z-10">
                               <tr>
                                   <th className="px-4 py-3">Wallet</th>
                                   <th className="px-4 py-3">First Buy</th>
                                   <th className="px-4 py-3 text-right">Invested</th>
                                   <th className="px-4 py-3 text-right">PnL / ROI</th>
                                   <th className="px-4 py-3 text-center">Tx (B/S)</th>
                                   <th className="px-4 py-3 text-center">Class</th>
                                   <th className="px-4 py-3 text-right">Action</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y-2 divide-skin-border/10 bg-skin-card">
                               {buyers.map((buyer, i) => {
                                   const roi = calculateROI(buyer);
                                   const classification = getClassification(buyer);
                                   return (
                                       <tr key={i} className="hover:bg-skin-base transition-colors">
                                           <td className="px-4 py-3 font-mono font-bold text-xs text-skin-text">
                                               {buyer.wallet.slice(0, 4)}...{buyer.wallet.slice(-4)}
                                           </td>
                                           <td className="px-4 py-3 text-xs">
                                               <div className="font-bold">{formatUSD(buyer.first_buy.volume_usd)}</div>
                                               <div className="text-skin-muted text-[10px]">{formatDate(buyer.first_buy_time)}</div>
                                           </td>
                                           <td className="px-4 py-3 text-right font-medium text-skin-text">
                                               {formatUSD(buyer.total_invested)}
                                           </td>
                                           <td className="px-4 py-3 text-right">
                                               <div className={`font-black ${buyer.total > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                   {formatUSD(buyer.total)}
                                               </div>
                                               <div className="text-xs font-bold text-skin-muted">{roi.toFixed(0)}%</div>
                                           </td>
                                           <td className="px-4 py-3 text-center font-mono text-xs">
                                               <span className="text-green-600 font-bold">{buyer.buy_transactions}</span>
                                               <span className="text-skin-muted mx-1">/</span>
                                               <span className="text-red-600 font-bold">{buyer.sell_transactions}</span>
                                           </td>
                                           <td className="px-4 py-3 text-center">
                                               <span className={`text-[10px] px-2 py-1 rounded border ${classification.color} font-bold whitespace-nowrap`}>
                                                   {classification.label}
                                               </span>
                                           </td>
                                           <td className="px-4 py-3 text-right">
                                               <button 
                                                   onClick={() => analyzeWallet(buyer.wallet)}
                                                   className="text-xs bg-black text-white px-3 py-1.5 rounded font-bold hover:bg-gray-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                                               >
                                                   Analyze
                                               </button>
                                           </td>
                                       </tr>
                                   );
                               })}
                           </tbody>
                       </table>
                   </div>
               </div>
           </div>
       )}

       {/* Wallet Analysis Modal */}
       {analyzingWallet && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
               <div className="bg-skin-card w-full max-w-md rounded-xl border-2 border-skin-border shadow-[8px_8px_0px_0px_var(--color-shadow)] overflow-hidden animate-in fade-in zoom-in duration-200">
                   <div className="p-4 border-b-2 border-skin-border bg-skin-base flex justify-between items-center">
                       <h3 className="font-black text-lg">Wallet Analysis</h3>
                       <button onClick={closeAnalysis} className="p-1 hover:bg-skin-card rounded border-2 border-transparent hover:border-skin-border transition-all">
                           <X size={20} />
                       </button>
                   </div>
                   
                   <div className="p-6">
                       <div className="mb-6 text-center">
                           <div className="text-xs font-bold text-skin-muted uppercase tracking-wider mb-1">Target Wallet</div>
                           <div className="font-mono font-black text-xl bg-skin-base py-2 px-4 rounded border-2 border-skin-border inline-block">
                               {analyzingWallet.slice(0, 6)}...{analyzingWallet.slice(-6)}
                           </div>
                       </div>

                       {loadingPnl ? (
                           <div className="flex flex-col items-center justify-center py-8 gap-4">
                               <div className="w-10 h-10 border-4 border-skin-border border-t-black rounded-full animate-spin"></div>
                               <p className="font-bold text-skin-muted animate-pulse">Scanning wallet history...</p>
                           </div>
                       ) : walletPnl ? (
                           <div className="space-y-4">
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-skin-base p-4 rounded-lg border-2 border-skin-border">
                                       <div className="text-xs font-bold text-skin-muted uppercase">Total PnL</div>
                                       <div className={`text-2xl font-black ${walletPnl.totalRealizedPnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                           {formatUSD(walletPnl.totalRealizedPnl || 0)}
                                       </div>
                                   </div>
                                   <div className="bg-skin-base p-4 rounded-lg border-2 border-skin-border">
                                       <div className="text-xs font-bold text-skin-muted uppercase">Win Rate</div>
                                       <div className="text-2xl font-black text-skin-text">
                                           {walletPnl.winRate ? `${walletPnl.winRate}%` : 'N/A'}
                                       </div>
                                   </div>
                               </div>
                               
                               {/* Best/Worst Token (Simplified logic as API might not return sorted list directly, but let's assume we can find it if positions exist) */}
                               {walletPnl.positions && walletPnl.positions.length > 0 && (
                                   <div className="space-y-2">
                                       <div className="text-xs font-bold text-skin-muted uppercase">Top Performers</div>
                                       {walletPnl.positions.sort((a: any, b: any) => (b.realizedPnl || 0) - (a.realizedPnl || 0)).slice(0, 3).map((pos: any, i: number) => (
                                           <div key={i} className="flex justify-between items-center text-sm font-bold border-b border-skin-border/10 pb-1">
                                               <span>{pos.token?.symbol || pos.token?.mint?.slice(0, 4) || 'UNK'}</span>
                                               <span className={pos.realizedPnl > 0 ? 'text-green-600' : 'text-red-600'}>
                                                   {formatUSD(pos.realizedPnl || 0)}
                                               </span>
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </div>
                       ) : (
                           <div className="text-center py-8 text-skin-muted font-bold">
                               <AlertCircle className="mx-auto mb-2" />
                               Could not fetch PnL data.
                           </div>
                       )}
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
