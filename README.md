# 🕵️‍♂️ Lelantos - Solana Intelligence & Wallet Analysis

**Lelantos** is a powerful open-source intelligence tool designed for the Solana blockchain. It specializes in detecting **overlapping wallets**, analyzing **recurring traders**, and uncovering **side-wallets** (sybil/insider behavior) across multiple token launches.

Built with **React**, **Vite**, and **Tailwind CSS**, it leverages the **SolanaTracker** and **Helius** APIs to provide deep on-chain insights.

![Lelantos Dashboard](https://raw.githubusercontent.com/heil-kaizen/NOFace/main/lelantos.webp)

---

## 🚀 Features

### 1. **Recurring Wallet Finder (Overlapping Wallets)**
- **Input:** A list of Solana token addresses (CA).
- **Analysis:** Scans the holder lists and top traders of all entered tokens.
- **Output:** Identifies wallets that appear in multiple tokens.
- **Insight:** Helps detect coordinated groups, cabals, or recurring "smart money" traders.
- **Metrics:** Calculates Win Rate, Total PnL, and ROI for these recurring wallets.

### 2. **Smart Wallet Intelligence**
- **Deep Dive:** Analyzes specific wallets to reveal their trading behavior.
- **PnL Analysis:** Tracks realized and unrealized profits.
- **Tagging:** Auto-tags wallets (e.g., "Sniper", "Whale", "Early Buyer") based on on-chain actions.

### 3. **Connected Wallet Detection (Side-Wallets)**
- **Sybil Detection:** Uses **Helius API** to trace funding sources.
- **Logic:** Detects if a wallet has sent/received ≥ 0.5 SOL to/from other wallets.
- **Visualization:** Maps out clusters of connected wallets to expose insider networks.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **Charts:** Recharts
- **Data APIs:**
  - [SolanaTracker API](https://docs.solanatracker.io/) (Market Data, Holders)
  - [Helius API](https://docs.helius.xyz/) (RPC, Transactions, Webhooks)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/lelantos.git
cd lelantos
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory. You will need API keys from **SolanaTracker** and **Helius**.

```env
# .env
VITE_SOLANA_TRACKER_API_KEY=your_solana_tracker_api_key_here
VITE_HELIUS_API_KEY=your_helius_api_key_here
```

> **Note:** The application uses `import.meta.env` to access these variables. Ensure they are prefixed with `VITE_`.

### 4. Run Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## 📦 Building for Production

To create a production-ready build:

```bash
npm run build
```
The output will be in the `dist/` folder, ready to be deployed to Vercel, Netlify, or any static host.

---

## ☁️ Deployment (Vercel)

1. **Push** your code to a GitHub repository.
2. **Import** the project into Vercel.
3. **Environment Variables:**
   In the Vercel Dashboard > Settings > Environment Variables, add:
   - `VITE_SOLANA_TRACKER_API_KEY`
   - `VITE_HELIUS_API_KEY`
4. **Deploy!**

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Disclaimer:** This tool is for educational and research purposes only. Blockchain data analysis is probabilistic; always verify on-chain data manually before making financial decisions.
