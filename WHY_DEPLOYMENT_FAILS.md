# 🎯 Why Your Deployed App Doesn't Work (But Localhost Does)

## TL;DR - The Problem

Your **frontend on Vercel** is trying to connect to `http://127.0.0.1:3001` (localhost), which **doesn't exist in production**. 

Your backend is on Render at a different URL, but your frontend doesn't know about it.

---

## 🔍 The Root Cause

### On Localhost:
```
Frontend (localhost:3000) → Backend (localhost:3001) ✅ Works
```

### On Production:
```
Frontend (Vercel) → Backend (localhost:3001) ❌ Doesn't exist!
                 ↓
                 Should be → Backend (Render) ✅
```

---

## ✅ The Solution (3 Steps)

### Step 1: Get Your Backend URL
1. Go to **Render Dashboard**
2. Click on your backend service
3. Copy the URL (looks like: `https://obs-backend-xyz.onrender.com`)

### Step 2: Tell Vercel About It
1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://your-backend-url.onrender.com` (paste your actual Render URL)
4. Add to **all environments** (Production, Preview, Development)
5. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **...** on latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes

**Done!** Your app should now work.

---

## 🧪 How to Verify It's Fixed

### Test 1: Backend is Running
```bash
curl https://your-backend-url.onrender.com/health
```
Should return:
```json
{"status":"ok","timestamp":"...","server":"OBS Backend","port":3001}
```

### Test 2: Frontend Can Connect
1. Open your deployed app: `https://your-app.vercel.app`
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Paste and run:
```javascript
fetch('https://your-backend-url.onrender.com/health').then(r => r.json()).then(console.log)
```
Should show: `{status: "ok", ...}`

### Test 3: Features Work
1. Try using the chat/oracle feature
2. Check **Network** tab in DevTools
3. API calls should go to `https://your-backend-url.onrender.com`
4. No "Connection lost" errors

---

## 🐛 Other Common Issues

### Issue 2: CORS Errors
**Symptom:** Browser console shows "CORS policy blocked"

**Fix:** Update `apps/backend/src/server.ts` line 32-34:
```typescript
fastify.register(cors, {
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',  // Add your Vercel URL
    /\.vercel\.app$/
  ],
  credentials: true
});
```
Commit, push, and Render will auto-deploy.

### Issue 3: MongoDB Connection Failed
**Symptom:** Backend logs show MongoDB errors

**Fix:** 
1. MongoDB Atlas → **Network Access**
2. Click **Add IP Address**
3. Enter: `0.0.0.0/0` (allow from anywhere)
4. Click **Confirm**

### Issue 4: Environment Variables Missing
**Symptom:** Features that need env vars don't work

**Fix:** Ensure these are set in **Render**:
```
MONGODB_URI=mongodb+srv://patidaraayush053:Aayush9098%40@obs.dd4hlns.mongodb.net/obs?retryWrites=true&w=majority&appName=OBS
RPC_URL=https://testnet-rpc.monad.xyz/
X402_PAY_TO=0x598a82A1e968D29A2666847C39bCa5adf5640684
X402_PRICE_WEI=100000000000000
X402_CHAIN_ID=10143
```

---

## 📚 Documentation Files Created

I've created comprehensive guides for you:

1. **QUICK_FIX_DEPLOYMENT.md** ← Start here for fast fixes
2. **DEPLOYMENT_TROUBLESHOOTING.md** ← Complete troubleshooting guide
3. **VERCEL_DEPLOYMENT.md** ← Vercel setup guide
4. **BACKEND_DEPLOYMENT_GUIDE.md** ← Render setup guide

---

## 🛠️ Diagnostic Tool

Run this to automatically check your deployment:

```bash
VERCEL_URL=https://your-app.vercel.app RENDER_URL=https://your-backend.onrender.com npm run diagnose
```

This will test:
- ✅ Backend health
- ✅ API endpoints
- ✅ CORS configuration
- ✅ Frontend accessibility
- ✅ Environment variables

---

## 📋 Quick Checklist

Before asking for help, verify:

- [ ] Backend is deployed and running on Render
- [ ] Backend health check works: `curl https://your-backend.onrender.com/health`
- [ ] `NEXT_PUBLIC_API_URL` is set in Vercel environment variables
- [ ] `NEXT_PUBLIC_API_URL` has your **actual Render URL** (not localhost)
- [ ] Frontend is deployed to Vercel
- [ ] You redeployed after adding environment variables
- [ ] MongoDB IP whitelist includes `0.0.0.0/0`
- [ ] CORS is configured with your Vercel domain

---

## 🎉 Expected Result

When everything is working:

✅ Frontend loads without errors  
✅ Browser console is clean (no red errors)  
✅ Network tab shows API calls to Render backend  
✅ Chat/Oracle features work  
✅ Transactions can be simulated  
✅ Dashboard shows data  
✅ No "Connection lost" messages  

---

## 🆘 Still Having Issues?

1. **Check browser console** (F12 → Console tab)
   - Look for red errors
   - Common: "CORS blocked", "Failed to fetch", "404 Not Found"

2. **Check network tab** (F12 → Network tab)
   - Try to use a feature
   - Look at failed requests (red)
   - Click on failed request → see error details

3. **Check backend logs**
   - Render Dashboard → Your Service → Logs
   - Look for errors or connection issues

4. **Run diagnostics**
   ```bash
   npm run diagnose
   ```

5. **Share these for help:**
   - Vercel deployment URL
   - Render backend URL
   - Browser console errors (screenshot)
   - Network tab (screenshot of failed request)
   - Backend logs (last 50 lines)

---

**Good luck! Your app should work after setting `NEXT_PUBLIC_API_URL` in Vercel! 🚀**
