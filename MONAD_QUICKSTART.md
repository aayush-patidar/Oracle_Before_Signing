# 🚀 Quick Start: Deploy to Monad

## Prerequisites Checklist

- [ ] Get MON testnet tokens from faucet
- [ ] Have your wallet private key ready
- [ ] Install dependencies: `npm install`

## 3-Step Deployment

### 1️⃣ Configure Environment

Edit `.env` file and add your private key:

```bash
DEPLOYER_PRIVATE_KEY=your_private_key_without_0x
```

### 2️⃣ Compile Contracts

```bash
npm run chain:compile
```

### 3️⃣ Deploy to Monad

```bash
npm run monad:deploy
```

## ✅ Done!

Your contracts are now deployed to Monad Testnet. The deployment script will output:
- Contract addresses
- Explorer links
- Next steps

## 🔧 Useful Commands

| Command | Description |
|---------|-------------|
| `npm run chain:compile` | Compile smart contracts |
| `npm run monad:deploy` | Deploy to Monad testnet |
| `npm run monad:verify` | Verify contracts on explorer |
| `npm run dev` | Run app with Monad backend |

## 🌐 Add Monad to MetaMask

**Network Settings:**
- Name: `Monad Testnet`
- RPC: `https://testnet-rpc.monad.xyz/`
- Chain ID: `10143`
- Symbol: `MON`
- Explorer: `http://testnet.monadexplorer.com/`

## 📚 Full Documentation

See `MONAD_DEPLOYMENT.md` for detailed instructions and troubleshooting.

## 🆘 Need Help?

1. Check the full deployment guide: `MONAD_DEPLOYMENT.md`
2. Join Monad Discord for faucet and support
3. Check contract addresses in `chain/state.json`

---

**Security Reminder:** Never commit your `.env` file or share your private key!
