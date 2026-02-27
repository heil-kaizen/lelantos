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
  total_realized_pnl?: number;
  total_unrealized_pnl?: number;
  profitable_positions?: number;
  losing_positions?: number;
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

export interface FirstBuyer {
  wallet: string;
  first_buy_time: number;
  first_buy: {
    signature: string;
    amount: number;
    volume_usd: number;
    time: number;
  };
  first_sell_time: number;
  last_transaction_time: number;
  held: number;
  sold: number;
  sold_usd: number;
  holding: number;
  realized: number;
  unrealized: number;
  total: number;
  total_invested: number;
  buy_transactions: number;
  sell_transactions: number;
  total_transactions: number;
  average_buy_amount: number;
  average_sell_amount: number;
  current_value: number;
  cost_basis: number;
}

export interface RecurringWallet {
  address: string;
  type: 'early_buyer' | 'top_trader';
  occurrences: number;
  tokens: string[];
  total_pnl: number;
  avg_roi: number;
  win_rate: number;
  data_points: any[]; // Store the raw data from each token for detailed view if needed
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
