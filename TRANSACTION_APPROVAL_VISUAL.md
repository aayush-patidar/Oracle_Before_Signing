# 🎯 Transaction Approval System - Visual Guide

```
┌─────────────────────────────────────────────────────────────────┐
│          NOAHAI ORACLE - TRANSACTION APPROVAL SYSTEM            │
│                    Three-Tier Security Model                    │
└─────────────────────────────────────────────────────────────────┘

                    📥 Transaction Request
                            │
                            ▼
                    ┌───────────────┐
                    │ Amount Check  │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  ≥ 800 USDT │  │ 500-800 USDT│  │  < 500 USDT │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                │                │
           ▼                ▼                ▼
    
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ 🔴 BLOCKED  │  │ 🟡 PENDING  │  │ 🟢 APPROVED │
    │             │  │             │  │             │
    │  DENIED     │  │  REVIEW     │  │  ALLOWED    │
    │  No Override│  │  Required   │  │  Automatic  │
    └─────────────┘  └─────────────┘  └─────────────┘


═══════════════════════════════════════════════════════════════════

📊 TRANSACTION TIER BREAKDOWN

┌─────────────────────────────────────────────────────────────────┐
│ 🔴 TIER 1: BLOCKED (High Risk)                                  │
├─────────────────────────────────────────────────────────────────┤
│ Amount Range:    ≥ 800 USDT                                     │
│ Status:          AUTOMATICALLY DENIED                           │
│ Override:        ❌ NOT ALLOWED                                 │
│ Reasoning:       • Exceeds maximum security limit               │
│                  • Protects against large unauthorized txns     │
│                  • Balance protection enforced                  │
│ Example:         800 USDT → BLOCKED ❌                          │
│                  1000 USDT → BLOCKED ❌                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🟡 TIER 2: PENDING (Medium Risk)                                │
├─────────────────────────────────────────────────────────────────┤
│ Amount Range:    500 - 799.99 USDT                              │
│ Status:          REQUIRES MANUAL APPROVAL                       │
│ Override:        ✅ USER CAN APPROVE/DENY                       │
│ Reasoning:       • Medium-risk transaction                      │
│                  • Requires user verification                   │
│                  • Manual review for safety                     │
│ Example:         500 USDT → PENDING ⏳                          │
│                  650 USDT → PENDING ⏳                          │
│                  799 USDT → PENDING ⏳                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🟢 TIER 3: AUTO-APPROVED (Low Risk)                             │
├─────────────────────────────────────────────────────────────────┤
│ Amount Range:    < 500 USDT                                     │
│ Status:          AUTOMATICALLY ALLOWED                          │
│ Override:        ✅ NOT NEEDED                                  │
│ Reasoning:       • Below risk threshold                         │
│                  • Safe for automatic processing                │
│                  • Optimized for user convenience               │
│ Example:         100 USDT → APPROVED ✅                         │
│                  300 USDT → APPROVED ✅                         │
│                  499 USDT → APPROVED ✅                         │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════

📈 TRANSACTION SUM CALCULATION

Your total balance: 1000 USDT

Example Transactions:
┌────────────────┬──────────┬─────────────┬──────────────┐
│ Transaction    │ Amount   │ Status      │ Running Sum  │
├────────────────┼──────────┼─────────────┼──────────────┤
│ TX #1          │ 200 USDT │ ✅ APPROVED │ 200 USDT     │
│ TX #2          │ 300 USDT │ ✅ APPROVED │ 500 USDT     │
│ TX #3          │ 600 USDT │ ⏳ PENDING  │ 1100 USDT    │
│ TX #4          │ 800 USDT │ ❌ BLOCKED  │ 1100 USDT    │
└────────────────┴──────────┴─────────────┴──────────────┘

Total Approved:  500 USDT
Total Pending:   600 USDT (awaiting approval)
Total Blocked:   800 USDT (denied)


═══════════════════════════════════════════════════════════════════

🔐 ADDITIONAL SECURITY RULES

Beyond amount-based tiers, the system also enforces:

❌ ALWAYS BLOCKED:
   • Malicious Spender Addresses
   • Unlimited Approvals (MAX_UINT)
   • Complete Balance Drain Attempts

⚠️  RISK FLAGS:
   • BLOCKED_AMOUNT: Amount ≥ 800 USDT
   • PENDING_AMOUNT: 500 ≤ Amount < 800 USDT
   • AUTO_APPROVED: Amount < 500 USDT
   • MALICIOUS_SPENDER: Known bad actors
   • UNLIMITED_APPROVAL: Infinite allowance
   • BALANCE_DRAINED: Complete fund drain


═══════════════════════════════════════════════════════════════════

🧪 TEST SCENARIOS

Test Case 1: Small Transaction
Input:  200 USDT
Result: ✅ AUTO-APPROVED
Reason: "Transaction amount: 200.00 USDT is below 500 USDT threshold"

Test Case 2: Medium Transaction
Input:  650 USDT
Result: ⏳ PENDING
Reason: "Transaction amount: 650.00 USDT requires manual approval"

Test Case 3: Large Transaction
Input:  900 USDT
Result: ❌ BLOCKED
Reason: "Transaction amount: 900.00 USDT exceeds maximum limit"

Test Case 4: Boundary Test (Lower)
Input:  499.99 USDT
Result: ✅ AUTO-APPROVED

Test Case 5: Boundary Test (Middle)
Input:  500.00 USDT
Result: ⏳ PENDING

Test Case 6: Boundary Test (Upper)
Input:  799.99 USDT
Result: ⏳ PENDING

Test Case 7: Boundary Test (Block)
Input:  800.00 USDT
Result: ❌ BLOCKED


═══════════════════════════════════════════════════════════════════

💡 WHY THIS SYSTEM?

Your Question: "Why it denied transaction of 800 if my total amount is 1000?"

Answer:
✓ Security First: The 800 USDT threshold protects you from large 
  unauthorized transactions, even if your balance is 1000 USDT.

✓ Risk Mitigation: Large single transactions (≥800) are blocked to
  prevent potential fraud or mistakes.

✓ Tiered Approach: The system balances security with usability:
  - Small amounts (<500): Fast, automatic approval
  - Medium amounts (500-800): You decide
  - Large amounts (≥800): Blocked for protection

✓ Configurable: These thresholds can be adjusted based on your
  security requirements.


═══════════════════════════════════════════════════════════════════

📝 IMPLEMENTATION FILES

Modified Backend Services:
1. apps/backend/src/services/judge.ts
   - shouldDeny(): Blocks ≥800 USDT
   - shouldAllow(): Auto-approves <500 USDT
   - shouldPend(): Marks 500-800 USDT as pending
   - createPendingJudgment(): New method for pending status

2. apps/backend/src/services/analyze.ts
   - Added BLOCKED_AMOUNT flag
   - Added PENDING_AMOUNT flag
   - Added AUTO_APPROVED flag

Documentation:
- TRANSACTION_APPROVAL_SYSTEM.md: Full technical documentation
- TRANSACTION_APPROVAL_VISUAL.md: This visual guide


═══════════════════════════════════════════════════════════════════
