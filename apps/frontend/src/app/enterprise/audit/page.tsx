'use client';

import { useEffect, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiCall } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AuditLog {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  tx_hash?: string;
  decision?: string;
  reason?: string;
  details?: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const data = await apiCall('/audit');
      setLogs(data as AuditLog[]);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('ADDED')) {
      return 'bg-blue-500/20 text-blue-400';
    }
    if (action.includes('DENIED') || action.includes('DELETED') || action.includes('REVOKED')) {
      return 'bg-red-500/20 text-red-400';
    }
    if (action.includes('APPROVED') || action.includes('ALLOWED')) {
      return 'bg-green-500/20 text-green-400';
    }
    return 'bg-gray-500/20 text-gray-400';
  };

  const getDecisionColor = (decision?: string) => {
    if (!decision) return '';
    if (decision === 'ALLOWED' || decision === 'APPROVED') {
      return 'bg-green-500/20 text-green-400';
    }
    if (decision === 'DENIED') {
      return 'bg-red-500/20 text-red-400';
    }
    return 'bg-yellow-500/20 text-yellow-400';
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString()}.json`;
    link.click();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-gray-400">
            Immutable record of all security decisions and actions
          </p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 gap-2"
          onClick={exportLogs}
        >
          <Download className="w-4 h-4" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{logs.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Allowed Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {logs.filter(l => l.decision === 'ALLOWED').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Denied Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {logs.filter(l => l.decision === 'DENIED').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Unique Actors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {new Set(logs.map(l => l.actor)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Action History</CardTitle>
          <CardDescription>
            {logs.length} log entr{logs.length === 1 ? 'y' : 'ies'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>
          ) : logs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-transparent">
                    <TableHead className="text-gray-300">Timestamp</TableHead>
                    <TableHead className="text-gray-300">Actor</TableHead>
                    <TableHead className="text-gray-300">Action</TableHead>
                    <TableHead className="text-gray-300">Decision</TableHead>
                    <TableHead className="text-gray-300">Reason</TableHead>
                    <TableHead className="text-gray-300">TX Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="border-gray-700 hover:bg-gray-700/50"
                    >
                      <TableCell className="text-gray-300 text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-400">
                        {log.actor.substring(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.decision ? (
                          <Badge className={getDecisionColor(log.decision)}>
                            {log.decision}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm max-w-xs truncate">
                        {log.reason || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-400">
                        {log.tx_hash ? `${log.tx_hash.substring(0, 12)}...` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No audit logs</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Audit Trail Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white">Immutable Records</h3>
              <p className="text-sm text-gray-400">
                All actions logged with timestamps and digital signatures
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white">Complete Traceability</h3>
              <p className="text-sm text-gray-400">
                Actor identification, decision rationale, and supporting data
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white">Compliance Ready</h3>
              <p className="text-sm text-gray-400">
                Export for audit, regulatory, and governance requirements
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckCircle({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
