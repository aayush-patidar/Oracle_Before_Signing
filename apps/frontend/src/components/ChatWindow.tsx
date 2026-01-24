'use client';

import { useState, useRef, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { Shield, Wallet, CreditCard, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  type: 'user' | 'system';
  content: string;
  timestamp: Date;
  isPayment?: boolean;
}

interface ChatWindowProps {
  onNewRun: (runData: any) => void;
  onStreamUpdate: (stage: any) => void;
}

export default function ChatWindow({ onNewRun, onStreamUpdate }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { account, isConnected } = useWeb3();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (currentRunId) {
      const eventSource = new EventSource(`/api/stream/${currentRunId}`);

      eventSource.onmessage = (event) => {
        try {
          const stage = JSON.parse(event.data);
          onStreamUpdate(stage);

          // Add system message for stage updates
          if (stage.message) {
            addMessage('system', stage.message);
          } else if (stage.error) {
            onStreamUpdate(stage); // Notify parent
            addMessage('system', `❌ Error: ${stage.error}`);
            setIsLoading(false);
            eventSource.close();
          }

          if (stage.stage === 'final') {
            setIsLoading(false);
            eventSource.close();
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        onStreamUpdate({ error: 'Connection to Oracle lost. Please try again.' });
        eventSource.close();
        setIsLoading(false);
      };

      return () => {
        eventSource.close();
      };
    }
  }, [currentRunId, onStreamUpdate]);

  const addMessage = (type: 'user' | 'system', content: string, isPayment = false) => {
    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
      timestamp: new Date(),
      isPayment
    };
    setMessages(prev => [...prev, message]);
  };

  const handlePay = async () => {
    if (!pendingPayment || !window.ethereum) return;

    const payToast = toast.loading('Initiating x402 payment...');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: pendingPayment.payTo,
        value: pendingPayment.priceWei
      });

      toast.info('Payment submitted! Verifying...', { id: payToast });
      addMessage('system', `Payment sent: ${tx.hash.slice(0, 10)}... (Waiting for verification)`);

      // Retry chat request with payment header
      await submitToChat(pendingPayment.originalMessage, tx.hash);

      setPendingPayment(null);
      toast.success('Payment verified successfully!', { id: payToast });
    } catch (error: any) {
      console.error('Payment failed details:', error);

      let description = error?.message || 'Please check your wallet and try again';
      const errorMsg = error?.message?.toLowerCase() || '';
      const errorCode = error?.code;

      if (errorCode === 'ACTION_REJECTED' || errorCode === 4001 || errorMsg.includes('user rejected') || errorMsg.includes('user denied')) {
        description = 'Transaction was cancelled in MetaMask';
      } else if (errorCode === 'INSUFFICIENT_FUNDS' || errorMsg.includes('insufficient funds')) {
        description = 'You don\'t have enough ETH in your local wallet for this payment';
      } else if (errorMsg.includes('chain id') || errorMsg.includes('network mismatch')) {
        description = 'Network mismatch. Please ensure MetaMask is on Localhost 8545 (31337)';
      } else if (errorMsg.includes('nonce') || errorMsg.includes('already pending')) {
        description = 'MetaMask state mismatch. Try resetting your MetaMask account (Settings > Advanced > Clear activity tab data)';
      } else if (errorMsg.includes('connect')) {
        description = 'Failed to connect to MetaMask. Make sure it is unlocked and accounts are selected.';
      }

      toast.error('Payment failed', {
        id: payToast,
        description
      });
    }
  };

  const submitToChat = async (message: string, paymentTxHash?: string) => {
    setIsLoading(true);
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (paymentTxHash) {
        headers['x-payment-tx'] = paymentTxHash;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (response.status === 402) {
        // x402 Payment Required
        setPendingPayment({ ...data, originalMessage: message });
        addMessage('system', `x402 Payment Required: ${ethers.formatEther(data.priceWei)} ETH for full analysis.`, true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start analysis');
      }

      const { runId } = data;
      setCurrentRunId(runId);
      onNewRun({ runId, message });

    } catch (error: any) {
      console.error('Error starting analysis:', error);
      addMessage('system', `Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    addMessage('user', userMessage);
    await submitToChat(userMessage);
  };

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">NoahAI Analysis</h2>
            <p className="text-[10px] text-gray-500 font-mono">X402 PAY-PER-VERDICT ACTIVE</p>
          </div>
        </div>
        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">Live</Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-800">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <Shield className="w-12 h-12 text-gray-600" />
            <p className="text-sm text-gray-400 max-w-xs">Describe your transaction intent to start a security analysis run.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl ${message.type === 'user'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'bg-gray-900 border border-gray-800 text-gray-300'
                }`}
            >
              {message.isPayment ? (
                <div className="space-y-3 py-1">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Payment Required</span>
                  </div>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <Button
                    onClick={handlePay}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold h-9"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Pay via MetaMask
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    {message.type === 'system' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">
                      {message.type === 'user' ? 'You' : 'System Oracle'}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed break-all">{message.content}</p>
                </>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-900 border border-gray-800 px-4 py-3 rounded-2xl flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-xs text-gray-400 font-mono">NoahAI Processing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-900/50 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. Approve 1000 USDT for swapping..."
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
            disabled={isLoading || !!pendingPayment}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || !!pendingPayment}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 transition-colors"
          >
            <Shield className="w-4 h-4" />
          </button>
        </form>
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-500 uppercase font-medium tracking-widest">
          <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Intent Free</span>
          <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-yellow-500" /> Simulation Paid</span>
        </div>
      </div>
    </div>
  );
}