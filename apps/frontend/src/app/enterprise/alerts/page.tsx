'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Filter, Clock } from 'lucide-react';
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
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Security Alerts</h1>
        <p className="text-sm sm:text-base text-gray-400">
          Real-time security events and policy violations
        </p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
            <div className="text-2xl font-bold text-rose-500">
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
            <div className="text-2xl font-bold text-amber-500">
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
            <div className="text-2xl font-bold text-indigo-400">
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
            <div className="text-2xl font-bold text-emerald-400">
              {alerts.filter(a => a.acknowledged).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
          <Button
            key={severity}
            size="sm"
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
          {filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`relative overflow-hidden border border-white/5 bg-[#0b1222]/50 p-6 rounded-[2rem] transition-all hover:bg-[#0b1222]/80 group ${alert.acknowledged ? 'opacity-60' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      <div className={`mt-1 p-2.5 rounded-lg border flex-shrink-0 flex items-center justify-center ${alert.severity === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                        alert.severity === 'HIGH' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                          'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-200 uppercase tracking-wider mb-1 break-words">
                          {alert.event_type}
                        </p>
                        <p className="text-sm text-gray-400 leading-relaxed break-words">{alert.message}</p>
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {new Date(alert.created_at || alert.createdAt || new Date()).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:gap-3 sm:min-w-[120px] pl-12 sm:pl-0">
                      <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex-shrink-0 ${alert.severity === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                        alert.severity === 'HIGH' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                          'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                        {alert.severity}
                      </div>

                      {!alert.acknowledged ? (
                        <button
                          onClick={() => handleAcknowledge(alert.id || (alert as any)._id)}
                          className="py-2 px-4 sm:w-full sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[11px] rounded-xl transition-all shadow-[0_10px_20px_rgba(37,99,235,0.2)] active:scale-95 flex items-center justify-center gap-2"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          Verified
                        </div>
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
