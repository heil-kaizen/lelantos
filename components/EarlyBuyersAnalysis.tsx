import React, { useState, useMemo } from 'react';
import { AnalysisResult, RecurringWallet } from '../types';
import { Wallet, TrendingUp, DollarSign, Clock, AlertCircle, ArrowUp, ArrowDown, Search, X, Trophy, Copy, CheckCircle, Users, ExternalLink, Download, CheckSquare, Square } from 'lucide-react';

interface EarlyBuyersAnalysisProps {
  result: AnalysisResult;
  apiKey: string;
  initialTab?: 'early_buyers' | 'top_traders';
}

export const EarlyBuyersAnalysis: React.FC<EarlyBuyersAnalysisProps> = ({ result, apiKey, initialTab = 'early_buyers' }) => {
  const [activeTab] = useState<'early_buyers' | 'top_traders'>(initialTab);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedWallets, setSelectedWallets] = useState<Set<string>>(new Set());

  const recurringWallets = result.recurringWallets || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatUSD = (val: number) => {
      return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const toggleWalletSelection = (address: string) => {
      const next = new Set(selectedWallets);
      if (next.has(address)) {
          next.delete(address);
      } else {
          next.add(address);
      }
      setSelectedWallets(next);
  };

  const toggleAllSelection = () => {
      if (selectedWallets.size === recurringWallets.length) {
          setSelectedWallets(new Set());
      } else {
          setSelectedWallets(new Set(recurringWallets.map(w => w.address)));
      }
  };

  const handleExport = (selectedOnly: boolean) => {
      const walletsToExport = selectedOnly 
          ? recurringWallets.filter(w => selectedWallets.has(w.address))
          : recurringWallets;

      if (walletsToExport.length === 0) return;

      const exportData = walletsToExport.map((wallet) => {
          // Find 1-based index in the original list
          const index = recurringWallets.findIndex(w => w.address === wallet.address) + 1;
          const prefix = wallet.type === 'early_buyer' ? 'E' : 'T';
          
          // tokens here are symbols like ["BONK", "WIF"]
          const symbolsStr = (wallet.tokens || [])
              .map(t => (t || 'u').charAt(0).toLowerCase())
              .join('');
              
          return {
              address: wallet.address,
              name: `${prefix}_${symbolsStr}_${index}`,
              emoji: "😀"
          };
      });

      const jsonString = JSON.stringify(exportData, null, 2);
      navigator.clipboard.writeText(jsonString);
      
      const originalCopied = copied;
      setCopied('exported');
      setTimeout(() => setCopied(originalCopied), 2000);
  };

  return (
    <div className="mt-4 space-y-8">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
               <h2 className="text-2xl font-black text-skin-text flex items-center gap-2">
                   {activeTab === 'early_buyers' ? <Clock className="text-blue-500" /> : <Trophy className="text-yellow-500" />}
                   {activeTab === 'early_buyers' ? 'Recurring Early Buyers' : 'Recurring Top Traders'}
               </h2>
               <p className="text-skin-muted text-sm font-medium mt-1">
                   {activeTab === 'early_buyers' 
                    ? 'Identify wallets that appear as Early Buyers across multiple tokens.' 
                    : 'Identify wallets that appear as Top Traders across multiple tokens.'}
               </p>
           </div>
           
           {recurringWallets.length > 0 && (
               <div className="flex items-center gap-2">
                   <button
                       onClick={() => handleExport(true)}
                       disabled={selectedWallets.size === 0}
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all border-2 border-skin-border disabled:opacity-50 disabled:cursor-not-allowed bg-blue-100 text-blue-700 hover:bg-blue-200"
                   >
                       <Download size={14} />
                       Export Selected ({selectedWallets.size})
                   </button>
                   <button
                       onClick={() => handleExport(false)}
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all border-2 border-skin-border bg-skin-card text-skin-text hover:bg-skin-muted/10 shadow-[2px_2px_0px_0px_var(--color-shadow)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                   >
                       <Download size={14} />
                       Export All
                   </button>
                   {copied === 'exported' && <span className="text-xs font-bold text-green-500 animate-pulse">Copied!</span>}
               </div>
           )}
       </div>

       {recurringWallets.length > 0 && (
           <div className="bg-skin-card rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)] overflow-hidden">
                {/* Content */}
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-black text-white text-xs uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center">
                                    <button onClick={toggleAllSelection} className="align-middle">
                                        {selectedWallets.size > 0 && selectedWallets.size === recurringWallets.length 
                                            ? <CheckSquare size={18} className="text-lime-400" />
                                            : <Square size={18} className="opacity-50 hover:opacity-100" />
                                        }
                                    </button>
                                </th>
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
                            {recurringWallets.map((wallet, i) => {
                                const isSelected = selectedWallets.has(wallet.address);
                                return (
                                <tr key={i} className={`hover:bg-skin-base transition-colors ${isSelected ? 'bg-skin-muted/5' : ''}`}>
                                    <td className="px-4 py-4 text-center">
                                        <button onClick={() => toggleWalletSelection(wallet.address)} className="align-middle border-none bg-transparent">
                                            {isSelected 
                                                ? <CheckSquare size={18} className="text-lime-500" />
                                                : <Square size={18} className="text-skin-muted opacity-30 hover:opacity-100" />
                                            }
                                        </button>
                                    </td>
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {recurringWallets.length === 0 && (
            <div className="bg-skin-card p-12 text-center text-skin-muted font-bold border-2 border-skin-border rounded-xl shadow-[4px_4px_0px_0px_var(--color-shadow)]">
                No recurring wallets found in this category across the analyzed tokens.
            </div>
        )}
     </div>
  );
};
