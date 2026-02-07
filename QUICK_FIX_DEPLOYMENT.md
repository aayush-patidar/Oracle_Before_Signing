# 🚀 Quick Fix Guide - Deployment Issues

## ⚡ Most Common Issue: Frontend Can't Connect to Backend

### Symptoms:
- ✅ Works on localhost
- ❌ "Connection lost" on deployed version
- ❌ "System interface breakdown"

### Quick Fix (5 minutes):

#### 1️⃣ Get Your Backend URL
```bash
# Go to Render Dashboard → Your Backend Service
# Copy the URL (e.g., https://obs-backend-xyz.onrender.com)
```

#### 2️⃣ Add to Vercel
```bash
# Vercel Dashboard → Your Project → Settings → Environment Variables
# Add:
Name: NEXT_PUBLIC_API_URL
Value: https://your-backend-url.onrender.com  # ← Your actual Render URL
```

#### 3️⃣ Redeploy
```bash
# Vercel Dashboard → Deployments → ... → Redeploy
```

**That's it!** Wait 2-3 minutes for deployment, then test.

---

## 🧪 Run Diagnostics

```bash
# Test your deployment automatically
VERCEL_URL=https://your-app.vercel.app RENDER_URL=https://your-backend.onrender.com npm run diagnose
```

---

## 🔧 Other Quick Fixes

### Issue: CORS Errors

**File:** `apps/backend/src/server.ts` (line 32-34)

**Replace:**
```typescript
fastify.register(cors, {
  origin: true // Allow all origins for demo
});
```

**With:**
```typescript
fastify.register(cors, {
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',  // ← Your Vercel URL
    /\.vercel\.app$/
  ],
  credentials: true
});
```

Then commit, push, and Render auto-deploys.

---

### Issue: MongoDB Connection Failed

**Fix:** Add IP to whitelist

1. MongoDB Atlas → Network Access
2. Add IP Address: `0.0.0.0/0`
3. Save

---

### Issue: Environment Variables Not Set

**Render (Backend):**
```
MONGODB_URI=mongodb+srv://patidaraayush053:Aayush9098%40@obs.dd4hlns.mongodb.net/obs?retryWrites=true&w=majority&appName=OBS
RPC_URL=https://testnet-rpc.monad.xyz/
X402_PAY_TO=0x598a82A1e968D29A2666847C39bCa5adf5640684
X402_PRICE_WEI=100000000000000
X402_CHAIN_ID=10143
```

**Vercel (Frontend):**
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 📊 Test Your Deployment

### Test Backend:
```bash
curl https://your-backend.onrender.com/health
# Should return: {"status":"ok",...}
```

### Test Frontend:
```bash
# Open in browser:
https://your-app.vercel.app

# Open DevTools (F12) → Console
# Should see no red errors
```

### Test Connection:
```bash
# In browser console on your deployed frontend:
fetch('https://your-backend.onrender.com/health').then(r => r.json()).then(console.log)
# Should return: {status: "ok", ...}
```

---

## 🆘 Still Not Working?

### Check These:

1. **Backend URL is correct?**
   ```bash
   echo $NEXT_PUBLIC_API_URL
   # Should be your Render URL, not localhost
   ```

2. **Backend is running?**
   - Render Dashboard → Your Service → Status should be "Live"

3. **Environment variables set?**
   - Vercel: Settings → Environment Variables
   - Render: Environment → Environment Variables

4. **Redeployed after changes?**
   - Changes to environment variables require redeploy

### Debug Commands:

```bash
# Check Vercel logs
vercel logs

# Check what URL frontend is using
# In browser console on deployed frontend:
console.log(process.env.NEXT_PUBLIC_API_URL)
```

---

## 📖 Full Documentation

For detailed troubleshooting, see:
- `DEPLOYMENT_TROUBLESHOOTING.md` - Complete guide
- `VERCEL_DEPLOYMENT.md` - Vercel setup
- `BACKEND_DEPLOYMENT_GUIDE.md` - Render setup

---

## ✅ Success Checklist

- [ ] Backend deployed to Render
- [ ] Backend health check works: `curl https://your-backend.onrender.com/health`
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel
- [ ] Frontend deployed to Vercel
- [ ] Frontend loads without errors
- [ ] Browser console is clean
- [ ] Features work (chat, oracle, etc.)

---

**Need help?** Run diagnostics: `npm run diagnose`
