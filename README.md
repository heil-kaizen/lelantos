# Lelantos On-Chain Analysis Tool

Lelantos is a professional-grade Solana blockchain intelligence platform. It is designed to uncover hidden patterns, coordinated trading groups, and "smart money" movements by analyzing the intersection of wallet activities across multiple tokens.

Unlike standard explorers that show data for a single token, Lelantos specializes in cross-token correlation, helping traders and researchers identify recurring actors in the Solana ecosystem.

## Core Analysis Modules

### 1. Multi-Token Overlap Analysis
This module identifies "Diamond Hand" clusters and coordinated communities. By inputting a list of token addresses (mint addresses), Lelantos scans the current holder lists for every token provided.
- **How it works:** It fetches the top holders for each token and maps every wallet address to the tokens they hold.
- **Insight:** If a single wallet holds 3 out of 5 tokens in your list, it is flagged as an "Overlap." This often indicates a loyal community member, a coordinated "shill" group, or a smart wallet following a specific developer's narrative.

### 2. Recurring Early Buyers Scan
This module tracks the "Snipers" and the "First-In" traders who consistently enter positions within the first few minutes of a token launch.
- **How it works:** It queries the historical "First Buyers" data for each token mint. It then aggregates these lists to find wallets that appear in the "Early Buyer" category for multiple tokens.
- **Insight:** Finding a wallet that was a top 50 buyer for 3 different successful tokens is a strong signal of a professional sniper or an insider wallet.

### 3. Recurring Top Traders Scan
This module identifies the most profitable traders across a specific set of tokens.
- **How it works:** It retrieves the "Top Traders" list (ranked by PnL and ROI) for each token. It then cross-references these lists to find wallets that are "Top Traders" in more than one asset.
- **Insight:** This reveals "Smart Money" wallets that have a proven track record of high-performance trading across various market conditions.

### 4. Connected Wallets Trace (Helius Integration)
A deep-dive tool to reveal wallet clusters and distribution networks.
- **How it works:** By providing a single wallet address, Lelantos uses the Helius Digital Asset Standard (DAS) and Enhanced Transactions API to trace all SOL transfers.
- **Insight:** It classifies connected wallets as "Main -> Wallet" (Distribution) or "Wallet -> Main" (Consolidation), helping you see if a developer is distributing supply across multiple "clean" wallets.

## Technical Architecture and Logic

### Rate Limit and Credit Optimization
To ensure the application remains stable and respects API provider limits, Lelantos uses a custom **Request Queue System**:
- **Sequential Processing:** Requests are chained together to prevent overlapping calls.
- **Strict Delays:** A mandatory 2000ms (2 second) delay is enforced between every fetch operation. This prevents "429 Too Many Requests" errors and ensures your API keys are not temporarily banned.
- **Deduplication:** The input layer automatically trims whitespace and removes duplicate token addresses before the analysis begins, saving you time and API credits.

### Advanced Data Merging
The tool performs complex data normalization on the fly:
- **PnL Calculation:** It merges "Realized PnL" (actual profit from closed positions) and "Unrealized PnL" (current value of open positions) to give you a "Total PnL" metric.
- **ROI Estimation:** If the API does not provide a direct ROI percentage, Lelantos calculates it manually using the `(Total PnL / Total Invested) * 100` formula.

### System Filtering
Lelantos maintains a "Blacklist" of known Solana infrastructure addresses. It automatically filters out:
- Raydium Authority and Vault addresses (V4 and CLMM).
- Serum and OpenBook program addresses.
- Magic Eden and Tensor marketplace authorities.
- Token Metadata and System Rent programs.
This ensures that the "Top Traders" you see are actual human traders, not automated liquidity pool contracts.

## UI and Workflow Features

### Automated Wallet Export
Lelantos features a powerful, built-in JSON exporter designed specifically to pipe intelligence data into bots or secondary sorting software:
- **Selectable Grids:** Checkboxes have been integrated into every result table (Overlaps, Early Buyers, and Top Traders), allowing you to manually currate the lists before exporting.
- **Bulk Operations:** Each grid contains an "Export Selected" and "Export All" button. 
- **Formatting:** The export saves directly to your clipboard in a strict, pre-formatted JSON array. It dynamically generates string identifiers based on the feature used (`O` for Overlap, `E` for Early buyers, `T` for Top Traders), followed by the first letters of the held tokens, and finally the numerical rank of the wallet.

### Sticky Sidebar and Persistent History
The dashboard is designed for high-intensity research:
- **Sticky Sidebar:** On desktop, the input form stays fixed to the left. You can scroll through hundreds of results on the right while the buttons and input fields remain accessible.
- **Analysis History:** Results are appended to the page. You can run an "Overlap" scan, then a "Top Trader" scan, and both will remain on the screen for side-by-side comparison.
- **One-of-each-type Logic:** If you run the same analysis again with new tokens, the app replaces only that specific section (e.g., the old "Early Buyers" section is replaced by the new one), keeping your dashboard organized.

## Getting Started and API Configuration

### 1. Obtain Your API Keys
To use Lelantos, you need keys from two providers:

#### Solana Tracker API (Required for all core analysis)
1. Visit [Solana Tracker](https://www.solanatracker.io/).
2. Sign up for an account and navigate to the API Dashboard.
3. Generate an API Key. This key powers the Token Info, Holder Lists, Top Traders, and Early Buyers data.

#### Helius API (Optional, for Wallet Tracing)
1. Visit [Helius.dev](https://www.helius.dev/).
2. Create a free account and get your API Key.
3. This key is required for the "Connected Wallets Analysis" section at the bottom of the app.

### 2. Local Installation
1. Clone the repository to your local machine.
2. Open your terminal and run `npm install` to download all necessary dependencies.
3. Create a file named `.env` in the root folder of the project.
4. Add your keys to the `.env` file exactly like this:
   ```env
   VITE_SOLANA_TRACKER_API_KEY=your_solana_tracker_key_here
   VITE_HELIUS_API_KEY=your_helius_key_here
   ```

### 3. Running the App
1. Run `npm run dev` in your terminal.
2. Open your browser to the URL provided (usually `http://localhost:3000`).
3. Enter at least two Solana token mint addresses (e.g., `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`) and click an analysis button to begin.

## License
This project is licensed under the MIT License.
