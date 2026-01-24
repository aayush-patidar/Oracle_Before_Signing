'use client';

import { useEffect, useState } from 'react';
import { Zap, Trash2, Copy, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Allowance {
  id: number;
  token: string;
  token_address: string;
  spender: string;
  spender_address: string;
  amount: string;
  allowance_formatted: string;
  risk_score: number;
  last_updated: string;
}

export default function ApprovalsPage() {
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAllowances, setSelectedAllowances] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchAllowances();
  }, []);

  const fetchAllowances = async () => {
    try {
      const response = await fetch('/api/allowances');
      if (response.ok) {
        const data = await response.json();
        setAllowances(data.allowances || []);
      }
    } catch (error) {
      console.error('Failed to fetch allowances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    const revokeToast = toast.loading('Revoking approval...');
    try {
      const response = await fetch(`/api/allowances?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Approval revoked successfully', { id: revokeToast });
        fetchAllowances();
        setSelectedAllowances(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        throw new Error('Failed to revoke');
      }
    } catch (error) {
      toast.error('Failed to revoke approval', { id: revokeToast });
    }
  };

  const handleBulkRevoke = async () => {
    const ids = Array.from(selectedAllowances);
    const revokeToast = toast.loading(`Revoking ${ids.length} approvals...`);
    try {
      const response = await fetch(`/api/allowances?ids=${ids.join(',')}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Approvals revoked successfully', { id: revokeToast });
        fetchAllowances();
        setSelectedAllowances(new Set());
      } else {
        throw new Error('Failed to revoke');
      }
    } catch (error) {
      toast.error('Failed to revoke approvals', { id: revokeToast });
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-500/20 text-red-400';
    if (score >= 50) return 'bg-orange-500/20 text-orange-400';
    if (score >= 20) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-green-500/20 text-green-400';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 20) return 'MEDIUM';
    return 'LOW';
  };

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedAllowances);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAllowances(newSelected);
  };

  const selectAll = () => {
    if (selectedAllowances.size === allowances.length) {
      setSelectedAllowances(new Set());
    } else {
      setSelectedAllowances(new Set(allowances.map(a => a.id)));
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Approvals & Allowances</h1>
        <p className="text-gray-400">
          Monitor token approvals and manage spender permissions
        </p>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{(allowances || []).length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Critical Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {(allowances || []).filter(a => a.risk_score >= 80).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              {(allowances || []).filter(a => a.risk_score >= 50 && a.risk_score < 80).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Unlimited Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {(allowances || []).filter(a => a.amount.includes('115792')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedAllowances.size > 0 && (
        <Card className="bg-blue-900/30 border-blue-700">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-white">
                {selectedAllowances.size} approval{selectedAllowances.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-3">
                <Button
                  className="bg-red-600 hover:bg-red-700 gap-2"
                  onClick={handleBulkRevoke}
                >
                  <Trash2 className="w-4 h-4" />
                  Revoke Selected
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-700 font-bold"
                  onClick={() => setSelectedAllowances(new Set())}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allowances Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Active Allowances</CardTitle>
          <CardDescription>
            Token spender approvals and their risk levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>
          ) : allowances.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-transparent">
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={(allowances || []).length > 0 && selectedAllowances.size === allowances.length}
                        onChange={selectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead className="text-gray-300">Token</TableHead>
                    <TableHead className="text-gray-300">Spender</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">Risk</TableHead>
                    <TableHead className="text-gray-300">Last Updated</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allowances.map((allowance) => (
                    <TableRow
                      key={allowance.id}
                      className={`border-gray-700 hover:bg-gray-700/50 ${selectedAllowances.has(allowance.id) ? 'bg-gray-700/30' : ''
                        }`}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedAllowances.has(allowance.id)}
                          onChange={() => toggleSelection(allowance.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-white">{allowance.token}</p>
                          <p className="text-xs text-gray-400 font-mono">
                            {allowance.token_address.substring(0, 10)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-white">{allowance.spender}</p>
                          <p className="text-xs text-gray-400 font-mono">
                            {allowance.spender_address.substring(0, 10)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="text-gray-300">
                          {allowance.allowance_formatted}
                        </div>
                        {allowance.amount.includes('115792') && (
                          <Badge className="mt-1 bg-red-500/20 text-red-400">
                            MAX_UINT
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(allowance.risk_score)}>
                          {getRiskLabel(allowance.risk_score)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(allowance.last_updated).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleRevoke(allowance.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No approvals found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Factors Guide */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Risk Assessment Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                High Risk Indicators
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Amount = MAX_UINT256</li>
                <li>• Spender is malicious contract</li>
                <li>• Unverified spender</li>
                <li>• Recent approval to new address</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Safe Approvals
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Verified spender address</li>
                <li>• Limited amount &lt;20% balance</li>
                <li>• Known protocol contract</li>
                <li>• Time-locked revocation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
