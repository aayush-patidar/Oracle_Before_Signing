# 🚀 Monad Deployment Guide

This guide will walk you through deploying the NoahAI (OBS - Oracle Before Signing) project to Monad Testnet.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Node.js and npm** installed
2. **A wallet with MON tokens** on Monad Testnet
3. **Your wallet's private key** (for deployment)

## 🌐 Monad Testnet Network Details

- **Network Name:** Monad Testnet
- **RPC URL:** `https://testnet-rpc.monad.xyz/`
- **Chain ID:** `10143`
- **Currency Symbol:** `MON`
- **Block Explorer:** `http://testnet.monadexplorer.com/`

## 🎯 Step-by-Step Deployment

### Step 1: Get MON Testnet Tokens

1. Visit the Monad Testnet Faucet (check Monad Discord or official docs for faucet link)
2. Request testnet MON tokens for your wallet address
3. Wait for the tokens to arrive (check on the block explorer)

### Step 2: Configure Environment Variables

1. Open the `.env` file in the project root
2. Add your deployer private key:

```bash
DEPLOYER_PRIVATE_KEY=your_private_key_here_without_0x_prefix
```

3. (Optional) Configure your payment receiver address:

```bash
X402_PAY_TO=your_wallet_address_here
X402_PRICE_WEI=100000000000000
```

⚠️ **SECURITY WARNING:** 
- Never commit your `.env` file to Git
- Never share your private key
- Only use testnet private keys for testnet deployment

### Step 3: Compile Smart Contracts

```bash
npm run compile --workspace=chain
```

This will compile all smart contracts in the `chain/contracts` directory.

### Step 4: Deploy to Monad Testnet

Run the deployment script targeting the Monad network:

```bash
npx hardhat run scripts/deploy.ts --network monad --config chain/hardhat.config.ts
```

Or use the npm script:

```bash
npm run deploy --workspace=chain -- --network monad
```

### Step 5: Save Deployment Addresses

After deployment, the script will output contract addresses. Save these addresses:

```
MockUSDT deployed to: 0x...
MaliciousSpender deployed to: 0x...
```

The deployment script automatically saves the state to `chain/state.json`.

### Step 6: Update Frontend Configuration

Update your frontend to connect to Monad Testnet. The backend will automatically use the RPC_URL from `.env`.

### Step 7: Configure MetaMask for Monad

Add Monad Testnet to MetaMask:

1. Open MetaMask
2. Click on the network dropdown
3. Click "Add Network" → "Add a network manually"
4. Enter the following details:
   - **Network Name:** Monad Testnet
   - **New RPC URL:** `https://testnet-rpc.monad.xyz/`
   - **Chain ID:** `10143`
   - **Currency Symbol:** `MON`
   - **Block Explorer URL:** `http://testnet.monadexplorer.com/`
5. Click "Save"

### Step 8: Start Your Application

Start the backend and frontend:

```bash
npm run dev
```

Your application is now connected to Monad Testnet! 🎉

## 🔍 Verify Deployment

1. Check the block explorer: `http://testnet.monadexplorer.com/`
2. Search for your contract addresses
3. Verify the contracts are deployed correctly

## 📝 Additional Configuration

### Alternative RPC URLs

If the primary RPC is slow, you can use alternative endpoints:

```bash
MONAD_RPC_URL=https://monad-testnet.drpc.org
# or
MONAD_RPC_URL=https://rpc-testnet.monadinfra.com
```

### Gas Configuration

Monad has sub-second block times and high throughput. You may want to adjust gas settings in `hardhat.config.ts`:

```typescript
monad: {
  url: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz/",
  chainId: 10143,
  accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
  gas: "auto",
  gasPrice: "auto"
}
```

## 🐛 Troubleshooting

### Issue: "Insufficient funds for gas"
**Solution:** Get more MON tokens from the faucet

### Issue: "Network connection error"
**Solution:** Try an alternative RPC URL

### Issue: "Nonce too high"
**Solution:** Reset your MetaMask account (Settings → Advanced → Clear activity tab data)

### Issue: "Contract deployment failed"
**Solution:** Check that your contracts compile successfully first

## 🎯 Production Deployment (Mainnet)

When Monad mainnet launches, update your configuration:

1. Get real MON tokens
2. Update `.env` with mainnet RPC URL
3. Add mainnet network to `hardhat.config.ts`
4. Deploy using `--network monad-mainnet`

## 📚 Resources

- [Monad Official Website](https://monad.xyz)
- [Monad Documentation](https://docs.monad.xyz)
- [Monad Testnet Explorer](http://testnet.monadexplorer.com/)
- [Monad Discord](https://discord.gg/monad) - For faucet access and support

## 🔐 Security Best Practices

1. ✅ Use environment variables for sensitive data
2. ✅ Never commit private keys to version control
3. ✅ Test thoroughly on testnet before mainnet
4. ✅ Audit smart contracts before production deployment
5. ✅ Use hardware wallets for mainnet deployments
6. ✅ Keep your `.env` file in `.gitignore`

---

**Need Help?** Check the Monad Discord or open an issue in the project repository.
