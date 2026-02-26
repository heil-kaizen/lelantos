export interface TokenInfo {
  token: string;
  name?: string;
  symbol?: string;
  image?: string;
  totalSupply: number;
  decimals: number;
  holderCount?: number;
  creationTime?: number; // Added for 'Early Sniper' detection
}

export interface Holder {
  owner?: string;
  address?: string; // API sometimes returns 'address' instead of 'owner'
  amount: number;
  percentage?: number;
}

export interface HoldersResponse {
  holders: Holder[];
  total: number;
}

export interface TopTraderMatch {
  token: string;
  pnl: number;
  roi: number;
  trades: number;
}

export interface WalletSummary {
  portfolio_value_usd: number;
  total_trades: number;
  win_rate: number;
  realized_pnl: number;
}

export interface WalletOverlap {
  address: string;
  tokens: string[];
  percentages: Record<string, number>; // tokenAddress -> percentage
  
  // New Smart Intelligence Fields
  score?: number;
  tags?: string[];
  portfolioValue?: number;
  avgHoldingDuration?: number; // in hours

  // New Feature Fields
  is_top_trader?: boolean;
  top_trader_matches?: TopTraderMatch[];
  wallet_summary?: WalletSummary;
}

export interface AnalysisResult {
  overlaps: WalletOverlap[];
  processedTokens: TokenInfo[];
  tokenMap: Record<string, TokenInfo>;
  timestamp: number;
}

export interface AnalysisConfig {
  tokens: string[];
  apiKey: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}
