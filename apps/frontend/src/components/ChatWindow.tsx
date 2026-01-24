'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { usePolicy } from '@/context/PolicyContext';
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
  const completedRunsRef = useRef<Set<string>>(new Set());
  const isRunningRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<ethers.BrowserProvider | null>(null);

  const { account, isConnected } = useWeb3();
  const { policyMode } = usePolicy();

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const isNearBottom = () => {
    const container = messagesEndRef.current?.parentElement;
    if (!container) return true;
    const threshold = 100;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  const addMessage = useCallback((type: 'user' | 'system', content: string, isPayment = false) => {
    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
      timestamp: new Date(),
      isPayment
    };
    setMessages(prev => [...prev, message]);
  }, []);

  useEffect(() => {
    if (isNearBottom()) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (currentRunId && !completedRunsRef.current.has(currentRunId) && !isRunningRef.current) {
      const isStandalone = currentRunId.startsWith('demo-');

      if (isStandalone) {
        completedRunsRef.current.add(currentRunId);
        isRunningRef.current = true;
        const pollResult = async () => {
          try {
            const stages = [
              { stage: 'intent_parse', message: 'Parsing intent...' },
              { stage: 'fork_chain', message: 'Forking chain...' },
              { stage: 'simulate', message: 'Simulating...' },
              { stage: 'extract_delta', message: 'Extracting reality delta...' },
              { stage: 'judge', message: 'Judging...' }
            ];

            for (const step of stages) {
              await new Promise(r => setTimeout(r, 600));
              onStreamUpdate(step);
            }

            const response = await fetch(`/api/chat?runId=${currentRunId}`);
            const finalData = await response.json();
            const judgment = finalData.judgment?.judgment || 'ALLOW';

            // Universal Routing: ENFORCE -> Transactions, MONITOR -> Alerts
            if (policyMode === 'ENFORCE') {
              // Log ALL outcomes to Transactions Registry in Enforce Mode
              await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  from_address: account || '0x598a82A1e968D29A2666847C39bCa5adf5640684',
                  to_address: '0x1F95a95810FB99bb2781545b89E2791AD87DfAFb',
                  function_name: 'approve',
                  status: judgment === 'DENY' ? 'DENIED' : 'ALLOWED',
                  severity: judgment === 'DENY' ? 'CRITICAL' : 'LOW'
                })
              });
              addMessage('system', `Simulation Complete: Intent ${judgment === 'DENY' ? 'Blocked' : 'Verified'}. Logged to Transactions Registry.`);
            } else {
              // Log ALL outcomes to Alerts in Monitor Mode
              await fetch('/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event_type: judgment === 'DENY' ? 'SECURITY_VIOLATION' : 'BENIGN_INTENT',
                  severity: judgment === 'DENY' ? 'HIGH' : 'LOW',
                  message: `Oracle Simulation: ${finalData.judgment?.reasoning_summary || 'Analysis finished'}`
                })
              });
              addMessage('system', `Simulation Complete: Intent ${judgment}. Security Alert generated (Monitor Mode).`);
            }

            // If it was an ALLOWED approval, add it to the Approvals registry
            if (judgment === 'ALLOW' && (finalData.judgment?.reasoning_summary?.toLowerCase().includes('limit') || finalData.judgment?.reasoning_summary?.toLowerCase().includes('safe'))) {
              await fetch('/api/allowances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token: 'USDT',
                  spender: 'Verified Router',
                  spender_address: '0x1F95a95810FB99bb2781545b89E2791AD87DfAFb',
                  formatted: '100 USDT',
                  risk_score: finalData.judgment?.risk_score || 5
                })
              });
            }

            onStreamUpdate(finalData);
            setIsLoading(false);
            isRunningRef.current = false;
          } catch (e) {
            console.error('Polling error:', e);
            setIsLoading(false);
            isRunningRef.current = false;
          }
        };
        pollResult();
      } else {
        completedRunsRef.current.add(currentRunId);
        const eventSource = new EventSource(`/api/stream/${currentRunId}`);
        eventSource.onmessage = (event) => {
          try {
            const stage = JSON.parse(event.data);
            onStreamUpdate(stage);
            if (stage.message) addMessage('system', stage.message);
            else if (stage.error) {
              addMessage('system', `❌ Error: ${stage.error}`);
              setIsLoading(false);
              eventSource.close();
            }
            if (stage.stage === 'final') {
              setIsLoading(false);
              eventSource.close();
            }
          } catch (error) { console.error(error); }
        };
        eventSource.onerror = () => {
          eventSource.close();
          setIsLoading(false);
        };
        return () => eventSource.close();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRunId, onStreamUpdate, policyMode, account]);

  const handlePay = async () => {
    if (!pendingPayment || !window.ethereum) return;

    const payToast = toast.loading('Initiating x402 payment...');
    try {
      // Use cached provider to reduce initialization RPC calls
      if (!providerRef.current) {
        providerRef.current = new ethers.BrowserProvider(window.ethereum);
      }

      const signer = await providerRef.current.getSigner();

      const tx = await signer.sendTransaction({
        to: pendingPayment.payTo,
        value: pendingPayment.priceWei,
        // Manual gas limit if RPC estimateGas fails due to rate limiting
        gasLimit: 100000
      });

      toast.info('Payment submitted! Verifying...', { id: payToast });
      addMessage('system', `Payment sent: ${tx.hash.slice(0, 10)}... (Waiting for verification)`);

      await submitToChat(pendingPayment.originalMessage, tx.hash);

      setPendingPayment(null);
      toast.success('Payment verified successfully!', { id: payToast });
    } catch (error: any) {
      console.error('Payment failed details:', error);
      let errMsg = error?.message || 'Transaction failed';

      if (errMsg.includes('429') || errMsg.includes('rate limit')) {
        errMsg = 'Blockchain network is busy (Rate Limited). Please wait 30 seconds and try again.';
      } else if (errMsg.includes('insufficient funds')) {
        errMsg = 'Insufficient funds in wallet for payment.';
      } else if (errMsg.includes('user rejected')) {
        errMsg = 'Payment cancelled by user.';
      }

      toast.error('Payment failed', {
        id: payToast,
        description: errMsg,
        duration: 5000
      });
    }
  };

  const submitToChat = async (message: string, paymentTxHash?: string) => {
    setIsLoading(true);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (paymentTxHash) headers['x-payment-tx'] = paymentTxHash;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (response.status === 402) {
        setPendingPayment({ ...data, originalMessage: message });
        addMessage('system', `x402 Payment Required: ${ethers.formatEther(data.priceWei)} ETH for full analysis.`, true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) throw new Error(data.error || 'Failed to start analysis');

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
    addMessage('user', userMessage);
    await submitToChat(userMessage);
  };

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden h-full">
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

      <div className="flex-1 overflow-y-auto pt-6 px-6 pb-8 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <Shield className="w-12 h-12 text-gray-600" />
            <p className="text-sm text-gray-400 max-w-xs">Describe your transaction intent to start a security analysis run.</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${message.type === 'user' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-gray-900 border border-gray-800 text-gray-300'}`}>
              {message.isPayment ? (
                <div className="space-y-3 py-1">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Payment Required</span>
                  </div>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <Button onClick={handlePay} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold h-9">
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
        <div ref={messagesEndRef} className="h-4" />
      </div>

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
          <button type="submit" disabled={!inputValue.trim() || isLoading || !!pendingPayment} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 transition-colors">
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