'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

interface Web3ContextType {
    account: string | null;
    balance: string;
    chainId: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    switchNetwork: (networkName: string) => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<string | null>(null);
    const [balance, setBalance] = useState<string>('0');
    const [chainId, setChainId] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Initialize state on mount
    useEffect(() => {
        if (window.ethereum) {
            const p = new ethers.BrowserProvider(window.ethereum);
            setProvider(p);
            checkConnection(p);

            (window.ethereum as any).on('accountsChanged', handleAccountsChanged);
            (window.ethereum as any).on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                (window.ethereum as any).removeListener('accountsChanged', handleAccountsChanged);
                (window.ethereum as any).removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);

    const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length > 0) {
            setAccount(accounts[0]);
            if (provider) await updateBalance(accounts[0], provider);
        } else {
            setAccount(null);
            setBalance('0');
            toast.info('Wallet disconnected');
        }
    };

    const handleChainChanged = (chainId: string) => {
        setChainId(chainId);
        // Refresh provider on chain change
        if (window.ethereum) {
            const newP = new ethers.BrowserProvider(window.ethereum);
            setProvider(newP);
            if (account) updateBalance(account, newP);
        }
    };

    const lastBalanceCheck = React.useRef<number>(0);
    const updateBalance = async (address: string, p: ethers.BrowserProvider) => {
        if (!address) return;

        // Throttle balance updates (max once per 5 seconds)
        const now = Date.now();
        if (now - lastBalanceCheck.current < 5000) return;
        lastBalanceCheck.current = now;

        try {
            const balance = await p.getBalance(address);
            setBalance(ethers.formatEther(balance));
        } catch (error: any) {
            // Silently ignore rate limiting and noise errors
            const msg = error.message?.toLowerCase() || '';
            if (!msg.includes('coalesce') && !msg.includes('32002') && !msg.includes('too many errors')) {
                console.error('Error fetching balance:', error);
            }
        }
    };

    const checkConnection = async (p: ethers.BrowserProvider) => {
        if (!window.ethereum) return;

        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
                setChainId(currentChainId);
                await updateBalance(accounts[0], p);
            }
        } catch (error) {
            console.error('Error checking connection:', error);
        }
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            toast.error('MetaMask not detected', {
                description: 'Please install MetaMask to initiate a connection.'
            });
            return;
        }

        setIsConnecting(true);
        try {
            // Check if MetaMask is literally blocked or pending
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts returned from MetaMask');
            }

            setAccount(accounts[0]);

            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            setChainId(currentChainId);

            if (window.ethereum) {
                const p = new ethers.BrowserProvider(window.ethereum);
                await updateBalance(accounts[0], p);
            }

            toast.success('Wallet connected!');
        } catch (error: any) {
            console.error('Connection error details:', error);

            const errorMsg = error?.message?.toLowerCase() || '';
            const errorCode = error?.code;

            if (errorCode === 4001 || errorMsg.includes('user rejected') || errorMsg.includes('user denied')) {
                toast.error('Connection rejected', {
                    description: 'You cancelled the connection request in MetaMask.'
                });
            } else if (errorCode === -32002 || errorMsg.includes('already pending')) {
                toast.error('Request already pending', {
                    description: 'Please open MetaMask and check for a pending request.'
                });
            } else if (errorMsg.includes('connect') || errorMsg.includes('metamask')) {
                toast.error('MetaMask Error', {
                    description: 'Failed to connect to MetaMask. Please unlock it or try again.'
                });
            } else {
                toast.error('Failed to connect wallet', {
                    description: error?.message || 'Check your browser extension and try again.'
                });
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setBalance('0');
        setChainId(null);
        toast.info('Wallet disconnected');
    };

    const switchNetwork = async (networkName: string) => {
        if (!window.ethereum) return;

        const networks: Record<string, { chainId: string; rpcUrls: string[]; chainName: string; nativeCurrency: any }> = {
            'localhost': {
                chainId: '0x7A69', // 31337
                chainName: 'Localhost 8545',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
            },
            'sepolia': {
                chainId: '0xaa36a7', // 11155111
                chainName: 'Sepolia',
                rpcUrls: ['https://rpc.sepolia.org'],
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 }
            },
            'mainnet': {
                chainId: '0x1', // 1
                chainName: 'Ethereum Mainnet',
                rpcUrls: ['https://mainnet.infura.io/v3/'],
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
            }
        };

        const target = networks[networkName];
        if (!target) {
            toast.error(`Network configuration for ${networkName} not found`);
            return;
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: target.chainId }],
            });
            toast.success(`Switched to ${target.chainName}`);
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [target],
                    });
                    toast.success(`Added and switched to ${target.chainName}`);
                } catch (addError) {
                    console.error('Failed to add network:', addError);
                    toast.error('Failed to add network to MetaMask');
                }
            } else {
                console.error('Failed to switch network:', switchError);
                toast.error('Failed to switch network');
            }
        }
    };

    return (
        <Web3Context.Provider
            value={{
                account,
                balance,
                chainId,
                isConnected: !!account,
                isConnecting,
                connectWallet,
                disconnectWallet,
                switchNetwork
            }}
        >
            {children}
        </Web3Context.Provider>
    );
}

export function useWeb3() {
    const context = useContext(Web3Context);
    if (context === undefined) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
}
