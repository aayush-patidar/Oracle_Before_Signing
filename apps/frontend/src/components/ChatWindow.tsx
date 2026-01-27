'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, ChevronRight, RefreshCw, Shield, AlertCircle, CheckCircle2, Wallet, Coins } from 'lucide-react';
import { useWeb3 } from '@/context/Web3Context';
import { usePolicy } from '@/context/PolicyContext';

interface Message {
  role: 'user' | 'system' | 'ai';
  content: string;
  type?: 'payment' | 'status' | 'error' | 'success';
}

interface ChatWindowProps {
  onNewRun: (runData: any) => void;
  onStreamUpdate: (stage: any) => void;
}

export default function ChatWindow({ onNewRun, onStreamUpdate }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { account, sendPayment } = useWeb3();
  const { policyMode } = usePolicy();
  const isRunningRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const addMessage = (role: 'user' | 'system' | 'ai', content: string, type?: Message['type']) => {
    setMessages((prev) => [...prev, { role, content, type }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const userMessage = inputValue.trim();
    if (!userMessage) return;

    // Validation: Check for address and amount/max/unlimited
    const hasAddress = /0x[a-fA-F0-9]{40}/.test(userMessage);
    const hasAmount = /\b\d+(\.\d+)?\b/i.test(userMessage) ||
      /\b(max|unlimited)\b/i.test(userMessage);

    if (!hasAddress || !hasAmount) {
      addMessage('user', userMessage);
      setInputValue('');
      addMessage('system', 'Simulation Error: Please provide both a recipient address (0x...) and an amount (or "max") for processing.', 'error');
      return;
    }

    setInputValue('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (response.status === 402) {
        setPendingPayment(data);
        addMessage('system', `Authentication required: ${data.message}`, 'payment');
        setIsLoading(false);
        return;
      }

      if (data.runId) {
        onNewRun(data);
        startPolling(data.runId);
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('system', 'System interface breakdown. Connection lost.', 'error');
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!pendingPayment) return;
    setIsLoading(true);
    try {
      // Robust way to find the message that triggered the payment required response
      const intentMessage = [...messages].reverse().find(m => m.role === 'user')?.content || inputValue;

      addMessage('system', 'Initiating secure payment authorization...', 'status');

      // Perform the on-chain payment
      const txHash = await sendPayment(pendingPayment.payTo, pendingPayment.priceWei);

      addMessage('system', `Verification Hash: ${txHash.substring(0, 10)}... (Simulating Outcome)`, 'status');

      // Retry the chat request with the payment verification header
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-payment-tx': txHash
        },
        body: JSON.stringify({ message: intentMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Gateway server error (${response.status})`);
      }

      const data = await response.json();
      setPendingPayment(null);

      if (data.runId) {
        onNewRun(data);
        startPolling(data.runId);
      } else {
        addMessage('system', 'Simulation started successfully.', 'success');
      }
    } catch (e: any) {
      console.error('Payment flow aborted:', e);
      const errorMsg = e?.message || 'Gateway connection failed.';

      // Check for specific MetaMask errors
      if (errorMsg.includes('user rejected') || errorMsg.includes('ACTION_REJECTED')) {
        addMessage('system', 'Payment cancelled: You rejected the request in MetaMask.', 'error');
      } else if (errorMsg.includes('insufficient funds')) {
        addMessage('system', 'Payment failed: Insufficient MON balance for the security fee.', 'error');
      } else {
        addMessage('system', `Payment Error: ${errorMsg}`, 'error');
      }

      setIsLoading(false);
    }
  };

  const startPolling = (currentRunId: string) => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    let pollCount = 0;
    const interval = setInterval(() => {
      onStreamUpdate({ stage: 'polling', message: 'Analyzing block deltas...', count: ++pollCount });
      if (pollCount > 3) {
        clearInterval(interval);
        pollResult(currentRunId);
      }
    }, 1000);
  };

  const pollResult = async (currentRunId: string) => {
    try {
      const response = await fetch(`/api/chat?runId=${currentRunId}`);
      const finalData = await response.json();

      if (finalData.error) {
        addMessage('system', finalData.error, 'error');
        onStreamUpdate(finalData);
        setIsLoading(false);
        isRunningRef.current = false;
        return;
      }

      const judgment = finalData.judgment?.judgment || 'ALLOW';

      if (policyMode === 'ENFORCE') {
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
        addMessage('system', `Analysis Verified. Outcome ${judgment === 'DENY' ? 'BLOCKED' : 'CLEARED'}. Result mirrored to registry.`, 'success');
      } else {
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: judgment === 'DENY' ? 'SECURITY_VIOLATION' : 'BENIGN_INTENT',
            severity: judgment === 'DENY' ? 'HIGH' : 'LOW',
            message: `Oracle Simulation: ${finalData.judgment?.reasoning_summary || 'Analysis finished'}`
          })
        });
        addMessage('system', `Monitor analysis complete. Event-delta: ${judgment}. Security alert dispatched.`, 'status');
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

  return (
    <div className="flex flex-col h-full bg-[#0b1222] border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden">
      {/* Premium Header */}
      <div className="px-8 py-6 bg-slate-900/40 border-b border-white/5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">NoahAI Terminal</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Active Verifier: Monad_SOC_1</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-hide flex flex-col">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
            <div className="w-16 h-16 rounded-[2rem] bg-slate-900 border border-white/5 flex items-center justify-center shadow-inner">
              <Coins className="w-8 h-8 text-slate-700" />
            </div>
            <div className="space-y-4">
              <h3 className="text-slate-300 font-bold text-sm uppercase tracking-widest">System Readiness Confirmed</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[200px] mx-auto">
                Provide detailed transaction metrics (Amount & Recipient) for adversarial snapshot simulation.
              </p>
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} className={`w-full flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {m.role === 'user' ? (
              <div className="flex flex-col items-end max-w-[80%]">
                <div className="flex items-center gap-2 mb-2 mr-2">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Principal User</span>
                  <div className="h-3 w-[1px] bg-white/10" />
                  <User className="w-3 h-3 text-blue-400" />
                </div>
                <div className="bg-blue-600 px-5 py-3 rounded-2xl rounded-tr-none text-white text-sm font-medium shadow-[0_10px_30px_rgba(37,99,235,0.2)] border border-blue-500/20 break-words w-full">
                  {m.content}
                </div>
              </div>
            ) : m.type === 'payment' ? (
              <div className="w-full max-w-[90%] bg-amber-500/5 border border-amber-500/20 rounded-[2rem] p-6 space-y-5 shadow-inner">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Wallet className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Authorization Required</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{m.content}</p>
                  </div>
                </div>
                <button
                  onClick={handlePayment}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-[0_10px_20px_rgba(245,158,11,0.2)]"
                >
                  Confirm Authorization (MetaMask)
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-start max-w-[90%]">
                <div className="flex items-center gap-2 mb-2 ml-2">
                  <Shield className="w-3 h-3 text-slate-500" />
                  <div className="h-3 w-[1px] bg-white/10" />
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">NoahAI_Response</span>
                </div>
                <div className={`px-5 py-3.5 rounded-3xl rounded-tl-none text-sm font-medium border ${m.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
                  m.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' :
                    'bg-slate-900 border-white/5 text-slate-300'
                  }`}>
                  {m.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start max-w-[90%] animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-2 ml-2">
              <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
              <span className="text-[9px] text-blue-500/50 font-black uppercase tracking-widest">Synthesizing...</span>
            </div>
            <div className="bg-slate-900 border border-white/5 px-5 py-4 rounded-3xl rounded-tl-none flex items-center gap-4">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-bounce delay-200" />
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Oracle Processing</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="p-6 bg-slate-900/40 border-t border-white/5 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute inset-0 bg-blue-500/5 blur-xl group-focus-within:bg-blue-500/10 transition-all rounded-3xl" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. Approve 1000 USDT to 0x... (Max: 10k)"
            className="relative w-full bg-slate-950 border border-white/5 rounded-2xl pl-5 pr-14 py-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium shadow-inner"
            disabled={isLoading || !!pendingPayment}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || !!pendingPayment}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-[0_5px_15px_rgba(37,99,235,0.3)] active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Intent Validated</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-amber-500/50" />
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Simulation Sandboxed</span>
          </div>
        </div>
      </div>
    </div>
  );
}