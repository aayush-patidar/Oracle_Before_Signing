# Monad Testnet Configuration Fix

## Issue
Transactions made on the Monad testnet were not showing up in the OBS dashboard.

## Root Cause
The backend was configured to use **localhost Hardhat network** instead of **Monad testnet**:
- `RPC_URL` was pointing to `http://127.0.0.1:8545` (localhost)
- `X402_PAY_TO` was using localhost test address `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- `X402_CHAIN_ID` was set to `31337` (Hardhat's chain ID) instead of `10143` (Monad testnet)

## Fix Applied
Updated `apps/backend/.env` to use Monad testnet configuration:

```env
MONGODB_URI=mongodb+srv://patidaraayush053:Aayush9098%40@obs.dd4hlns.mongodb.net/obs?retryWrites=true&w=majority&appName=OBS
RPC_URL=https://testnet-rpc.monad.xyz/
X402_PAY_TO=0x598a82A1e968D29A2666847C39bCa5adf5640684
X402_PRICE_WEI=100000000000000
X402_CHAIN_ID=10143
```

## Deployed Contracts on Monad Testnet

Your contracts are already deployed on Monad testnet:

- **MockUSDT**: `0xf187ba9BdF5aE32D7F75A537CE7399D0855410C6`
- **MaliciousSpender**: `0x1F95a95810FB99bb2781545b89E2791AD87DfAFb`
- **Deployer Address**: `0x598a82A1e968D29A2666847C39bCa5adf5640684`

View on [Monad Explorer](http://testnet.monadexplorer.com/)

## How to Use the Application with Monad

### 1. Connect MetaMask to Monad Testnet

Add Monad Testnet to MetaMask with these settings:
- **Network Name**: Monad Testnet
- **RPC URL**: `https://testnet-rpc.monad.xyz/`
- **Chain ID**: `10143`
- **Currency Symbol**: MON
- **Block Explorer**: `http://testnet.monadexplorer.com/`

### 2. Get Testnet MON Tokens
- Visit a Monad testnet faucet to get test MON tokens
- Ensure you have enough MON for gas fees

### 3. Mint Test USDT (Optional)
If you need USDT for testing, you can mint it from the deployed MockUSDT contract:
```
Contract: 0xf187ba9BdF5aE32D7F75A537CE7399D0855410C6
Function: mint(address to, uint256 amount)
```

### 4. Use the Chat Interface
1. Open `http://localhost:3000`
2. Use the chat to request approvals (e.g., "Approve 10 USDT to 0x...")
3. The system will:
   - Parse your intent (FREE)
   - Request x402 payment (you'll pay via MetaMask on Monad)
   - Simulate the transaction on Monad
   - Provide judgment and Reality Delta
4. All transactions will now appear in the Enterprise Dashboard at `/enterprise/transactions`

### 5. View Transactions
- Navigate to: `http://localhost:3000/enterprise/transactions`
- All simulated and executed transactions will appear here
- You can approve, deny, or simulate transactions from the dashboard

## Testing the Fix

To verify transactions are being saved:

1. **Start the app**: Already running (`npm run dev`)
2. **Open browser**: Navigate to `http://localhost:3000`
3. **Submit a test transaction**:
   - Type in chat: "Approve 5 USDT to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
   - Pay via MetaMask (on Monad network)
   - Wait for simulation to complete
4. **Check the dashboard**: Go to `/enterprise/transactions`
   - Your transaction should appear in the list
   - Status will be ALLOWED, DENIED, or PENDING based on judgment

## Database Storage
Transactions are stored in MongoDB Atlas:
- **Database**: `obs`
- **Collections**: `transactions`, `simulations`, `alerts`, `policies`, `auditlogs`
- **Connection**: Successfully connected (visible in backend logs)

## Important Notes

### Current Limitations
1. The `from_address` in saved transactions is currently hardcoded to the deployer wallet in `runManager.ts` (line 164)
2. To make it dynamic, you'd need to pass the actual user's wallet address from the frontend through the chat flow

### x402 Payment Flow
- **NoahAI** (intent parsing) is FREE
- **Cyrene** (simulation + judgment) requires payment
- Payment is verified on-chain before processing
- Payment address: `0x598a82A1e968D29A2666847C39bCa5adf5640684` (your deployer wallet)

### Simulation Behavior
- The app will attempt to connect to Monad RPC
- If connection fails, it falls back to mock simulation
- Mock simulation still calculates deltas and provides judgments

## Next Steps

1. ✅ Backend is now configured for Monad
2. ✅ Application is running
3. ✅ MongoDB is connected
4. 🎯 Test by submitting transactions via chat
5. 🎯 Verify they appear in `/enterprise/transactions`

## Troubleshooting

If transactions still don't appear:
1. Check backend logs for MongoDB save errors
2. Verify MetaMask is connected to Monad (Chain ID 10143)
3. Ensure payment transaction succeeds
4. Check browser console for frontend errors

If MongoDB connection fails:
- The app will fall back to in-memory storage
- Transactions won't persist between restarts
- Check your MongoDB Atlas network access settings
