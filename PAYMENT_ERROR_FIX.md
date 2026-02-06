# Payment Error Fix - Monad RPC Timeout

## Issue
Payment verification is failing with timeout errors when trying to verify the x402 payment transaction on Monad RPC.

**Error Message:**
```
JsonRpcProvider failed to detect network and cannot start up
request timeout (code=TIMEOUT)
```

## Root Cause
The Monad testnet RPC (`https://testnet-rpc.monad.xyz/`) is experiencing:
1. Slow response times
2. Network connectivity issues
3. High latency for transaction lookups

## ✅ Fix Applied

I've updated `apps/backend/src/services/x402.ts` with:

### 1. **Increased Timeout** (15s → 30s)
- More time for Monad RPC to respond
- 30 attempts with 1-second intervals

### 2. **Per-Request Timeout** (3 seconds)
- Each individual request times out after 3s
- Prevents hanging on a single slow request
- Automatically retries on timeout

### 3. **Static Network Configuration**
```typescript
const provider = new ethers.JsonRpcProvider(config.rpcUrl, undefined, {
    staticNetwork: ethers.Network.from(config.chainId),
    batchMaxCount: 1
});
```
- Skips network detection (which was timing out)
- Uses static Chain ID 10143 for Monad
- Disables batching for more reliable requests

### 4. **Better Logging**
- Shows attempt number (e.g., "Attempt 5/30")
- Displays transaction details when found
- Clear error messages for debugging

## How It Works Now

```
Payment TX submitted
        ↓
Backend tries to verify (Attempt 1/30)
        ↓
Timeout after 3s? → Retry (Attempt 2/30)
        ↓
Found transaction? → Verify details
        ↓
✅ Payment verified!
```

## Testing the Fix

### 1. **Submit a transaction** via chat
```
"Approve 5 USDT to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
```

### 2. **Pay x402 fee** when prompted
- MetaMask will open
- Approve the payment transaction
- Copy the transaction hash

### 3. **Watch backend logs**
You should see:
```
🔍 Verifying payment TX: 0x... on https://testnet-rpc.monad.xyz/
🔄 Attempt 1/30 to fetch transaction...
🔄 Attempt 2/30 to fetch transaction...
✅ Transaction found on attempt 3
📝 Transaction details: { from: '0x...', to: '0x...', value: '...' }
✅ Payment verified successfully!
```

### 4. **Simulation proceeds**
- If payment is verified, simulation starts
- Judgment is provided
- "Execute on Monad" button appears

## Alternative Solutions

If the issue persists, here are alternatives:

### Option 1: Use a Different RPC
Some Monad RPC endpoints might be faster:

```env
# In apps/backend/.env
RPC_URL=https://testnet-rpc.monad.xyz/
# Try alternative if available
```

### Option 2: Skip Payment Verification (Testing Only)
**⚠️ FOR TESTING ONLY - NOT FOR PRODUCTION**

Temporarily bypass payment verification:

```typescript
// In apps/backend/src/routes/chat.ts
// Comment out payment verification:

// if (!paymentTx) {
//     return reply.code(402).send({...});
// }

// const verification = await verifyPaymentTx(paymentTx);
// if (!verification.ok) {
//     return reply.code(402).send({...});
// }

// Just proceed directly:
const runId = runManager.startRun(message, paymentTx);
runManager.processRun(runId);
return { runId };
```

### Option 3: Increase Timeout Further
If Monad RPC is consistently slow:

```typescript
// In apps/backend/src/services/x402.ts
const maxAttempts = 60; // 60 seconds instead of 30
```

## Monitoring

Check backend logs for these patterns:

### ✅ Success Pattern:
```
🔍 Verifying payment TX: 0x...
🔄 Attempt 1/30 to fetch transaction...
✅ Transaction found on attempt 1
📝 Transaction details: {...}
✅ Payment verified successfully!
```

### ⚠️ Slow But Working:
```
🔍 Verifying payment TX: 0x...
🔄 Attempt 1/30 to fetch transaction...
⏱️ Attempt 1 timed out, retrying...
🔄 Attempt 2/30 to fetch transaction...
⏱️ Attempt 2 timed out, retrying...
🔄 Attempt 3/30 to fetch transaction...
✅ Transaction found on attempt 3
✅ Payment verified successfully!
```

### ❌ Failure Pattern:
```
🔍 Verifying payment TX: 0x...
🔄 Attempt 1/30 to fetch transaction...
⏱️ Attempt 1 timed out, retrying...
... (repeats 30 times)
⚠️ x402: TX not found after 30 attempts
```

## What to Check if Still Failing

1. **Network Connection**
   - Can you access https://testnet-rpc.monad.xyz/ in browser?
   - Try: `curl https://testnet-rpc.monad.xyz/`

2. **Transaction Hash**
   - Is the transaction actually on Monad?
   - Check in Monad Explorer: http://testnet.monadexplorer.com/tx/YOUR_TX_HASH

3. **Firewall/Proxy**
   - Is your network blocking RPC requests?
   - Try from a different network

4. **Monad Network Status**
   - Is Monad testnet operational?
   - Check their status page or Discord

## Quick Debug Commands

### Test RPC Connection:
```bash
curl -X POST https://testnet-rpc.monad.xyz/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Check Transaction:
```bash
curl -X POST https://testnet-rpc.monad.xyz/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getTransactionByHash","params":["YOUR_TX_HASH"],"id":1}'
```

## Current Status

✅ **Fix Applied**: Backend has been updated with improved timeout handling
🔄 **Auto-Reload**: Backend automatically reloaded with new code
⏳ **Ready to Test**: Try submitting a transaction now

## Next Steps

1. Submit a test transaction via chat
2. Pay the x402 fee when prompted
3. Watch the backend logs for verification progress
4. If it still times out after 30 seconds, try Option 2 (skip verification for testing)

---

**Note**: The Monad testnet RPC can be slow at times. The fix should handle most cases, but if the network is experiencing issues, you may need to wait or use the testing bypass option.
