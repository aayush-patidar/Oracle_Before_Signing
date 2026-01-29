'use client';

import { useEffect, useState } from 'react';
import { Download, Eye, CheckCircle, XCircle } from 'lucide-react';
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

interface SimulationReport {
  id?: string;
  _id?: string;
  report_id: string;
  transaction_id: string;
  decision: string;
  balance_before?: string;
  balance_after?: string;
  allowance_before?: string;
  allowance_after?: string;
  delta_summary?: string;
  created_at: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<SimulationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<SimulationReport | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await apiCall('/simulations');
      setReports(data as SimulationReport[]);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDecisionColor = (decision: string) => {
    if (decision === 'ALLOWED') {
      return 'bg-green-500/20 text-green-400';
    }
    return 'bg-red-500/20 text-red-400';
  };

  const getDecisionIcon = (decision: string) => {
    if (decision === 'ALLOWED') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const exportReport = (report: SimulationReport) => {
    const reportData = {
      report_id: report.report_id,
      transaction_id: report.transaction_id,
      decision: report.decision,
      timestamp: report.created_at,
      details: {
        balance_before: report.balance_before,
        balance_after: report.balance_after,
        allowance_before: report.allowance_before,
        allowance_after: report.allowance_after,
        delta_summary: report.delta_summary
      }
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simulation-${report.report_id}.json`;
    link.click();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Simulation Reports</h1>
        <p className="text-gray-400">
          View detailed simulation results and outcomes
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Simulations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{reports.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Allowed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {reports.filter(r => r.decision === 'ALLOWED').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {reports.filter(r => r.decision === 'DENIED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Simulation History</CardTitle>
          <CardDescription>
            {reports.length} report{reports.length !== 1 ? 's' : ''}
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
          ) : reports.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-transparent">
                    <TableHead className="text-gray-300">Report ID</TableHead>
                    <TableHead className="text-gray-300">Transaction</TableHead>
                    <TableHead className="text-gray-300">Decision</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow
                      key={report._id || report.id || report.report_id}
                      className="border-gray-700 hover:bg-gray-700/50"
                    >
                      <TableCell className="font-mono text-sm text-gray-300">
                        {report.report_id.substring(0, 12)}...
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-400">
                        {report.transaction_id.substring(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDecisionIcon(report.decision)}
                          <Badge className={getDecisionColor(report.decision)}>
                            {report.decision}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(report.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-400"
                          onClick={() => exportReport(report)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No simulation reports</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      {selectedReport && (
        <Card className="bg-gray-800 border-gray-700 fixed bottom-0 right-0 w-full max-w-2xl h-screen rounded-none border-l">
          <CardHeader className="border-b border-gray-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Report Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReport(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 py-6 overflow-y-auto h-full max-h-[calc(100vh-80px)]">
            {/* Report ID */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Report ID</h3>
              <p className="font-mono text-xs bg-gray-900 p-3 rounded text-gray-400">
                {selectedReport.report_id}
              </p>
            </div>

            {/* Decision */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Decision</h3>
              <div className="flex items-center gap-2">
                {getDecisionIcon(selectedReport.decision)}
                <Badge className={getDecisionColor(selectedReport.decision)}>
                  {selectedReport.decision}
                </Badge>
              </div>
            </div>

            {/* Balance Changes */}
            {selectedReport.balance_before && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Balance Changes</h3>
                <div className="space-y-2 bg-gray-900 p-3 rounded">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Before:</span>
                    <span className="text-gray-300 font-mono">{selectedReport.balance_before}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">After:</span>
                    <span className="text-gray-300 font-mono">{selectedReport.balance_after}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Allowance Changes */}
            {selectedReport.allowance_before && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Allowance Changes</h3>
                <div className="space-y-2 bg-gray-900 p-3 rounded">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Before:</span>
                    <span className="text-gray-300 font-mono">{selectedReport.allowance_before}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">After:</span>
                    <span className="text-gray-300 font-mono">{selectedReport.allowance_after}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Delta Summary */}
            {selectedReport.delta_summary && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Delta Summary</h3>
                <p className="text-gray-300 bg-gray-900 p-3 rounded">{selectedReport.delta_summary}</p>
              </div>
            )}

            {/* Export Button */}
            <div className="pt-4 border-t border-gray-700">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                onClick={() => {
                  exportReport(selectedReport);
                  setSelectedReport(null);
                }}
              >
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
