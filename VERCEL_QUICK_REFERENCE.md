# 🚀 VERCEL DEPLOYMENT - QUICK START

## ⚡ TL;DR - What to Add to Vercel

**ONLY ONE VARIABLE NEEDED:**

```
Name: NEXT_PUBLIC_API_URL
Value: https://your-backend-deployment-url.onrender.com
```

---

## 📋 COMPLETE ENVIRONMENT VARIABLE SUMMARY

| Variable | Value | Add to Vercel? | Notes |
|----------|-------|----------------|-------|
| **NEXT_PUBLIC_API_URL** | `https://your-backend.onrender.com` | ✅ **YES** | Your deployed backend URL |
| MONGODB_URI | `mongodb+srv://...` | ❌ NO | Backend secret only |
| RPC_URL | `https://testnet-rpc.monad.xyz/` | ❌ NO | Backend uses for payment verification |
| X402_PAY_TO | `0x598a82A1e968D29A2666847C39bCa5adf5640684` | ❌ NO | Backend payment receiver |
| X402_PRICE_WEI | `100000000000000` | ❌ NO | Backend payment amount |
| X402_CHAIN_ID | `10143` | ❌ NO | Backend chain ID |

---

## 🎯 Why Only One Variable?

**Frontend Architecture:**
- Contract addresses: **Hardcoded** in `pages/enterprise/page.tsx`
  - Monad: `0xf187ba9BdF5aE32D7F75A537CE7399D0855410C6` (MockUSDT)
  - Monad: `0x1F95a95810FB99bb2781545b89E2791AD87DfAFb` (MaliciousSpender)
- Network configs: **Hardcoded** in `Web3Context.tsx`
  - Monad Testnet RPC, Chain ID, etc.
- Wallet connection: **MetaMask** handles RPC

**Backend handles:**
- MongoDB connection
- Payment verification
- Transaction simulation
- State management

---

## ✅ 3-STEP DEPLOYMENT

### Step 1: Deploy Backend First
```bash
# Deploy to Render/Railway with these env vars:
MONGODB_URI=mongodb+srv://...
RPC_URL=https://testnet-rpc.monad.xyz/
X402_CHAIN_ID=10143
X402_PAY_TO=0x598a82A1e968D29A2666847C39bCa5adf5640684
X402_PRICE_WEI=100000000000000
```

### Step 2: Add Variable to Vercel
```
Vercel Dashboard → Settings → Environment Variables
Add: NEXT_PUBLIC_API_URL = https://your-backend.onrender.com
Select: Production, Preview, Development
```

### Step 3: Deploy to Vercel
```bash
# Option 1: Git Push
git push origin main

# Option 2: Vercel CLI
vercel --prod
```

---

## 🔍 VERIFICATION CHECKLIST

- [ ] Backend deployed and accessible
- [ ] Backend `/api/dashboard` returns 200 OK
- [ ] Backend CORS allows Vercel domain
- [ ] `NEXT_PUBLIC_API_URL` added to Vercel
- [ ] Vercel build succeeds
- [ ] Frontend loads at Vercel URL
- [ ] Wallet connects to Monad Testnet
- [ ] API calls reach backend (check Network tab)
- [ ] Transactions work end-to-end

---

## 🐛 Common Issues

### Backend not responding
```bash
# Test backend directly
curl https://your-backend.onrender.com/api/dashboard
```

### CORS errors
Add to backend `apps/backend/src/index.ts`:
```typescript
origin: ['https://*.vercel.app']
```

### Env var not working
After adding variable:
1. Go to Deployments
2. Click latest deployment → "..."
3. Select "Redeploy"

---

## 📊 Final Architecture

```
Browser (MetaMask + Monad Testnet)
        ↓
Vercel Frontend (NEXT_PUBLIC_API_URL only)
        ↓
Backend on Render (All other env vars)
        ↓
MongoDB Atlas + Monad RPC
```

---

**Ready to deploy!** 🎉

See `VERCEL_ENV_DEPLOYMENT_GUIDE.md` for complete details.
