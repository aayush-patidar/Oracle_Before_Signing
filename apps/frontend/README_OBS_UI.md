# OBS Dashboard - Enterprise Blockchain UI

A production-quality Next.js dashboard for monitoring and interacting with the OBS (Oracle Before Signing) blockchain system.

## Features

- **Real-time Blockchain Monitoring**: Live RPC health status, balances, and allowances
- **Risk Assessment**: Automatic risk level calculation (Safe/Elevated/Critical) based on allowances
- **MetaMask Integration**: Connect wallet, approve/revoke permissions
- **Enterprise UI**: Professional design with cards, tables, badges, and comprehensive error handling
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 18+
- Hardhat node running locally
- Contracts deployed and `chain/state.json` exists

## Setup Instructions

### 1. Start Hardhat Node
```bash
cd chain
npx hardhat node
```

### 2. Deploy Contracts
```bash
cd chain
npm run deploy
```

### 3. Start Frontend
```bash
cd apps/frontend
npm run dev
```

## Accessing the Dashboard

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Dashboard Components

### KPI Cards
- **RPC Status**: Shows if the blockchain node is online
- **USDT Balance**: Current user balance in USDT
- **Allowance**: Current spending allowance granted to malicious spender
- **Risk Level**: Automatic risk assessment (Safe/Elevated/Critical)

### Contracts Table
Lists all deployed contracts with:
- Contract name and type
- Full address (clickable for copy/external link)
- Contract badges (ERC20, Malicious)

### Wallets Table
Shows key wallet addresses with:
- Role-based identification
- Current balances
- Copy and external link actions

### Actions Panel
**⚠️ DANGER ZONE - Use with extreme caution**

- **Connect Wallet**: Links MetaMask to the dashboard
- **Approve MAX**: Grants unlimited spending permission (HIGH RISK)
- **Revoke Approval**: Safely removes all permissions

## Risk Levels

- **Safe** (🛡️): Allowance = 0 (no permissions granted)
- **Elevated** (⚠️): 0 < Allowance < 100 USDT (limited risk)
- **Critical** (🚨): Allowance ≥ 100 USDT (high risk - potential total loss)

## Error Handling

The dashboard gracefully handles:
- Hardhat node offline
- Missing configuration files
- MetaMask not installed
- Wrong network in MetaMask
- Transaction failures

## Development

### Adding New Components
UI components follow shadcn/ui patterns in `src/components/ui/`.

### API Routes
Blockchain data is fetched via `/api/chain-state` route.

### Styling
Uses Tailwind CSS with custom design tokens for consistent enterprise appearance.

## Security Notes

- Never approve unlimited spending in production
- Always verify contract addresses before interactions
- The "Approve MAX" button is styled as dangerous for a reason
- Use the revoke function immediately after testing