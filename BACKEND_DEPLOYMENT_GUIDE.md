# 🚀 BACKEND DEPLOYMENT GUIDE

## IMPORTANT: Deploy Backend BEFORE Frontend

Your backend (`apps/backend`) must be deployed separately before deploying the frontend to Vercel.

---

## 📋 BACKEND ENVIRONMENT VARIABLES

Add these to your backend hosting platform (Render/Railway/Fly.io):

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://patidaraayush053:Aayush9098%40@obs.dd4hlns.mongodb.net/obs?retryWrites=true&w=majority&appName=OBS

# Monad RPC Configuration
RPC_URL=https://testnet-rpc.monad.xyz/

# x402 Payment Configuration
X402_PAY_TO=0x598a82A1e968D29A2666847C39bCa5adf5640684
X402_PRICE_WEI=100000000000000
X402_CHAIN_ID=10143

# Server Configuration (optional)
PORT=3001
HOST=0.0.0.0
```

---

## 🔧 REQUIRED: Update CORS Configuration

Before deploying, update `apps/backend/src/server.ts` to allow Vercel domains:

### Current Configuration (Line 32-34):
```typescript
fastify.register(cors, {
  origin: true // Allow all origins for demo
});
```

### Production Configuration (Update to):
```typescript
fastify.register(cors, {
  origin: [
    'http://localhost:3000',           // Local development
    'https://*.vercel.app',            // All Vercel deployments
    'https://your-app.vercel.app'      // Your production domain
  ],
  credentials: true
});
```

**Action Required:**
1. Open `apps/backend/src/server.ts`
2. Replace lines 32-34 with the production configuration above
3. Replace `your-app.vercel.app` with your actual Vercel domain
4. Commit and deploy

---

## 🚀 DEPLOYMENT PLATFORMS

### Option 1: Render (Recommended)

1. **Create Account**: [render.com](https://render.com)
2. **New Web Service**: Click "New +" → "Web Service"
3. **Connect Repository**: Link your Git repo
4. **Configuration**:
   ```
   Name: obs-backend
   Environment: Node
   Region: Choose closest to your users
   Branch: main
   Root Directory: apps/backend
   Build Command: npm install
   Start Command: npm start
   ```
5. **Add Environment Variables**: Copy from list above
6. **Deploy**: Click "Create Web Service"
7. **Get URL**: Copy your deployment URL (e.g., `https://obs-backend.onrender.com`)

### Option 2: Railway

1. **Create Account**: [railway.app](https://railway.app)
2. **New Project**: Click "New Project"
3. **Deploy from GitHub**: Select your repository
4. **Configuration**:
   ```
   Root Directory: apps/backend
   Install Command: npm install
   Start Command: npm start
   ```
5. **Add Variables**: Go to Variables tab, add all env vars
6. **Deploy**: Railway auto-deploys
7. **Get URL**: Find in Settings → Domains

### Option 3: Fly.io

1. **Install CLI**: `curl -L https://fly.io/install.sh | sh`
2. **Login**: `fly auth login`
3. **Create App**: 
   ```bash
   cd apps/backend
   fly launch
   ```
4. **Set Variables**:
   ```bash
   fly secrets set MONGODB_URI="mongodb+srv://..."
   fly secrets set RPC_URL="https://testnet-rpc.monad.xyz/"
   fly secrets set X402_PAY_TO="0x598a82A1e968D29A2666847C39bCa5adf5640684"
   fly secrets set X402_PRICE_WEI="100000000000000"
   fly secrets set X402_CHAIN_ID="10143"
   ```
5. **Deploy**: `fly deploy`

---

## ✅ VERIFICATION CHECKLIST

### After Deployment:

- [ ] Backend URL is accessible
- [ ] Health check returns 200:
  ```bash
  curl https://your-backend-url.onrender.com/health
  ```
  Expected response:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-02-06T...",
    "server": "OBS Backend",
    "port": 3001
  }
  ```
- [ ] API endpoints respond:
  ```bash
  curl https://your-backend-url.onrender.com/api/dashboard
  ```
- [ ] CORS headers present:
  ```bash
  curl -I https://your-backend-url.onrender.com/health
  # Look for: Access-Control-Allow-Origin
  ```
- [ ] MongoDB connection works (check logs)
- [ ] Environment variables loaded (check startup logs)

---

## 🐛 TROUBLESHOOTING

### Build Fails

**Error**: "Cannot find module"
```bash
# Ensure package.json has all dependencies
cd apps/backend
npm install
```

### MongoDB Connection Error

**Error**: "MongoServerError: Authentication failed"
- Verify `MONGODB_URI` is URL-encoded
- Check MongoDB Atlas IP whitelist (should include `0.0.0.0/0`)
- Verify database user permissions

### Port Binding Error

**Error**: "EADDRINUSE"
- Hosting platforms auto-assign PORT
- Remove hardcoded PORT or use `process.env.PORT`

### CORS Errors from Frontend

**Error**: "CORS policy blocked"
- Verify CORS configuration includes Vercel domain
- Check `origin` array in `server.ts`
- Redeploy after CORS update

---

## 📊 POST-DEPLOYMENT

### 1. Get Backend URL

Your deployment URL will be something like:
- Render: `https://obs-backend.onrender.com`
- Railway: `https://obs-backend-production.up.railway.app`
- Fly.io: `https://obs-backend.fly.dev`

### 2. Test Endpoints

```bash
# Health check
curl https://your-backend-url/health

# Dashboard
curl https://your-backend-url/api/dashboard

# Chain state
curl https://your-backend-url/api/chain-state

# Transactions
curl https://your-backend-url/api/transactions
```

### 3. Update Frontend

Use this URL in Vercel:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

---

## 🔐 SECURITY CHECKLIST

- [ ] Environment variables not committed to Git
- [ ] MongoDB credentials secured
- [ ] CORS restricted to known domains
- [ ] HTTPS enforced (automatic on all platforms)
- [ ] No sensitive data in logs
- [ ] Database IP whitelist configured

---

## 📈 MONITORING

### Render
- Dashboard → Logs (real-time)
- Dashboard → Metrics (CPU, memory)

### Railway
- Project → Deployments → View Logs
- Project → Metrics

### Fly.io
```bash
fly logs
fly status
```

---

## 🎉 NEXT STEPS

Once backend is deployed and verified:

1. ✅ Copy your backend URL
2. ✅ Go to Vercel deployment guide
3. ✅ Add `NEXT_PUBLIC_API_URL` to Vercel
4. ✅ Deploy frontend to Vercel
5. ✅ Test full application

---

**Backend deployment complete!** Your backend URL is ready to use in the frontend deployment.
