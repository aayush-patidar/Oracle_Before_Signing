'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  Shield,
  AlertCircle,
  Database,
  LogOut,
  Menu,
  X,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
  Wallet,
  Download,
  Activity
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import WalletConnect from '@/components/WalletConnect';
import { useWeb3 } from '@/context/Web3Context';
import { useRole } from '@/context/RoleContext';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EnterpriseLayoutProps {
  children: ReactNode;
}

export default function EnterpriseLayout({ children }: EnterpriseLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { chainId, switchNetwork } = useWeb3();
  const { role, permissions, setRole } = useRole();
  const [isExporting, setIsExporting] = useState(false);

  // Helper to convert chainId to dropdown value
  const chainIdToName = (id: string | null) => {
    if (!id) return 'localhost';
    const normalized = id.toString().toLowerCase();
    if (normalized === '0x7a69' || normalized === '31337') return 'localhost';
    if (normalized === '0x279f' || normalized === '10143') return 'monad';
    if (normalized === '0xaa36a7' || normalized === '11155111') return 'sepolia';
    if (normalized === '0x1' || normalized === '1') return 'mainnet';
    return 'localhost'; // Fallback to localhost display
  };

  const handleExport = async () => {
    setIsExporting(true);
    const exportToast = toast.loading('Preparing data for export...');

    try {
      // Fetch all relevant data for total export
      const [stats, contracts, alerts] = await Promise.all([
        apiCall<any>('/dashboard'),
        apiCall<any[]>('/contracts'),
        apiCall<any[]>('/alerts')
      ]);

      const exportData = {
        timestamp: new Date().toISOString(),
        role: role,
        network: chainIdToName(chainId),
        summary: stats,
        registry: contracts,
        recentEvents: alerts
      };

      // Create blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `obs-enterprise-export-${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('System data exported successfully', { id: exportToast });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export system data', { id: exportToast });
    } finally {
      setIsExporting(false);
    }
  };

  const navigation = [
    { name: 'Overview', href: '/enterprise', icon: LayoutDashboard },
    { name: 'AI Oracle', href: '/enterprise/chat', icon: MessageSquare },
    { name: 'Transactions', href: '/enterprise/transactions', icon: Activity },
    { name: 'Policies', href: '/enterprise/policies', icon: Shield },
    { name: 'Contracts', href: '/enterprise/contracts', icon: Database },
    { name: 'Approvals', href: '/enterprise/approvals', icon: CheckCircle },
    { name: 'Reports', href: '/enterprise/reports', icon: FileText },
    { name: 'Alerts', href: '/enterprise/alerts', icon: AlertCircle },
    { name: 'Audit Logs', href: '/enterprise/audit', icon: Clock },
    { name: 'Settings', href: '/enterprise/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/enterprise') {
      return pathname === '/enterprise';
    }
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-20'
          } bg-gray-950 border-r border-gray-800 transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-500" />
              <span className="font-bold text-lg">OBS</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-gray-300"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  className={`w-full justify-start gap-3 ${active
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.name}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-800 space-y-2">
          <div
            className={`text-xs font-semibold text-gray-500 uppercase ${!sidebarOpen && 'hidden'
              }`}
          >
            Role
          </div>
          {sidebarOpen && (
            <Select value={role} onValueChange={(val: any) => setRole(val)}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="auditor">Auditor</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">OBS Security Console</h1>
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
              Monitor Mode
            </Badge>
          </div>

          <div className="flex items-center gap-6">
            {/* Custom Network Selector */}
            <div className="flex items-center gap-2 relative">
              <span className="text-sm text-gray-400">Network:</span>
              <div className="relative group">
                <button
                  className="flex items-center justify-between w-44 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white hover:bg-gray-750 transition-all font-medium"
                  onClick={() => {
                    const dropdown = document.getElementById('network-dropdown');
                    dropdown?.classList.toggle('hidden');
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${chainIdToName(chainId) === 'localhost' ? 'bg-blue-400' :
                        chainIdToName(chainId) === 'monad' ? 'bg-purple-400' :
                          chainIdToName(chainId) === 'sepolia' ? 'bg-yellow-400' :
                            'bg-green-400'
                      }`} />
                    <span className="capitalize">{chainIdToName(chainId)}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>

                <div
                  id="network-dropdown"
                  className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-[60] py-1 hidden animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => document.getElementById('network-dropdown')?.classList.add('hidden')}
                >
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
                    onClick={() => {
                      switchNetwork('localhost');
                      document.getElementById('network-dropdown')?.classList.add('hidden');
                    }}
                  >
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    Localhost (Hardhat)
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
                    onClick={() => {
                      switchNetwork('monad');
                      document.getElementById('network-dropdown')?.classList.add('hidden');
                    }}
                  >
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    Monad Testnet
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
                    onClick={() => {
                      switchNetwork('sepolia');
                      document.getElementById('network-dropdown')?.classList.add('hidden');
                    }}
                  >
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                    Sepolia Testnet
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
                    onClick={() => {
                      switchNetwork('mainnet');
                      document.getElementById('network-dropdown')?.classList.add('hidden');
                    }}
                  >
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Ethereum Mainnet
                  </button>
                </div>
              </div>
            </div>

            {/* RPC Status */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">RPC Connected</span>
            </div>

            {/* Wallet */}
            <WalletConnect />


            {/* Export */}
            {permissions.export && (
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 gap-2"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? <Clock className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export
              </Button>
            )}

            {/* Logout */}
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-300">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
