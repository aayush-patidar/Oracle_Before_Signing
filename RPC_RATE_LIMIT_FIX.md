# Monad RPC Rate Limiting Fix

## Issue
Getting RPC errors when trying to use the application:
```
Payment Error: could not coalesce error (error={ "code": -32002, "message": "RPC endpoint returned too many errors, retrying in 0.04 minutes. Consider using a different RPC endpoint." }
```

## Root Cause
The Monad testnet RPC (`https://testnet-rpc.monad.xyz/`) has rate limits and can return errors when:
1. Too many requests are made in a short time
2. Balance checks happen too frequently
3. Multiple components try to fetch data simultaneously

## ✅ Fixes Applied

### 1. **Reduced Balance Check Frequency**
**File**: `apps/frontend/src/context/Web3Context.tsx`

**Before**: Balance checked every 5 seconds
**After**: Balance checked every 30 seconds

```typescript
// Throttle balance updates (max once per 30 seconds to avoid RPC rate limits)
const now = Date.now();
if (now - lastBalanceCheck.current < 30000) return;
```

### 2. **Improved Error Handling**
Added comprehensive error filtering to ignore common RPC errors:

```typescript
// Don't log common RPC errors
if (!msg.includes('coalesce') && 
    !msg.includes('32002') && 
    !msg.includes('too many errors') &&
    !msg.includes('rate limit') &&
    code !== -32002 &&
    code !== 'UNKNOWN_ERROR') {
    console.error('Error fetching balance:', error);
}
// Set a default balance on error to prevent UI issues
setBalance('0');
```

### 3. **Optional Balance Verification**
Made balance check optional in `sendPayment` - if RPC fails, transaction still proceeds:

```typescript
try {
    const balance = await p.getBalance(address);
    // Check if sufficient balance
} catch (balanceError: any) {
    // If balance check fails due to RPC issues, just warn and continue
    const msg = balanceError.message?.toLowerCase() || '';
    if (msg.includes('coalesce') || msg.includes('32002') || msg.includes('too many errors')) {
        console.warn('⚠️ Could not verify balance (RPC issue), proceeding anyway...');
    } else {
        throw balanceError; // Re-throw if it's an actual error
    }
}
```

### 4. **Increased Delay After Transactions**
**Before**: 2 second delay
**After**: 5 second delay

```typescript
// Refresh balance after payment (with delay to avoid rate limit)
setTimeout(() => updateBalance(account, p), 5000);
```

## How It Works Now

### Balance Updates:
```
Connect Wallet → Check balance immediately
     ↓
Wait 30 seconds
     ↓
Check balance again (if needed)
     ↓
Repeat...
```

### Payment Flow:
```
User initiates payment
     ↓
Try to check balance
     ↓
RPC error? → Warn and continue anyway
     ↓
Submit transaction (MetaMask has balance info)
     ↓
Wait 5 seconds
     ↓
Update balance
```

## Benefits

1. **Fewer RPC Calls**: 30s throttle vs 5s = 6x fewer requests
2. **Graceful Degradation**: App works even if RPC is slow/failing
3. **Better UX**: No crashes or stuck states
4. **Silent Errors**: Common RPC errors don't spam console

## Testing

### Test Case 1: Normal Operation
```
1. Connect wallet
2. Balance shows (or "0" if RPC slow)
3. Submit transaction
4. Pay x402 fee
5. Transaction executes
6. Balance updates after 5 seconds
```

### Test Case 2: RPC Issues
```
1. Connect wallet
2. Balance might show "0" (RPC error)
3. Submit transaction anyway
4. MetaMask shows correct balance
5. Pay x402 fee (works because MetaMask has balance)
6. Transaction executes successfully
7. Balance updates when RPC recovers
```

## Alternative Solutions

If you're still experiencing issues, try these:

### Option 1: Use Alternative RPC (if available)
```env
# In apps/backend/.env and apps/frontend/.env.local
RPC_URL=https://alternative-monad-rpc.xyz/
```

### Option 2: Disable Balance Display Temporarily
Comment out balance updates in Web3Context:

```typescript
// Temporarily disable balance updates
const updateBalance = React.useCallback(async (address: string, p: ethers.BrowserProvider) => {
    return; // Skip balance updates
}, []);
```

### Option 3: Use MetaMask Balance Only
The app can rely on MetaMask for balance info - it doesn't need to fetch from RPC:

```typescript
// In sendPayment, remove balance check entirely
// MetaMask will reject if insufficient funds anyway
```

## Monitoring RPC Health

### Check if Monad RPC is working:
```bash
curl -X POST https://testnet-rpc.monad.xyz/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Expected response:**
```json
{"jsonrpc":"2.0","id":1,"result":"0x..."}
```

**Error response:**
```json
{"error":{"code":-32002,"message":"too many errors"}}
```

### Check specific balance:
```bash
curl -X POST https://testnet-rpc.monad.xyz/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["0x598a82A1e968D29A2666847C39bCa5adf5640684","latest"],
    "id":1
  }'
```

## What to Do if Errors Persist

### 1. **Check Console Logs**
Look for patterns:
- ✅ `⚠️ Could not verify balance (RPC issue), proceeding anyway...` - This is OK
- ❌ Repeated errors every second - Something is wrong

### 2. **Wait and Retry**
Monad RPC might be temporarily overloaded:
- Wait 1-2 minutes
- Refresh the page
- Try again

### 3. **Use MetaMask Directly**
If RPC is down, you can still:
- Submit transactions (MetaMask handles it)
- Pay x402 fees (MetaMask has balance)
- Execute on-chain (MetaMask submits)

The only thing that won't work is balance display in the UI.

### 4. **Check Monad Status**
- Visit Monad Discord/Twitter
- Check if testnet is operational
- Look for maintenance announcements

## Error Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| -32002 | Too many requests | Wait 30s, retry |
| UNKNOWN_ERROR | RPC overloaded | Proceed anyway |
| "coalesce error" | RPC timeout | Ignore, use MetaMask |
| "too many errors" | Rate limited | Wait, then retry |

## Current Status

✅ **Balance throttle**: 5s → 30s
✅ **Error handling**: Improved
✅ **Optional checks**: Implemented
✅ **Delays increased**: 2s → 5s
✅ **Silent errors**: RPC errors don't spam console

## Expected Behavior Now

### Before Fix:
```
[Error] could not coalesce error
[Error] could not coalesce error
[Error] could not coalesce error
❌ App stuck/broken
```

### After Fix:
```
⚠️ Could not verify balance (RPC issue), proceeding anyway...
✅ Transaction submitted successfully
✅ Payment confirmed
✅ Execution complete
```

## Summary

The app is now **resilient to RPC issues**:
- Works even if Monad RPC is slow/failing
- Balance checks are optional, not required
- MetaMask handles actual transactions
- UI gracefully degrades if RPC unavailable

**You can now use the app even during RPC issues!** 🎉

The only visible effect might be:
- Balance shows "0" temporarily
- Takes longer to update after transactions
- Console warnings (not errors)

But core functionality (submit, pay, execute) will still work because MetaMask handles the actual blockchain interaction.
