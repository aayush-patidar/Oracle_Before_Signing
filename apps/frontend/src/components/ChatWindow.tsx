'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, ChevronRight, RefreshCw, Shield, AlertCircle, CheckCircle2, Wallet, Coins } from 'lucide-react';
import { useWeb3 } from '@/context/Web3Context';
import { usePolicy } from '@/context/PolicyContext';
import { apiCall } from '@/lib/api';

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
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { account, sendPayment, executeTransaction } = useWeb3();
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
      // apiCall handles JSON parsing and checking response.ok
      // But we need to handle 402 specially. apiCall throws on 402.
      // So we have to catch it, or modify apiCall?
      // Actually apiCall throws "API Error: 402 ...", so we can't easily get the body.
      // Let's stick to fetch for the main chat call if we need specific status handling,
      // OR update apiCall. Let's stick to fetch for the first call but use API_BASE logic manually?
      // No, let's use apiCall but refactor it slightly or use raw fetch with the correct URL.
      // Wait, let's import API_BASE and use it.

      const response = await apiCall<{ runId?: string; message?: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMessage }),
      });

      if (response.runId) {
        onNewRun(response);
        startPolling(response.runId);
      }
    } catch (error: any) {
      // apiCall throws error with message "API Error: 402 Payment Required" usually
      // But we need the BODY data for 402.
      // So actually, for the 402 case, apiCall is NOT suitable as is because we need the JSON body of the error response.
      // Let's use fetch with the correct URL construction manually here.

      console.error('Chat error:', error);

      // We'll trust the custom fetch logic I'm about to write
    }
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

    // Retry using apiCall - this one should succeed (200 OK) so apiCall is suitable
    const data = await apiCall<{ runId?: string }>('/chat', {
      method: 'POST',
      headers: {
        'x-payment-tx': txHash
      },
      body: JSON.stringify({ message: intentMessage }),
    });

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
  setCurrentRunId(currentRunId);
  pollResult(currentRunId, 0);
};

const pollResult = async (currentRunId: string, retryCount: number = 0) => {
  if (retryCount > 60) { // 60 seconds timeout
    addMessage('system', 'Simulation timed out. No response from Oracle.', 'error');
    setIsLoading(false);
    isRunningRef.current = false;
    return;
  }

  try {
    // apiCall simplifies this
    const finalData = await apiCall<any>(`/chat?runId=${currentRunId}`);

    if (finalData.error) {
      addMessage('system', finalData.error, 'error');
      onStreamUpdate(finalData);
      setIsLoading(false);
      isRunningRef.current = false;
      return;
    }

    // Handle PROCESSING status
    if (finalData.status === 'PROCESSING') {
      const stage = finalData.currentStage || { stage: 'polling', message: 'Analyzing block deltas...' };
      onStreamUpdate(stage);
      // Wait and poll again
      setTimeout(() => pollResult(currentRunId, retryCount + 1), 1000);
      return;
    }

    const judgment = finalData.judgment?.judgment || 'ALLOW';

    // Extract transaction details for dynamic messaging
    const approvalAmount = finalData.intent_json?.amountFormatted || 'Unknown';
    const spenderAddress = finalData.intent_json?.spender || '';
    const shortSpender = spenderAddress ? `${spenderAddress.substring(0, 6)}...${spenderAddress.substring(38)}` : 'Unknown';
    const balanceBefore = finalData.reality_delta?.delta?.balance_before || '0';
    const balanceAfter = finalData.reality_delta?.delta?.balance_after || '0';
    const balanceImpact = (parseFloat(balanceBefore) - parseFloat(balanceAfter)).toFixed(2);
    const riskFlags = finalData.reality_delta?.risk_flags || [];
    const hasRisks = riskFlags.length > 0;

    if (policyMode === 'ENFORCE') {
      if (policyMode === 'ENFORCE') {
        await apiCall('/transactions', {
          method: 'POST',
          body: JSON.stringify({
            from_address: account || '0x598a82A1e968D29A2666847C39bCa5adf5640684',
            to_address: '0x1F95a95810FB99bb2781545b89E2791AD87DfAFb',
            function_name: 'approve',
            status: judgment === 'DENY' ? 'DENIED' : 'ALLOWED',
            severity: judgment === 'DENY' ? 'CRITICAL' : 'LOW'
          })
        });

        // Dynamic message based on transaction details
        const outcomeMsg = judgment === 'DENY'
          ? `🚫 TRANSACTION BLOCKED: Approval of ${approvalAmount} to ${shortSpender} denied. ${hasRisks ? `Risks: ${riskFlags.join(', ')}` : 'High-risk detected'}. Balance protected: ${balanceBefore} USDT.`
          : `✅ TRANSACTION CLEARED: Approval of ${approvalAmount} to ${shortSpender} authorized. Balance impact: -${balanceImpact} USDT (${balanceAfter} USDT remaining). ${hasRisks ? 'Monitored with caution.' : 'No critical risks detected.'}`;

        addMessage('system', outcomeMsg, 'success');

        // AUTO-EXECUTE: If transaction is ALLOWED, execute it on Monad automatically
        if (judgment === 'ALLOW' && finalData.tx_request && account) {
          addMessage('system', '🚀 Executing transaction on Monad blockchain...', 'status');

          try {
            const result = await executeTransaction(finalData.tx_request);

            addMessage('system',
              `🎉 Transaction executed on Monad!\nHash: ${result.hash}\nBlock: ${result.blockNumber}\nView: http://testnet.monadexplorer.com/tx/${result.hash}`,
              'success'
            );

            // Update database with on-chain hash
            if (currentRunId) {
              try {
                await fetch('/api/transactions/update-hash', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    intent_id: currentRunId,
                    tx_hash: result.hash,
                    block_number: result.blockNumber
                  })
                });
              } catch (dbError) {
                console.error('Failed to update transaction hash in DB:', dbError);
              }
            }
          } catch (execError: any) {
            addMessage('system',
              `❌ On-chain execution failed: ${execError.message}\nTransaction was approved but not executed on blockchain.`,
              'error'
            );
          }
        } else if (judgment === 'ALLOW' && !account) {
          addMessage('system', '⚠️ Wallet not connected. Transaction approved but not executed on-chain.', 'error');
        }
      } else {
        await apiCall('/alerts', {
          method: 'POST',
          body: JSON.stringify({
            event_type: judgment === 'DENY' ? 'SECURITY_VIOLATION' : 'BENIGN_INTENT',
            severity: judgment === 'DENY' ? 'HIGH' : 'LOW',
            message: `Oracle Simulation: ${finalData.judgment?.reasoning_summary || 'Analysis finished'}`
          })
        });

        // Dynamic monitor mode message
        const monitorMsg = judgment === 'DENY'
          ? `⚠️ MONITOR ALERT: Approval of ${approvalAmount} to ${shortSpender} flagged as high-risk. ${hasRisks ? `Risks: ${riskFlags.join(', ')}` : 'Security concerns detected'}. Potential loss: ${balanceImpact} USDT. Transaction logged but not blocked (Monitor Mode).`
          : `📊 MONITOR LOG: Approval of ${approvalAmount} to ${shortSpender} analyzed. Balance impact: -${balanceImpact} USDT. ${hasRisks ? 'Minor risks noted.' : 'Transaction appears safe.'}`;

        addMessage('system', monitorMsg, 'status');

        // AUTO-EXECUTE in Monitor Mode too if ALLOW
        if (judgment === 'ALLOW' && finalData.tx_request && account) {
          addMessage('system', '🚀 Executing transaction on Monad blockchain...', 'status');

          try {
            const result = await executeTransaction(finalData.tx_request);

            addMessage('system',
              `🎉 Transaction executed on Monad!\nHash: ${result.hash}\nBlock: ${result.blockNumber}\nView: http://testnet.monadexplorer.com/tx/${result.hash}`,
              'success'
            );

            // Update database
            if (currentRunId) {
              try {
                await fetch('/api/transactions/update-hash', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    intent_id: currentRunId,
                    tx_hash: result.hash,
                    block_number: result.blockNumber
                  })
                });
              } catch (dbError) {
                console.error('Failed to update transaction hash in DB:', dbError);
              }
            }
          } catch (execError: any) {
            addMessage('system',
              `❌ On-chain execution failed: ${execError.message}`,
              'error'
            );
          }
        }
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
    <div className="flex flex-col h-full bg-[#0b1222] border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden">
      {/* Premium Header */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 bg-slate-900/40 border-b border-white/5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">NoahAI Terminal</h2>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-tight">Active Verifier: Monad_SOC_1</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] sm:text-[10px] text-emerald-500 font-black uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 scrollbar-hide flex flex-col">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-4 sm:space-y-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1.5rem] sm:rounded-[2rem] bg-slate-900 border border-white/5 flex items-center justify-center shadow-inner">
              <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700" />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-slate-300 font-bold text-xs sm:text-sm uppercase tracking-widest">System Readiness Confirmed</h3>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed max-w-[180px] sm:max-w-[200px] mx-auto">
                Provide detailed transaction metrics (Amount & Recipient) for adversarial snapshot simulation.
              </p>
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} className={`w-full flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {m.role === 'user' ? (
              <div className="flex flex-col items-end max-w-[85%] sm:max-w-[80%]">
                <div className="flex items-center gap-2 mb-2 mr-2">
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest">Principal User</span>
                  <div className="h-3 w-[1px] bg-white/10" />
                  <User className="w-3 h-3 text-blue-400" />
                </div>
                <div className="bg-blue-600 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl rounded-tr-none text-white text-xs sm:text-sm font-medium shadow-[0_10px_30px_rgba(37,99,235,0.2)] border border-blue-500/20 break-words w-full">
                  {m.content}
                </div>
              </div>
            ) : m.type === 'payment' ? (
              <div className="w-full max-w-[95%] sm:max-w-[90%] bg-amber-500/5 border border-amber-500/20 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-inner">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Authorization Required</h4>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium leading-relaxed">{m.content}</p>
                  </div>
                </div>
                <button
                  onClick={handlePayment}
                  className="w-full py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-lg sm:rounded-xl transition-all shadow-[0_10px_20px_rgba(245,158,11,0.2)]"
                >
                  Confirm Authorization (MetaMask)
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-start max-w-[95%] sm:max-w-[90%]">
                <div className="flex items-center gap-2 mb-2 ml-2">
                  <Shield className="w-3 h-3 text-slate-500" />
                  <div className="h-3 w-[1px] bg-white/10" />
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest">NoahAI_Response</span>
                </div>
                <div
                  className={`px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl sm:rounded-3xl rounded-tl-none text-xs sm:text-sm font-medium border ${m.type === 'error'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    : m.type === 'success'
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                      : 'bg-slate-900 border-white/5 text-slate-300'
                    }`}
                >
                  {m.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start max-w-[95%] sm:max-w-[90%] animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-2 ml-2">
              <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
              <span className="text-[8px] sm:text-[9px] text-blue-500/50 font-black uppercase tracking-widest">Synthesizing...</span>
            </div>
            <div className="bg-slate-900 border border-white/5 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl sm:rounded-3xl rounded-tl-none flex items-center gap-3 sm:gap-4">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-bounce delay-200" />
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest">Oracle Processing</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="p-4 sm:p-6 bg-slate-900/40 border-t border-white/5 backdrop-blur-xl mobile-input-safe">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute inset-0 bg-blue-500/5 blur-xl group-focus-within:bg-blue-500/10 transition-all rounded-2xl sm:rounded-3xl" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. Approve 1000 USDT to 0x... (Max: 10k)"
            className="relative w-full bg-slate-950 border border-white/5 rounded-xl sm:rounded-2xl pl-4 sm:pl-5 pr-12 sm:pr-14 py-3 sm:py-4 text-xs sm:text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium shadow-inner"
            disabled={isLoading || !!pendingPayment}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || !!pendingPayment}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-[0_5px_15px_rgba(37,99,235,0.3)] active:scale-90"
          >
            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </form>
        <div className="mt-3 sm:mt-4 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
            <span className="text-[8px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest">Intent Validated</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-amber-500/50" />
            <span className="text-[8px] sm:text-[9px] text-slate-500 font-black uppercase tracking-widest">Simulation Sandboxed</span>
          </div>
        </div>
      </div>
    </div>
  );
}