# ✅ Monad Deployment Checklist

Use this checklist to track your deployment progress.

## 📋 Pre-Deployment

- [ ] **Install Dependencies**
  ```bash
  npm install
  ```

- [ ] **Get Testnet Tokens**
  - [ ] Join Monad Discord
  - [ ] Request MON tokens from faucet
  - [ ] Verify tokens received (check explorer)

- [ ] **Prepare Wallet**
  - [ ] Export private key from wallet
  - [ ] Keep private key secure
  - [ ] Never commit to Git

## 🔧 Configuration

- [ ] **Environment Setup**
  - [ ] Copy `.env.example` to `.env` (if needed)
  - [ ] Add `DEPLOYER_PRIVATE_KEY` to `.env`
  - [ ] Add `X402_PAY_TO` address (optional)
  - [ ] Verify `.env` is in `.gitignore`

- [ ] **MetaMask Setup**
  - [ ] Add Monad Testnet to MetaMask
    - Network Name: `Monad Testnet`
    - RPC URL: `https://testnet-rpc.monad.xyz/`
    - Chain ID: `10143`
    - Symbol: `MON`
    - Explorer: `http://testnet.monadexplorer.com/`
  - [ ] Switch to Monad Testnet
  - [ ] Verify balance shows MON tokens

## 🏗️ Build & Deploy

- [ ] **Compile Contracts**
  ```bash
  npm run chain:compile
  ```
  - [ ] Compilation successful
  - [ ] No errors in output

- [ ] **Deploy to Monad**
  ```bash
  npm run monad:deploy
  ```
  - [ ] Deployment successful
  - [ ] Contract addresses received
  - [ ] Save contract addresses

- [ ] **Verify Deployment**
  - [ ] Check contracts on explorer
  - [ ] Verify `chain/state.json` created
  - [ ] Note MockUSDT address: `_______________`
  - [ ] Note MaliciousSpender address: `_______________`

## 🧪 Testing

- [ ] **Update Application**
  - [ ] Update `.env` with contract addresses (if needed)
  - [ ] Restart application: `npm run dev`

- [ ] **Test Frontend**
  - [ ] Open http://localhost:3000
  - [ ] Connect MetaMask
  - [ ] Verify Monad network selected

- [ ] **Test Transactions**
  - [ ] Try a test approval
  - [ ] Verify x402 payment works
  - [ ] Check transaction on explorer

## 📝 Documentation

- [ ] **Save Important Info**
  - [ ] Contract addresses saved
  - [ ] Deployment transaction hashes saved
  - [ ] Explorer links bookmarked

- [ ] **Update Project Docs**
  - [ ] Update README with contract addresses (if needed)
  - [ ] Document any custom configuration
  - [ ] Note deployment date and network

## 🔐 Security

- [ ] **Verify Security**
  - [ ] `.env` not committed to Git
  - [ ] Private keys not shared
  - [ ] Using testnet only
  - [ ] Backup important addresses

## 🎉 Post-Deployment

- [ ] **Share & Showcase**
  - [ ] Test all features
  - [ ] Take screenshots
  - [ ] Share on social media (optional)
  - [ ] Submit to hackathon (if applicable)

## 📊 Deployment Info

Fill this out after successful deployment:

```
Deployment Date: _______________
Deployer Address: _______________
Network: Monad Testnet (Chain ID: 10143)

Contract Addresses:
- MockUSDT: _______________
- MaliciousSpender: _______________

Explorer Links:
- MockUSDT: http://testnet.monadexplorer.com/address/_______________
- MaliciousSpender: http://testnet.monadexplorer.com/address/_______________

Deployment Transaction: _______________
Gas Used: _______________
```

## 🆘 Troubleshooting

If you encounter issues, check:

- [ ] Sufficient MON balance for gas
- [ ] Correct network selected in MetaMask
- [ ] Private key correctly formatted in `.env`
- [ ] All dependencies installed
- [ ] Contracts compile without errors

See `MONAD_DEPLOYMENT.md` for detailed troubleshooting.

---

**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete

**Current Step**: _______________

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________
