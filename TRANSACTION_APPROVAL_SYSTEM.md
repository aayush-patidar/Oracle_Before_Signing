# Transaction Approval System - Tiered Logic

## Overview
The system now implements a **three-tier approval logic** based on transaction amounts:

## Approval Tiers

### 🔴 **BLOCKED** (Amount ≥ 800 USDT)
- **Status**: Automatically DENIED
- **Override**: NOT allowed
- **Reasoning**: 
  - Transaction amount exceeds maximum security limit
  - Amounts >= 800 USDT are automatically blocked for protection
  - Balance is protected from large unauthorized transactions

### 🟡 **PENDING** (500 ≤ Amount < 800 USDT)
- **Status**: Requires Manual Approval
- **Override**: Allowed (user can approve or deny)
- **Reasoning**:
  - Transaction amount requires review
  - Amounts between 500-800 USDT need manual verification
  - User must explicitly approve or deny the transaction

### 🟢 **AUTO-APPROVED** (Amount < 500 USDT)
- **Status**: Automatically ALLOWED
- **Override**: Not needed
- **Reasoning**:
  - Transaction amount is below 500 USDT threshold
  - Auto-approved for convenience and speed
  - Low-risk transaction tier

## Implementation Details

### Backend Services Modified

#### 1. **judge.ts** - Judgment Logic
- `shouldDeny()`: Blocks transactions >= 800 USDT
- `shouldAllow()`: Auto-approves transactions < 500 USDT
- `shouldPend()`: Marks 500-800 USDT transactions as pending
- `createPendingJudgment()`: New method for pending status

#### 2. **analyze.ts** - Risk Flags
New risk flags added:
- `BLOCKED_AMOUNT`: Amount >= 800 USDT
- `PENDING_AMOUNT`: 500 <= Amount < 800 USDT
- `AUTO_APPROVED`: Amount < 500 USDT

## Transaction Flow

```
Transaction Request
        ↓
Amount Check
        ↓
    ┌───┴───┐
    │       │
≥ 800?   < 800?
    │       │
  BLOCK   ┌─┴─┐
          │   │
      ≥ 500? < 500?
          │   │
      PENDING AUTO-APPROVE
```

## Example Scenarios

### Example 1: 300 USDT Transaction
- **Amount**: 300 USDT
- **Status**: ✅ AUTO-APPROVED
- **Message**: "Transaction amount: 300.00 USDT is below 500 USDT threshold"

### Example 2: 650 USDT Transaction
- **Amount**: 650 USDT
- **Status**: ⏳ PENDING
- **Message**: "Transaction amount: 650.00 USDT requires manual approval"
- **Action Required**: User must review and approve/deny

### Example 3: 900 USDT Transaction
- **Amount**: 900 USDT
- **Status**: ❌ BLOCKED
- **Message**: "Transaction amount: 900.00 USDT exceeds maximum limit"
- **Override**: Not allowed

## Additional Security Rules

The system also maintains these security checks:
- ❌ **Malicious Spenders**: Always blocked
- ❌ **Unlimited Approvals**: Always blocked
- ❌ **Balance Drain**: Always blocked

## Transaction Sum Calculation

To calculate the total sum of transactions, you can:

1. **Frontend**: Sum all transaction amounts in the UI
2. **Backend**: Query database and aggregate transaction amounts
3. **Real-time**: Track running total as transactions are processed

## Testing the System

### Test Case 1: Small Amount
```javascript
// Amount: 200 USDT (200 * 10^6 wei)
Expected: AUTO-APPROVED
```

### Test Case 2: Medium Amount
```javascript
// Amount: 600 USDT (600 * 10^6 wei)
Expected: PENDING (requires manual approval)
```

### Test Case 3: Large Amount
```javascript
// Amount: 1000 USDT (1000 * 10^6 wei)
Expected: BLOCKED (no override)
```

## Configuration

Current thresholds (can be adjusted in `judge.ts`):
- **Auto-Approve Threshold**: < 500 USDT
- **Pending Range**: 500-800 USDT
- **Block Threshold**: >= 800 USDT

## Notes

- All amounts are in USDT (6 decimals)
- Conversion: `amount_in_wei / 10^6 = amount_in_USDT`
- The system prioritizes security while maintaining usability
- Pending transactions allow user discretion for medium-risk amounts
