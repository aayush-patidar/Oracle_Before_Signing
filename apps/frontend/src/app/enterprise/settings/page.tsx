'use client';

import { useState, useEffect } from 'react';
import { Save, Shield, Users, Bell, Database, Server, Cpu } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRole, Role } from '@/context/RoleContext';
import { usePolicy } from '@/context/PolicyContext';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SettingsPage() {
  const { role: currentRole, setRole } = useRole();
  const { policyMode: globalMode, setPolicyMode: setGlobalMode } = usePolicy();
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole);
  const [policyMode, setPolicyMode] = useState(globalMode);
  const [alertSeverity, setAlertSeverity] = useState('HIGH');
  const [isUpdatingPolicy, setIsUpdatingPolicy] = useState(false);

  useEffect(() => {
    setPolicyMode(globalMode);
  }, [globalMode]);

  const roles = [
    {
      name: 'Admin',
      value: 'admin' as Role,
      description: 'Full access - manage policies, contracts, and settings',
      permissions: ['Read', 'Write', 'Delete', 'Config']
    },
    {
      name: 'Analyst',
      value: 'analyst' as Role,
      description: 'View-only access - review transactions and reports',
      permissions: ['Read']
    },
    {
      name: 'Operator',
      value: 'operator' as Role,
      description: 'Execute operations - approve/deny transactions, revoke approvals',
      permissions: ['Read', 'Execute']
    },
    {
      name: 'Auditor',
      value: 'auditor' as Role,
      description: 'Compliance access - export reports and audit logs',
      permissions: ['Read', 'Export']
    }
  ];

  const handleSaveRole = () => {
    setRole(selectedRole);
    toast.success(`Role updated to ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`);
  };

  const handleUpdatePolicyMode = async () => {
    setIsUpdatingPolicy(true);
    const updateToast = toast.loading('Updating security policy mode...');
    try {
      await setGlobalMode(policyMode);
      toast.success(`All policies updated to ${policyMode} mode`, { id: updateToast });
    } catch (error) {
      console.error('Failed to update policy mode:', error);
      toast.error('Failed to update policy mode', { id: updateToast });
    } finally {
      setIsUpdatingPolicy(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">
          Configure security console preferences and policies
        </p>
      </div>

      {/* Account Settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Account & Role
          </CardTitle>
          <CardDescription>Manage your workspace access and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-6">
              Current Role
            </label>
            <div className="space-y-4">
              {roles.map((r) => (
                <div
                  key={r.value}
                  onClick={() => setSelectedRole(r.value)}
                  className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${selectedRole === r.value
                    ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-gray-900/50 border-gray-700 hover:bg-gray-800'
                    }`}
                >
                  <div className="pt-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedRole === r.value ? 'border-blue-500' : 'border-gray-500'
                      }`}>
                      {selectedRole === r.value && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-bold ${selectedRole === r.value ? 'text-white' : 'text-gray-300'}`}>
                        {r.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{r.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {r.permissions.map((perm) => (
                        <Badge
                          key={perm}
                          variant="secondary"
                          className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] uppercase tracking-wider font-bold px-2 py-0"
                        >
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <Button
              onClick={handleSaveRole}
              className="bg-blue-600 hover:bg-blue-700 gap-2 px-6"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Policy Settings */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-400" />
              Security Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Policy Enforcement Mode
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800">
                  <input
                    type="radio"
                    name="mode"
                    value="ENFORCE"
                    checked={policyMode === 'ENFORCE'}
                    onChange={(e) => setPolicyMode(e.target.value)}
                    className="accent-blue-500"
                  />
                  <div>
                    <h3 className="font-semibold text-white text-sm">Enforce Mode</h3>
                    <p className="text-xs text-gray-500">
                      Block transactions that violate policies
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800">
                  <input
                    type="radio"
                    name="mode"
                    value="MONITOR"
                    checked={policyMode === 'MONITOR'}
                    onChange={(e) => setPolicyMode(e.target.value)}
                    className="accent-blue-500"
                  />
                  <div>
                    <h3 className="font-semibold text-white text-sm">Monitor Mode</h3>
                    <p className="text-xs text-gray-500">
                      Log violations without blocking
                    </p>
                  </div>
                </label>
              </div>
            </div>
            <Button
              onClick={handleUpdatePolicyMode}
              disabled={isUpdatingPolicy}
              className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Save className="w-4 h-4" />
              {isUpdatingPolicy ? 'Updating...' : 'Update Policy Mode'}
            </Button>
          </CardContent>
        </Card>

        {/* Alert Settings */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              Alert Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Minimum Alert Severity
              </label>
              <Select value={alertSeverity} onValueChange={setAlertSeverity}>
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">Critical Only</SelectItem>
                  <SelectItem value="HIGH">High & Critical</SelectItem>
                  <SelectItem value="MEDIUM">Medium & Above</SelectItem>
                  <SelectItem value="LOW">All Alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                <input type="checkbox" defaultChecked className="rounded accent-blue-500" />
                <div>
                  <h3 className="font-semibold text-white text-sm">Email Notifications</h3>
                  <p className="text-xs text-gray-500">For critical security events</p>
                </div>
              </label>
            </div>

            <Button className="w-full bg-gray-700 hover:bg-gray-600 gap-2">
              <Save className="w-4 h-4" />
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <Cpu className="w-5 h-5 text-purple-400" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span className="text-gray-400 text-sm flex items-center gap-2"><Server className="w-3.5 h-3.5" /> Version</span>
            <span className="text-white text-sm font-mono">1.0.0 (Enterprise)</span>
          </div>
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span className="text-gray-400 text-sm flex items-center gap-2"><Database className="w-3.5 h-3.5" /> Database</span>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">MongoDB Atlas - Connected</Badge>
          </div>
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span className="text-gray-400 text-sm flex items-center gap-2">API Endpoint</span>
            <span className="text-white text-sm font-mono">localhost:3001</span>
          </div>
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span className="text-gray-400 text-sm flex items-center gap-2">RPC Provider</span>
            <span className="text-white text-sm font-mono text-green-400">Localhost 8545 (Active)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
