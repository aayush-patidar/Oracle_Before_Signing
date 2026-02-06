import mongoose, { Schema, Document } from 'mongoose';

// Contracts
export interface IContract extends Document {
    address: string;
    name: string;
    symbol?: string;
    trust_level: 'TRUSTED' | 'UNVERIFIED' | 'MALICIOUS';
    risk_score: number;
    is_upgradeable: boolean;
    verified_chain: string;
    added_by?: string;
    reason?: string;
    source_link?: string;
    risk_tag?: string;
    type?: string;
}

const ContractSchema = new Schema({
    address: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    symbol: String,
    trust_level: { type: String, enum: ['TRUSTED', 'UNVERIFIED', 'MALICIOUS'], default: 'UNVERIFIED' },
    risk_score: { type: Number, default: 0 },
    is_upgradeable: { type: Boolean, default: false },
    verified_chain: { type: String, default: 'ethereum' },
    added_by: String,
    reason: String,
    source_link: String,
    risk_tag: String,
    type: String
}, { timestamps: true });

// Policies
export interface IPolicy extends Document {
    name: string;
    description: string;
    enabled: boolean;
    mode: 'ENFORCE' | 'MONITOR';
    rule_type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

const PolicySchema = new Schema({
    name: { type: String, required: true },
    description: String,
    enabled: { type: Boolean, default: true },
    mode: { type: String, enum: ['ENFORCE', 'MONITOR'], default: 'MONITOR' },
    rule_type: String,
    severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'LOW' }
}, { timestamps: true });

// Transactions
export interface ITransaction extends Document {
    intent_id?: string;
    from_address: string;
    to_address: string;
    function_name?: string;
    data?: string;
    value?: string;
    intent?: string;
    status: 'PENDING' | 'ALLOWED' | 'DENIED' | 'SIMULATING';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    network?: string; // Network where transaction was executed
    paymentTxHash?: string;
    // On-chain execution tracking
    tx_hash?: string;
    block_number?: number;
    on_chain?: boolean;
    executed_at?: string;
}

const TransactionSchema = new Schema({
    intent_id: { type: String, unique: true, sparse: true },
    from_address: { type: String, required: true },
    to_address: { type: String, required: true },
    function_name: String,
    data: String,
    value: String,
    intent: String,
    status: { type: String, enum: ['PENDING', 'ALLOWED', 'DENIED', 'SIMULATING'], default: 'PENDING' },
    severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'LOW' },
    network: String, // Network where transaction was executed
    paymentTxHash: String,
    // On-chain execution tracking
    tx_hash: String,
    block_number: Number,
    on_chain: { type: Boolean, default: false },
    executed_at: String
}, { timestamps: true });

// Simulations
export interface ISimulation extends Document {
    report_id: string;
    transaction_id: string;
    decision: 'ALLOWED' | 'DENIED';
    balance_before?: string;
    balance_after?: string;
    allowance_before?: string;
    allowance_after?: string;
    delta_summary?: string;
}

const SimulationSchema = new Schema({
    report_id: { type: String, required: true, unique: true },
    transaction_id: { type: String, required: true },
    decision: { type: String, enum: ['ALLOWED', 'DENIED'], required: true },
    balance_before: String,
    balance_after: String,
    allowance_before: String,
    allowance_after: String,
    delta_summary: String
}, { timestamps: true });

// Alerts
export interface IAlert extends Document {
    event_type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    transaction_id?: string;
    acknowledged: boolean;
}

const AlertSchema = new Schema({
    event_type: { type: String, required: true },
    severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'LOW' },
    message: { type: String, required: true },
    transaction_id: String,
    acknowledged: { type: Boolean, default: false }
}, { timestamps: true });

// Audit Logs
export interface IAuditLog extends Document {
    actor: string;
    action: string;
    decision: string;
    reason?: string;
    tx_hash?: string;
}

const AuditLogSchema = new Schema({
    actor: { type: String, required: true },
    action: { type: String, required: true },
    decision: String,
    reason: String,
    tx_hash: String
}, { timestamps: true });

// Allowances
export interface IAllowance extends Document {
    token_address: string;
    owner: string;
    spender: string;
    amount: string;
    risk_score: number;
}

const AllowanceSchema = new Schema({
    token_address: { type: String, required: true },
    owner: { type: String, required: true },
    spender: { type: String, required: true },
    amount: { type: String, required: true },
    risk_score: { type: Number, default: 0 }
}, { timestamps: true });

// Payments
export interface IPayment extends Document {
    txHash: string;
    payer: string;
    amountWei: string;
    verifiedAt: Date;
    runId?: string;
}

const PaymentSchema = new Schema({
    txHash: { type: String, required: true, unique: true },
    payer: { type: String, required: true },
    amountWei: { type: String, required: true },
    verifiedAt: { type: Date, default: Date.now },
    runId: String
}, { timestamps: true });

export const Contract = mongoose.model<IContract>('Contract', ContractSchema);
export const Policy = mongoose.model<IPolicy>('Policy', PolicySchema);
export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const Simulation = mongoose.model<ISimulation>('Simulation', SimulationSchema);
export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const Allowance = mongoose.model<IAllowance>('Allowance', AllowanceSchema);
export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
