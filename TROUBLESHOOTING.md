# OBS - Oracle Before Signing

Enterprise-grade blockchain transaction safety system with chat-based intent analysis.

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Windows, macOS, or Linux

### Installation

```bash
npm install
```

### Running the Application

**Start all services** (recommended):
```bash
npm run dev
```

This automatically starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- Application logs in terminal

**Or start individual services**:
```bash
npm run dev:backend   # Backend only on port 3001
npm run dev:frontend  # Frontend only on port 3000
npm run chain         # Hardhat/Anvil chain on port 8545 (optional)
```

## Troubleshooting

### "This site can't be reached" on localhost:3000

**Step 1: Check if servers are running**
```bash
npm run health
```

This shows status of:
- Frontend (http://localhost:3000)
- Backend API (http://localhost:3001/health)
- RPC Chain (http://127.0.0.1:8545)

**Step 2: Free up ports**

If you see port conflicts, kill processes:
```bash
npm run kill:ports
```

This safely terminates processes using ports 3000, 3001, and 8545.

**Step 3: Verify Next.js is running**

In your terminal, you should see:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
✓ Ready in 5.2s
```

If not, backend may be blocking. Try:
```bash
npm run kill:ports
npm run dev:frontend
```

**Step 4: Verify backend is running**

In another terminal, check:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-24T...",
  "server": "OBS Backend",
  "port": 3001
}
```

### Backend port already in use

```bash
# Kill all node processes using development ports
npm run kill:ports

# Or manually for Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or for macOS/Linux:
lsof -i :3001
kill -9 <PID>
```

### Frontend shows "Cannot connect to API"

**Cause**: Backend is not running or not accessible.

**Fix**:
1. Ensure backend is running: `npm run dev:backend`
2. Frontend automatically proxies API calls via `/api/*` routes
3. Check `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3001`

If you need to use direct backend URL instead of proxy:
```bash
# Edit .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Port 3000 or 3001 won't release

**Windows**:
```powershell
# Find process
netstat -ano | findstr :3000

# Kill by PID
taskkill /PID <PID> /F
```

**macOS/Linux**:
```bash
lsof -ti :3000 | xargs kill -9
```

Or use the npm script:
```bash
npm run kill:ports
```

### "Cannot find module" errors

```bash
# Reinstall all dependencies
npm install

# Or clean reinstall
rm -rf node_modules package-lock.json
npm install
```

## Architecture

### Frontend (Next.js 14)
- **Port**: 3000
- **Files**: `apps/frontend/src/`
- **Features**: Enterprise dashboard, real-time chat, transaction analysis
- **API Proxy**: All `/api/*` calls are proxied to backend at 3001

### Backend (Fastify)
- **Port**: 3001
- **Files**: `apps/backend/src/`
- **Features**: Chat API, transaction streaming, enterprise data management
- **Health**: GET `/health` returns server status
- **Root**: GET `/` lists available endpoints

### Chain (Hardhat/Anvil)
- **Port**: 8545 (optional)
- **Files**: `chain/`
- **Purpose**: Local test blockchain for development

## Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NODE_ENV=development
```

### Backend (auto-configured)
```env
PORT=3001              # default
HOST=0.0.0.0           # default
NODE_ENV=development   # auto-set
```

## API Endpoints

All endpoints are available at `http://localhost:3001`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API root - lists all endpoints |
| GET | `/health` | Server health check |
| GET | `/api/contracts` | List verified contracts |
| POST | `/api/contracts` | Add new contract |
| GET | `/api/policies` | List security policies |
| PATCH | `/api/policies/:id` | Update policy |
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/alerts` | List security alerts |
| GET | `/api/audit` | Audit logs |
| GET | `/api/allowances` | Token allowances |
| GET | `/api/dashboard` | Dashboard statistics |

## Development

### Building

```bash
npm run build
```

Creates optimized production builds in:
- `apps/frontend/.next/`
- `apps/backend/dist/`

### Production Start

```bash
npm run start
```

Runs pre-built application (must build first).

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start frontend + backend |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run build` | Build both apps for production |
| `npm run start` | Start production builds |
| `npm run health` | Check service health |
| `npm run kill:ports` | Free development ports |

## Troubleshooting Checklist

- [ ] Node.js version >= 18.0.0 (`node --version`)
- [ ] No other services using ports 3000, 3001, 8545
- [ ] `npm install` completed without errors
- [ ] Frontend shows "Ready in X.Xs" in terminal
- [ ] Backend shows "listening at http://0.0.0.0:3001"
- [ ] `npm run health` shows all services UP
- [ ] Browser can access http://localhost:3000
- [ ] Backend API responds to `/health` endpoint

## Common Issues Summary

| Issue | Solution |
|-------|----------|
| "Cannot reach localhost:3000" | Run `npm run dev` - both servers required |
| "API not responding" | Check backend with `npm run health` |
| "Port already in use" | Run `npm run kill:ports` |
| "Module not found" | Run `npm install` again |
| "Build errors" | Delete `node_modules`, reinstall, rebuild |

## Support

For detailed logs, check:
- **Frontend**: Browser DevTools Console (F12)
- **Backend**: Terminal where `npm run dev:backend` runs
- **Build errors**: Run `npm run build` for full output

## Performance

### Typical Startup Times
- Frontend: 5-7 seconds (first start), 2-3 seconds (hot reload)
- Backend: 2-3 seconds
- Combined `npm run dev`: 8-10 seconds total

### Port Binding
- Frontend binds to `0.0.0.0:3000` (accessible on `localhost:3000`)
- Backend binds to `0.0.0.0:3001` (accessible on `localhost:3001`)
- Ensures compatibility across Windows, macOS, Linux

---

**Last Updated**: January 2026  
**Version**: 1.0.0
