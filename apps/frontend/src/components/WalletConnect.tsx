'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, Copy, Check, ChevronDown, Activity, Globe } from 'lucide-react';
import { useWeb3 } from '@/context/Web3Context';
import { toast } from 'sonner';

export default function WalletConnect() {
    const { account, balance, isConnected, isConnecting, disconnectWallet, chainId, connectWallet } = useWeb3();
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleConnect = async () => {
        // Check if MetaMask is installed
        if (typeof window === 'undefined') {
            toast.error('Please wait for page to load');
            return;
        }

        if (!window.ethereum) {
            toast.error('MetaMask not detected', {
                description: 'Please install MetaMask extension and refresh the page',
                duration: 5000,
            });
            // Open MetaMask download page
            window.open('https://metamask.io/download/', '_blank');
            return;
        }

        // MetaMask is installed, proceed with connection
        await connectWallet();
    };


    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const copyAddress = () => {
        if (account) {
            navigator.clipboard.writeText(account);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Address copied to clipboard');
        }
    };

    const getNetworkName = (id: string | null) => {
        if (!id) return 'Unknown';
        if (id === '0x7A69' || id === '31337') return 'Localhost';
        if (id === '0xaa36a7' || id === '11155111') return 'Sepolia';
        if (id === '0x1' || id === '1') return 'Mainnet';
        return 'Unknown Network';
    };

    if (isConnected && account) {
        return (
            <div className="relative font-sans" ref={dropdownRef}>
                <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-white px-3"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-gray-200 font-mono text-sm">
                            {formatAddress(account)}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </Button>

                {isOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-4 py-3 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-400">Connected Wallet</span>
                            <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10 text-xs">
                                Active
                            </Badge>
                        </div>

                        {/* Address */}
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-800 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <Wallet className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white font-mono">{formatAddress(account)}</p>
                                        <p className="text-xs text-gray-500">Ethereum Wallet</p>
                                    </div>
                                </div>
                                <button
                                    onClick={copyAddress}
                                    className="p-1.5 hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-white"
                                    title="Copy Address"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-800">
                                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                        <Activity className="w-3 h-3" /> Balance
                                    </p>
                                    <p className="text-lg font-bold text-white max-w-[100px] truncate" title={balance}>{parseFloat(balance).toFixed(4)}</p>
                                    <p className="text-xs text-gray-500">ETH</p>
                                </div>
                                <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-800">
                                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                        <Globe className="w-3 h-3" /> Network
                                    </p>
                                    <p className="text-sm font-bold text-white mt-1.5">{getNetworkName(chainId)}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        <p className="text-xs text-green-400">Operational</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-800 my-2" />

                            <Button
                                variant="destructive"
                                className="w-full justify-center gap-2"
                                onClick={disconnectWallet}
                            >
                                <LogOut className="w-4 h-4" />
                                Disconnect
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Button
            onClick={handleConnect}
            variant="outline"
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700 text-white border-none transition-all shadow-lg hover:shadow-blue-500/20"
        >
            <Wallet className="w-4 h-4 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
    );
}
