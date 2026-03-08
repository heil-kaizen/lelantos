import { ConnectedWalletResult } from '../types';

const DELAY_MS = 1200;

export class HeliusService {
  private apiKey: string;
  private requestQueue: Promise<any> = Promise.resolve();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async enqueueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    this.requestQueue = this.requestQueue.then(async () => {
      await this.delay(DELAY_MS);
      return requestFn();
    });
    return this.requestQueue;
  }

  private async fetchWithRetry(url: string, retries = 2): Promise<any> {
    try {
      return await this.enqueueRequest(async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Helius API error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      });
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying Helius request... (${retries} left)`);
        await this.delay(2000); // Wait a bit longer before retry
        return this.fetchWithRetry(url, retries - 1);
      }
      throw error;
    }
  }

  async getWalletIdentity(walletAddress: string): Promise<{ domain?: string, social?: string }> {
    try {
        const url = `https://api.helius.xyz/v1/wallet/${walletAddress}/identity?api-key=${this.apiKey}`;
        const response = await this.fetchWithRetry(url, 1);
        
        // Helius Identity Response Example: { "domain": "example.sol", "twitter": "@handle" }
        // Note: The actual response structure might vary, but let's assume standard fields based on docs.
        // If the API returns a different structure, we might need to adjust.
        // Common fields: domain, twitter, discord, telegram.
        
        return {
            domain: response.domain || undefined,
            social: response.twitter || response.discord || response.telegram || undefined
        };
    } catch (e) {
        // Identity fetch is non-critical, so we just return empty if it fails
        return {};
    }
  }

  async traceConnectedWallets(walletAddress: string): Promise<{ results: ConnectedWalletResult[], scanned_count: number }> {
    const limit = 50;
    const maxRawScanned = 2000;
    const maxValidTransfers = 200;
    
    let rawScanned = 0;
    let validTransfersCount = 0;
    let nextCursor: string | undefined;
    let beforeSignature: string | undefined;
    let hasMore = true;

    // Maps to aggregate data
    // Key: Counterparty Address
    const outgoingMap = new Map<string, number>();
    const incomingMap = new Map<string, number>();
    const walletStats = new Map<string, { 
        countSent: number, 
        countReceived: number, 
        lastTime: number 
    }>();

    // Step 1: Scan Loop
    while (hasMore && rawScanned < maxRawScanned && validTransfersCount < maxValidTransfers) {
      let transferUrl = `https://api.helius.xyz/v1/wallet/${walletAddress}/transfers?limit=${limit}&api-key=${this.apiKey}`;
      
      // Support both cursor-based and signature-based pagination
      if (nextCursor) {
        transferUrl += `&cursor=${nextCursor}`;
      } else if (beforeSignature) {
        transferUrl += `&before=${beforeSignature}`;
      }

      try {
        const response = await this.fetchWithRetry(transferUrl);
        
        // Handle response structure (support both direct array and data object)
        const data = Array.isArray(response) ? response : (response.data || []);
        
        if (data.length === 0) {
            hasMore = false;
            break;
        }

        for (const t of data) {
            rawScanned++;
            
            // Check limits inside loop to break early
            if (rawScanned > maxRawScanned) break;

            // 1. Filter: Symbol must be SOL
            if (t.symbol !== 'SOL') continue;

            // 2. Filter: Ignore dust (< 0.05 SOL)
            const amount = t.amount || 0;
            if (amount < 0.05) continue;

            // Valid Transfer Found
            validTransfersCount++;

            const counterparty = t.counterparty;
            if (!counterparty) continue;
            if (counterparty === walletAddress) continue; // Ignore self

            const timestamp = t.timestamp || 0;
            const direction = t.direction; // 'out' or 'in'

            // Update Stats
            const stats = walletStats.get(counterparty) || { countSent: 0, countReceived: 0, lastTime: 0 };
            if (timestamp > stats.lastTime) stats.lastTime = timestamp;

            if (direction === 'out') {
                outgoingMap.set(counterparty, (outgoingMap.get(counterparty) || 0) + amount);
                stats.countSent++;
            } else if (direction === 'in') {
                incomingMap.set(counterparty, (incomingMap.get(counterparty) || 0) + amount);
                stats.countReceived++;
            }
            walletStats.set(counterparty, stats);
        }

        // Pagination Logic
        if (response.pagination && response.pagination.hasMore && response.pagination.nextCursor) {
            nextCursor = response.pagination.nextCursor;
        } else if (data.length > 0 && data[data.length - 1].signature) {
             // Fallback for standard Helius pagination (use last signature)
             beforeSignature = data[data.length - 1].signature;
             
             // If we received fewer items than the limit, we've reached the end
             if (data.length < limit) {
                 hasMore = false;
             }
        } else {
            hasMore = false;
        }

      } catch (e) {
        console.error("Error fetching Helius transfers:", e);
        hasMore = false;
      }
    }

    // Step 2: Classify and Filter Results
    const results: ConnectedWalletResult[] = [];
    const allCounterparties = new Set([...outgoingMap.keys(), ...incomingMap.keys()]);

    for (const address of allCounterparties) {
        const totalSent = outgoingMap.get(address) || 0;
        const totalReceived = incomingMap.get(address) || 0;
        const stats = walletStats.get(address)!;

        // Threshold Check: >= 0.5 SOL in either direction
        if (totalSent >= 0.5 || totalReceived >= 0.5) {
            let classification = "Connected";
            if (totalSent >= 0.5 && totalReceived >= 0.5) {
                classification = "Strongly Linked Wallet";
            } else if (totalSent >= 0.5) {
                classification = "Side Wallet";
            } else if (totalReceived >= 0.5) {
                classification = "Funding Wallet";
            }

            results.push({
                wallet: address,
                total_sol_sent: totalSent,
                total_sol_received: totalReceived,
                transfer_count_sent: stats.countSent,
                transfer_count_received: stats.countReceived,
                last_transfer_time: stats.lastTime,
                classification
            });
        }
    }

    // Step 3: Sort by Total Activity
    results.sort((a, b) => (b.total_sol_sent + b.total_sol_received) - (a.total_sol_sent + a.total_sol_received));

    // Step 4: Enrich with Identity (Top 10)
    const topResults = results.slice(0, 10);
    const remainingResults = results.slice(10);
    
    const enrichedResults = await Promise.all(topResults.map(async (res) => {
        const identity = await this.getWalletIdentity(res.wallet);
        return { ...res, ...identity };
    }));

    return {
        results: [...enrichedResults, ...remainingResults],
        scanned_count: rawScanned
    };
  }
}
