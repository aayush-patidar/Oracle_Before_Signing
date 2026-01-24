'use client';

import { useEffect, useState } from 'react';
import { Settings2, Copy, Trash2, Power, Plus, Shield, Info, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiCall } from '@/lib/api';
import { toast } from 'sonner';
import CreatePolicyModal from '@/components/CreatePolicyModal';
import { usePolicy } from '@/context/PolicyContext';

interface Policy {
  _id: string;
  name: string;
  description: string;
  enabled: boolean;
  mode: 'ENFORCE' | 'MONITOR';
  rule_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  updatedAt: string;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);

  // Derived state for current global mode
  const currentMode = policies.length > 0
    ? (policies.every(p => p.mode === 'ENFORCE') ? 'ENFORCE' : 'MONITOR')
    : 'ENFORCE';

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const data = await apiCall<Policy[]>('/policies');
      setPolicies(data);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const togglePolicy = async (policy: Policy) => {
    try {
      await apiCall(`/policies/${policy._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          enabled: !policy.enabled,
          mode: policy.mode
        })
      });
      toast.success(`Policy ${policy.enabled ? 'disabled' : 'enabled'} successfully`);
      await fetchPolicies();
      // We need to re-fetch the context state because toggling one policy might change the global "Strict Enforce" status
      // Ideally we would expose a 'refresh' method on the context or just let the context know.
      // Since context fetches on mount, we can force a reload or we can just rely on the user navigating or 
      // we can expose a refresh function from context.
      // For now, let's keep it simple. The header might lag until refresh if we don't sync.
    } catch (error) {
      console.error('Failed to update policy:', error);
      toast.error('Failed to update policy');
    }
  };

  const deletePolicy = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      await apiCall(`/policies/${id}`, { method: 'DELETE' });
      toast.success('Policy deleted');
      fetchPolicies();
    } catch (error) {
      console.error('Failed to delete policy:', error);
      toast.error('Failed to delete policy');
    }
  };

  const { setPolicyMode } = usePolicy();

  const globalSwitchMode = async () => {
    const nextMode = currentMode === 'ENFORCE' ? 'MONITOR' : 'ENFORCE';
    setIsSwitchingMode(true);
    const switchToast = toast.loading(`Switching to ${nextMode} mode...`);

    try {
      // Use the context setter which handles the API call and state update
      await setPolicyMode(nextMode);
      toast.success(`Security system updated to ${nextMode} mode`, { id: switchToast });
      fetchPolicies();
    } catch (error) {
      console.error('Failed to switch mode:', error);
      toast.error('Failed to switch mode', { id: switchToast });
    } finally {
      setIsSwitchingMode(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">Security Policies</h1>
          <p className="text-gray-400 max-w-2xl">
            Configure transaction guardrails to prevent malicious activity in real-time.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 shadow-lg shadow-blue-900/40 gap-2 border-none"
        >
          <Plus className="w-4 h-4" />
          Create Policy
        </Button>
      </div>

      {/* Global Mode Card */}
      <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-3 text-lg">
            <Settings2 className="w-5 h-5 text-blue-400" />
            Global Guardrail Mode
          </CardTitle>
          <CardDescription>Status of the system-wide security enforcement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <div className={`p-4 rounded-xl border transition-all ${currentMode === 'ENFORCE'
              ? 'bg-green-500/5 border-green-500/30'
              : 'bg-gray-900/50 border-gray-800 opacity-60'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  Enforce Mode
                </h3>
                {currentMode === 'ENFORCE' && (
                  <Badge className="bg-green-500 text-white px-2 py-0 text-[10px]">ACTIVE</Badge>
                )}
              </div>
              <p className="text-xs text-gray-400">Transactions that violate any active policy will be blocked immediately.</p>
              {currentMode === 'MONITOR' && (
                <Button
                  size="sm"
                  onClick={globalSwitchMode}
                  disabled={isSwitchingMode}
                  className="mt-4 w-full bg-gray-700 hover:bg-gray-600 h-8 text-xs gap-2"
                >
                  <Power className="w-3 h-3" />
                  Switch to Enforce
                </Button>
              )}
            </div>

            <div className={`p-4 rounded-xl border transition-all ${currentMode === 'MONITOR'
              ? 'bg-blue-500/5 border-blue-500/30'
              : 'bg-gray-900/50 border-gray-800 opacity-60'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  Monitor Mode
                </h3>
                {currentMode === 'MONITOR' && (
                  <Badge className="bg-blue-500 text-white px-2 py-0 text-[10px]">ACTIVE</Badge>
                )}
              </div>
              <p className="text-xs text-gray-400">Transactions are cross-checked, and alerts are generated without blocking users.</p>
              {currentMode === 'ENFORCE' && (
                <Button
                  size="sm"
                  onClick={globalSwitchMode}
                  disabled={isSwitchingMode}
                  className="mt-4 w-full bg-gray-700 hover:bg-gray-600 h-8 text-xs gap-2"
                >
                  <Power className="w-3 h-3" />
                  Switch to Monitor
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Policies List */}
      <Card className="bg-gray-800 border-gray-700 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-gray-700">
          <CardTitle className="text-white text-xl">Policy Registry</CardTitle>
          <CardDescription>
            {policies.length} security firewall{policies.length !== 1 ? 's' : ''} currently deployed
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-700/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : policies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 bg-gray-900/50 hover:bg-transparent">
                  <TableHead className="w-[300px]">Policy Details</TableHead>
                  <TableHead>Protection Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Control</TableHead>
                  <TableHead className="text-right pr-6">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy._id} className="border-gray-700 hover:bg-gray-700/30 group">
                    <TableCell>
                      <div className="py-2">
                        <p className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight text-sm">
                          {policy.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{policy.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-900/50 border-gray-700 text-gray-400 font-mono text-[10px]">
                        {policy.rule_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getSeverityColor(policy.severity)} text-[10px] font-bold`}>
                        {policy.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePolicy(policy)}
                        className={`h-8 font-bold text-[10px] ${policy.enabled ? 'text-green-400 bg-green-400/5' : 'text-gray-500 bg-gray-500/5'}`}
                      >
                        {policy.enabled ? '✓ ACTIVE' : '✕ OFF'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-400/10">
                          <Settings2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePolicy(policy._id)}
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-900/20">
              <Shield className="w-16 h-16 text-gray-800 mb-4" />
              <p className="text-gray-500 font-medium">No guardrails configured yet.</p>
              <Button
                variant="link"
                onClick={() => setShowCreateModal(true)}
                className="text-blue-500 mt-2"
              >
                Deploy your first policy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preset Patterns Section */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-lg relative group overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all" />
          <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
          <h3 className="font-bold text-white text-lg mb-2">Block Scam Approvals</h3>
          <p className="text-gray-400 text-xs mb-6">Automatically scans for known malicious spender addresses added to the registry.</p>
          <Button variant="outline" size="sm" className="w-full border-gray-700 text-xs hover:bg-red-500 hover:text-white transition-all">Quick Deploy</Button>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-lg relative group overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
          <Clock className="w-10 h-10 text-blue-500 mb-4" />
          <h3 className="font-bold text-white text-lg mb-2">Rate Limiting</h3>
          <p className="text-gray-400 text-xs mb-6">Prevent execution of more than 5 transactions per minute from the same workspace.</p>
          <Button variant="outline" size="sm" className="w-full border-gray-700 text-xs hover:bg-blue-500 hover:text-white transition-all">Quick Deploy</Button>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-lg relative group overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all" />
          <Shield className="w-10 h-10 text-green-500 mb-4" />
          <h3 className="font-bold text-white text-lg mb-2">Whitelisted Spenders</h3>
          <p className="text-gray-400 text-xs mb-6">Restrict token approvals to only trusted decentralized protocols (Uniswap, Aave).</p>
          <Button variant="outline" size="sm" className="w-full border-gray-700 text-xs hover:bg-green-500 hover:text-white transition-all">Quick Deploy</Button>
        </div>
      </div>

      {/* Modal */}
      <CreatePolicyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchPolicies}
      />
    </div>
  );
}
