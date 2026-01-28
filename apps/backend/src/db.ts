import mongoose from 'mongoose';
// Re-attempting connection...
import { v4 as uuidv4 } from 'uuid';
import * as Models from './models';

const getMongoUri = () => process.env.MONGODB_URI || 'mongodb://localhost:27017/obs';

mongoose.set('bufferCommands', false);

// In-Memory Storage for Fallback
const mockStore: any = {
  contracts: [],
  policies: [],
  transactions: [],
  alerts: [],
  auditLogs: [],
  simulations: []
};

export let useMock = false;

export const isDatabaseReady = () => {
  return useMock || mongoose.connection.readyState === 1;
};

export const initializeDatabase = async (retries = 2): Promise<void> => {
  try {
    const state = mongoose.connection.readyState;
    if (state === 0) {
      console.log(`📡 Connecting to MongoDB...`);
      await mongoose.connect(getMongoUri(), {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 10000,
      });
      console.log('✅ MongoDB connected successfully');
    }
    await seedDatabase();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    if (retries > 0) {
      console.log(`🔄 Retrying... (${retries} left)`);
      await new Promise(r => setTimeout(r, 2000));
      return initializeDatabase(retries - 1);
    } else {
      console.warn('⚠️ WARNING: All database connection attempts failed.');
      console.warn('🚀 SWITCHING TO IN-MEMORY STORAGE (Dashboard remains functional, but data resets on restart)');
      useMock = true;
      await seedMockDatabase();
    }
  }
};

const seedMockDatabase = async () => {
  // Only seed essential policies, no static transactions or alerts
  mockStore.policies = [
    { _id: 'p1', name: 'Block Unlimited Approvals', enabled: true, mode: 'ENFORCE', rule_type: 'UNLIMITED_APPROVAL', severity: 'CRITICAL' },
    { _id: 'p2', name: 'Malicious Contract Detection', enabled: true, mode: 'ENFORCE', rule_type: 'MALICIOUS_CONTRACT', severity: 'CRITICAL' }
  ];
  // Contracts, transactions, and alerts start empty - only populated when user performs actions
};

export const seedDatabase = async () => {
  if (useMock) return;
  try {
    const policyCount = await Models.Policy.countDocuments();
    if (policyCount === 0) {
      console.log('Seeding initial policies...');
      await Models.Policy.create([
        { name: 'Block Unlimited Approvals', enabled: true, mode: 'ENFORCE', rule_type: 'UNLIMITED_APPROVAL', severity: 'CRITICAL' },
        { name: 'Malicious Contract Detection', enabled: true, mode: 'ENFORCE', rule_type: 'MALICIOUS_CONTRACT', severity: 'CRITICAL' }
      ]);
    }
  } catch (e) { }
};

// Query helpers
export const Queries = {
  getContracts: async () => useMock ? mockStore.contracts : await Models.Contract.find().sort({ createdAt: -1 }),
  getContractById: async (id: string) => {
    if (useMock) return mockStore.contracts.find((c: any) => c._id === id);
    return await Models.Contract.findById(id);
  },
  getContractByAddress: async (addr: string) => {
    if (useMock) return mockStore.contracts.find((c: any) => c.address.toLowerCase() === addr.toLowerCase());
    return await Models.Contract.findOne({ address: new RegExp(`^${addr}$`, 'i') });
  },
  addContract: async (c: any) => {
    if (useMock) {
      const newC = { _id: uuidv4(), ...c, addedAt: new Date().toISOString() };
      mockStore.contracts.unshift(newC);
      return newC;
    }
    return await Models.Contract.create(c);
  },

  getPolicies: async () => useMock ? mockStore.policies : await Models.Policy.find(),
  addPolicy: async (p: any) => {
    if (useMock) {
      const newP = { _id: uuidv4(), ...p, createdAt: new Date().toISOString() };
      mockStore.policies.push(newP);
      return newP;
    }
    return await Models.Policy.create(p);
  },
  deletePolicy: async (id: string) => {
    if (useMock) {
      mockStore.policies = mockStore.policies.filter((p: any) => p._id !== id);
      return true;
    }
    return await Models.Policy.findByIdAndDelete(id);
  },
  updatePolicy: async (id: string, enabled: boolean, mode: string) => {
    if (useMock) {
      const p = mockStore.policies.find((p: any) => p._id === id);
      if (p) { p.enabled = enabled; p.mode = mode; }
      return p;
    }
    return await Models.Policy.findByIdAndUpdate(id, { enabled, mode }, { new: true });
  },
  updateAllPoliciesMode: async (mode: string) => {
    if (useMock) {
      mockStore.policies.forEach((p: any) => p.mode = mode);
      return { modifiedCount: mockStore.policies.length };
    }
    return await Models.Policy.updateMany({}, { mode });
  },

  getTransactions: async (l = 50) => useMock ? mockStore.transactions.slice(0, l) : await Models.Transaction.find().sort({ createdAt: -1 }).limit(l),
  getTransactionById: async (id: string) => {
    if (useMock) return mockStore.transactions.find((t: any) => t._id === id);
    return await Models.Transaction.findById(id);
  },
  addTransaction: async (t: any) => {
    if (useMock) {
      const newT = { _id: uuidv4(), ...t, createdAt: new Date().toISOString() };
      mockStore.transactions.unshift(newT);
      return newT;
    }
    return await Models.Transaction.create(t);
  },
  updateTransaction: async (id: string, updates: any) => {
    if (useMock) {
      const tx = mockStore.transactions.find((t: any) => t._id === id || t.id === id);
      if (tx) { Object.assign(tx, updates); }
      return tx;
    }
    return await Models.Transaction.findByIdAndUpdate(id, updates, { new: true });
  },

  getAlerts: async (l = 100) => useMock ? mockStore.alerts.slice(0, l) : await Models.Alert.find().sort({ createdAt: -1 }).limit(l),
  addAlert: async (a: any) => {
    if (useMock) {
      const newA = { _id: uuidv4(), ...a, createdAt: new Date().toISOString() };
      mockStore.alerts.unshift(newA);
      return newA;
    }
    return await Models.Alert.create(a);
  },
  updateAlert: async (id: string, updates: any) => {
    if (useMock) {
      const alert = mockStore.alerts.find((a: any) => a._id === id || a.id === id);
      if (alert) { Object.assign(alert, updates); }
      return alert;
    }
    return await Models.Alert.findByIdAndUpdate(id, updates, { new: true });
  },

  getAuditLogs: async (l = 200) => useMock ? mockStore.auditLogs.slice(0, l) : await Models.AuditLog.find().sort({ createdAt: -1 }).limit(l),
  addAuditLog: async (log: any) => {
    if (useMock) {
      const newL = { _id: uuidv4(), ...log, createdAt: new Date().toISOString() };
      mockStore.auditLogs.unshift(newL);
      return newL;
    }
    return await Models.AuditLog.create(log);
  },

  getPayments: async () => useMock ? mockStore.payments : await Models.Payment.find(),
  addPayment: async (payment: any) => {
    if (useMock) {
      const newP = { _id: uuidv4(), ...payment, verifiedAt: new Date().toISOString() };
      if (!mockStore.payments) mockStore.payments = [];
      mockStore.payments.unshift(newP);
      return newP;
    }
    return await Models.Payment.create(payment);
  },

  getAllowances: async () => useMock ? [] : await Models.Allowance.find(),
  getSimulations: async (l = 50) => useMock ? mockStore.simulations.slice(0, l) : await Models.Simulation.find().sort({ createdAt: -1 }).limit(l),
  addSimulation: async (s: any) => {
    if (useMock) {
      const newS = { _id: uuidv4(), ...s, createdAt: new Date().toISOString() };
      mockStore.simulations.unshift(newS);
      return newS;
    }
    return await Models.Simulation.create(s);
  },

  getDashboardStats: async () => {
    if (useMock) {
      return {
        totalTransactions: mockStore.transactions.length,
        pendingTransactions: mockStore.transactions.filter((t: any) => t.status === 'PENDING').length,
        allowedTransactions: mockStore.transactions.filter((t: any) => t.status === 'ALLOWED').length,
        deniedTransactions: mockStore.transactions.filter((t: any) => t.status === 'DENIED').length,
        totalAlerts: mockStore.alerts.length,
        criticalAlerts: mockStore.alerts.filter((a: any) => a.severity === 'CRITICAL').length,
        highAlerts: mockStore.alerts.filter((a: any) => a.severity === 'HIGH').length,
        totalContracts: mockStore.contracts.length,
        trustedContracts: mockStore.contracts.filter((c: any) => c.trust_level === 'TRUSTED').length,
        maliciousContracts: mockStore.contracts.filter((c: any) => c.trust_level === 'MALICIOUS').length,
        recentAlerts: mockStore.alerts.slice(0, 5)
      };
    }

    const [txCount, pendingCount, allowedCount, deniedCount, alertCount, critAlertCount, highAlertCount, contracts, recentAlerts] = await Promise.all([
      Models.Transaction.countDocuments(),
      Models.Transaction.countDocuments({ status: 'PENDING' }),
      Models.Transaction.countDocuments({ status: 'ALLOWED' }),
      Models.Transaction.countDocuments({ status: 'DENIED' }),
      Models.Alert.countDocuments(),
      Models.Alert.countDocuments({ severity: 'CRITICAL' }),
      Models.Alert.countDocuments({ severity: 'HIGH' }),
      Models.Contract.find(),
      Models.Alert.find().sort({ createdAt: -1 }).limit(5)
    ]);

    return {
      totalTransactions: txCount,
      pendingTransactions: pendingCount,
      allowedTransactions: allowedCount,
      deniedTransactions: deniedCount,
      totalAlerts: alertCount,
      criticalAlerts: critAlertCount,
      highAlerts: highAlertCount,
      totalContracts: contracts.length,
      trustedContracts: contracts.filter(c => c.trust_level === 'TRUSTED').length,
      maliciousContracts: contracts.filter(c => c.trust_level === 'MALICIOUS').length,
      recentAlerts: recentAlerts || []
    };
  }
};
