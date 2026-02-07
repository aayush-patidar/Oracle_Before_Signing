# 🔧 Deployment Troubleshooting Guide

## 🚨 Common Issues: Why Features Work Locally But Not in Production

Based on your screenshots showing "System interface breakdown. Connection lost." and "BASELINE LINK INACTIVE", here are the most common issues and their solutions:

---

## 🎯 Issue #1: Frontend Cannot Connect to Backend (MOST COMMON)

### **Symptoms:**
- ✅ Works on localhost
- ❌ "Connection lost" on deployed version
- ❌ "System interface breakdown"
- ❌ API calls fail silently
- ❌ Chat/Oracle features don't work

### **Root Cause:**
Your frontend on Vercel is trying to connect to `http://127.0.0.1:3001` (localhost), which doesn't exist in production.

### **Solution:**

#### Step 1: Verify Your Backend URL on Render
1. Go to your Render dashboard
2. Find your backend service
3. Copy the URL (e.g., `https://obs-backend-xyz.onrender.com`)
4. Test it:
   ```bash
   curl https://your-backend-url.onrender.com/health
   ```
   Should return:
   ```json
   {"status":"ok","timestamp":"...","server":"OBS Backend","port":3001}
   ```

#### Step 2: Add Environment Variable to Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add this variable:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://your-backend-url.onrender.com
   ```
   **IMPORTANT:** Replace `your-backend-url.onrender.com` with your actual Render backend URL

3. Add it to all environments (Production, Preview, Development)

#### Step 3: Redeploy Frontend
```bash
# In Vercel dashboard, go to Deployments → Click "..." → Redeploy
```

Or via CLI:
```bash
vercel --prod
```

---

## 🎯 Issue #2: CORS Errors

### **Symptoms:**
- Browser console shows: "CORS policy blocked"
- Network tab shows failed requests with CORS errors
- Backend is accessible but frontend can't connect

### **Root Cause:**
Backend doesn't allow requests from your Vercel domain.

### **Solution:**

Update `apps/backend/src/server.ts` line 32-34:

**Current (Line 32-34):**
```typescript
fastify.register(cors, {
  origin: true // Allow all origins for demo
});
```

**Replace with:**
```typescript
fastify.register(cors, {
  origin: [
    'http://localhost:3000',                    // Local development
    'https://your-app.vercel.app',              // Your Vercel domain
    'https://your-app-git-main.vercel.app',     // Vercel preview
    /\.vercel\.app$/                            // All Vercel deployments
  ],
  credentials: true
});
```

**Then:**
1. Commit and push changes
2. Render will auto-deploy
3. Wait for deployment to complete
4. Test again

---

## 🎯 Issue #3: Environment Variables Not Set

### **Symptoms:**
- Features work locally but fail in production
- Backend logs show "NOT SET" for environment variables
- Payment verification fails
- MongoDB connection errors

### **Solution:**

#### For Vercel (Frontend):
Add these environment variables in Vercel Dashboard:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

#### For Render (Backend):
Add these environment variables in Render Dashboard:

```bash
MONGODB_URI=mongodb+srv://patidaraayush053:Aayush9098%40@obs.dd4hlns.mongodb.net/obs?retryWrites=true&w=majority&appName=OBS
RPC_URL=https://testnet-rpc.monad.xyz/
X402_PAY_TO=0x598a82A1e968D29A2666847C39bCa5adf5640684
X402_PRICE_WEI=100000000000000
X402_CHAIN_ID=10143
PORT=3001
HOST=0.0.0.0
```

**IMPORTANT:** After adding environment variables, you MUST redeploy both services.

---

## 🎯 Issue #4: MongoDB Connection Fails

### **Symptoms:**
- Backend logs: "MongoServerError: Authentication failed"
- Backend logs: "Could not connect to any servers"
- Features requiring database don't work

### **Solution:**

1. **Check MongoDB Atlas IP Whitelist:**
   - Go to MongoDB Atlas → Network Access
   - Add IP Address: `0.0.0.0/0` (Allow from anywhere)
   - This is required for Render/Vercel to connect

2. **Verify Connection String:**
   - Ensure special characters in password are URL-encoded
   - Your password `Aayush9098@` should be `Aayush9098%40`
   - Full URI should be:
     ```
     mongodb+srv://patidaraayush053:Aayush9098%40@obs.dd4hlns.mongodb.net/obs?retryWrites=true&w=majority&appName=OBS
     ```

3. **Check Database User Permissions:**
   - Go to MongoDB Atlas → Database Access
   - Ensure user has "Read and write to any database" permissions

---

## 🎯 Issue #5: Serverless Function Timeout (Vercel)

### **Symptoms:**
- Long-running operations fail
- Chat responses timeout
- "504 Gateway Timeout" errors

### **Root Cause:**
Vercel free tier has 10-second timeout for serverless functions.

### **Solution:**

**Option A: Upgrade Vercel Plan**
- Pro plan has 60-second timeout
- Hobby plan has 10-second timeout

**Option B: Use Separate Backend (Recommended)**
- Deploy backend to Render (no timeout limits)
- Set `NEXT_PUBLIC_API_URL` in Vercel
- All heavy operations run on Render backend

---

## 🎯 Issue #6: Chain State File Not Found

### **Symptoms:**
- `/api/chain-state` returns mock data
- Contract addresses are wrong
- Transactions fail with "contract not found"

### **Root Cause:**
`chain/state.json` doesn't exist in production deployment.

### **Solution:**

**Option A: Hardcode Production Values**

Update `apps/backend/src/server.ts` line 78-96 with your actual deployed contract addresses:

```typescript
return {
  contracts: {
    mockUSDT: {
      address: '0xYourActualUSDTAddress',  // From your Monad deployment
      symbol: 'USDT',
      decimals: 6
    },
    maliciousSpender: {
      address: '0xYourActualSpenderAddress'  // From your Monad deployment
    }
  },
  wallets: {
    user: '0x598a82A1e968D29A2666847C39bCa5adf5640684',
    maliciousSpender: '0xYourSpenderAddress'
  },
  initialState: {
    userBalance: '1000000000'
  }
};
```

**Option B: Use Environment Variables**

1. Add to Render environment variables:
   ```
   MONAD_USDT_ADDRESS=0xYourUSDTAddress
   MONAD_SPENDER_ADDRESS=0xYourSpenderAddress
   ```

2. Update `apps/backend/src/server.ts`:
   ```typescript
   return {
     contracts: {
       mockUSDT: {
         address: process.env.MONAD_USDT_ADDRESS || '0x...',
         symbol: 'USDT',
         decimals: 6
       },
       maliciousSpender: {
         address: process.env.MONAD_SPENDER_ADDRESS || '0x...'
       }
     }
   };
   ```

---

## 🎯 Issue #7: Build Fails on Vercel

### **Symptoms:**
- Deployment fails during build
- TypeScript errors
- Module not found errors

### **Solution:**

1. **Test Build Locally:**
   ```bash
   cd apps/frontend
   npm run build
   ```

2. **Fix TypeScript Errors:**
   - Check build output for errors
   - Fix all type errors
   - Commit and push

3. **Verify Dependencies:**
   ```bash
   npm install
   ```

4. **Check Vercel Build Settings:**
   - Build Command: `npm run build --workspace=apps/frontend`
   - Output Directory: `apps/frontend/.next`
   - Install Command: `npm install`
   - Node Version: 18.x or higher

---

## 🎯 Issue #8: WebSocket/SSE Connections Fail

### **Symptoms:**
- Real-time chat doesn't work
- EventSource errors in console
- Streaming responses fail

### **Root Cause:**
Vercel serverless functions don't support long-lived connections.

### **Solution:**

Use the separate backend on Render:
1. Ensure `NEXT_PUBLIC_API_URL` points to Render backend
2. Render supports WebSocket and SSE connections
3. All streaming will go through Render, not Vercel

---

## 📋 Complete Deployment Checklist

### Backend (Render):
- [ ] Backend deployed to Render
- [ ] Health check returns 200: `curl https://your-backend.onrender.com/health`
- [ ] All environment variables set in Render dashboard
- [ ] MongoDB connection works (check logs)
- [ ] CORS configured with Vercel domain
- [ ] Backend URL copied for frontend

### Frontend (Vercel):
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel environment variables
- [ ] Frontend deployed successfully
- [ ] Build passes without errors
- [ ] Frontend loads in browser
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows API calls going to Render backend

### Testing:
- [ ] Open deployed frontend URL
- [ ] Open browser DevTools → Network tab
- [ ] Try to use chat/oracle feature
- [ ] Verify API calls go to `https://your-backend.onrender.com`
- [ ] Check for errors in Console tab
- [ ] Verify features work end-to-end

---

## 🔍 Debugging Steps

### 1. Check Frontend Logs (Vercel):
```bash
# Via Vercel CLI
vercel logs

# Or in Vercel Dashboard → Deployments → View Function Logs
```

### 2. Check Backend Logs (Render):
```bash
# In Render Dashboard → Your Service → Logs
```

### 3. Test API Endpoints:
```bash
# Backend health
curl https://your-backend.onrender.com/health

# Dashboard API
curl https://your-backend.onrender.com/api/dashboard

# Chain state
curl https://your-backend.onrender.com/api/chain-state
```

### 4. Check Browser Console:
1. Open deployed frontend
2. Press F12 → Console tab
3. Look for errors (red text)
4. Common errors:
   - `CORS policy blocked` → Fix CORS in backend
   - `Failed to fetch` → Check `NEXT_PUBLIC_API_URL`
   - `404 Not Found` → Backend not deployed or wrong URL
   - `500 Internal Server Error` → Check backend logs

### 5. Check Network Tab:
1. F12 → Network tab
2. Try to use a feature
3. Look at failed requests (red)
4. Click on failed request → Headers tab
5. Check:
   - Request URL (should be your Render backend)
   - Status Code (should be 200)
   - Response (error message)

---

## 🚀 Quick Fix Commands

### Redeploy Everything:
```bash
# 1. Commit latest changes
git add .
git commit -m "fix: deployment configuration"
git push origin main

# 2. Render auto-deploys from Git push

# 3. Redeploy Vercel
vercel --prod
```

### Reset and Redeploy:
```bash
# 1. Clear Vercel cache
vercel --prod --force

# 2. Restart Render service
# Go to Render Dashboard → Manual Deploy → Clear build cache & deploy
```

---

## 📞 Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Share these details:**
   - Vercel deployment URL
   - Render backend URL
   - Browser console errors (screenshot)
   - Network tab (screenshot of failed request)
   - Render backend logs (last 50 lines)

2. **Quick diagnostic:**
   ```bash
   # Test backend directly
   curl https://your-backend.onrender.com/health
   
   # Test from frontend
   # Open browser console on deployed frontend and run:
   fetch('https://your-backend.onrender.com/health').then(r => r.json()).then(console.log)
   ```

3. **Common final issues:**
   - Wrong backend URL in `NEXT_PUBLIC_API_URL`
   - Typo in environment variable names
   - Backend service is sleeping (Render free tier)
   - MongoDB IP whitelist not set to `0.0.0.0/0`

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Frontend loads without errors
- ✅ Browser console is clean (no red errors)
- ✅ Network tab shows successful API calls to Render backend
- ✅ Chat/Oracle features work
- ✅ Transactions can be simulated
- ✅ Dashboard shows data
- ✅ No "Connection lost" messages

---

**Good luck with your deployment! 🚀**
