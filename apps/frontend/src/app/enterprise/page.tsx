'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, TrendingUp, CheckCircle, Clock, Activity, Shield, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiCall } from '@/lib/api';
import { useWeb3 } from '@/context/Web3Context';
import { ethers } from 'ethers';
import { toast } from 'sonner';

interface DashboardStats {
  totalTransactions: number;
  pendingTransactions: number;
  allowedTransactions: number;
  deniedTransactions: number;
  criticalAlerts: number;
  highAlerts: number;
  recentAlerts: any[];
}

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { account, isConnected, switchNetwork } = useWeb3();

  // ERC20 ABI for approve function
  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
  ];

  // Test contract addresses - different per network
  // Localhost (Hardhat)
  const LOCALHOST_TOKEN = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const LOCALHOST_SPENDER = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // Monad Testnet (deployed contracts)
  const MONAD_TOKEN = "0xf187ba9BdF5aE32D7F75A537CE7399D0855410C6"; // MockUSDT
  const MONAD_SPENDER = "0x1F95a95810FB99bb2781545b89E2791AD87DfAFb"; // MaliciousSpender

  // Function to get contract addresses based on network
  const getContractAddresses = async () => {
    if (!window.ethereum) return { token: LOCALHOST_TOKEN, spender: LOCALHOST_SPENDER };

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      if (chainId === 10143) {
        // Monad Testnet
        return { token: MONAD_TOKEN, spender: MONAD_SPENDER };
      }
      // Default to localhost
      return { token: LOCALHOST_TOKEN, spender: LOCALHOST_SPENDER };
    } catch {
      return { token: LOCALHOST_TOKEN, spender: LOCALHOST_SPENDER };
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await apiCall<DashboardStats>('/dashboard');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMax = async () => {
    if (!isConnected || !window.ethereum) {
      toast.error('Please connect your wallet first');
      return;
    }

    setActionLoading(true);
    const loadingToast = toast.loading('Initiating transaction...');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      // Get network name for display
      const chainId = Number(network.chainId);
      const networkName = chainId === 31337 ? 'Localhost' :
        chainId === 10143 ? 'Monad Testnet' :
          chainId === 11155111 ? 'Sepolia' :
            chainId === 1 ? 'Mainnet' : 'Unknown Network';

      console.log('Connected to:', networkName, 'Chain ID:', chainId);

      // Get contract addresses for current network
      const addresses = await getContractAddresses();

      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(addresses.token, ERC20_ABI, signer);

      console.log('Requesting approval for:', addresses.spender);

      // Attempt transaction
      const tx = await tokenContract.approve(addresses.spender, ethers.MaxUint256);

      toast.info('Transaction submitted', {
        id: loadingToast,
        description: `Hash: ${tx.hash.slice(0, 10)}...`
      });

      console.log('Transaction hash:', tx.hash);

      // Wait with timeout
      const receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Transaction timeout (30s). Check MetaMask status.')), 30000)
        )
      ]);

      toast.success('Approval successful!', {
        id: loadingToast,
        description: 'Maximum allowance granted to test contract.'
      });

      fetchDashboardStats();
    } catch (error: any) {
      console.error('Approval error details:', error);

      let message = 'Transaction failed';
      let description = error?.message || 'Check your wallet and try again';

      const errorMsg = error?.message?.toLowerCase() || '';

      if (error?.code === 'ACTION_REJECTED' || error?.code === 4001 || errorMsg.includes('user rejected') || errorMsg.includes('user denied')) {
        message = 'Transaction cancelled';
        description = 'You rejected the request in MetaMask';
      } else if (errorMsg.includes('timeout')) {
        message = 'Still pending...';
        description = 'The transaction is taking a while. Check MetaMask to see if it\'s stuck.';
      } else if (errorMsg.includes('coalesce') || errorMsg.includes('32002') || errorMsg.includes('too many errors')) {
        message = 'RPC Node Busy';
        description = 'The blockchain node is receiving too many requests. Please wait a few seconds and try again.';
      } else if (errorMsg.includes('could not find') || errorMsg.includes('network')) {
        message = 'Connection Failed';
        description = 'Failed to connect to MetaMask. Make sure it is unlocked.';
      }

      toast.error(message, {
        id: loadingToast,
        description
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-800 rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Security Overview</h1>
        <p className="text-gray-400">
          Monitor and manage blockchain transaction security, policies, and compliance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.totalTransactions || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">All-time transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {stats?.pendingTransactions || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">Awaiting decision</p>
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
              {stats?.deniedTransactions || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">Blocked by policy</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-300">
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              {(stats?.criticalAlerts || 0) + (stats?.highAlerts || 0)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Critical + High</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Link href="/enterprise/chat">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                NoahAI Chat
              </Button>
            </Link>
            <Link href="/enterprise/transactions">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Review Transactions
              </Button>
            </Link>
            <Link href="/enterprise/approvals">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Manage Approvals
              </Button>
            </Link>
            <Link href="/enterprise/contracts">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Contract Registry
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Actions - Test Transactions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Actions
          </CardTitle>
          <CardDescription>Test blockchain transactions with your connected wallet</CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">Connect your wallet to test transactions</p>
              <p className="text-sm text-gray-500">Use the &quot;Connect Wallet&quot; button in the top right</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-white mb-1">Approve MAX</h4>
                    <p className="text-sm text-gray-400">Grant unlimited spending permission to test contract</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">Dangerous</Badge>
                </div>
                <Button
                  onClick={handleApproveMax}
                  disabled={actionLoading}
                  variant="destructive"
                  className="w-full"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {actionLoading ? 'Processing...' : 'Approve MAX'}
                </Button>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                    Current Network
                  </p>
                  <p className="text-[10px] text-blue-400 font-mono">
                    {account ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
                <p className="text-xs text-red-400 mt-2">
                  ⚠️ This will open MetaMask to approve unlimited token spending
                </p>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  <strong>Connected:</strong> {account?.slice(0, 6)}...{account?.slice(-4)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Recent Security Events</CardTitle>
            <Link href="/enterprise/alerts">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats && stats.recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {stats.recentAlerts.map((alert: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 bg-gray-900 rounded-lg border border-gray-700"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <AlertTriangle
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${alert.severity === 'CRITICAL'
                        ? 'text-red-500'
                        : alert.severity === 'HIGH'
                          ? 'text-orange-500'
                          : 'text-yellow-500'
                        }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        {alert.event_type}
                      </p>
                      <p className="text-sm text-gray-400">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      alert.severity === 'CRITICAL'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No recent security events</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">RPC Connection</span>
              <Badge className="bg-green-500/20 text-green-400">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Policy Engine</span>
              <Badge className="bg-green-500/20 text-green-400">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Database</span>
              <Badge className="bg-green-500/20 text-green-400">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Contract Registry</span>
              <Badge className="bg-blue-500/20 text-blue-400">
                {stats?.totalTransactions} items
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
