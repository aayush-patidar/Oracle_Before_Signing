'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { Toaster, toast } from 'sonner';
import {
  RefreshCw,
  Wallet,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Shield,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

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

interface ChainState {
  contracts: {
    mockUSDT: {
      address: string;
      symbol: string;
      decimals: number;
    };
    maliciousSpender: {
      address: string;
    };
  };
  wallets: {
    user: string;
    maliciousSpender: string;
  };
  initialState: {
    userBalance: string;
  };
}

interface ChainData {
  rpcHealthy: boolean;
  userBalance: string;
  allowance: string;
  riskLevel: 'safe' | 'elevated' | 'critical';
}

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

export default function Dashboard() {
  const [chainState, setChainState] = useState<ChainState | null>(null);
  const [chainData, setChainData] = useState<ChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorShown, setErrorShown] = useState(false);
  const [chainStateErrorShown, setChainStateErrorShown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize JSON-RPC provider (memoized to prevent re-renders)
  const provider = useMemo(() => new ethers.JsonRpcProvider('http://127.0.0.1:8545'), []);

  const fetchChainState = useCallback(async () => {
    try {
      const response = await fetch('/api/chain-state');
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setChainState(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch chain state:', error);

      // FALLBACK for deployment: Use default mock data if fetch fails
      const fallback = {
        contracts: {
          mockUSDT: { address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', symbol: 'USDT', decimals: 6 },
          maliciousSpender: { address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' }
        },
        wallets: {
          user: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          maliciousSpender: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
        },
        initialState: { userBalance: '1000000000' }
      };

      setChainState(fallback);
      return fallback;
    }
  }, []);

  const fetchChainData = useCallback(async (state: ChainState) => {
    try {
      const usdtContract = new ethers.Contract(state.contracts.mockUSDT.address, ERC20_ABI, provider);
      const maliciousSpenderContract = new ethers.Contract(state.contracts.maliciousSpender.address, ERC20_ABI, provider);

      // Check RPC health
      const blockNumber = await provider.getBlockNumber();
      const rpcHealthy = blockNumber > 0;

      if (!rpcHealthy) {
        throw new Error('RPC connection failed');
      }

      // Fetch user balance and allowance
      const userBalance = await usdtContract.balanceOf(state.wallets.user);
      const allowance = await usdtContract.allowance(state.wallets.user, state.contracts.maliciousSpender.address);

      // Calculate risk level
      const allowanceNumber = Number(ethers.formatUnits(allowance, state.contracts.mockUSDT.decimals));
      let riskLevel: 'safe' | 'elevated' | 'critical' = 'safe';
      if (allowanceNumber > 0 && allowanceNumber < 100) {
        riskLevel = 'elevated';
      } else if (allowanceNumber >= 100) {
        riskLevel = 'critical';
      }

      setChainData({
        rpcHealthy,
        userBalance: ethers.formatUnits(userBalance, state.contracts.mockUSDT.decimals),
        allowance: ethers.formatUnits(allowance, state.contracts.mockUSDT.decimals),
        riskLevel
      });
    } catch (error: any) {
      // Silently ignore RPC noise
      const msg = error.message?.toLowerCase() || '';
      if (!msg.includes('coalesce') && !msg.includes('32002') && !msg.includes('too many errors')) {
        console.error('Failed to fetch chain data:', error);
      }

      setChainData({
        rpcHealthy: false,
        userBalance: '0',
        allowance: '0',
        riskLevel: 'safe'
      });
      // Only show error toast once to avoid spam
      if (!errorShown) {
        setErrorShown(true);
        toast.error('Failed to fetch blockchain data', {
          description: 'Please ensure Hardhat node is running'
        });
      }
    }
  }, [provider]);

  const refreshData = useCallback(async (showErrors = true) => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing) return;

    setIsRefreshing(true);
    setRefreshing(true);

    if (showErrors) {
      setErrorShown(false); // Allow error toasts again on manual refresh
      setChainStateErrorShown(false); // Allow chain state error toasts again on manual refresh
    }

    try {
      const state = await fetchChainState();
      if (state) {
        await fetchChainData(state);
      }
    } finally {
      setRefreshing(false);
      setIsRefreshing(false);
    }
  }, [fetchChainState, fetchChainData, isRefreshing]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not detected', {
        description: 'Please install MetaMask to connect your wallet'
      });
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);

      // Switch to localhost network (chain ID 31337)
      try {
        await browserProvider.send("wallet_switchEthereumChain", [{ chainId: "0x7A69" }]);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          toast.error('Network not configured', {
            description: 'Please add localhost:8545 network to MetaMask'
          });
          return;
        } else if (switchError.code === 4001 || switchError?.message?.includes('user denied')) {
          toast.error('Network switch cancelled', {
            description: 'You rejected the network switch in MetaMask'
          });
          return;
        }
        throw switchError;
      }

      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();

      setWalletConnected(true);
      setWalletAddress(address);
      toast.success('Wallet connected', {
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`
      });
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);

      // Handle specific MetaMask errors
      if (error?.code === -32002 || error?.message?.includes('already pending')) {
        toast.error('Connection request pending', {
          description: 'Please check MetaMask for the pending connection request'
        });
      } else if (error?.code === 4001 || error?.message?.includes('user denied')) {
        toast.error('Connection cancelled', {
          description: 'You rejected the wallet connection in MetaMask'
        });
      } else {
        toast.error('Failed to connect wallet', {
          description: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  const approveMax = async () => {
    if (!walletConnected || !chainState || !window.ethereum) return;

    setActionLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const usdtContract = new ethers.Contract(chainState.contracts.mockUSDT.address, ERC20_ABI, signer);

      const tx = await usdtContract.approve(chainState.contracts.maliciousSpender.address, ethers.MaxUint256);
      toast.info('Transaction submitted', {
        description: 'Approving maximum allowance...'
      });

      await tx.wait();
      toast.success('Approval successful', {
        description: 'Maximum allowance granted to malicious spender'
      });

      // Wait a moment for the transaction to be fully processed, then refresh
      setTimeout(() => refreshData(false), 2000);
    } catch (error: any) {
      console.error('Approval failed:', error);

      // Handle user rejection specifically
      if (error?.code === 'ACTION_REJECTED' || error?.code === 4001 || error?.message?.includes('user denied')) {
        toast.error('Transaction cancelled', {
          description: 'You rejected the transaction in MetaMask'
        });
      } else {
        toast.error('Approval failed', {
          description: error instanceof Error ? error.message : 'Transaction reverted'
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const revokeApproval = async () => {
    if (!walletConnected || !chainState || !window.ethereum) return;

    setActionLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const usdtContract = new ethers.Contract(chainState.contracts.mockUSDT.address, ERC20_ABI, signer);

      const tx = await usdtContract.approve(chainState.contracts.maliciousSpender.address, 0);
      toast.info('Transaction submitted', {
        description: 'Revoking allowance...'
      });

      await tx.wait();
      toast.success('Revocation successful', {
        description: 'Allowance revoked from malicious spender'
      });

      // Wait a moment for the transaction to be fully processed, then refresh
      setTimeout(() => refreshData(false), 2000);
    } catch (error: any) {
      console.error('Revocation failed:', error);

      // Handle user rejection specifically
      if (error?.code === 'ACTION_REJECTED' || error?.code === 4001 || error?.message?.includes('user denied')) {
        toast.error('Transaction cancelled', {
          description: 'You rejected the transaction in MetaMask'
        });
      } else {
        toast.error('Revocation failed', {
          description: error instanceof Error ? error.message : 'Transaction reverted'
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return <Badge variant="success" className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" />Safe</Badge>;
      case 'elevated':
        return <Badge variant="warning" className="flex items-center gap-1"><ShieldAlert className="w-3 h-3" />Elevated</Badge>;
      case 'critical':
        return <Badge variant="destructive" className="flex items-center gap-1"><Shield className="w-3 h-3" />Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setErrorShown(false); // Reset error state for initial load
      setChainStateErrorShown(false); // Reset chain state error state for initial load
      try {
        const state = await fetchChainState();
        if (state) {
          await fetchChainData(state);
        }
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []); // Empty dependency array to prevent infinite loops

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!chainState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Configuration Error</h3>
              <p className="text-gray-600 mb-4">
                Unable to load chain configuration. Please ensure contracts are deployed.
              </p>
              <Button onClick={() => refreshData(true)} disabled={refreshing}>
                {refreshing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">OBS Dashboard</h1>
            <Badge variant={chainData?.rpcHealthy ? "success" : "destructive"}>
              {chainData?.rpcHealthy ? "Online" : "Offline"}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              variant={walletConnected ? "secondary" : "default"}
              size="sm"
              onClick={walletConnected ? () => setWalletConnected(false) : connectWallet}
            >
              <Wallet className="w-4 h-4 mr-2" />
              {walletConnected ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}` : 'Connect Wallet'}
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>RPC Status</CardDescription>
              <CardTitle className="flex items-center gap-2">
                {chainData?.rpcHealthy ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                {chainData?.rpcHealthy ? 'Healthy' : 'Offline'}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>USDT Balance</CardDescription>
              <CardTitle>{chainData?.userBalance || '0'} USDT</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Allowance</CardDescription>
              <CardTitle>{chainData?.allowance || '0'} USDT</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Risk Level</CardDescription>
              <CardTitle>{chainData ? getRiskBadge(chainData.riskLevel) : <Badge variant="secondary">Unknown</Badge>}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contracts Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Contracts</CardTitle>
              <CardDescription>Deployed smart contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">MockUSDT</TableCell>
                    <TableCell className="font-mono text-sm">
                      {chainState.contracts.mockUSDT.address}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">ERC20</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(chainState.contracts.mockUSDT.address)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://localhost:8545/address/${chainState.contracts.mockUSDT.address}`, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">MaliciousSpender</TableCell>
                    <TableCell className="font-mono text-sm">
                      {chainState.contracts.maliciousSpender.address}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">Malicious</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(chainState.contracts.maliciousSpender.address)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://localhost:8545/address/${chainState.contracts.maliciousSpender.address}`, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Dangerous operations - use with caution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!walletConnected ? (
                <div className="text-center py-4">
                  <Wallet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-4">Connect wallet to perform actions</p>
                  <Button onClick={connectWallet}>Connect Wallet</Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={approveMax}
                      disabled={actionLoading}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {actionLoading ? 'Processing...' : 'Approve MAX'}
                    </Button>
                    <p className="text-xs text-red-600">
                      ⚠️ Grants unlimited spending permission to malicious contract
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={revokeApproval}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Revoke Approval'}
                    </Button>
                    <p className="text-xs text-gray-600">
                      Safely removes all permissions from malicious contract
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Wallets Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Wallets</CardTitle>
            <CardDescription>Key addresses in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">User Wallet</TableCell>
                  <TableCell className="font-mono text-sm">
                    {chainState.wallets.user}
                  </TableCell>
                  <TableCell>{chainData?.userBalance || '0'} USDT</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(chainState.wallets.user)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://localhost:8545/address/${chainState.wallets.user}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Malicious Spender</TableCell>
                  <TableCell className="font-mono text-sm">
                    {chainState.wallets.maliciousSpender}
                  </TableCell>
                  <TableCell>0 USDT</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(chainState.wallets.maliciousSpender)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://localhost:8545/address/${chainState.wallets.maliciousSpender}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}