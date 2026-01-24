# OBS Enterprise Security Console

A comprehensive blockchain transaction security and governance platform designed for enterprise teams.

## Overview

OBS (Oracle Before Signing) transforms into an enterprise-grade Web3 SIEM + Policy Engine for wallet and contract security. This console provides multi-team collaboration, risk assessment, policy enforcement, and complete audit trails.

## Architecture

### Three-Layer Stack

1. **Blockchain Layer** (Chain/)
   - Hardhat network with MockUSDT and MaliciousSpender contracts
   - State management via state.json
   - Real-time transaction simulation

2. **Backend API** (apps/backend/)
   - Fastify REST API on port 3001
   - SQLite database for persistence
   - Enterprise endpoints for all console features

3. **Frontend Console** (apps/frontend/)
   - Next.js 14 enterprise UI on port 3000
   - Dark-mode designed for SOC/security teams
   - Real-time data visualization

## Key Features

### 1. **Transaction Queue**
- Centralized inbox for incoming transaction intents
- Status tracking: PENDING → SIMULATING → ALLOWED/DENIED
- Detail drawer with:
  - Raw transaction data
  - Decoded function calls
  - Simulation results
  - Decision history
  - Policy violations

### 2. **Policy Engine**
- Dynamic rule creation and management
- Pre-built policies:
  - Block unlimited approvals (MAX_UINT)
  - Block unverified contracts
  - Balance preservation thresholds
  - Multi-signature requirements
  - Upgradeable contract restrictions
- Two modes: **ENFORCE** (block) or **MONITOR** (log-only)

### 3. **Contract Registry**
- Verified contract whitelist
- Trust levels: TRUSTED / UNVERIFIED / MALICIOUS
- Risk assessment:
  - Upgradeable contract detection
  - Admin privilege tracking
  - Exploit history
  - Approval pattern analysis

### 4. **Approvals & Allowances Manager**
- Token approval inventory
- Risk scoring system
- Batch revocation
- Visual risk indicators

### 5. **Simulation Reports**
- Complete simulation runs with before/after deltas
- Decision tracking
- Exportable reports (JSON/PDF stub)
- Irreversibility flags

### 6. **Alerts & Monitoring**
- Real-time security event feed
- Severity filtering (CRITICAL, HIGH, MEDIUM, LOW)
- Timeline visualization
- Acknowledgment tracking

### 7. **Audit Logs**
- Immutable action history
- Complete traceability:
  - Who (actor address)
  - What (action)
  - When (timestamp)
  - Decision (allowed/denied)
  - Reason (policy violation details)
- Exportable for compliance

### 8. **Role-Based Access**
- **Admin**: Full policy and configuration access
- **Analyst**: View-only, report generation
- **Operator**: Execute transactions, manage approvals
- **Auditor**: Export and compliance features

## Quick Start Demo

### 1. Start All Services

```bash
# Terminal 1: Backend API
cd apps/backend
npm install
npm run dev

# Terminal 2: Frontend Console
cd apps/frontend
npm install
npm run dev

# Terminal 3: (Optional) Hardhat node
cd chain
npx hardhat node
```

### 2. Access the Console

Open browser: **http://localhost:3000/enterprise**

### 3. Demo Flow: Malicious Spender Attack

1. **Navigate to Contracts**
   - See MaliciousSpender already in registry (MALICIOUS tag)
   - Note: upgradeable=true, risk_tag=CRITICAL

2. **Queue a Transaction**
   - Go to Transactions
   - Create new intent: Approve MaliciousSpender for MAX_UINT USDT
   - Status: PENDING

3. **Simulate**
   - Click "Simulate"
   - Results show:
     - Balance before: 1,000,000,000 USDT
     - Balance after: 0 (drained)
     - Allowance before: 0
     - Allowance after: MAX_UINT

4. **Policies Block**
   - Two policies triggered:
     - "Block Unlimited Approvals" (CRITICAL)
     - "Block Malicious Spender" (CRITICAL)
   - Transaction marked DENIED
   - Alert created automatically

5. **Audit Trail**
   - Go to Audit Logs
   - See complete decision history
   - Export for compliance

## API Endpoints

### Core Enterprise Endpoints

```
GET  /api/dashboard          → Summary statistics
GET  /api/contracts          → List contracts
POST /api/contracts          → Register contract
GET  /api/transactions       → Queue status
POST /api/transactions       → Create intent
GET  /api/policies           → Policy list
PATCH /api/policies/:id      → Update policy
GET  /api/simulations        → Reports
POST /api/simulations        → Create report
GET  /api/alerts             → Security events
GET  /api/audit              → Audit logs
GET  /api/allowances         → Token approvals
```

## Database Schema

SQLite tables for persistence:

- **contracts** - Registry with trust levels
- **policies** - Rule definitions
- **transactions** - Intent queue
- **simulations** - Reports with deltas
- **alerts** - Security events
- **audit_logs** - Complete action trail
- **allowances** - Token approval tracking

## UI Components

### Enterprise-Grade Design
- Dark theme optimized for long monitoring sessions
- Consistent spacing and typography
- Status badges with semantic colors
- Loading skeletons for all data tables
- Empty states with helpful guidance
- Keyboard navigation support
- WCAG accessible forms

### Key UI Patterns
- **Left Sidebar** - Main navigation
- **Top Bar** - Network/wallet/mode selectors
- **Data Tables** - Sortable, filterable, paginated
- **Detail Drawers** - Side panel inspection
- **Timeline Views** - Event sequences
- **Summary Cards** - Key metrics
- **Status Chips** - Real-time updates

## Configuration

### Backend Configuration
File: `apps/backend/src/db.ts`

Modify seed data:
```typescript
// Add/remove verified contracts
// Adjust initial policies
// Customize risk scoring
```

### Frontend Configuration
File: `apps/frontend/src/components/EnterpriseLayout.tsx`

Customize:
- Navigation links
- Sidebar width
- Role definitions
- Network options

## Development Workflow

### Adding New Features

1. **Backend**
   ```bash
   # Add new table
   db.exec(`CREATE TABLE IF NOT EXISTS ...`)
   
   # Add API endpoint
   fastify.get('/api/new-endpoint', ...)
   ```

2. **Frontend**
   ```bash
   # Create new page
   touch apps/frontend/src/app/enterprise/new-feature/page.tsx
   
   # Add to sidebar navigation
   # in EnterpriseLayout.tsx
   ```

3. **Database**
   - Run migrations
   - Seed test data
   - Verify persistence

### Testing

```bash
# Test API
curl http://localhost:3001/api/dashboard

# Test UI
npm run dev (in frontend)
# Browser: http://localhost:3000/enterprise
```

## Production Considerations

### Security
- [ ] Implement real authentication (JWT/OAuth)
- [ ] Add rate limiting
- [ ] Enable HTTPS
- [ ] Validate all inputs
- [ ] Sanitize data exports

### Performance
- [ ] Add caching layer (Redis)
- [ ] Index database tables
- [ ] Implement pagination
- [ ] Optimize queries
- [ ] Add compression

### Compliance
- [ ] Implement audit log signing
- [ ] Add data encryption at rest
- [ ] Set up log retention policies
- [ ] Enable two-factor authentication
- [ ] Create SOC 2 audit procedures

### Scalability
- [ ] Move to PostgreSQL
- [ ] Implement message queue (RabbitMQ)
- [ ] Add load balancing
- [ ] Containerize with Docker
- [ ] Set up Kubernetes deployment

## Key Design Decisions

1. **SQLite for Hackathon** → PostgreSQL for production
2. **Mocked blockchain calls** → Real ethers.js integration
3. **Mock authentication** → OAuth2/JWT implementation
4. **JSON exports only** → PDF generation libraries
5. **Single database** → Distributed cache layer

## Enterprise Moat Features

These features distinguish OBS from generic security dashboards:

1. **Policy as Code** - Programmable security rules
2. **Multi-Team Collaboration** - Role-based access control
3. **Immutable Audit Trail** - Compliance-ready logging
4. **Smart Simulation** - Before/after outcome visualization
5. **Malicious Contract Detection** - Built-in threat database
6. **Approval Lifecycle Management** - Centralized revocation
7. **Decision Reasoning** - Transparent policy enforcement
8. **Report Export** - SOC 2 / audit-ready formats

## Support & Contribution

For enterprise deployments:
- Modify seed data in `apps/backend/src/db.ts`
- Extend policies in database schema
- Customize alert thresholds
- Integrate with external systems

## License

Built for enterprise security teams.
