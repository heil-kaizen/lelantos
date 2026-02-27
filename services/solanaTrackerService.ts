import { AnalysisConfig, AnalysisResult, Holder, TokenInfo, WalletOverlap, TopTraderMatch, WalletSummary } from '../types';

const BASE_URL = "https://data.solanatracker.io";

export class SolanaTrackerService {
  private apiKey: string;
  
  // Rate Limiting State
  private requestQueue = Promise.resolve();

  // Cache to save credits on repeated lookups within the same session
  private cache: Map<string, any> = new Map();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      "x-api-key": this.apiKey
    };
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async enqueueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    // Chain the request to the queue
    const result = this.requestQueue.then(requestFn);
    // Update the queue to wait for this request to finish (including its delay)
    this.requestQueue = result.catch(() => {});
    return result;
  }

  private async executeFetch(url: string, retries: number): Promise<any> {
      console.log(`Fetching: ${url}`);
      const response = await fetch(url, { headers: this.getHeaders() });

      if (response.status === 429) {
        if (retries > 0) {
            console.warn(`Rate limit 429 hit. Pausing for 3000ms...`);
            await this.sleep(3000);
            return this.executeFetch(url, retries - 1);
        } else {
             throw new Error(`Rate limit exceeded after retries for ${url}`);
        }
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      await this.sleep(2000); // Strict 2000ms delay
      return data;
  }

  private async safeFetch(url: string): Promise<any> {
      return this.enqueueRequest(() => this.executeFetch(url, 2));
  }

  // --- API ENDPOINTS ---

  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    const cacheKey = `info:${tokenAddress}`;
    if (this.cache.has(cacheKey)) {
        console.log(`Using cached info for ${tokenAddress}`);
        return this.cache.get(cacheKey);
    }

    const url = `${BASE_URL}/tokens/${tokenAddress}`;
    try {
      const data = await this.safeFetch(url);
      const tokenData = data.token || data;

      const result: TokenInfo = {
        token: tokenAddress,
        name: tokenData.name || 'Unknown',
        symbol: tokenData.symbol || tokenAddress.slice(0, 4),
        image: tokenData.image,
        totalSupply: parseFloat(data.totalSupply || tokenData.supply || '0'),
        decimals: parseInt(data.decimals || tokenData.decimals || '0', 10),
        // Capture creation time for Sniper detection
        creationTime: tokenData.createdAt ? new Date(tokenData.createdAt).getTime() : undefined
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.warn(`Error fetching token info for ${tokenAddress}`, error);
      throw error;
    }
  }

  async getTokenHolders(tokenAddress: string): Promise<Holder[]> {
    // We generally don't cache holders as they change frequently, 
    // but for this session scope it might be okay. Let's keep it fresh for now.
    const url = `${BASE_URL}/tokens/${tokenAddress}/holders`;
    try {
      const data = await this.safeFetch(url);
      
      let holders: Holder[] = [];
      
      // Handle various API response formats
      if (data.accounts && Array.isArray(data.accounts)) holders = data.accounts;
      else if (data.holders && Array.isArray(data.holders)) holders = data.holders;
      else if (Array.isArray(data)) holders = data;

      // Retry logic for "0 holders" glitch
      if (holders.length === 0) {
        console.warn("Received 0 holders. Retrying once after delay...");
        await this.sleep(2000);
        const retryData = await this.safeFetch(url);
        if (retryData.accounts) holders = retryData.accounts;
        else if (retryData.holders) holders = retryData.holders;
      }

      return holders;
    } catch (error) {
      console.warn(`Error fetching holders for ${tokenAddress}`, error);
      return [];
    }
  }

  async getWalletBasic(wallet: string): Promise<any> {
    const url = `${BASE_URL}/wallet/${wallet}/basic`;
    try {
        const data = await this.safeFetch(url);
        return data;
    } catch (e) {
        return { total: 0 };
    }
  }

  async getWalletTrades(wallet: string): Promise<any[]> {
    const url = `${BASE_URL}/wallet/${wallet}/trades`;
    try {
        const data = await this.safeFetch(url);
        return Array.isArray(data) ? data : (data.trades || []);
    } catch (e) {
        return [];
    }
  }

  async getWalletPnL(wallet: string): Promise<any> {
    const url = `${BASE_URL}/pnl/${wallet}`;
    try {
        const data = await this.safeFetch(url);
        return data;
    } catch (e) {
        return null;
    }
  }

  async getTopTraders(token: string): Promise<any[]> {
      const cacheKey = `top:${token}`;
      if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

      const url = `${BASE_URL}/top-traders/${token}`;
      try {
          const data = await this.safeFetch(url);
          const traders = Array.isArray(data) ? data : (data.traders || []);
          
          this.cache.set(cacheKey, traders);
          return traders;
      } catch (e) {
          return [];
      }
  }

  async getFirstBuyers(token: string): Promise<FirstBuyer[]> {
      const url = `${BASE_URL}/first-buyers/${token}`;
      try {
          const data = await this.safeFetch(url);
          return Array.isArray(data) ? data : [];
      } catch (e) {
          console.warn(`Failed to fetch first buyers for ${token}`, e);
          return [];
      }
  }

  // --- ANALYSIS LOGIC ---

  async analyzeTokens(config: AnalysisConfig): Promise<AnalysisResult> {
    const { tokens } = config;
    const processedTokens: TokenInfo[] = [];
    const walletMap: Record<string, { tokens: string[], percentages: Record<string, number> }> = {};
    const tokenMap: Record<string, TokenInfo> = {};
    
    // Map wallet address -> List of TopTraderMatch
    const walletTopTraderMap = new Map<string, TopTraderMatch[]>();

    console.log("Starting Smart Analysis (Strict Rate Limit Mode)...");

    // 1. Initial Scan: Info & Holders
    for (const token of tokens) {
      const cleanToken = token.trim();
      if (!cleanToken) continue;

      try {
        // A. Token Info
        let info = await this.getTokenInfo(cleanToken);
        
        // B. Holders
        const holders = await this.getTokenHolders(cleanToken);
        info.holderCount = holders.length;
        
        processedTokens.push(info);
        tokenMap[cleanToken] = info;

        // C. Top Traders (New Feature)
        try {
            const traders = await this.getTopTraders(cleanToken);
            for (const t of traders) {
                const wallet = t.wallet || t.owner || t.address;
                if (wallet) {
                    if (!walletTopTraderMap.has(wallet)) {
                        walletTopTraderMap.set(wallet, []);
                    }
                    walletTopTraderMap.get(wallet)?.push({
                        token: cleanToken,
                        pnl: t.pnl || 0,
                        roi: t.roi || 0,
                        trades: t.total_trades || t.trades || 0
                    });
                }
            }
        } catch (e) {
            console.warn(`Failed to fetch top traders for ${cleanToken}`, e);
        }

        if (holders.length === 0) continue;

        // D. Process Overlaps
        for (const holder of holders) {
          const rawWallet = holder.owner || holder.address || (holder as any).wallet;
          const wallet = rawWallet ? rawWallet.trim() : null;
          if (!wallet) continue;

          let percent = 0;
          if (holder.percentage !== undefined) percent = Number(holder.percentage);
          else if (info.totalSupply > 0) {
             const balance = Number(holder.amount) / Math.pow(10, info.decimals);
             percent = (balance / info.totalSupply) * 100;
          }

          if (!walletMap[wallet]) walletMap[wallet] = { tokens: [], percentages: {} };
          if (!walletMap[wallet].tokens.includes(cleanToken)) {
            walletMap[wallet].tokens.push(cleanToken);
            walletMap[wallet].percentages[cleanToken] = percent;
          }
        }
      } catch (err) {
        console.error(`Failed to process ${cleanToken}`, err);
      }
    }

    // 2. Identify Overlaps
    let overlaps: WalletOverlap[] = Object.entries(walletMap)
      .filter(([_, data]) => data.tokens.length >= 2)
      .map(([address, data]) => ({
        address,
        tokens: data.tokens,
        percentages: data.percentages
      }));

    // Sort by number of overlaps (descending) to prioritize most suspicious wallets
    overlaps.sort((a, b) => b.tokens.length - a.tokens.length);

    console.log(`Found ${overlaps.length} overlaps. Starting Deep Analysis...`);

    // 3. Deep Analysis (Scoring & Tagging)
    // We only fetch extra details for wallets that actually overlap
    if (overlaps.length > 0) {
        
        // Only consider top 50 overlaps to save requests
        const deepAnalysisLimit = Math.min(overlaps.length, 50);
        
        if (overlaps.length > deepAnalysisLimit) {
            console.warn(`Limiting deep analysis to top ${deepAnalysisLimit} overlaps out of ${overlaps.length}`);
        }

        for (let i = 0; i < deepAnalysisLimit; i++) {
            const overlap = overlaps[i];
            let score = 0;
            const tags: string[] = [];

            // Base Score: Overlaps
            // 2 tokens = 4 pts, 3 tokens = 6 pts, 4+ tokens = 8 pts
            score += Math.min(overlap.tokens.length * 2, 8);

            let basicInfo: any = { total: 0 };
            let trades: any[] = [];
            let pnlData: any = null;

            // Fetch details sequentially
            try {
                basicInfo = await this.getWalletBasic(overlap.address);
            } catch (e) { console.warn(`Failed basic info for ${overlap.address}`, e); }

            try {
                trades = await this.getWalletTrades(overlap.address);
            } catch (e) { console.warn(`Failed trades for ${overlap.address}`, e); }

            try {
                pnlData = await this.getWalletPnL(overlap.address);
            } catch (e) { console.warn(`Failed PnL for ${overlap.address}`, e); }

            overlap.portfolioValue = basicInfo.total || 0;

            // Wealth Score Bonus
            if ((basicInfo.total || 0) > 100000) score += 2;
            else if ((basicInfo.total || 0) > 10000) score += 1;

            // NEW: Wallet Summary
            let realizedPnl = 0;
            let profitableTrades = 0;
            let totalTrades = trades.length;
            
            for (const trade of trades) {
                if (trade.pnl) realizedPnl += trade.pnl;
                if (trade.pnl > 0) profitableTrades++;
            }

            // Process PnL Data
            let totalRealizedPnl = 0;
            let totalUnrealizedPnl = 0;
            let profitablePositions = 0;
            let losingPositions = 0;
            let usedPnLEndpoint = false;

            if (pnlData) {
                totalRealizedPnl = pnlData.totalRealizedPnl || 0;
                totalUnrealizedPnl = pnlData.totalUnrealizedPnl || 0;
                
                if (pnlData.positions && Array.isArray(pnlData.positions)) {
                    for (const pos of pnlData.positions) {
                        const totalPosPnl = (pos.realizedPnl || 0) + (pos.unrealizedPnl || 0);
                        if (totalPosPnl > 0) profitablePositions++;
                        else if (totalPosPnl < 0) losingPositions++;
                    }
                }
                usedPnLEndpoint = true;
            }

            // Fallback: If PnL endpoint failed (or returned 0/empty) but we have trades, use trade data
            if (!usedPnLEndpoint && trades.length > 0) {
                 totalRealizedPnl = realizedPnl;
                 // Estimate positions from trades (rough approximation)
                 profitablePositions = profitableTrades;
                 losingPositions = totalTrades - profitableTrades;
            }

            // Calculate Win Rate based on available data source
            let winRate = 0;
            if (usedPnLEndpoint) {
                const totalPositions = profitablePositions + losingPositions;
                if (totalPositions > 0) {
                    winRate = Math.round((profitablePositions / totalPositions) * 100);
                }
            } else {
                if (totalTrades > 0) {
                    winRate = Math.round((profitableTrades / totalTrades) * 100);
                }
            }

            // Performance Score Bonus
            if (winRate > 60 && totalTrades > 5) score += 1;
            if (totalRealizedPnl > 5000) score += 1;

            overlap.wallet_summary = {
                portfolio_value_usd: basicInfo.total || 0,
                total_trades: totalTrades,
                win_rate: winRate,
                realized_pnl: realizedPnl,
                total_realized_pnl: totalRealizedPnl,
                total_unrealized_pnl: totalUnrealizedPnl,
                profitable_positions: profitablePositions,
                losing_positions: losingPositions
            };

            // NEW: Top Trader Match
            const topTraderMatches = walletTopTraderMap.get(overlap.address) || [];
            if (topTraderMatches.length > 0) {
                overlap.is_top_trader = true;
                overlap.top_trader_matches = topTraderMatches;
                score += 3; // Bonus for being a top trader
                tags.push("Top Trader");
            }

            // Behavioral Analysis
            let isWhale = (basicInfo.total || 0) > 20000;
            if ((basicInfo.total || 0) > 5000) score += 2; 
            if (isWhale) tags.push("Whale");

            let isEarlySniper = false;
            let isQuickFlipper = false;
            let isDiamondHand = false;
            let maxDuration = 0;

            // Trade Pattern Analysis
            for (const tokenHash of overlap.tokens) {
                const tokenInfo = tokenMap[tokenHash];
                if (!tokenInfo) continue;

                const tokenTrades = trades.filter((t: any) => t.token === tokenHash || t.token?.mint === tokenHash);
                
                if (tokenTrades.length > 0) {
                    tokenTrades.sort((a: any, b: any) => a.time - b.time);
                    const firstTradeTime = tokenTrades[0].time * 1000; 
                    
                    // Sniper: Bought within 10 mins of creation
                    if (tokenInfo.creationTime) {
                        const timeDiff = firstTradeTime - tokenInfo.creationTime;
                        if (timeDiff > 0 && timeDiff < 10 * 60 * 1000) {
                            isEarlySniper = true;
                        }
                    }

                    // Flipper: Sold within 30 mins of buy
                    const sellTrade = tokenTrades.find((t: any) => t.type === 'sell' && (t.time * 1000) - firstTradeTime < 30 * 60 * 1000);
                    if (sellTrade) isQuickFlipper = true;

                    // Diamond Hand: Held > 24h
                    const duration = Date.now() - firstTradeTime;
                    if (duration > maxDuration) maxDuration = duration;
                    if (duration > 24 * 60 * 60 * 1000) isDiamondHand = true;
                }
            }

            if (isEarlySniper) { score += 2; tags.push("Early Sniper"); }
            if (maxDuration > 60 * 60 * 1000) score += 2; // > 1 Hour
            if (isDiamondHand) tags.push("Diamond Hand");
            if (isQuickFlipper) tags.push("Quick Flipper");
            if (tags.length === 0 && !tags.includes("Top Trader")) tags.push("Casual Trader");

            overlap.score = Math.min(score, 10);
            overlap.tags = [...new Set(tags)]; 
            overlap.avgHoldingDuration = maxDuration / (1000 * 60 * 60); 
        }
    }

    // Sort Results
    overlaps.sort((a, b) => {
        if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
        return b.tokens.length - a.tokens.length;
    });

    return {
      overlaps,
      processedTokens,
      tokenMap,
      timestamp: Date.now()
    };
  }
}
