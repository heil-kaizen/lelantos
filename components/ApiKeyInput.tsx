import React, { useState } from 'react';
import { Key, Eye, EyeOff, Save } from 'lucide-react';

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  heliusApiKey: string;
  setHeliusApiKey: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, setApiKey, heliusApiKey, setHeliusApiKey }) => {
  const [showKey, setShowKey] = useState(false);
  const [showHeliusKey, setShowHeliusKey] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempHeliusKey, setTempHeliusKey] = useState(heliusApiKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setApiKey(tempKey);
    setHeliusApiKey(tempHeliusKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-skin-card p-6 rounded-xl border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)] mb-6 space-y-6">
      {/* SolanaTracker Key */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-purple-300 p-1.5 rounded border-2 border-skin-border shadow-[2px_2px_0px_0px_var(--color-shadow)]">
            <Key className="w-4 h-4 text-black" />
          </div>
          <h2 className="text-lg font-black text-skin-text">SolanaTracker API Key</h2>
        </div>
        
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            placeholder="Enter your x-api-key"
            className="w-full bg-skin-base text-skin-text border-2 border-skin-border rounded-lg py-2.5 pl-4 pr-12 focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--color-shadow)] transition-all placeholder-skin-muted font-medium"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-2.5 text-skin-muted hover:text-skin-text transition-colors"
          >
            {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Helius Key */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-orange-300 p-1.5 rounded border-2 border-skin-border shadow-[2px_2px_0px_0px_var(--color-shadow)]">
            <Key className="w-4 h-4 text-black" />
          </div>
          <h2 className="text-lg font-black text-skin-text">Helius API Key</h2>
        </div>
        
        <div className="relative">
          <input
            type={showHeliusKey ? "text" : "password"}
            value={tempHeliusKey}
            onChange={(e) => setTempHeliusKey(e.target.value)}
            placeholder="Enter your Helius API Key"
            className="w-full bg-skin-base text-skin-text border-2 border-skin-border rounded-lg py-2.5 pl-4 pr-12 focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--color-shadow)] transition-all placeholder-skin-muted font-medium"
          />
          <button
            onClick={() => setShowHeliusKey(!showHeliusKey)}
            className="absolute right-3 top-2.5 text-skin-muted hover:text-skin-text transition-colors"
          >
            {showHeliusKey ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`w-full px-6 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 border-2 border-skin-border shadow-[4px_4px_0px_0px_var(--color-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--color-shadow)] active:shadow-none ${
          isSaved 
            ? "bg-green-400 text-black"
            : "bg-[#c084fc] hover:bg-[#d8b4fe] text-black"
        }`}
      >
        {isSaved ? "Saved" : <><Save size={18} /> Save Keys</>}
      </button>

      <p className="mt-3 text-xs text-skin-muted font-medium">
        Keys are stored locally in your browser session.
      </p>
    </div>
  );
};
