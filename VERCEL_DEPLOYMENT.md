# 🚀 Vercel Deployment Guide for OBS

## ✅ Pre-Deployment Checklist

### 1. **Build Status** ✅
- [x] Frontend builds successfully
- [x] Backend builds successfully  
- [x] TypeScript errors fixed
- [x] No linting errors
- [x] Chain state API fixed for serverless
- [x] API routes use env vars

### 2. **Project Structure** ✅
Your project is a **monorepo** with:
- `apps/frontend` - Next.js 14 application (deploys to Vercel)
- `apps/backend` - Fastify server (needs separate deployment)
- `chain` - Hardhat contracts (already deployed to Monad)

### 3. **Current Configuration**

#### Vercel.json ✅
```json
{
  "buildCommand": "npm run build --workspace=apps/frontend",
  "outputDirectory": "apps/frontend/.next",
  "framework": "nextjs"
}
```

#### Environment Variables Required
```
MONGODB_URI=mongodb+srv://...
MONAD_RPC_URL=https://testnet-rpc.monad.xyz/
X402_CHAIN_ID=10143
RPC_URL=https://testnet-rpc.monad.xyz/
X402_PAY_TO=0x598a82A1e968D29A2666847C39bCa5adf5640684
X402_PRICE_WEI=100000000000000
```

---

## 🎯 Deployment Strategy

### **Option 1: Frontend Only on Vercel (Recommended for Quick Deploy)**

Your frontend has **Next.js API routes** in `apps/frontend/src/pages/api/` that will run as **serverless functions** on Vercel. This means:

✅ **What works on Vercel:**
- All frontend pages (`/enterprise/*`)
- API routes (`/api/chat`, `/api/transactions`, etc.)
- Static assets
- Serverless functions

❌ **What needs separate deployment:**
- Backend server (`apps/backend`) - needs MongoDB connection
- This provides enterprise features like database persistence

### **Option 2: Full Stack Deployment**

1. **Frontend on Vercel** (this deployment)
2. **Backend on Railway/Render/Fly.io** (separate deployment)
3. Update frontend to connect to backend API URL

---

## 📋 Step-by-Step Deployment to Vercel

### Step 1: Prepare Your Repository

1. **Ensure .gitignore is correct** ✅
   ```
   node_modules/
   .next/
   dist/
   .env
   .env.*
   ```

2. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

### Step 2: Deploy to Vercel

#### Via Vercel CLI (Recommended):

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? (Select your account)
   - Link to existing project? `N`
   - Project name? `obs-oracle` (or your choice)
   - In which directory is your code located? `./`
   - Want to override settings? `N`

5. **Set Environment Variables:**
   ```bash
   vercel env add MONGODB_URI
   vercel env add X402_PAY_TO
   vercel env add X402_PRICE_WEI
   vercel env add MONAD_RPC_URL
   vercel env add X402_CHAIN_ID
   vercel env add RPC_URL
   ```

6. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

#### Via Vercel Dashboard:

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build --workspace=apps/frontend`
   - **Output Directory:** `apps/frontend/.next`
   - **Install Command:** `npm install`

5. Add Environment Variables in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`

6. Click "Deploy"

---

## 🔧 Post-Deployment Configuration

### 1. **Verify Deployment**

After deployment, test these endpoints:

- `https://your-app.vercel.app/enterprise` - Main dashboard
- `https://your-app.vercel.app/api/chat` - Chat API
- `https://your-app.vercel.app/api/transactions` - Transactions API
- `https://your-app.vercel.app/api/chain-state` - Chain state

### 2. **Update Frontend API Calls (if using separate backend)**

If you deploy the backend separately, update the API base URL:

Create `apps/frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### 3. **Configure Custom Domain (Optional)**

In Vercel Dashboard:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## 🐛 Common Issues & Solutions

### Issue 1: Build Fails with TypeScript Errors
**Solution:** ✅ Already fixed! The `Transaction` interface now includes the `id` property.

### Issue 2: Environment Variables Not Working
**Solution:** 
- Ensure variables are set in Vercel Dashboard
- Redeploy after adding variables
- Use `NEXT_PUBLIC_` prefix for client-side variables

### Issue 3: API Routes Return 404
**Solution:**
- Verify API routes are in `apps/frontend/src/pages/api/`
- Check vercel.json configuration
- Ensure build completed successfully

### Issue 4: MongoDB Connection Fails
**Solution:**
- Verify `MONGODB_URI` is set correctly
- Check MongoDB Atlas network access (allow 0.0.0.0/0 for Vercel)
- Ensure database user has correct permissions

### Issue 5: Monorepo Build Issues
**Solution:** ✅ Already configured!
- `vercel.json` specifies correct workspace
- Build command targets frontend workspace only

---

## 📊 Deployment Checklist

Before deploying, verify:

- [ ] All code committed to Git
- [ ] `.env` file NOT committed (in .gitignore)
- [ ] Build passes locally (`npm run build`)
- [ ] Environment variables documented
- [ ] MongoDB connection string ready
- [ ] Vercel account created
- [ ] Git repository accessible to Vercel

After deploying:

- [ ] Deployment successful
- [ ] Environment variables set in Vercel
- [ ] Frontend loads correctly
- [ ] API routes respond
- [ ] MongoDB connection works
- [ ] Chat functionality works
- [ ] Transaction simulation works

---

## 🎉 Quick Deploy Commands

```bash
# 1. Build locally to verify
npm run build

# 2. Install Vercel CLI
npm install -g vercel

# 3. Login
vercel login

# 4. Deploy to preview
vercel

# 5. Deploy to production
vercel --prod
```

---

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 📝 Notes

1. **Backend Deployment:** The Fastify backend (`apps/backend`) needs separate deployment on a Node.js hosting platform like Railway, Render, or Fly.io.

2. **Database:** MongoDB Atlas is recommended for production. Ensure your connection string is in the environment variables.

3. **Serverless Functions:** Vercel has a 10-second timeout for serverless functions on the free tier. For longer operations, consider upgrading or using the separate backend.

4. **Cold Starts:** First request after inactivity may be slower due to serverless cold starts.

5. **Build Time:** Monorepo builds may take longer. Vercel caches dependencies to speed up subsequent builds.

---

## 🚨 Security Reminders

- ✅ Never commit `.env` file
- ✅ Use environment variables for all secrets
- ✅ Rotate MongoDB credentials if exposed
- ✅ Use Vercel's environment variable encryption
- ✅ Enable HTTPS only (Vercel does this by default)
- ✅ Review Vercel's security best practices

---

**Your project is ready to deploy! 🎉**

Run `vercel` to get started, or push to your Git repository and import in the Vercel dashboard.
