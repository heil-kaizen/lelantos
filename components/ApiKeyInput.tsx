import React, { useState } from 'react';
import { Plus, Trash2, Search, AlertCircle } from 'lucide-react';
import { AppStatus } from '../types';

interface AnalysisFormProps {
  status: AppStatus;
  onAnalyze: (tokens: string[]) => void;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({ status, onAnalyze }) => {
  const [tokens, setTokens] = useState<string[]>(['', '']); // Start with 2 empty slots

  const handleAddToken = () => {
    if (tokens.length < 6) {
      setTokens([...tokens, '']);
    }
  };

  const handleRemoveToken = (index: number) => {
    if (tokens.length > 2) {
      const newTokens = [...tokens];
      newTokens.splice(index, 1);
      setTokens(newTokens);
    }
  };

  const handleTokenChange = (index: number, value: string) => {
    const newTokens = [...tokens];
    newTokens[index] = value;
    setTokens(newTokens);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(tokens.filter(t => t.trim() !== ''));
  };

  const isValid = tokens.filter(t => t.trim() !== '').length >= 2;

  return (
    <div className="bg-skin-card p-6 rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)] h-fit">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-green-300 p-2 rounded border-2 border-skin-border shadow-[2px_2px_0px_0px_var(--color-shadow)]">
          <Search className="w-5 h-5 text-black" />
        </div>
        <h2 className="text-xl font-black text-skin-text">Start Analysis</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-skin-text">
              Token Addresses (Min 2)
            </label>
            <button
              type="button"
              onClick={handleAddToken}
              disabled={tokens.length >= 6}
              className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold disabled:opacity-50 transition-colors bg-blue-50 px-2 py-1 rounded border border-blue-200 hover:border-blue-400"
            >
              <Plus size={14} /> Add Slot
            </button>
          </div>
          
          <div className="space-y-3">
            {tokens.map((token, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => handleTokenChange(index, e.target.value)}
                  placeholder={`Token Address ${index + 1}`}
                  className="flex-grow bg-skin-base border-2 border-skin-border rounded-lg p-2.5 text-sm text-skin-text font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--color-shadow)] transition-all placeholder-skin-muted"
                />
                {tokens.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveToken(index)}
                    className="p-2.5 text-skin-text hover:bg-red-100 bg-skin-card rounded-lg border-2 border-skin-border transition-colors shadow-[2px_2px_0px_0px_var(--color-shadow)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!isValid || status === AppStatus.ANALYZING}
          className={`w-full py-3 rounded-lg font-black text-lg transition-all border-2 border-skin-border ${
            !isValid || status === AppStatus.ANALYZING
              ? "bg-skin-muted/20 text-skin-muted cursor-not-allowed"
              : "bg-[#a3e635] text-black shadow-[4px_4px_0px_0px_var(--color-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--color-shadow)] active:shadow-none"
          }`}
        >
          {status === AppStatus.ANALYZING ? "Scanning Chain..." : "Analyze Overlaps"}
        </button>
        
        {!isValid && (
          <div className="mt-3 flex items-center gap-2 text-amber-600 font-bold text-xs bg-amber-50 p-2 rounded border border-amber-200">
            <AlertCircle size={14} />
            <span>Enter at least 2 valid token addresses.</span>
          </div>
        )}
      </form>
    </div>
  );
};
