# Solution: Execute OBS Transactions on Monad Blockchain

## Current Issue

**Transactions made through OBS are NOT executed on the Mo blockchain.** They are only:
1. Simulated locally
2. Saved to MongoDB database
3. Visible in the OBS dashboard

**What you need**: When a user approves a transaction in OBS, it should be **actually submitted to Monad** and visible in the Monad Explorer.

## Architecture Overview

### Current Flow
```
User → Chat Intent → Simulation → Judgment → Save to DB ❌ (Not on-chain)
```

### Required Flow
```
User → Chat Intent → Simulation → Judgment → User Approval → Execute on Monad ✅
```

## Solution: Add On-Chain Execution

### Step 1: Add `executeTransaction` Function to Web3Context

Add this function to `apps/frontend/src/context/Web3Context.tsx`:

```typescript
const executeTransaction = async (txRequest: { to: string; data: string; value?: string }) => {
    if (!window.ethereum || !account) {
        throw new Error('Wallet not connected');
    }

    const p = new ethers.BrowserProvider(window.ethereum);
    try {
        console.log('🚀 Executing transaction on Monad:', txRequest);
        const signer = await p.getSigner();
        
        const tx = await signer.sendTransaction({
            to: txRequest.to,
            data: txRequest.data,
            value: txRequest.value || '0',
        });

        console.log('⏳ Transaction submitted:', tx.hash);
        
        toast.promise(tx.wait(), {
            loading: 'Executing transaction on Monad...',
            success: (receipt) => `Transaction confirmed! Block: ${receipt?.blockNumber}`,
            error: (err: any) => `Execution failed: ${err.message || 'Unknown error'}`
        });

        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed:', receipt);

        return {
            hash: tx.hash,
            blockNumber: receipt?.blockNumber,
            status: receipt?.status
        };
    } catch (error: any) {
        console.error('❌ executeTransaction failed:', error);
        throw error;
    }
};
```

Then export it in the context value:

```typescript
return (
    <Web3Context.Provider
        value={{
            account,
            balance,
            chainId,
            isConnected: !!account,
            isConnecting,
            connectWallet,
            disconnectWallet,
            switchNetwork,
            sendPayment,
            executeTransaction, // ADD THIS
        }}
    >
        {children}
    </Web3Context.Provider>
);
```

Update the interface:

```typescript
interface Web3ContextType {
    account: string | null;
    balance: string;
    chainId: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    switchNetwork: (networkName: string) => Promise<void>;
    sendPayment: (to: string, amountWei: string) => Promise<string>;
    executeTransaction: (txRequest: { to: string; data: string; value?: string }) => Promise<any>; // ADD THIS
}
```

### Step 2: Add "Sign Transaction" Button in Chat Results

When judgment is `ALLOW`, add a button to execute the transaction on-chain.

In `ChatWindow.tsx`, after the judgment message, add execution logic:

```typescript
// After showing the judgment message
if (judgment === 'ALLOW' && finalData.tx_request) {
    addMessage('system', 
        '✅ Transaction approved. Ready to execute on Monad blockchain.', 
        'success'
    );
    
    // Store the tx_request for execution
    setPendingExecution(finalData.tx_request);
}
```

Add state for pending execution:

```typescript
const [pendingExecution, setPendingExecution] = useState<any>(null);
```

Add execution handler:

```typescript
const handleExecuteOnChain = async () => {
    if (!pendingExecution) return;
    
    try {
        addMessage('system', 'Submitting transaction to Monad blockchain...', 'status');
        
        const result = await executeTransaction(pendingExecution);
        
        addMessage('system', 
            `🎉 Transaction executed on Monad! Hash: ${result.hash}. View on explorer: http://testnet.monadexplorer.com/tx/${result.hash}`,
            'success'
        );
        
        setPendingExecution(null);
        
        // Update the transaction in database with on-chain hash
        await fetch('/api/transactions/update-hash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent_id: currentRunId,
                tx_hash: result.hash,
                block_number: result.blockNumber
            })
        });
        
    } catch (error: any) {
        addMessage('system', 
            `❌ Execution failed: ${error.message}`,
            'error'
        );
    }
};
```

Add a button in the UI (after approval message):

```tsx
{pendingExecution && (
    <div className="w-full max-w-[95%] sm:max-w-[90%] bg-emerald-500/5 border border-emerald-500/20 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-inner">
        <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            </div>
            <div>
                <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">
                    Ready to Execute
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium leading-relaxed">
                    This transaction has been approved. Click below to execute it on the Monad blockchain.
                </p>
            </div>
        </div>
        <button
            onClick={handleExecuteOnChain}
            className="w-full py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-lg sm:rounded-xl transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
        >
            Execute on Monad (MetaMask)
        </button>
    </div>
)}
```

### Step 3: Add Backend Endpoint to Update Transaction Hash

Create `apps/backend/src/routes/transactions.ts` or add to existing routes:

```typescript
fastify.post('/api/transactions/update-hash', async (request, reply) => {
    try {
        const { intent_id, tx_hash, block_number } = request.body;
        
        const updated = await Queries.updateTransaction(intent_id, {
            tx_hash,
            block_number,
            on_chain: true,
            executed_at: new Date().toISOString()
        });
        
        if (updated) {
            await Queries.addAuditLog({
                actor: 'user',
                action: 'TRANSACTION_EXECUTED_ON_CHAIN',
                tx_hash,
                decision: 'EXECUTED'
            });
        }
        
        return reply.send({ success: true, tx_hash });
    } catch (error) {
        console.error('Failed to update transaction hash:', error);
        return reply.status(500).send({ error: 'Failed to update transaction' });
    }
});
```

### Step 4: Update Transaction Model

Add fields to track on-chain execution in `apps/backend/src/models.ts`:

```typescript
const transactionSchema = new Schema({
    intent_id: { type: String, required: true, unique: true },
    from_address: { type: String, required: true },
    to_address: { type: String, required: true },
    data: String,
    value: String,
    function_name: String,
    status: { type: String, enum: ['PENDING', 'ALLOWED', 'DENIED', 'SIMULATING'], default: 'PENDING' },
    severity: String,
    // NEW FIELDS FOR ON-CHAIN TRACKING
    tx_hash: String,           // Actual on-chain transaction hash
    block_number: Number,      // Block number where it was mined
    on_chain: { type: Boolean, default: false },  // Whether it's been executed on-chain
    executed_at: Date,         // When it was executed on-chain
    // EXISTING FIELDS
    created_at: { type: Date, default: () => new Date() },
    createdAt: { type: Date, default: () => new Date() }
});
```

## Testing the Solution

### 1. **Connect MetaMask to Monad**
- Network: Monad Testnet
- Chain ID: 10143
- RPC: https://testnet-rpc.monad.xyz/

### 2. **Get Test Tokens**
- Get MON from Monad faucet (for gas)
- Mint USDT from deployed MockUSDT contract

### 3. **Submit Transaction via OBS**
```
1. Open http://localhost:3000
2. Type: "Approve 5 USDT to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
3. Pay x402 fee via MetaMask
4. Wait for simulation and judgment
5. Click "Execute on Monad" button
6 Confirm in MetaMask
```

### 4. **Verify on Monad Explorer**
```
http://testnet.monadexplorer.com/tx/YOUR_TX_HASH
```

You should see:
- ✅ Transaction hash
- ✅ Block number
- ✅ From/To addresses
- ✅ Function call data (approve)
- ✅ Status: Success

### 5. **Check OBS Dashboard**
Navigate to `/enterprise/transactions` and verify the transaction shows:
- ✅ Status: ALLOWED
- ✅ On-chain: true
- ✅ TX Hash: (clickable link to explorer)

## Alternative: Automatic Execution

If you want transactions to be **automatically executed** when approved (instead of requiring a button click):

In `runManager.ts`, after saving the transaction to database:
```typescript
// After line 186 (Simulation report saved)
if (status === 'ALLOWED') {
    console.log('✅ Transaction approved - ready for on-chain execution');
    // Emit a special event that the frontend can listen for
    this.emit(runId, {
        stage: 'ready_to_execute',
        message: 'Transaction approved and ready for execution',
        tx_request: simulationResult.txRequest
    });
}
```

Then in the frontend, listen for this event and automatically trigger the execution prompt.

## Important Notes

### Security Considerations
1. **Never auto-execute** without user confirmation
2. Always show transaction details before execution
3. Validate network (ensure user is on Monad)
4. Check user balance before execution

### Gas Considerations
- Approval transactions cost gas on Monad
- Ensure users have enough MON for gas
- Consider adding gas estimation before execution

### Error Handling
Common errors to handle:
- User rejects in MetaMask
- Insufficient gas
- Network mismatch (not on Monad)
- Contract not deployed
- Invalid approval amount

## Summary

After implementing this solution:
1. ✅ Transactions simulated in OBS
2. ✅ Judgment provided
3. ✅ User approves via button click
4. ✅ Transaction **executed on Monad blockchain**
5. ✅ Visible in Monad Explorer
6. ✅ Tracked in OBS dashboard with on-chain hash

This gives you **full integration** between OBS simulation and actual Monad blockchain execution!
