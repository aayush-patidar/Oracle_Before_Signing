'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWeb3 } from '@/context/Web3Context';

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenMetaMask: () => void;
}

export default function WalletModal({ isOpen, onClose, onOpenMetaMask }: WalletModalProps) {
    const { connectWallet } = useWeb3();
    const [step, setStep] = useState<'select' | 'connecting' | 'error'>('select');
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStep('select');
            setSelectedWallet(null);
        }
    }, [isOpen]);

    const handleConnect = async (walletName: string) => {
        if (walletName === 'MetaMask') {
            onClose();
            onOpenMetaMask();
            return;
        }

        setSelectedWallet(walletName);
        setStep('connecting');

        // Simulate initial visualization of connection
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            await connectWallet();
            onClose();
        } catch (error) {
            setStep('error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                    <h2 className="text-lg font-bold text-white">Connect Wallet</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full hover:bg-gray-800 text-gray-400">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-5">
                    {step === 'select' && (
                        <div className="space-y-3">
                            <button
                                onClick={() => handleConnect('MetaMask')}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-orange-500/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white p-1.5 shadow-lg">
                                        {/* MetaMask Fox SVG */}
                                        <svg viewBox="0 0 32 32" className="w-full h-full">
                                            <path fill="#E17726" d="M29.2 12.5l-2.1-9.6c-.1-.5-.8-.7-1.1-.3L18.7 12 16 2.6c-.2-.6-1-.6-1.2 0L12.1 12 4.8 2.6c-.4-.5-1.1-.3-1.2.2L1.5 12.5c-.2 1 .3 2 1.3 2.1l13.2 2.4 11.9-2.3c1-.1 1.5-1.1 1.3-2.2z" />
                                            <path fill="#E2761B" d="M1.5 12.5l2.1 9.6c.1.5.8.7 1.1.3l7.3-9.4L1.5 12.5z" />
                                            <path fill="#E4761B" d="M29.2 12.5l-2.1 9.6c-.1.5-.8.7-1.1.3l-7.3-9.4 10.5-.5z" />
                                            <path fill="#D7C1B3" d="M11.6 15.6l-3.2 9.1c-1.2 3.4.6 7.3 4.2 8.4l2.1.6-1.1-4.8-2-13.3z" />
                                            <path fill="#233447" d="M20.2 15.6l3.2 9.1c1.2 3.4-.6 7.3-4.2 8.4l-2.1.6 1.1-4.8 2-13.3z" />
                                            <path fill="#CD6116" d="M10.4 14.3L3.8 29.8c-.5 1.2.2 2.2 1.5 2.2h21.4c1.3 0 2-1 1.5-2.2L21.6 14.3l-5.6-1.9-5.6 1.9z" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white group-hover:text-orange-400 transition-colors">MetaMask</p>
                                        <p className="text-xs text-gray-500">Connect to your MetaMask wallet</p>
                                    </div>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                            </button>

                            <button
                                disabled
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-800/30 border border-gray-800 opacity-60 cursor-not-allowed"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500 p-2 shadow-lg flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white">
                                            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                                            <path d="M9 12l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-300">WalletConnect</p>
                                        <p className="text-xs text-gray-600">Coming soon</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {step === 'connecting' && (
                        <div className="py-8 text-center space-y-4">
                            <div className="relative w-16 h-16 mx-auto">
                                <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Small Fox */}
                                    <svg viewBox="0 0 32 32" className="w-8 h-8 opacity-80">
                                        <path fill="#E17726" d="M29.2 12.5l-2.1-9.6c-.1-.5-.8-.7-1.1-.3L18.7 12 16 2.6c-.2-.6-1-.6-1.2 0L12.1 12 4.8 2.6c-.4-.5-1.1-.3-1.2.2L1.5 12.5c-.2 1 .3 2 1.3 2.1l13.2 2.4 11.9-2.3c1-.1 1.5-1.1 1.3-2.2z" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Requesting Connection</h3>
                                <p className="text-sm text-gray-400">Open the {selectedWallet} extension to connect.</p>
                            </div>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="py-8 text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Connection Failed</h3>
                                <p className="text-sm text-gray-400">Something went wrong. Please try again.</p>
                            </div>
                            <Button onClick={() => setStep('select')} variant="outline">
                                Try Again
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-950 border-t border-gray-800 text-center">
                    <p className="text-xs text-gray-500">
                        By connecting, you agree to our <span className="text-blue-500 cursor-pointer">Terms of Service</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
