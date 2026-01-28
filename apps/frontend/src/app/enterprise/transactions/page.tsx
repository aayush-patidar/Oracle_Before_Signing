'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, Eye, Zap, XCircle, CheckCircle, Clock } from 'lucide-react';
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

interface Transaction {
  id?: string;
  intent_id: string;
  from_address: string;
  to_address: string;
  function_name: string;
  status: string;
  created_at: string;
  risk_level?: string;
}

import { useRouter } from 'next/navigation';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTx) return;
    setProcessing(true);

    try {
      // Use _id if available (MongoDB), otherwise id or intent_id
      const txId = (selectedTx as any)._id || selectedTx.id || selectedTx.intent_id;

      const response = await fetch(`/api/transactions/${txId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Update local state and close drawer
        await fetchTransactions();
        setSelectedTx(null);
      } else {
        console.error('Failed to update transaction status');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ALLOWED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'DENIED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'SIMULATING':
        return <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ALLOWED':
        return 'bg-green-500/20 text-green-400';
      case 'DENIED':
        return 'bg-red-500/20 text-red-400';
      case 'SIMULATING':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Transaction Queue</h1>
        <p className="text-gray-400">
          Review, simulate, and approve blockchain transactions
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Button variant="outline" className="border-gray-700">
          All Transactions
        </Button>
        <Button variant="ghost" className="text-gray-400">
          Pending ({transactions.filter(t => t.status === 'PENDING').length})
        </Button>
        <Button variant="ghost" className="text-gray-400">
          Allowed ({transactions.filter(t => t.status === 'ALLOWED').length})
        </Button>
        <Button variant="ghost" className="text-gray-400">
          Denied ({transactions.filter(t => t.status === 'DENIED').length})
        </Button>
      </div>

      {/* Transactions Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Active Transactions</CardTitle>
          <CardDescription>
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} in queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-transparent">
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">From Address</TableHead>
                    <TableHead className="text-gray-300">Function</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow
                      key={tx.id || (tx as any).intent_id}
                      className="border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tx.status)}
                          <Badge className={getStatusBadgeVariant(tx.status)}>
                            {tx.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-300">
                        {tx.from_address.substring(0, 10)}...
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {tx.function_name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(tx.created_at || (tx as any).createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No transactions in queue</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Drawer */}
      {selectedTx && (
        <Card className="bg-gray-800 border-gray-700 fixed bottom-0 right-0 w-96 h-screen rounded-none border-l shadow-2xl z-50">
          <CardHeader className="border-b border-gray-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Transaction Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTx(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 py-6 overflow-y-auto h-full max-h-[calc(100vh-80px)]">
            {/* Status */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Status</h3>
              <Badge className={getStatusBadgeVariant(selectedTx.status)}>
                {selectedTx.status}
              </Badge>
            </div>

            {/* Intent ID */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Intent ID</h3>
              <p className="font-mono text-xs bg-gray-900 p-2 rounded text-gray-400 break-all">
                {selectedTx.id || (selectedTx as any).intent_id}
              </p>
            </div>

            {/* From Address */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">From</h3>
              <p className="font-mono text-xs bg-gray-900 p-2 rounded text-gray-400 break-all">
                {selectedTx.from_address}
              </p>
            </div>

            {/* To Address */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">To</h3>
              <p className="font-mono text-xs bg-gray-900 p-2 rounded text-gray-400 break-all">
                {selectedTx.to_address}
              </p>
            </div>

            {/* Function */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Function</h3>
              <p className="text-gray-300">{selectedTx.function_name || 'N/A'}</p>
            </div>

            {/* Created */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Created</h3>
              <p className="text-gray-400 text-sm">
                {new Date(selectedTx.created_at || (selectedTx as any).createdAt || new Date()).toLocaleString()}
              </p>
            </div>

            {/* Actions */}
            {selectedTx.status === 'PENDING' && (
              <div className="space-y-2 pt-4 border-t border-gray-700">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleUpdateStatus('ALLOWED')}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Approve'}
                </Button>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700"
                  variant="secondary"
                  onClick={() => handleUpdateStatus('DENIED')}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Deny'}
                </Button>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  variant="secondary"
                  onClick={() => router.push('/enterprise/chat')}
                >
                  Simulate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
