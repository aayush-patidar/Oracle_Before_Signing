# 🚀 VERCEL DEPLOYMENT - COMPLETE ENVIRONMENT VARIABLE GUIDE

## DEPLOYMENT ARCHITECTURE

**Frontend**: Next.js (Vercel)  
**Backend**: Node.js API (deployed separately - Render/Railway)  
**Blockchain**: Monad Testnet (Chain ID: 10143)  
**Database**: MongoDB Atlas

---

## ✅ FINAL VERIFIED ENVIRONMENT VARIABLES LIST

### **CRITICAL WARNING**
⚠️ **DO NOT EXPOSE** backend-only variables to the frontend.  
Only variables with `NEXT_PUBLIC_` prefix are safe for Vercel deployment.

---

## 📋 COMPLETE VARIABLE TABLE

| ENV VARIABLE NAME | REQUIRED VALUE | WHERE IT COMES FROM | DEPLOYMENT TARGET | NOTES |
|-------------------|----------------|---------------------|-------------------|-------|
| **NEXT_PUBLIC_API_URL** | `https://your-backend.onrender.com` | Backend deployment URL | **REQUIRED** - Vercel | Points frontend to your deployed backend API |
| MONGODB_URI | `mongodb+srv://user:pass@cluster.mongodb.net/obs` | MongoDB Atlas connection string | **BACKEND ONLY** | ❌ DO NOT add to Vercel - backend secret |
| RPC_URL | `https://testnet-rpc.monad.xyz/` | Monad Testnet RPC endpoint | **BACKEND ONLY** | Used by backend for payment verification |
| X402_PAY_TO | `0x598a82A1e968D29A2666847C39bCa5adf5640684` | Payment receiver address | **BACKEND ONLY** | Wallet that receives x402 payments |
| X402_PRICE_WEI | `100000000000000` | Payment amount in wei (0.0001 MON) | **BACKEND ONLY** | Cost for simulation service |
| X402_CHAIN_ID | `10143` | Monad Testnet chain ID | **BACKEND ONLY** | Chain ID for payment verification |

---

## 🎯 VERCEL-SPECIFIC CONFIGURATION

### Environment Variables to Add in Vercel Dashboard

**ONLY ADD THIS SINGLE VARIABLE TO VERCEL:**

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

**Explanation:**
- The frontend uses `NEXT_PUBLIC_API_URL` to communicate with your backend
- All other variables (MongoDB, RPC, payment config) belong to the **backend deployment**
- The `NEXT_PUBLIC_` prefix makes this variable available to the browser

### Where Backend URL Comes From

1. Deploy backend separately to **Render**, **Railway**, or **Fly.io**
2. Get the deployment URL (e.g., `https://obs-backend.onrender.com`)
3. Add this URL to Vercel as `NEXT_PUBLIC_API_URL`

---

## 🔧 FRONTEND CONFIGURATION DETAILS

### Contract Addresses (Hardcoded in Frontend)

**Location**: `apps/frontend/src/app/enterprise/page.tsx`

```typescript
// Monad Testnet (Chain ID: 10143)
MONAD_TOKEN = "0xf187ba9BdF5aE32D7F75A537CE7399D0855410C6"  // MockUSDT
MONAD_SPENDER = "0x1F95a95810FB99bb2781545b89E2791AD87DfAFb"  // MaliciousSpender

// Localhost (Chain ID: 31337) - for development
LOCALHOST_TOKEN = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
LOCALHOST_SPENDER = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
```

✅ **No environment variables needed** - these are network-specific and determined at runtime.

### Network Configuration (Hardcoded in Web3Context)

**Location**: `apps/frontend/src/context/Web3Context.tsx`

```typescript
Networks:
- Monad Testnet: chainId 0x279F (10143), RPC: https://testnet-rpc.monad.xyz/
- Localhost: chainId 0x7A69 (31337), RPC: http://127.0.0.1:8545
- Sepolia: chainId 0xaa36a7 (11155111)
- Mainnet: chainId 0x1 (1)
```

✅ **No environment variables needed** - these are static configurations.

---

## 📝 VERCEL-READY .env.example FOR FRONTEND

```bash
# =============================================================================
# VERCEL FRONTEND ENVIRONMENT VARIABLES
# =============================================================================

# Backend API URL
# REQUIRED: Set this to your deployed backend URL
# Example: https://obs-backend.onrender.com
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com

# =============================================================================
# THE FOLLOWING VARIABLES ARE FOR BACKEND ONLY - DO NOT ADD TO VERCEL
# =============================================================================

# MongoDB Connection (Backend Only)
# MONGODB_URI=mongodb+srv://...

# Monad RPC Configuration (Backend Only)
# RPC_URL=https://testnet-rpc.monad.xyz/
# X402_CHAIN_ID=10143

# x402 Payment Configuration (Backend Only)
# X402_PAY_TO=0x598a82A1e968D29A2666847C39bCa5adf5640684
# X402_PRICE_WEI=100000000000000
```

---

## 🚀 STEP-BY-STEP VERCEL DEPLOYMENT

### **Step 1: Deploy Backend First**

Before deploying to Vercel, deploy your backend:

1. Choose platform: **Render**, **Railway**, or **Fly.io**
2. Deploy `apps/backend` with these environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   RPC_URL=https://testnet-rpc.monad.xyz/
   X402_CHAIN_ID=10143
   X402_PAY_TO=0x598a82A1e968D29A2666847C39bCa5adf5640684
   X402_PRICE_WEI=100000000000000
   ```
3. Get your backend URL (e.g., `https://obs-backend.onrender.com`)
4. **Verify backend is running** by visiting `https://your-backend-url/health`

### **Step 2: Configure Vercel Environment Variables**

#### Option A: Via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project (or create new)
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variable:

**Variable Settings:**
```
Name: NEXT_PUBLIC_API_URL
Value: https://your-backend-url.onrender.com
Environment: Production, Preview, Development (select all)
```

5. Click **Save**

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Add environment variable
vercel env add NEXT_PUBLIC_API_URL

# When prompted, enter your backend URL
# Example: https://obs-backend.onrender.com

# Select all environments: Production, Preview, Development
```

### **Step 3: Deploy to Vercel**

#### Option A: Via Git (Recommended)

1. Push to GitHub/GitLab/Bitbucket:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. Import in Vercel Dashboard:
   - Click "Add New Project"
   - Import your Git repository
   - Configure project:
     - **Framework Preset**: Next.js
     - **Root Directory**: `./`
     - **Build Command**: `npm run build --workspace=apps/frontend`
     - **Output Directory**: `apps/frontend/.next`
     - **Install Command**: `npm install`
   - Click **Deploy**

#### Option B: Via Vercel CLI

```bash
# From project root
vercel --prod
```

### **Step 4: Verify Deployment**

After deployment, test these URLs:

1. **Frontend**: `https://your-app.vercel.app`
   - Should redirect to `/enterprise`
   - Dashboard should load

2. **Network Connection**:
   - Connect wallet (MetaMask)
   - Switch to Monad Testnet (Chain ID: 10143)
   - Verify connection shows "Monad Testnet"

3. **Backend Connection**:
   - Open browser console (F12)
   - Check for API calls to your backend URL
   - Should see requests to `https://your-backend-url.onrender.com/api/*`

4. **Full Flow Test**:
   - Connect wallet
   - Try "Approve MAX" button
   - Should trigger MetaMask transaction
   - Transaction should be recorded in backend

---

## 🔄 WHEN TO REDEPLOY

| Change | Requires Redeploy? | Action |
|--------|-------------------|--------|
| Update `NEXT_PUBLIC_API_URL` | ✅ YES | Redeploy via Vercel Dashboard or push to Git |
| Change backend URL | ✅ YES | Update env var in Vercel + redeploy |
| Update contract addresses | ✅ YES | Code change - commit and push |
| Change frontend UI | ✅ YES | Code change - commit and push |
| Update backend env vars | ❌ NO | Update in backend hosting platform only |
| Change MongoDB connection | ❌ NO | Update in backend hosting platform only |

---

## ✅ VALIDATION CHECKLIST

### Pre-Deployment Validation

- [ ] Backend is deployed and accessible
- [ ] Backend URL is working (test `/health` endpoint)
- [ ] MongoDB connection is configured in backend
- [ ] Backend CORS allows Vercel domain
- [ ] Contract addresses match deployed network (Monad Testnet)

### Backend CORS Configuration

**CRITICAL**: Your backend must allow requests from Vercel domain.

In `apps/backend/src/index.ts`, ensure CORS is configured:

```typescript
fastify.register(cors, {
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',  // Add your Vercel domain
    'https://*.vercel.app'          // Allow all Vercel preview deployments
  ],
  credentials: true
});
```

### Vercel Deployment Validation

- [ ] `NEXT_PUBLIC_API_URL` is set in Vercel
- [ ] Environment variable is applied to Production, Preview, and Development
- [ ] Build completes successfully
- [ ] No TypeScript errors in build logs
- [ ] Deployment shows "Ready" status

### Post-Deployment Validation

- [ ] Frontend loads at Vercel URL
- [ ] No console errors (check browser DevTools)
- [ ] Wallet connection works
- [ ] Network switch to Monad Testnet works
- [ ] API calls reach backend (check Network tab)
- [ ] Transaction signing triggers MetaMask
- [ ] Dashboard data loads from backend

---

## 🐛 TROUBLESHOOTING

### Issue: "Network Error" or API calls fail

**Diagnosis:**
```bash
# Open browser console
# Check Network tab for failed requests
# Look for CORS errors or 404s
```

**Solutions:**
1. Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
2. Check backend CORS configuration includes Vercel domain
3. Test backend URL directly: `curl https://your-backend-url.onrender.com/api/dashboard`
4. Ensure backend is running (check hosting platform dashboard)

### Issue: "Cannot read properties of undefined"

**Cause**: Contract addresses not found for network

**Solution**:
- Verify you're connected to Monad Testnet (Chain ID: 10143)
- Check contract addresses in `apps/frontend/src/app/enterprise/page.tsx`
- Ensure contracts are deployed to Monad Testnet

### Issue: Environment variable not updating

**Solution**:
```bash
# After updating env var in Vercel Dashboard:
1. Go to Deployments tab
2. Find latest deployment
3. Click "..." menu → "Redeploy"
4. Select "Use existing Build Cache" → Redeploy
```

### Issue: Build fails with "MODULE_NOT_FOUND"

**Cause**: Monorepo workspace issue

**Solution**:
Verify `vercel.json` configuration:
```json
{
  "buildCommand": "npm run build --workspace=apps/frontend",
  "outputDirectory": "apps/frontend/.next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

### Issue: API routes return 404 on Vercel

**Cause**: API routes not found in Next.js Pages Router

**Solution**:
- Frontend uses App Router (`/app`) for pages
- API routes are proxied via `next.config.js` rewrites
- Verify `NEXT_PUBLIC_API_URL` points to deployed backend
- API routes on Vercel won't work - backend must be deployed separately

---

## 🔐 SECURITY BEST PRACTICES

### ✅ DO
- Use `NEXT_PUBLIC_` prefix only for non-sensitive, client-safe values
- Store MongoDB URI, private keys, and secrets in backend only
- Use environment variables for all deployment-specific values
- Enable HTTPS (Vercel does this automatically)
- Implement proper CORS on backend

### ❌ DO NOT
- Add `MONGODB_URI` to Vercel environment variables
- Expose backend secrets to frontend
- Hardcode API URLs in code
- Commit `.env` files to Git
- Use same MongoDB credentials for dev and production

---

## 📊 DEPLOYMENT ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                          │
│  (MetaMask Wallet Connected to Monad Testnet)          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              VERCEL (Frontend)                           │
│  • Next.js Application                                   │
│  • Environment: NEXT_PUBLIC_API_URL                     │
│  • Contract Addresses: Hardcoded per Network            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ API Calls
                  ▼
┌─────────────────────────────────────────────────────────┐
│        RENDER/RAILWAY (Backend)                          │
│  • Node.js Fastify API                                   │
│  • Environment: MONGODB_URI, RPC_URL, X402_*            │
│  • Handles: Transactions, Payments, Simulations         │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────┐    ┌──────────────────┐
│ MongoDB      │    │ Monad Testnet    │
│ Atlas        │    │ RPC              │
│ (Database)   │    │ (Blockchain)     │
└──────────────┘    └──────────────────┘
```

---

## ✅ FINAL CHECKLIST

### Before First Deploy

- [ ] Backend deployed with all environment variables
- [ ] Backend URL accessible and returning responses
- [ ] CORS configured to allow Vercel domain
- [ ] MongoDB connection working in backend
- [ ] Contracts deployed to Monad Testnet

### Vercel Configuration

- [ ] Project created in Vercel
- [ ] Git repository connected (if using Git deploy)
- [ ] Build settings configured for monorepo
- [ ] `NEXT_PUBLIC_API_URL` environment variable added
- [ ] Environment variable applied to all environments

### Post-Deploy Verification

- [ ] Build completed successfully
- [ ] No errors in build logs
- [ ] Frontend accessible at Vercel URL
- [ ] Wallet connection works
- [ ] API calls reach backend
- [ ] Data loads from backend
- [ ] Transactions can be initiated
- [ ] MetaMask prompts appear

---

## 🎉 SUCCESS CRITERIA

Your deployment is successful when:

1. ✅ Frontend loads at `https://your-app.vercel.app`
2. ✅ Dashboard shows "Connected" status for wallet
3. ✅ Network switch to Monad Testnet works
4. ✅ "Approve MAX" button triggers MetaMask
5. ✅ Transactions are recorded in backend (visible in dashboard)
6. ✅ No console errors in browser DevTools
7. ✅ Backend health check returns 200 OK

---

## 📞 QUICK REFERENCE COMMANDS

```bash
# Verify backend is running
curl https://your-backend-url.onrender.com/api/dashboard

# Deploy to Vercel
git push origin main  # (if using Git integration)
# OR
vercel --prod  # (if using CLI)

# Update environment variable
vercel env add NEXT_PUBLIC_API_URL

# Force redeploy
vercel --prod --force

# Check deployment logs
vercel logs <deployment-url>
```

---

## 🔗 RESOURCES

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Monad Testnet Documentation](https://docs.monad.xyz/)
- [MongoDB Atlas Setup](https://www.mongodb.com/cloud/atlas)

---

**Built by Aayush Patidar for LNMIIT Hackathon 2025**

*Last Updated: 2026-02-06*
