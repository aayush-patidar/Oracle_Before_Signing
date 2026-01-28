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
    sendPayment: (to: string, amountWei: string) => Promise<string>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<string | null>(null);
    const [balance, setBalance] = useState<string>('0');
    const [chainId, setChainId] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const lastBalanceCheck = React.useRef<number>(0);
    const updateBalance = React.useCallback(async (address: string, p: ethers.BrowserProvider) => {
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
    }, []);

    const handleAccountsChanged = React.useCallback(async (accounts: string[]) => {
        if (accounts.length > 0) {
            setAccount(accounts[0]);
            if (window.ethereum) {
                try {
                    const tempP = new ethers.BrowserProvider(window.ethereum);
                    await updateBalance(accounts[0], tempP);
                } catch (error) {
                    console.error('Error updating balance after account change:', error);
                }
            }
        } else {
            setAccount(null);
            setBalance('0');
            toast.info('Wallet disconnected');
        }
    }, [updateBalance]);

    const handleChainChanged = React.useCallback((chainId: string) => {
        setChainId(chainId);
        // Refresh provider on chain change
        if (window.ethereum) {
            try {
                const newP = new ethers.BrowserProvider(window.ethereum);
                setProvider(newP);
                // We need to get the account again to update balance
                // But usually account doesn't change on chain change, just balance might
                // So we use the 'account' state? No, 'account' state is stale here if not in deps.
                // Better to re-fetch accounts to be safe
                newP.listAccounts().then(accounts => {
                    if (accounts.length > 0) {
                        updateBalance(accounts[0].address, newP);
                    }
                }).catch(err => {
                    console.warn('Failed to list accounts after chain change:', err);
                });
            } catch (err) {
                console.error('Failed to recreate provider on chain change:', err);
            }
        }
    }, [updateBalance]); // updateBalance is stable

    const checkConnection = React.useCallback(async (p: ethers.BrowserProvider) => {
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
    }, [updateBalance]);

    // Initialize state on mount
    useEffect(() => {
        if (window.ethereum) {
            try {
                const p = new ethers.BrowserProvider(window.ethereum);
                setProvider(p);
                checkConnection(p);
            } catch (error) {
                console.error('Error initializing Web3 provider:', error);
            }

            (window.ethereum as any).on('accountsChanged', handleAccountsChanged);
            (window.ethereum as any).on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                (window.ethereum as any).removeListener('accountsChanged', handleAccountsChanged);
                (window.ethereum as any).removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [checkConnection, handleAccountsChanged, handleChainChanged]);

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

        const networks: Record<string, { chainId: string; rpcUrls: string[]; chainName: string; nativeCurrency: any; blockExplorerUrls?: string[] }> = {
            'localhost': {
                chainId: '0x7A69', // 31337
                chainName: 'Localhost 8545',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
            },
            'monad': {
                chainId: '0x279F', // 10143
                chainName: 'Monad Testnet',
                rpcUrls: ['https://testnet-rpc.monad.xyz/'],
                nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
                blockExplorerUrls: ['http://testnet.monadexplorer.com/']
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

    const sendPayment = async (to: string, amountWei: string) => {
        if (!window.ethereum || !account) {
            throw new Error('Wallet not connected');
        }

        const p = new ethers.BrowserProvider(window.ethereum);
        try {
            console.log('💳 Initiating payment to:', to, 'amount:', amountWei);
            const signer = await p.getSigner();
            const address = await signer.getAddress();
            console.log('👤 Signer address:', address);

            // Fetch balance to pre-verify
            const balance = await p.getBalance(address);
            const required = BigInt(amountWei) + ethers.parseEther('0.002'); // amount + gas buffer

            if (balance < required) {
                const balanceEth = ethers.formatEther(balance);
                const requiredEth = ethers.formatEther(required);
                throw new Error(`Insufficient MON balance. You have ${balanceEth}, but ~${requiredEth} is needed for the fee + gas.`);
            }

            const tx = await signer.sendTransaction({
                to,
                value: amountWei,
                // Gas limit 21000 is standard for ETH transfers.
                // Using slightly higher to be safe on testnet, but avoid 30000 which might be arbitrary
                gasLimit: 30000
            });

            console.log('⏳ Transaction submitted:', tx.hash);

            toast.promise(tx.wait(), {
                loading: 'Verifying payment on-chain...',
                success: 'Payment verified!',
                error: (err: any) => `Verification failed: ${err.message || 'Unknown error'}`
            });

            const receipt = await tx.wait();
            console.log('✅ Transaction confirmed in block:', receipt?.blockNumber);

            // Refresh balance after payment
            setTimeout(() => updateBalance(account, p), 2000);

            return tx.hash;
        } catch (error: any) {
            console.error('❌ sendPayment failed:', error);
            // Prettify common error messages
            if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient MON balance for the security fee and gas.');
            }
            throw error;
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
                switchNetwork,
                sendPayment
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
