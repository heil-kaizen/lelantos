import React, { useState, useMemo } from 'react';
import { AnalysisResult, RecurringWallet } from '../types';
import { Wallet, TrendingUp, DollarSign, Clock, AlertCircle, ArrowUp, ArrowDown, Search, X, Trophy, Copy, CheckCircle, Users, ExternalLink } from 'lucide-react';

interface EarlyBuyersAnalysisProps {
  result: AnalysisResult;
  apiKey: string;
  initialTab?: 'early_buyers' | 'top_traders';
}

export const EarlyBuyersAnalysis: React.FC<EarlyBuyersAnalysisProps> = ({ result, apiKey, initialTab = 'early_buyers' }) => {
  const [activeTab] = useState<'early_buyers' | 'top_traders'>(initialTab);
  const [copied, setCopied] = useState<string | null>(null);

  const recurringWallets = result.recurringWallets || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatUSD = (val: number) => {
      return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
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
       </div>

       {recurringWallets.length > 0 && (
           <div className="bg-skin-card rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)] overflow-hidden">
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
                            {recurringWallets.map((wallet, i) => (
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
