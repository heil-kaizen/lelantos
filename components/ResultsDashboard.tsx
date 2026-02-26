import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { ExternalLink, Copy, CheckCircle, AlertTriangle, Users, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ResultsDashboardProps {
  results: AnalysisResult;
  theme?: 'light' | 'dark' | 'night';
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results, theme = 'light' }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  // Prepare chart data
  const chartData = results.overlaps.map((overlap, index) => ({
    name: `W${index + 1}`,
    address: overlap.address,
    score: overlap.score || 0,
    tokens: overlap.tokens.length
  })).slice(0, 10); 

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-skin-muted';
    if (score >= 8) return 'text-red-600 font-black'; // High alert
    if (score >= 5) return 'text-amber-600 font-black';
    return 'text-green-600 font-black';
  };

  const getTagColor = (tag: string) => {
      switch(tag) {
          case 'Whale': return 'bg-purple-200 text-black border-2 border-skin-border font-bold';
          case 'Early Sniper': return 'bg-red-200 text-black border-2 border-skin-border font-bold';
          case 'Diamond Hand': return 'bg-blue-200 text-black border-2 border-skin-border font-bold';
          case 'Quick Flipper': return 'bg-orange-200 text-black border-2 border-skin-border font-bold';
          case 'Top Trader': return 'bg-yellow-200 text-black border-2 border-skin-border font-bold';
          default: return 'bg-skin-muted/10 text-skin-text border-2 border-skin-border font-bold';
      }
  };

  // Dynamic Chart Styles
  const getChartStyles = () => {
    if (theme === 'night') {
        return { axis: '#22c55e', tooltipBg: '#000', tooltipText: '#22c55e', tooltipBorder: '#22c55e' };
    }
    if (theme === 'dark') {
        return { axis: '#fff', tooltipBg: '#1e293b', tooltipText: '#fff', tooltipBorder: '#fff' };
    }
    return { axis: '#000', tooltipBg: '#fff', tooltipText: '#000', tooltipBorder: '#000' };
  };
  
  const chartStyles = getChartStyles();

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-skin-card p-6 rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)]">
          <p className="text-skin-muted text-sm font-bold uppercase tracking-wider">Overlapping Wallets</p>
          <h3 className="text-4xl font-black text-skin-text mt-2">{results.overlaps.length}</h3>
          <p className="text-xs text-skin-muted mt-2 font-medium">Found in 2+ tokens</p>
        </div>
        
        <div className="bg-skin-card p-6 rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)]">
          <p className="text-skin-muted text-sm font-bold uppercase tracking-wider">Highest Threat Score</p>
          <h3 className="text-4xl font-black text-red-500 mt-2">
            {results.overlaps.length > 0 ? Math.max(...results.overlaps.map(o => o.score || 0)) : 0}/10
          </h3>
          <p className="text-xs text-skin-muted mt-2 font-medium">Based on wallet activity</p>
        </div>

        <div className="bg-skin-card p-6 rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)]">
          <p className="text-skin-muted text-sm font-bold uppercase tracking-wider">Tokens Scanned</p>
          <h3 className="text-4xl font-black text-green-500 mt-2">{results.processedTokens.length}</h3>
          
          <div className="flex flex-col gap-2 mt-4">
            {results.processedTokens.map((t, i) => (
               <div key={i} className="flex items-center gap-2 text-xs text-skin-text font-bold">
                 <div className="w-6 h-6 rounded-full bg-skin-base border border-skin-border flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {t.image ? <img src={t.image} alt={t.symbol} className="w-full h-full object-cover"/> : t.symbol?.charAt(0)}
                 </div>
                 <span className="font-black">{t.symbol}</span>
                 <span className="text-skin-muted flex items-center gap-1 font-medium">
                   <Users size={10} />
                   {t.holderCount !== undefined ? t.holderCount : '?'} 
                 </span>
               </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score Chart */}
      {results.overlaps.length > 0 && (
          <div className="bg-skin-card p-6 rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)] h-80">
            <h3 className="text-lg font-black text-skin-text mb-6">Wallet Threat Scores</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke={chartStyles.axis} fontSize={12} tick={{fill: chartStyles.axis, fontWeight: 'bold'}} tickLine={false} axisLine={{strokeWidth: 2}} />
                    <YAxis stroke={chartStyles.axis} fontSize={12} domain={[0, 10]} tick={{fill: chartStyles.axis, fontWeight: 'bold'}} tickLine={false} axisLine={{strokeWidth: 2}} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: chartStyles.tooltipBg, border: `2px solid ${chartStyles.tooltipBorder}`, borderRadius: '8px', color: chartStyles.tooltipText, boxShadow: `4px 4px 0px 0px ${chartStyles.tooltipBorder}` }}
                        cursor={{fill: 'rgba(0, 0, 0, 0.05)'}}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} stroke={chartStyles.axis} strokeWidth={2} fill={entry.score > 7 ? '#ef4444' : entry.score > 4 ? '#f59e0b' : '#84cc16'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
      )}

      {/* Detailed List */}
      <div className="bg-skin-card rounded-xl border-2 border-skin-border overflow-hidden shadow-[4px_4px_0px_0px_var(--color-shadow)]">
        <div className="p-6 border-b-2 border-skin-border flex justify-between items-center bg-skin-base">
            <h3 className="text-lg font-black text-skin-text">Smart Wallet Intelligence</h3>
            <span className="text-xs bg-skin-card text-skin-text px-3 py-1.5 rounded border-2 border-skin-border font-bold shadow-[2px_2px_0px_0px_var(--color-shadow)]">Sorted by Score</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-skin-muted">
                <thead className="bg-black text-white uppercase font-bold tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Wallet / Tags</th>
                        <th className="px-6 py-4 text-center">Score</th>
                        <th className="px-6 py-4">Portfolio</th>
                        <th className="px-6 py-4">Holdings</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y-2 divide-skin-border/10">
                    {results.overlaps.map((overlap) => (
                        <tr key={overlap.address} className="hover:bg-skin-base transition-colors font-medium">
                            {/* Wallet & Tags */}
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    <span className="font-mono text-skin-text font-bold">
                                        {overlap.address.slice(0, 4)}...{overlap.address.slice(-4)}
                                    </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {overlap.tags && overlap.tags.length > 0 ? (
                                            overlap.tags.map(tag => (
                                                <span key={tag} className={`text-[10px] px-2 py-0.5 rounded ${getTagColor(tag)}`}>
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] px-2 py-0.5 rounded border-2 border-skin-border text-skin-muted font-bold">
                                                Casual
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </td>

                            {/* Score */}
                            <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center">
                                    <span className={`text-xl ${getScoreColor(overlap.score)}`}>
                                        {overlap.score || 0}
                                    </span>
                                    <span className="text-[10px] text-skin-muted font-bold">/10</span>
                                </div>
                            </td>

                            {/* Portfolio Value */}
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5">
                                    <Wallet size={14} className="text-skin-muted" />
                                    <span className="text-skin-text font-bold">
                                        {overlap.portfolioValue 
                                            ? `$${overlap.portfolioValue.toLocaleString(undefined, {maximumFractionDigits: 0})}` 
                                            : 'N/A'}
                                    </span>
                                </div>
                            </td>

                            {/* Holdings */}
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-2">
                                    {overlap.tokens.map(tokenAddr => {
                                        const info = results.tokenMap[tokenAddr];
                                        const percentage = overlap.percentages[tokenAddr];
                                        return (
                                            <div key={tokenAddr} className="bg-skin-card border-2 border-skin-border rounded px-2 py-1 text-xs flex items-center gap-1 shadow-[2px_2px_0px_0px_var(--color-shadow)]">
                                                <span className="font-black text-skin-text">{info?.symbol || 'UNK'}</span>
                                                {percentage !== undefined && (
                                                    <span className="text-green-600 font-bold ml-1">
                                                        {percentage < 0.01 ? '<0.01%' : `${percentage.toFixed(2)}%`}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => copyToClipboard(overlap.address)}
                                        className="p-2 text-skin-muted hover:text-skin-text hover:bg-skin-base rounded-lg border-2 border-transparent hover:border-skin-border transition-all"
                                        title="Copy Address"
                                    >
                                        {copied === overlap.address ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                                    </button>
                                    <a 
                                        href={`https://solscan.io/account/${overlap.address}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 text-skin-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg border-2 border-transparent hover:border-skin-border transition-all"
                                        title="View on Solscan"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {results.overlaps.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-skin-muted">
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <AlertTriangle size={32} />
                                    <p className="font-bold">No overlaps found.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
