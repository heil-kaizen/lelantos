import React, { useState } from 'react';
import { HeliusService } from '../services/heliusService';
import { ConnectedWalletResult } from '../types';
import { Search, ArrowRight, Wallet, Clock, AlertCircle, ExternalLink, TrendingUp, ShieldCheck, Repeat, Copy, CheckCircle } from 'lucide-react';

interface ConnectedWalletsAnalysisProps {
  heliusApiKey: string;
}

export const ConnectedWalletsAnalysis: React.FC<ConnectedWalletsAnalysisProps> = ({ heliusApiKey }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [results, setResults] = useState<ConnectedWalletResult[] | null>(null);
  const [scannedCount, setScannedCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress.trim()) {
        setError("Please enter a wallet address.");
        return;
    }
    if (!heliusApiKey) {
        setError("Helius API Key not found. Please set VITE_HELIUS_API_KEY in your environment variables.");
        return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setScannedCount(0);

    try {
      const service = new HeliusService(heliusApiKey);
      const data = await service.traceConnectedWallets(walletAddress);
      setResults(data.results);
      setScannedCount(data.scanned_count);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to trace connected wallets.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getClassificationColor = (cls?: string) => {
      switch(cls) {
          case 'Strongly Linked Wallet': return 'text-purple-600 bg-purple-100 border-purple-200';
          case 'Side Wallet': return 'text-red-600 bg-red-100 border-red-200';
          case 'Funding Wallet': return 'text-green-600 bg-green-100 border-green-200';
          default: return 'text-blue-600 bg-blue-100 border-blue-200';
      }
  };

  return (
    <div className="bg-skin-card rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)] overflow-hidden h-full">
      <div className="p-6 border-b-2 border-skin-border bg-skin-base">
        <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-500 p-2 rounded border-2 border-skin-border shadow-[2px_2px_0px_0px_var(--color-shadow)]">
                <Repeat className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-skin-text">Connected / Side Wallets</h2>
                <p className="text-skin-muted text-sm font-medium">Trace capital flows and identify side wallets (≥ 0.5 SOL).</p>
            </div>
        </div>

        <form onSubmit={handleAnalyze} className="flex gap-4 items-start">
            <div className="flex-grow">
                <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter Wallet Address to Trace"
                    className="w-full bg-skin-card border-2 border-skin-border rounded-lg p-3 text-skin-text font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--color-shadow)] transition-all placeholder-skin-muted"
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-black transition-all border-2 border-skin-border flex items-center gap-2 ${
                    loading
                    ? "bg-skin-muted/20 text-skin-muted cursor-not-allowed"
                    : "bg-indigo-500 text-white shadow-[4px_4px_0px_0px_var(--color-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--color-shadow)] active:shadow-none"
                }`}
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Tracing...
                    </>
                ) : (
                    <>
                        <Search size={18} />
                        Trace Flows
                    </>
                )}
            </button>
        </form>

        {loading && (
            <div className="mt-4 text-center p-4 bg-indigo-50 rounded-lg border-2 border-indigo-100 text-indigo-800 font-bold animate-pulse">
                Scanning history (up to 700 txs) & resolving identities...
            </div>
        )}

        {error && (
            <div className="mt-4 bg-red-100 border-2 border-red-200 text-red-800 p-4 rounded-xl font-bold flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
            </div>
        )}

        {!loading && scannedCount >= 700 && (
            <div className="mt-4 bg-orange-100 border-2 border-orange-200 text-orange-800 p-4 rounded-xl font-bold flex items-center gap-2">
                <AlertCircle size={20} />
                High activity wallet — scanning limited to last 700 transfers.
            </div>
        )}
      </div>

        {results && (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-black text-white uppercase font-bold tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Connected Wallet</th>
                        <th className="px-6 py-4 text-right">Sent (SOL)</th>
                        <th className="px-6 py-4 text-right">Received (SOL)</th>
                        <th className="px-6 py-4 text-center">Transfers</th>
                        <th className="px-6 py-4">Last Transfer</th>
                        <th className="px-6 py-4">Classification</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y-2 divide-skin-border/10 bg-skin-card">
                    {results.map((item, index) => (
                        <tr key={index} className="hover:bg-skin-base transition-colors font-medium">
                            <td className="px-6 py-4 font-mono font-bold text-skin-text">
                                <div>
                                    {item.domain ? (
                                        <span className="text-indigo-600 block">{item.domain}</span>
                                    ) : (
                                        <span>{item.wallet.slice(0, 4)}...{item.wallet.slice(-4)}</span>
                                    )}
                                    {item.social && (
                                        <span className="text-xs text-skin-muted block">{item.social}</span>
                                    )}
                                    {item.domain && (
                                        <span className="text-xs text-skin-muted block font-mono">{item.wallet.slice(0, 4)}...{item.wallet.slice(-4)}</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right font-black text-red-600">
                                {item.total_sol_sent > 0 ? item.total_sol_sent.toFixed(2) : '-'}
                            </td>
                            <td className="px-6 py-4 text-right font-black text-green-600">
                                {item.total_sol_received > 0 ? item.total_sol_received.toFixed(2) : '-'}
                            </td>
                            <td className="px-6 py-4 text-center font-bold">
                                {item.transfer_count_sent + item.transfer_count_received}
                            </td>
                            <td className="px-6 py-4 text-skin-muted text-xs">
                                {formatTime(item.last_transfer_time)}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`text-xs px-2 py-1 rounded border-2 font-bold ${getClassificationColor(item.classification)}`}>
                                    {item.classification}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => copyToClipboard(item.wallet)}
                                        className="p-2 text-skin-muted hover:text-skin-text hover:bg-skin-base rounded-lg border-2 border-transparent hover:border-skin-border transition-all"
                                        title="Copy Address"
                                    >
                                        {copied === item.wallet ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                                    </button>
                                    <a 
                                        href={`https://gmgn.ai/sol/address/${item.wallet}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 text-skin-muted hover:text-purple-600 hover:bg-purple-50 rounded-lg border-2 border-transparent hover:border-skin-border transition-all"
                                        title="View on GMGN"
                                    >
                                        <TrendingUp size={16} />
                                    </a>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {results.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-skin-muted">
                                <div className="flex flex-col items-center gap-2">
                                    <p className="font-bold text-lg">No connected wallets detected above the 0.5 SOL threshold.</p>
                                    <div className="text-sm text-left mt-2 bg-skin-base p-4 rounded-lg border-2 border-skin-border/50">
                                        <p className="font-bold mb-1">Possible reasons:</p>
                                        <ul className="list-disc list-inside space-y-1 opacity-80">
                                            <li>Transfers may be smaller than the dust filter (0.05 SOL).</li>
                                            <li>Transfers may have occurred deeper than the scanned history ({scannedCount} txs).</li>
                                            <li>The wallet may not have interacted with other wallets directly.</li>
                                        </ul>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};
