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

  async traceConnectedWallets(walletAddress: string): Promise<{ results: ConnectedWalletResult[], scanned_count: number }> {
    const limit = 100;
    const maxTransfers = 500;
    let allTransfers: any[] = [];
    let nextCursor: string | undefined;
    let hasMore = true;

    // Step 1: Fetch transfers with pagination
    while (hasMore && allTransfers.length < maxTransfers) {
      let transferUrl = `https://api.helius.xyz/v1/wallet/${walletAddress}/transfers?limit=${limit}&api-key=${this.apiKey}`;
      if (nextCursor) {
        transferUrl += `&cursor=${nextCursor}`;
      }

      try {
        const response = await this.fetchWithRetry(transferUrl);
        
        // Check if response has data array
        const data = response.data || [];
        
        // Accumulate raw data
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
    // Only process if symbol === "SOL"
    const solTransfers = allTransfers.filter((t: any) => t.symbol === 'SOL');

    // Step 3: Build map
    const walletMap = new Map<string, { 
        sent: number, 
        received: number, 
        countSent: number, 
        countReceived: number, 
        lastTime: number 
    }>();

    for (const t of solTransfers) {
        const counterparty = t.counterparty;
        if (!counterparty) continue;

        const amount = t.amount || 0;
        const timestamp = t.timestamp || 0;
        const direction = t.direction; // 'out' or 'in'

        const current = walletMap.get(counterparty) || { 
            sent: 0, 
            received: 0, 
            countSent: 0, 
            countReceived: 0, 
            lastTime: 0 
        };

        if (direction === 'out') {
            current.sent += amount;
            current.countSent += 1;
        } else if (direction === 'in') {
            current.received += amount;
            current.countReceived += 1;
        }

        if (timestamp > current.lastTime) {
            current.lastTime = timestamp;
        }

        walletMap.set(counterparty, current);
    }

    // Step 4: Filter and Classify
    const results: ConnectedWalletResult[] = [];

    for (const [address, data] of walletMap.entries()) {
        const totalSent = data.sent;
        const totalReceived = data.received;

        // Filter: Keep if total_sent >= 0.5 OR total_received >= 0.5
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
                transfer_count_sent: data.countSent,
                transfer_count_received: data.countReceived,
                last_transfer_time: data.lastTime,
                classification
            });
        }
    }

    // Step 5: Sort descending by total activity (sent + received)
    results.sort((a, b) => (b.total_sol_sent + b.total_sol_received) - (a.total_sol_sent + a.total_sol_received));

    return {
        results,
        scanned_count: allTransfers.length
    };
  }
}
