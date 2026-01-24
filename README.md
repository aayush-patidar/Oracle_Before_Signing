# OBS - Oracle Before Signing

A chat-only transaction risk analysis and approval system that simulates transactions before signing to provide adversarial judgment.

## 🎯 What is OBS?

OBS (Oracle Before Signing) is a weapon against transaction risks. It defaults to **DENY** unless absolutely safe, providing:

- **Reality Delta**: Before/after state changes (balances, allowances)
- **Future Timeline**: Block-by-block simulation of consequences
- **Judgment**: ✅ ALLOW or ❌ DENY with adversarial questioning
- **Chain Simulation**: Deterministic Hardhat network fork for risk assessment

## 🚀 Quick Start

```bash
# Install all dependencies
npm install

# Start both backend and frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting!

### Troubleshooting

If you encounter connection issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for:
- Port conflicts and how to resolve them
- Service health checks
- Environment configuration
- Common error fixes

**Quick fix for "site can't be reached"**:
```bash
npm run kill:ports  # Free up ports
npm run dev         # Start all services
npm run health      # Verify everything is running
```

## 🏗️ Architecture

```
obs-oracle-before-signing/
├── apps/
│   ├── frontend/          # Next.js 14 + TypeScript + Tailwind
│   └── backend/           # Node.js + Fastify + TypeScript
├── chain/                 # Hardhat project
│   ├── contracts/         # Solidity contracts
│   └── scripts/           # Deployment scripts
└── prompts/               # Local AI prompt templates
```

## 🎪 Demo Scenarios

### ❌ DENY Scenario (Malicious Drain)
```
User: "Approve unlimited USDT to 0x5FbDB2315678afecb367f032d93F642f64180aa3"
```

Expected behavior:
- Timeline shows approval + drain at block +18
- Reality delta: balance 1000.000000 → 0.000000
- Judgment: ❌ DENY
- Adversarial question: "This approval gives permanent spending power and simulation shows your funds reach 0. Why is this acceptable?"

### ✅ ALLOW Scenario (Safe Approval)
```
User: "Approve 10 USDT to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
```

Expected behavior:
- No drain simulation
- Reality delta: allowance 0.000000 → 10.000000
- Judgment: ✅ ALLOW
- Ready to sign with mock signer

## 🔧 What's Real vs Demo

### ✅ Real Implementation
- Hardhat network simulation
- ERC20 contract interactions
- State diff computation
- TypeScript type safety
- SSE streaming
- Chat UI with timeline

### 🎭 Demo Simulation
- "AI" judgment is rule-based (deterministic)
- Malicious spender drain is simulated in fork
- Mock signer returns success
- Block numbers are faked but state changes are real

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend**: Node.js, Fastify, TypeScript
- **Chain**: Hardhat, Solidity
- **Communication**: Server-Sent Events (SSE)
- **No external APIs**: Everything runs locally

## 🎯 Core Rules

OBS defaults to **DENY** unless:
- Amount ≤ 10 USDT AND
- Spender is not malicious AND
- No balance drain in simulation

## 💰 x402 Pay-per-Verdict (New!)

OBS now implements the **x402 protocol** for monetizing security insights. 

- **NoahAI (Intent Parsing)**: FREE. We decode what you want to do for no cost.
- **Cyrene (Simulation & Judgment)**: PAID. Running a full fork simulation and adversarial judgment requires a micro-payment.

### 🔄 x402 Workflow
1. User sends intent via Chat.
2. Backend returns **HTTP 402 Payment Required** with pricing metadata.
3. Frontend triggers **MetaMask** transaction automatically.
4. Once paid, the frontend retries with the `x-payment-tx` header.
5. Backend verifies payment on-chain and proceeds with the simulation.

### 🧪 x402 Demo Steps
1. Open the Chat.
2. Type an intent (e.g., "Approve 100 USDT...").
3. A system message will appear: "x402 Payment Required".
4. Click **"Pay via MetaMask"**.
5. Once the transaction is sent, the analysis will start automatically!

## 📋 API Endpoints

### POST /api/chat
Starts a new analysis run
```json
{
  "message": "Approve unlimited USDT to 0x..."
}
```

Response:
```json
{
  "runId": "run_123456"
}
```

### GET /api/stream/:runId
SSE stream of analysis stages:
- `intent_parse` → `fork_chain` → `simulate` → `extract_delta` → `judge` → `final`

## 🔐 Judgment Engine

### DENY Conditions
- Amount is MAX_UINT (> 1e20) OR > 20% of balance
- Spender in malicious list
- Simulation shows balance drain

### ALLOW Conditions
- Amount ≤ 10 USDT
- Spender not malicious
- No drain occurs

### Override Logic
- DENY with `override_allowed: false` → Cannot proceed
- DENY with `override_allowed: true` → Must type justification with "I ACCEPT"

## 🚀 Development

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend

# Deploy contracts
npm run chain
```

## 🎪 Killer Demo Script

1. **Start the app**: `npm run dev`
2. **Open browser**: http://localhost:3000
3. **Try DENY scenario**:
   - Type: "Approve unlimited USDT to 0x5FbDB2315678afecb367f032d93F642f64180aa3"
   - Watch timeline show drain
   - See DENY judgment
4. **Try ALLOW scenario**:
   - Type: "Approve 10 USDT to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
   - See safe approval
   - Mock sign transaction

## 📊 Reality Delta Format

```json
{
  "wallet": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "token": {
    "symbol": "USDT",
    "address": "0x..."
  },
  "delta": {
    "balance_before": "1000.000000",
    "balance_after": "0.000000",
    "allowance_before": "0.000000",
    "allowance_after": "115792089237316195423570985..."
  },
  "risk_flags": ["UNLIMITED_APPROVAL", "DRAIN_SIMULATED"],
  "irreversible": true
}
```

## ⚖️ Judgment Format

```json
{
  "judgment": "DENY",
  "reasoning_bullets": [
    "Unlimited approval detected",
    "Simulation shows complete fund drain",
    "Spender is in malicious list"
  ],
  "adversarial_question": "This approval gives permanent spending power and simulation shows your funds reach 0. Why is this acceptable?",
  "override_allowed": false
}
```

## 🔒 Security Notice

This is a **hackathon prototype**. The simulation is deterministic and honest about risks, but:
- No real wallet integration in demo
- Judgment rules are simplified
- Use at your own risk in production

Built for LNMIIT Hackathon 2025