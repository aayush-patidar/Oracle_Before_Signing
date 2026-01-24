'use client';

import { useState, useEffect } from 'react';
import { X, Search, MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/context/Web3Context';
import { toast } from 'sonner';

interface MetaMaskSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MetaMaskSidePanel({ isOpen, onClose }: MetaMaskSidePanelProps) {
    const { connectWallet } = useWeb3();
    const [isConnecting, setIsConnecting] = useState(false);

    if (!isOpen) return null;

    const handleAccountClick = async () => {
        setIsConnecting(true);
        // Simulate "Confirm Connection" delay inside the simulated extension
        await new Promise(resolve => setTimeout(resolve, 800));

        await connectWallet(); // This sets the context state
        setIsConnecting(false);
        onClose();
    };

    return (
        <div className="fixed inset-y-0 right-0 z-[60] flex">
            {/* Backdrop (transparent but blocking clicks outside if needed, or allow interaction?) 
          Real extensions close when you click away. */}
            <div className="fixed inset-0 z-0" onClick={onClose} />

            {/* The Panel */}
            <div className="relative z-10 w-[360px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-200">

                {/* Ext Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6">
                            <svg viewBox="0 0 32 32" className="w-full h-full">
                                <path fill="#E17726" d="M29.2 12.5l-2.1-9.6c-.1-.5-.8-.7-1.1-.3L18.7 12 16 2.6c-.2-.6-1-.6-1.2 0L12.1 12 4.8 2.6c-.4-.5-1.1-.3-1.2.2L1.5 12.5c-.2 1 .3 2 1.3 2.1l13.2 2.4 11.9-2.3c1-.1 1.5-1.1 1.3-2.2z" />
                                <path fill="#E2761B" d="M1.5 12.5l2.1 9.6c.1.5.8.7 1.1.3l7.3-9.4L1.5 12.5z" />
                                <path fill="#E4761B" d="M29.2 12.5l-2.1 9.6c-.1.5-.8.7-1.1.3l-7.3-9.4 10.5-.5z" />
                                <path fill="#D7C1B3" d="M11.6 15.6l-3.2 9.1c-1.2 3.4.6 7.3 4.2 8.4l2.1.6-1.1-4.8-2-13.3z" />
                                <path fill="#233447" d="M20.2 15.6l3.2 9.1c1.2 3.4-.6 7.3-4.2 8.4l-2.1.6 1.1-4.8 2-13.3z" />
                                <path fill="#CD6116" d="M10.4 14.3L3.8 29.8c-.5 1.2.2 2.2 1.5 2.2h21.4c1.3 0 2-1 1.5-2.2L21.6 14.3l-5.6-1.9-5.6 1.9z" />
                            </svg>
                        </div>
                        <span className="font-bold text-gray-700 tracking-tight">MetaMask</span>
                    </div>
                    <div className="flex gap-2 text-gray-400">
                        {/* Fake window controls */}
                        <div className="w-2 h-2 rounded-full bg-red-400/50 hover:bg-red-400 cursor-pointer" onClick={onClose} />
                    </div>
                </div>

                {/* Title Nav */}
                <div className="pt-4 pb-2 px-4 text-center relative border-b border-gray-100">
                    <button className="absolute left-4 top-4 text-gray-500 hover:text-gray-700">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <h2 className="font-bold text-gray-900 text-lg">Accounts</h2>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search your accounts"
                            className="w-full bg-gray-100 text-gray-900 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-gray-500"
                        />
                    </div>
                </div>

                {/* Account List */}
                <div className="flex-1 overflow-y-auto">
                    <div
                        onClick={handleAccountClick}
                        className="mx-2 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group border border-transparent hover:border-gray-200"
                    >
                        <div className="flex items-center gap-3">
                            {/* Jazzicon / Blockie */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-300 border border-gray-200" />

                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-900 text-sm">Account 1</span>
                                    <span className="text-gray-900 font-medium text-sm">$0.00</span>
                                </div>
                                <div className="flex items-center justify-between mt-0.5">
                                    <span className="text-xs text-gray-500">0x709...79C8</span>
                                    {isConnecting && <span className="text-[10px] text-blue-600 font-medium uppercase tracking-wider animate-pulse">Connecting</span>}
                                </div>
                            </div>

                            <button className="text-gray-400 hover:text-gray-600 p-1">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="mx-2 mt-1 p-3 rounded-xl opacity-60">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-bl from-purple-400 to-blue-300 border border-gray-200" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-900 text-sm">Account 2</span>
                                    <span className="text-gray-900 font-medium text-sm">$0.00</span>
                                </div>
                                <div className="flex items-center justify-between mt-0.5">
                                    <span className="text-xs text-gray-500">0x123...4567</span>
                                </div>
                            </div>
                            <button className="text-gray-400 p-1"><MoreVertical className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                    <button className="w-full py-3 rounded-full bg-blue-50 text-blue-600 font-bold text-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Add wallet or hardware wallet
                    </button>
                </div>

            </div>
        </div>
    );
}
