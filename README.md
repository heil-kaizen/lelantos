# Lelantos - Solana Wallet Overlap Hunter

**Lelantos** is a powerful open-source intelligence (OSINT) tool designed to detect coordinated wallet activity, "cabal" operations, and heavy overlapping exposure across multiple Solana tokens.

By analyzing the top holders of user-specified tokens, Lelantos identifies wallets that hold significant positions in multiple assets, flagging potential insider rings, coordinated marketing campaigns, or heavy whale concentration.

![Lelantos](https://raw.githubusercontent.com/heil-kaizen/NOFace/main/lelantos.webp)

## 🎯 Goal

The primary goal of Lelantos is to provide transparency into token distribution. It helps traders and researchers answer:
*   "Are the same people buying these different meme coins?"
*   "Is this a coordinated launch by a specific group?"
*   "Which whales are heavily exposed to this narrative?"

## 🚀 Features

*   **Multi-Token Analysis:** Input multiple Solana token addresses (min 2) to find common holders.
*   **Overlap Detection:** Automatically identifies wallets present in the top holder lists of multiple tokens.
*   **Threat Scoring:** Assigns a risk score (0-10) based on wallet behavior, portfolio size, and overlap count.
*   **Behavioral Tagging:** Auto-tags wallets with labels like:
    *   🐋 **Whale:** Portfolio value > $20k
    *   🎯 **Early Sniper:** Bought within 10 mins of token creation
    *   💎 **Diamond Hand:** Held for > 24 hours
    *   ⚡ **Quick Flipper:** Sold within 30 mins
    *   🏆 **Top Trader:** Appears in the top traders list
*   **Neo-Brutalism UI:** A clean, high-contrast interface for easy data visualization.

## 🛠️ Technical Architecture

### Tech Stack
*   **Frontend:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS (Neo-Brutalism aesthetic)
*   **Charts:** Recharts
*   **Icons:** Lucide React

### Data Source
Lelantos relies on the **SolanaTracker API** (`data.solanatracker.io`) for real-time on-chain data.

### 🔍 How it Works (The Algorithm)

1.  **Input:** User provides a list of Token Mint Addresses.
2.  **Scan:** The app iterates through each token and fetches:
    *   **Token Metadata:** Name, Symbol, Supply, Creation Time.
    *   **Top Holders:** The top 100-200 holders (depending on API response).
3.  **Cross-Reference:** It builds a map of `Wallet -> [Tokens Held]`.
4.  **Filter:** It isolates wallets that appear in the holder list of **2 or more** tokens.
5.  **Deep Analysis (Rate-Limited):**
    *   For the top overlapping wallets, it fetches **Wallet Basic Info** (Total Portfolio Value).
    *   It fetches **Wallet Trades** history to analyze timing (Sniper/Flipper detection).
    *   It checks **Top Trader** lists for the specific tokens.
6.  **Scoring:** A heuristic score is calculated:
    *   Base score: +2 per overlapping token.
    *   Bonus: +2 for Whales, +2 for Snipers, +2 for Top Traders.
    *   Capped at 10.

### 📡 API Endpoints Used

The application queries the following endpoints from SolanaTracker:

| Purpose | Endpoint | Description |
| :--- | :--- | :--- |
| **Token Info** | `GET /tokens/{address}` | Fetches decimals, supply, and creation time. |
| **Holders** | `GET /tokens/{address}/holders` | Fetches the top holders list. |
| **Wallet Info** | `GET /wallet/{address}/basic` | Fetches total portfolio value (USD). |
| **Trades** | `GET /wallet/{address}/trades` | Fetches recent trade history for behavioral analysis. |
| **Top Traders** | `GET /top-traders/{address}` | Checks if the wallet is a top PnL trader for the token. |

> **Note:** The application implements a strict client-side rate limiter (1.5s delay between requests) to respect the API's free tier limits and prevent 429 errors.

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/lelantos.git
    cd lelantos
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **API Key Configuration**
    *   Get an API Key from [SolanaTracker](https://www.solanatracker.io/).
    *   Enter the key in the application sidebar (stored locally in browser session).

## ⚠️ Disclaimer

This tool is for educational and research purposes only. Blockchain data can be complex, and "overlaps" do not always indicate malicious intent. Always do your own research (DYOR).
