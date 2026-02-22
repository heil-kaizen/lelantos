import React, { useState } from 'react';
import { Key, Eye, EyeOff, Save } from 'lucide-react';

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, setApiKey }) => {
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setApiKey(tempKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-purple-300 p-1.5 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Key className="w-4 h-4 text-black" />
        </div>
        <h2 className="text-lg font-black text-black">SolanaTracker API Key</h2>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <input
            type={showKey ? "text" : "password"}
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            placeholder="Enter your x-api-key"
            className="w-full bg-white text-black border-2 border-black rounded-lg py-2.5 pl-4 pr-12 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder-slate-400 font-medium"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-black transition-colors"
          >
            {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <button
          onClick={handleSave}
          className={`px-6 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none ${
            isSaved 
              ? "bg-green-400 text-black"
              : "bg-[#c084fc] hover:bg-[#d8b4fe] text-black"
          }`}
        >
          {isSaved ? "Saved" : <><Save size={18} /> Save Key</>}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500 font-medium">
        Required to access data.solanatracker.io. Your key is stored locally in your browser session.
      </p>
    </div>
  );
};