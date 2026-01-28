// Global singleton store for demo mode to ensure state persists across API calls and HMR
// This is critical for Next.js development where modules are reloaded

const globalAny: any = global;

if (!globalAny.demoStore) {
    globalAny.demoStore = {
        transactions: [],
        alerts: [],
        allowances: [],
        mode: 'MONITOR'
    };
}

export const getTransactions = () => globalAny.demoStore.transactions;
export const getAlerts = () => globalAny.demoStore.alerts;
export const getAllowances = () => globalAny.demoStore.allowances;
export const getDemoMode = () => globalAny.demoStore.mode;

export const addTransaction = (tx: any) => {
    const newTx = {
        id: `t-${Math.random().toString(36).substr(2, 5)}`,
        ...tx,
        createdAt: new Date().toISOString()
    };
    globalAny.demoStore.transactions = [newTx, ...globalAny.demoStore.transactions];
    return newTx;
};

export const addAlert = (alert: any) => {
    const newAlert = {
        id: globalAny.demoStore.alerts.length + 1,
        ...alert,
        acknowledged: false,
        createdAt: new Date().toISOString()
    };
    globalAny.demoStore.alerts = [newAlert, ...globalAny.demoStore.alerts];
    return newAlert;
};

export const addAllowance = (allowance: any) => {
    const newAllowance = {
        id: globalAny.demoStore.allowances.length + 1,
        token: allowance.token || 'USDT',
        token_address: allowance.token_address || '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        spender: allowance.spender || 'Trusted Protocol',
        spender_address: allowance.spender_address || '0x',
        amount: allowance.amount || '0',
        allowance_formatted: allowance.formatted || '0',
        risk_score: allowance.risk_score || 0,
        last_updated: new Date().toISOString()
    };
    globalAny.demoStore.allowances = [newAllowance, ...globalAny.demoStore.allowances];
    return newAllowance;
};

export const removeAllowance = (id: number) => {
    globalAny.demoStore.allowances = globalAny.demoStore.allowances.filter((a: any) => a.id !== id);
};

export const removeMultipleAllowances = (ids: number[]) => {
    globalAny.demoStore.allowances = globalAny.demoStore.allowances.filter((a: any) => !ids.includes(a.id));
};

export const setDemoMode = (mode: string) => {
    globalAny.demoStore.mode = mode;
};

export const acknowledgeAlert = (id: number | string) => {
    const alert = globalAny.demoStore.alerts.find((a: any) =>
        a.id.toString() === id.toString() ||
        (a._id && a._id.toString() === id.toString())
    );
    if (alert) {
        alert.acknowledged = true;
    }
    return alert;
};
