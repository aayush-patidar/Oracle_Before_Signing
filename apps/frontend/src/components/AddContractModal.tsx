'use client';

import { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AddContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (contract: ContractData) => void;
}

interface ContractData {
    address: string;
    name: string;
    type: string;
    riskLevel: 'safe' | 'medium' | 'high';
}

export default function AddContractModal({ isOpen, onClose, onAdd }: AddContractModalProps) {
    const [formData, setFormData] = useState<ContractData>({
        address: '',
        name: '',
        type: 'ERC20',
        riskLevel: 'safe'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate Ethereum address
        if (!formData.address.match(/^0x[a-fA-F0-9]{40}$/)) {
            toast.error('Invalid contract address', {
                description: 'Please enter a valid Ethereum address'
            });
            return;
        }

        if (!formData.name.trim()) {
            toast.error('Contract name is required');
            return;
        }

        onAdd(formData);
        toast.success('Contract added successfully!');

        // Reset form
        setFormData({
            address: '',
            name: '',
            type: 'ERC20',
            riskLevel: 'safe'
        });

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Plus className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Add Contract</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0 rounded-full hover:bg-gray-800 text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Contract Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Contract Address *
                        </label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="0x..."
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter the Ethereum contract address</p>
                    </div>

                    {/* Contract Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Contract Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., USDT Token"
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Contract Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Contract Type
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ERC20">ERC20 Token</option>
                            <option value="ERC721">ERC721 NFT</option>
                            <option value="ERC1155">ERC1155 Multi-Token</option>
                            <option value="DeFi">DeFi Protocol</option>
                            <option value="DAO">DAO Contract</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Risk Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Risk Level
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, riskLevel: 'safe' })}
                                className={`px-4 py-2 rounded-lg border transition-all ${formData.riskLevel === 'safe'
                                    ? 'bg-green-500/20 border-green-500 text-green-400'
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                Safe
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, riskLevel: 'medium' })}
                                className={`px-4 py-2 rounded-lg border transition-all ${formData.riskLevel === 'medium'
                                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                Medium
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, riskLevel: 'high' })}
                                className={`px-4 py-2 rounded-lg border transition-all ${formData.riskLevel === 'high'
                                    ? 'bg-red-500/20 border-red-500 text-red-400'
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                High
                            </button>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="flex gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-300">
                            Added contracts will be monitored for security events and policy violations
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contract
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
