'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiCall } from '@/lib/api';

interface Alert {
  id: number;
  severity: string;
  event_type: string;
  message: string;
  transaction_id?: string;
  created_at?: string;
  createdAt?: string;
  acknowledged: boolean;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await apiCall('/alerts');
      setAlerts(data as Alert[]);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: number | string) => {
    try {
      await apiCall(`/alerts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acknowledged: true }),
      });
      // Optimistic update
      setAlerts(alerts.map(a =>
        (a.id === id || (a as any)._id === id) ? { ...a, acknowledged: true } : a
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'HIGH':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'MEDIUM':
        return <Info className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  const filteredAlerts = filterSeverity === 'ALL'
    ? alerts
    : alerts.filter(a => a.severity === filterSeverity);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Security Alerts</h1>
        <p className="text-gray-400">
          Real-time security events and policy violations
        </p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-5 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{alerts.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {alerts.filter(a => a.severity === 'CRITICAL').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              {alerts.filter(a => a.severity === 'HIGH').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Medium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {alerts.filter(a => a.severity === 'MEDIUM').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Acknowledged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {alerts.filter(a => a.acknowledged).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
          <Button
            key={severity}
            variant={filterSeverity === severity ? 'default' : 'outline'}
            className={filterSeverity === severity ? '' : 'border-gray-700 text-gray-400'}
            onClick={() => setFilterSeverity(severity)}
          >
            {severity}
          </Button>
        ))}
      </div>

      {/* Alerts Timeline */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Alert Timeline</CardTitle>
          <CardDescription>
            {filteredAlerts.length} event{filteredAlerts.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>
          ) : filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="border-l-4 border-gray-600 bg-gray-900 p-4 rounded-lg hover:bg-gray-800/80 transition-colors"
                  style={{
                    borderLeftColor:
                      alert.severity === 'CRITICAL'
                        ? '#ef4444'
                        : alert.severity === 'HIGH'
                          ? '#f97316'
                          : alert.severity === 'MEDIUM'
                            ? '#eab308'
                            : '#3b82f6'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">
                            {alert.event_type}
                          </h3>
                          {!alert.acknowledged && (
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <p className="text-gray-300 mt-1">{alert.message}</p>
                        {alert.transaction_id && (
                          <p className="text-xs text-gray-500 mt-2 font-mono">
                            TX: {alert.transaction_id.substring(0, 16)}...
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(alert.created_at || alert.createdAt || new Date().toISOString()).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleAcknowledge(alert.id || (alert as any)._id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No alerts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
