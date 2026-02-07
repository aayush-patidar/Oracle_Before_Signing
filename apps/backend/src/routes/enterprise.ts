import { FastifyPluginAsync } from 'fastify';
import { Queries, seedDatabase, isDatabaseReady, useMock } from '../db';
import * as Models from '../models';
import mongoose from 'mongoose';
// ✅ Transaction body shape used by /api/transactions
type EnterpriseTxBody = {
  intent_id?: string;
  from_address: string;
  to_address: string;
  data?: string;
  value?: string;
  function_name?: string;
  status?: string;
  severity?: string;
  network?: string;
};

// ✅ Runtime validator (Fix B)
function isEnterpriseTxBody(x: unknown): x is EnterpriseTxBody {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;

  return (
    typeof o.from_address === "string" &&
    typeof o.to_address === "string" &&
    (o.intent_id === undefined || typeof o.intent_id === "string") &&
    (o.data === undefined || typeof o.data === "string") &&
    (o.value === undefined || typeof o.value === "string") &&
    (o.function_name === undefined || typeof o.function_name === "string") &&
    (o.status === undefined || typeof o.status === "string") &&
    (o.severity === undefined || typeof o.severity === "string") &&
    (o.network === undefined || typeof o.network === "string")
  );
}


interface ContractBody {
  address: string;
  name: string;
  type?: string;
  trust_level?: string;
  risk_tag?: string;
  reason?: string;
  source_link?: string;
}

interface PolicyUpdateBody {
  enabled: boolean;
  mode: string;
}

interface TransactionBody {
  intent_id: string;
  from_address: string;
  to_address: string;
  data: string;
  value: string;
  function_name: string;
}

interface SimulationBody {
  report_id: string;
  transaction_id: string;
  decision: string;
  balance_before?: string;
  balance_after?: string;
  allowance_before?: string;
  allowance_after?: string;
  delta_summary?: string;
}

export const enterpriseRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * CONTRACT REGISTRY ENDPOINTS
   */
  fastify.get('/api/contracts', async (request, reply) => {
    try {
      const contracts = await Queries.getContracts();
      return reply.send(contracts);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch contracts' });
    }
  });

  fastify.get<{ Params: { address: string } }>('/api/contracts/:address', async (request, reply) => {
    try {
      const contract = await Queries.getContractByAddress(request.params.address);
      if (!contract) {
        return reply.status(404).send({ error: 'Contract not found' });
      }
      return reply.send(contract);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch contract' });
    }
  });

  fastify.post<{ Body: ContractBody }>('/api/contracts', async (request, reply) => {
    try {
      const { address, name, type, trust_level, risk_tag, reason, source_link } = request.body;

      if (!address || !name) {
        return reply.status(400).send({ error: 'Missing required fields' });
      }

      const result = await Queries.addContract({
        address,
        name,
        type: type || 'UNKNOWN',
        trust_level: trust_level || 'UNVERIFIED',
        risk_tag: risk_tag || 'UNVERIFIED',
        reason,
        source_link,
        added_by: 'admin' // In prod: get from auth
      });

      return reply.status(201).send({
        id: (result as any)._id,
        address,
        name,
        message: 'Contract added to registry'
      });
    } catch (error: any) {
      fastify.log.error(error);
      if (error.message.includes('duplicate key') || error.code === 11000) {
        return reply.status(409).send({ error: 'Contract already exists' });
      }
      return reply.status(500).send({ error: 'Failed to add contract' });
    }
  });

  /**
   * POLICY ENDPOINTS
   */
  fastify.get('/api/policies', async (request, reply) => {
    try {
      const policies = await Queries.getPolicies();
      return reply.send(policies);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch policies' });
    }
  });

  fastify.post<{ Body: any }>('/api/policies', async (request, reply) => {
    try {
      const policy = await Queries.addPolicy(request.body);
      return reply.status(201).send(policy);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create policy' });
    }
  });

  fastify.delete<{ Params: { id: string } }>('/api/policies/:id', async (request, reply) => {
    try {
      await Queries.deletePolicy(request.params.id);
      return reply.send({ message: 'Policy deleted' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete policy' });
    }
  });

  fastify.patch<{ Params: { id: string }; Body: PolicyUpdateBody }>('/api/policies/:id', async (request, reply) => {
    try {
      const policyId = request.params.id; // Now using string ID for MongoDB
      const { enabled, mode } = request.body;

      await Queries.updatePolicy(policyId, enabled, mode || 'ENFORCE');

      return reply.send({ message: 'Policy updated', id: policyId });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update policy' });
    }
  });

  fastify.post<{ Body: { mode: string } }>('/api/policies/global-mode', async (request, reply) => {
    try {
      const { mode } = request.body;
      if (!mode) return reply.status(400).send({ error: 'Mode is required' });

      // Verifying connection
      if (!isDatabaseReady()) {
        return reply.status(503).send({ error: 'Database not ready' });
      }

      // Ensure policies exist to be updated (bypass if mock)
      if (!useMock) {
        const count = await Models.Policy.countDocuments();
        if (count === 0) {
          console.log('No policies found during global update. Re-seeding...');
          await seedDatabase();
        }
      }

      const result = await Queries.updateAllPoliciesMode(mode);
      console.log(`Global Update: ${result.modifiedCount} policies updated to ${mode}`);

      return reply.send({
        message: `All policies updated to ${mode} mode`,
        modifiedCount: result.modifiedCount
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to update policy mode',
        details: error.message
      });
    }
  });

  /**
   * TRANSACTION QUEUE ENDPOINTS
   */
  fastify.get('/api/transactions', async (request, reply) => {
    try {
      const limit = parseInt((request.query as any).limit) || 50;
      const transactions = await Queries.getTransactions(limit);
      return reply.send(transactions);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch transactions' });
    }
  });

  fastify.get<{ Params: { id: string } }>('/api/transactions/:id', async (request, reply) => {
    try {
      const transaction = await Queries.getTransactionById(request.params.id);
      if (!transaction) {
        return reply.status(404).send({ error: 'Transaction not found' });
      }
      return reply.send(transaction);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch transaction' });
    }
  });



  fastify.patch<{ Params: { id: string }; Body: { status: string } }>('/api/transactions/:id', async (request, reply) => {
    try {
      const { status } = request.body;
      if (!['ALLOWED', 'DENIED', 'PENDING'].includes(status)) {
        return reply.status(400).send({ error: 'Invalid status' });
      }

      const updated = await Queries.updateTransaction(request.params.id, { status });

      // Log audit
      if (updated) {
        await Queries.addAuditLog({
          actor: 'admin', // In prod: get from auth
          action: `TRANSACTION_${status}`,
          tx_hash: (updated as any).intent_id,
          decision: status
        });
      }

      return reply.send(updated);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update transaction' });
    }
  });

  fastify.post<{ Body: { intent_id: string; tx_hash: string; block_number?: number } }>('/api/transactions/update-hash', async (request, reply) => {
    try {
      const { intent_id, tx_hash, block_number } = request.body;

      if (!intent_id || !tx_hash) {
        return reply.status(400).send({ error: 'Missing required fields: intent_id and tx_hash' });
      }

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
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update transaction hash' });
    }
  });

  /**
   * SIMULATION ENDPOINTS
   */
  fastify.get('/api/simulations', async (request, reply) => {
    try {
      const limit = parseInt((request.query as any).limit) || 50;
      const simulations = await Queries.getSimulations(limit);
      return reply.send(simulations);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch simulations' });
    }
  });

  fastify.post<{ Body: SimulationBody }>('/api/simulations', async (request, reply) => {
    try {
      const {
        report_id,
        transaction_id,
        decision,
        balance_before,
        balance_after,
        allowance_before,
        allowance_after,
        delta_summary
      } = request.body;

      if (!report_id || !transaction_id || !decision) {
        return reply.status(400).send({ error: 'Missing required fields' });
      }

      await Queries.addSimulation({
        report_id,
        transaction_id,
        decision,
        balance_before,
        balance_after,
        allowance_before,
        allowance_after,
        delta_summary
      });

      // Create alert based on decision
      if (decision === 'DENIED') {
        await Queries.addAlert({
          severity: 'HIGH',
          event_type: 'TRANSACTION_DENIED',
          message: `Transaction ${transaction_id} was denied by policy`,
          transaction_id
        });
      }

      return reply.status(201).send({
        report_id,
        decision,
        message: 'Simulation report created'
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create simulation' });
    }
  });

  /**
   * ALERTS ENDPOINTS
   */
  fastify.get('/api/alerts', async (request, reply) => {
    try {
      const limit = parseInt((request.query as any).limit) || 100;
      const alerts = await Queries.getAlerts(limit);
      return reply.send(alerts);
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to fetch alerts' });
    }
  });

  fastify.patch<{ Params: { id: string }; Body: { acknowledged: boolean } }>('/api/alerts/:id', async (request, reply) => {
    try {
      const { acknowledged } = request.body;
      const updated = await Queries.updateAlert(request.params.id, { acknowledged });
      return reply.send(updated);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update alert' });
    }
  });

  /**
   * AUDIT LOG ENDPOINTS
   */
  fastify.get('/api/audit', async (request, reply) => {
    try {
      const limit = parseInt((request.query as any).limit) || 200;
      const logs = await Queries.getAuditLogs(limit);
      return reply.send(logs);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch audit logs' });
    }
  });

  /**
   * ALLOWANCES ENDPOINTS
   */
  fastify.get('/api/allowances', async (request, reply) => {
    try {
      const allowances = await Queries.getAllowances();
      return reply.send({ allowances });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch allowances' });
    }
  });

  /**
   * DASHBOARD STATS
   */
  fastify.get('/api/dashboard', async (request, reply) => {
    try {
      const stats = await Queries.getDashboardStats();
      return reply.send(stats);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch dashboard stats' });
    }
  });
};
