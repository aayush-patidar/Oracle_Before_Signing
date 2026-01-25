'use client';

import { useState, useCallback } from 'react';
import ChatWindow from '@/components/ChatWindow';
import FutureTimeline from '@/components/FutureTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Brain, Activity, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ChatPage() {
    const [currentRun, setCurrentRun] = useState<any>(null);
    const [stages, setStages] = useState<any[]>([]);
    const [finalResult, setFinalResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentStage, setCurrentStage] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleNewRun = useCallback((runData: any) => {
        setCurrentRun(runData);
        setStages([]);
        setFinalResult(null);
        setError(null);
        setCurrentStage('');
        setIsProcessing(!!runData);
    }, []);

    const handleStreamUpdate = useCallback((stage: any) => {
        setStages((prev) => [...prev, stage]);
        if (stage.message) {
            setCurrentStage(stage.message);
        }
        if (stage.error) {
            setError(stage.error);
            setIsProcessing(false);
        }
        if (stage.stage === 'final') {
            setFinalResult(stage);
            setCurrentStage('Analysis Complete');
            setIsProcessing(false);
        }
    }, []);

    return (
        <div className="h-full flex flex-col bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-[#020617] to-[#020617] overflow-hidden">
            <style jsx global>{`
                /* Modern UI Scrollbar System */
                ::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.15);
                }
                * {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255, 255, 255, 0.08) transparent;
                }
            `}</style>

            <div className="max-w-[1800px] mx-auto w-full flex-1 flex flex-col min-h-0 p-6 md:p-8 lg:p-10 pt-0 md:pt-0 lg:pt-0">

                {/* Enterprise Header - Strictly Fixed Height */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 py-8 flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                <Brain className="w-6 h-6 text-blue-400" />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight uppercase">
                                NoahAI <span className="text-blue-500">Oracle</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 text-[12px] font-black uppercase tracking-[0.3em] ml-1">
                            High-Fidelity Adversarial Reasoning • System Terminal v4.2.0
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-md">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] font-black uppercase text-emerald-400 tracking-[0.2em]">Operational Health: 100%</span>
                        </div>
                        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10 backdrop-blur-md">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="text-[11px] font-black uppercase text-blue-400 tracking-[0.2em]">Adversarial Enclave: Secure</span>
                        </div>
                    </div>
                </div>

                {/* Main Viewport Grid - Balanced Top-Level Alignment */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 min-h-0 py-8">
                    {/* Security Terminal Column */}
                    <div className="lg:col-span-4 flex flex-col min-h-0 h-full">
                        <div className="flex-1 overflow-hidden relative group rounded-[3rem] bg-[#0b1222]/80 border border-white/5 shadow-2xl backdrop-blur-xl">
                            <div className="absolute -inset-0.5 bg-gradient-to-b from-blue-500/20 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition duration-1000 blur-sm pointer-events-none" />
                            <ChatWindow onNewRun={handleNewRun} onStreamUpdate={handleStreamUpdate} />
                        </div>
                    </div>

                    {/* Simulation Analysis Column */}
                    <div className="lg:col-span-8 flex flex-col min-h-0 h-full overflow-hidden">
                        {!currentRun ? (
                            <div className="flex-1 bg-slate-900/10 border-2 border-dashed border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-center p-16 group transition-all hover:bg-slate-900/20">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-slate-950 flex items-center justify-center border border-white/5 mb-10 shadow-2xl transition-all duration-1000 group-hover:rotate-[360deg]">
                                    <Shield className="w-12 h-12 text-slate-800 group-hover:text-blue-500/70 transition-colors" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Baseline Link Inactive</h2>
                                <p className="text-slate-600 max-w-sm text-sm leading-relaxed font-bold uppercase tracking-widest opacity-60">
                                    Awaiting cryptographic intent signature. <br />Terminal link required for modeling.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1 min-h-0 h-full overflow-hidden">
                                {/* Predetermined Events Card */}
                                <Card className="bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden rounded-[2.5rem] flex flex-col h-full min-h-0">
                                    <CardHeader className="border-b border-white/5 bg-slate-900/30 px-8 py-5 flex-shrink-0">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3">
                                                <Clock className="w-4 h-4 text-indigo-400" />
                                                Predetermined Events
                                            </CardTitle>
                                            <Badge variant="outline" className="h-5 text-[9px] border-slate-800 text-slate-400 font-bold uppercase tracking-widest bg-black/20">SNAPSHOT</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0 flex-1 overflow-hidden h-full min-h-0">
                                        <div className="h-full overflow-y-auto scrollbar-hide">
                                            <FutureTimeline stages={finalResult?.timeline || []} />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Reality Delta Analysis Card - FIXED & STATIC */}
                                <Card className="bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden rounded-[2.5rem] flex flex-col h-full min-h-0">
                                    <CardHeader className="border-b border-white/5 bg-slate-900/30 px-8 py-5 flex-shrink-0">
                                        <CardTitle className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3">
                                            <Shield className="w-4 h-4 text-emerald-400" />
                                            Reality Delta Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 flex-1 flex flex-col justify-between overflow-hidden h-full min-h-0">
                                        {finalResult?.reality_delta ? (
                                            <div className="flex-1 flex flex-col justify-center space-y-8">
                                                <div className="text-center">
                                                    <p className="text-[10px] text-slate-500 font-black uppercase mb-8 tracking-[0.3em] opacity-80">Protocol Net Change Synthesis</p>

                                                    <div className="flex items-stretch justify-between gap-4">
                                                        <div className="flex-1 bg-black/40 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                                            <p className="text-[8px] text-slate-600 font-black uppercase mb-2 tracking-widest">Base Ledger</p>
                                                            <p className="text-xl font-mono text-slate-400 font-black tracking-tighter">{finalResult.reality_delta.delta.balance_before}</p>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="w-9 h-9 rounded-full bg-slate-950 flex items-center justify-center border border-white/5 shadow-lg">
                                                                <RefreshCw className={`w-3.5 h-3.5 text-slate-700 ${isProcessing ? 'animate-spin' : ''}`} />
                                                            </div>
                                                        </div>
                                                        <div className={`flex-1 p-5 rounded-2xl border flex flex-col items-center justify-center transition-all duration-700 ${isNaN(parseFloat(finalResult.reality_delta.delta.balance_after))
                                                                ? 'bg-amber-500/5 border-amber-500/20'
                                                                : parseFloat(finalResult.reality_delta.delta.balance_after) < parseFloat(finalResult.reality_delta.delta.balance_before)
                                                                    ? 'bg-rose-500/10 border-rose-500/20'
                                                                    : 'bg-emerald-500/5 border-emerald-500/20'
                                                            }`}>
                                                            <p className="text-[9px] text-slate-600 font-black uppercase mb-2 tracking-widest">Post-Event Delta</p>
                                                            <p className={`text-xl font-mono font-black tracking-tighter ${isNaN(parseFloat(finalResult.reality_delta.delta.balance_after))
                                                                    ? 'text-amber-500'
                                                                    : parseFloat(finalResult.reality_delta.delta.balance_after) < parseFloat(finalResult.reality_delta.delta.balance_before)
                                                                        ? 'text-rose-500'
                                                                        : 'text-emerald-500'
                                                                }`}>
                                                                {finalResult.reality_delta.delta.balance_after}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-8 border-t border-white/5">
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4 opacity-80">Adversarial Risk Modifiers</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {finalResult.reality_delta.risk_flags.length > 0 ? (
                                                            finalResult.reality_delta.risk_flags.map((flag: string) => (
                                                                <div key={flag} className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                                    {flag.replace(/_/g, ' ')}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] bg-emerald-500/5 text-emerald-500 border border-emerald-500/20">
                                                                NOMINAL_OPERATIONAL_RISK
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-30">
                                                <RefreshCw className="w-12 h-12 text-slate-700 animate-spin" />
                                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] text-center ml-1">Synthesizing Probabilities...</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
