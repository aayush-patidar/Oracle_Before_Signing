'use client';

import { useState } from 'react';
import { Plus, Shield, Copy, ExternalLink, Trash2, Edit } from 'lucide-react';
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
import AddContractModal from '@/components/AddContractModal';
import { toast } from 'sonner';
import { useRole } from '@/context/RoleContext';

interface Contract {
  id: string;
  address: string;
  name: string;
  type: string;
  riskLevel: 'safe' | 'medium' | 'high';
  addedAt: string;
}

export default function ContractsPage() {
  const { permissions } = useRole();
  const [showAddModal, setShowAddModal] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([
    {
      id: '1',
      address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      name: 'MockUSDT',
      type: 'ERC20',
      riskLevel: 'safe',
      addedAt: new Date().toISOString()
    },
    {
      id: '2',
      address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      name: 'Malicious Spender',
      type: 'Other',
      riskLevel: 'high',
      addedAt: new Date().toISOString()
    }
  ]);

  const handleAddContract = (contractData: any) => {
    const newContract: Contract = {
      id: Date.now().toString(),
      ...contractData,
      addedAt: new Date().toISOString()
    };
    setContracts([newContract, ...contracts]);
  };

  const handleDelete = (id: string) => {
    setContracts(contracts.filter(c => c.id !== id));
    toast.success('Contract removed from registry');
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'safe':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Safe</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>;
      case 'high':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High Risk</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Contract Registry</h1>
          <p className="text-gray-400">
            Manage and monitor smart contracts for security analysis
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Contract
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{contracts.length}</div>
            <p className="text-sm text-gray-400">Total Contracts</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">
              {contracts.filter(c => c.riskLevel === 'safe').length}
            </div>
            <p className="text-sm text-gray-400">Safe Contracts</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-400">
              {contracts.filter(c => c.riskLevel === 'medium').length}
            </div>
            <p className="text-sm text-gray-400">Medium Risk</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">
              {contracts.filter(c => c.riskLevel === 'high').length}
            </div>
            <p className="text-sm text-gray-400">High Risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Registered Contracts</CardTitle>
          <CardDescription>All smart contracts being monitored</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Address</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Risk Level</TableHead>
                <TableHead className="text-gray-400">Added</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id} className="border-gray-700">
                  <TableCell className="font-medium text-white">{contract.name}</TableCell>
                  <TableCell className="font-mono text-sm text-gray-300">
                    {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{contract.type}</Badge>
                  </TableCell>
                  <TableCell>{getRiskBadge(contract.riskLevel)}</TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {new Date(contract.addedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyAddress(contract.address)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://etherscan.io/address/${contract.address}`, '_blank')}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      {permissions.delete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contract.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Contract Modal */}
      <AddContractModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddContract}
      />
    </div>
  );
}
