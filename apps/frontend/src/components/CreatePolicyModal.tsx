'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CreatePolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export default function CreatePolicyModal({ isOpen, onClose, onCreated }: CreatePolicyModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        rule_type: 'UNLIMITED_APPROVAL',
        severity: 'HIGH',
        mode: 'ENFORCE'
    });

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error('Please enter a policy name');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/policies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to create policy');

            toast.success('Security policy created successfully');
            onCreated();
            onClose();
            // Reset form
            setFormData({
                name: '',
                description: '',
                rule_type: 'UNLIMITED_APPROVAL',
                severity: 'HIGH',
                mode: 'ENFORCE'
            });
        } catch (error) {
            console.error(error);
            toast.error('Error creating policy');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Create Security Policy</h2>
                            <p className="text-xs text-gray-500">Define code-level protection rules</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Policy Name */}
                    <div className="space-y-2">
                        <Label>Policy Name</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Block Large USDT Transfers"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Explain what this policy protects against..."
                            className="min-h-[80px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Rule Type */}
                        <div className="space-y-2">
                            <Label>Rule Type</Label>
                            <Select
                                value={formData.rule_type}
                                onValueChange={(val) => setFormData({ ...formData, rule_type: val })}
                            >
                                <SelectTrigger className="bg-gray-800 border-gray-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    <SelectItem value="UNLIMITED_APPROVAL">Unlimited Approval</SelectItem>
                                    <SelectItem value="LARGE_TRANSFER">Large Transfer</SelectItem>
                                    <SelectItem value="MALICIOUS_CONTRACT">Malicious Contract</SelectItem>
                                    <SelectItem value="UNVERIFIED_CONTRACT">Unverified Contract</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Severity */}
                        <div className="space-y-2">
                            <Label>Severity Level Level</Label>
                            <Select
                                value={formData.severity}
                                onValueChange={(val) => setFormData({ ...formData, severity: val })}
                            >
                                <SelectTrigger className="bg-gray-800 border-gray-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    <SelectItem value="CRITICAL" className="text-red-400 font-bold">Critical</SelectItem>
                                    <SelectItem value="HIGH" className="text-orange-400 font-bold">High</SelectItem>
                                    <SelectItem value="MEDIUM" className="text-yellow-400 font-bold">Medium</SelectItem>
                                    <SelectItem value="LOW" className="text-blue-400 font-bold">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Mode */}
                    <div className="space-y-2">
                        <Label>Enforcement Mode</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, mode: 'ENFORCE' })}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${formData.mode === 'ENFORCE'
                                        ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500'
                                        : 'bg-gray-800 border-gray-700 hover:bg-gray-800'
                                    }`}
                            >
                                <Shield className={`w-5 h-5 ${formData.mode === 'ENFORCE' ? 'text-blue-400' : 'text-gray-400'}`} />
                                <span className="text-sm font-bold">Enforce</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, mode: 'MONITOR' })}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${formData.mode === 'MONITOR'
                                        ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500'
                                        : 'bg-gray-800 border-gray-700 hover:bg-gray-800'
                                    }`}
                            >
                                <Info className={`w-5 h-5 ${formData.mode === 'MONITOR' ? 'text-blue-400' : 'text-gray-400'}`} />
                                <span className="text-sm font-bold">Monitor</span>
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-gray-700 text-gray-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 shadow-lg shadow-blue-900/20"
                        >
                            {loading ? 'Deploying...' : 'Deploy Policy'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
