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

  async traceConnectedWallets(walletAddress: string): Promise<ConnectedWalletResult[]> {
    const limit = 50;
    const maxTransfers = 150;
    let allTransfers: any[] = [];
    let nextCursor: string | undefined;
    let hasMore = true;

    // Step 1: Fetch transfers with pagination
    while (hasMore && allTransfers.length < maxTransfers) {
      let url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${this.apiKey}&limit=${limit}`;
      
      // User requested: GET https://api.helius.xyz/v1/wallet/{wallet}/transfers?limit=50&api-key=YOUR_API_KEY
      // But the example response structure is slightly different from standard Helius v0.
      // Let's implement exactly as requested.
      
      let transferUrl = `https://api.helius.xyz/v1/wallet/${walletAddress}/transfers?limit=${limit}&api-key=${this.apiKey}`;
      if (nextCursor) {
        transferUrl += `&cursor=${nextCursor}`;
      }

      try {
        const response = await this.fetchWithRetry(transferUrl);
        
        // Check if response has data array
        const data = response.data || [];
        
        // Filter immediately to save memory if needed, but logic says fetch then filter.
        // Let's just accumulate raw data first.
        allTransfers = [...allTransfers, ...data];

        // Check pagination
        if (response.pagination && response.pagination.hasMore && response.pagination.nextCursor) {
            nextCursor = response.pagination.nextCursor;
        } else {
            hasMore = false;
        }
      } catch (e) {
        console.error("Error fetching Helius transfers:", e);
        hasMore = false; // Stop on error
      }
    }

    // Step 2: Filter transfers
    // Only include transfers where: direction === "out" AND symbol === "SOL"
    const outgoingSolTransfers = allTransfers.filter((t: any) => 
        t.direction === 'out' && 
        t.symbol === 'SOL'
    );

    // Step 3: Build recipient map
    const recipientMap = new Map<string, { total: number, count: number, lastTime: number }>();

    for (const t of outgoingSolTransfers) {
        // The counterparty is the recipient when direction is 'out'
        const recipient = t.counterparty; 
        if (!recipient) continue;

        const amount = t.amount || 0;
        const timestamp = t.timestamp || 0;

        const current = recipientMap.get(recipient) || { total: 0, count: 0, lastTime: 0 };
        
        current.total += amount;
        current.count += 1;
        if (timestamp > current.lastTime) {
            current.lastTime = timestamp;
        }

        recipientMap.set(recipient, current);
    }

    // Step 4: Filter wallets (Total >= 1 SOL)
    const results: ConnectedWalletResult[] = [];

    for (const [address, data] of recipientMap.entries()) {
        if (data.total >= 1) {
            let classification = "Connected";
            if (data.total >= 5) classification = "Major Capital Move";
            else if (data.count >= 3) classification = "Repeated Routing";
            // "Likely Storage Wallet" logic is optional and requires deeper scan (no outgoing), skipping for now as per instructions "optional deeper scan"

            results.push({
                wallet: address,
                total_sol_received: data.total,
                transfer_count: data.count,
                last_transfer_time: data.lastTime,
                classification
            });
        }
    }

    // Step 5: Sort descending by totalSOLSent
    return results.sort((a, b) => b.total_sol_received - a.total_sol_received);
  }
}
