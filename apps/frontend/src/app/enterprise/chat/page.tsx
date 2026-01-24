'use client';

import { useState } from 'react';
import ChatWindow from '@/components/ChatWindow';
import JudgmentBanner from '@/components/JudgmentBanner';
import FutureTimeline from '@/components/FutureTimeline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Brain, Activity, Clock, RefreshCw } from 'lucide-react';

export default function ChatPage() {
    const [currentRun, setCurrentRun] = useState<any>(null);
    const [stages, setStages] = useState<any[]>([]);
    const [finalResult, setFinalResult] = useState<any>(null);

    const handleNewRun = (runData: any) => {
        setCurrentRun(runData);
        setStages([]);
        setFinalResult(null);
    };

    const handleStreamUpdate = (stage: any) => {
        setStages((prev) => [...prev, stage]);
        if (stage.stage === 'final') {
            setFinalResult(stage);
        }
    };

    return (
        <div className="p-8 h-[calc(100vh-80px)] overflow-hidden">
            <div className="grid grid-cols-12 gap-8 h-full">
                {/* Chat Column */}
                <div className="col-span-4 h-full flex flex-col">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Brain className="w-8 h-8 text-blue-500" />
                            NoahAI Oracle
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Describe your transaction intent to the adversarial oracle for simulation and risk judgment.
                        </p>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <ChatWindow onNewRun={handleNewRun} onStreamUpdate={handleStreamUpdate} />
                    </div>
                </div>

                {/* Simulation & Judgment Column */}
                <div className="col-span-8 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800">
                    {!currentRun ? (
                        <div className="flex-1 border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center p-12 opacity-50">
                            <Shield className="w-16 h-16 text-gray-700 mb-4" />
                            <h2 className="text-xl font-bold text-gray-500 mb-2">Awaiting Intent</h2>
                            <p className="text-gray-600 max-w-sm">
                                Start a chat with NoahAI to see real-time blockchain simulation, reality deltas, and adversarial risk judgments here.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Status Header */}
                            <Card className="bg-gray-800 border-gray-700 shadow-xl">
                                <CardContent className="py-4 px-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Analysis</p>
                                            <h3 className="text-white font-mono text-xs">{currentRun.runId}</h3>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge className="bg-gray-700 text-gray-300">Hardhat Fork</Badge>
                                        <Badge className="bg-blue-600 text-white animate-pulse">Running</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Judgment Section */}
                            {finalResult?.judgment && (
                                <JudgmentBanner judgment={finalResult.judgment} />
                            )}

                            {/* Timeline & Delta Section */}
                            <div className="grid grid-cols-2 gap-6">
                                <Card className="bg-gray-900 border-gray-800 shadow-inner min-h-[400px]">
                                    <CardHeader className="border-b border-gray-800 bg-gray-900/50">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-purple-400" />
                                                Future Timeline
                                            </CardTitle>
                                            <Badge variant="outline" className="border-gray-700 text-gray-500 text-[10px]">Simulation</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <FutureTimeline stages={finalResult?.timeline || []} />
                                    </CardContent>
                                </Card>

                                <Card className="bg-gray-900 border-gray-800 shadow-inner overflow-hidden">
                                    <CardHeader className="border-b border-gray-800 bg-gray-900/50">
                                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-green-400" />
                                            Reality Delta
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {finalResult?.reality_delta ? (
                                            <div className="space-y-6">
                                                <div className="p-4 bg-gray-950 rounded-xl border border-gray-800">
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-3 tracking-widest text-center">Net Balance Change</p>
                                                    <div className="flex items-center justify-center gap-6">
                                                        <div className="text-center">
                                                            <p className="text-[10px] text-gray-400 mb-1">Before</p>
                                                            <p className="text-xl font-mono text-white font-bold">{finalResult.reality_delta.delta.balance_before}</p>
                                                        </div>
                                                        <div className="h-8 w-px bg-gray-800" />
                                                        <div className="text-center">
                                                            <p className="text-[10px] text-gray-400 mb-1">After</p>
                                                            <p className={`text-xl font-mono font-bold ${parseFloat(finalResult.reality_delta.delta.balance_after) < parseFloat(finalResult.reality_delta.delta.balance_before) ? 'text-red-500' : 'text-green-500'}`}>
                                                                {finalResult.reality_delta.delta.balance_after}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Risk Flags</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {finalResult.reality_delta.risk_flags.length > 0 ? (
                                                            finalResult.reality_delta.risk_flags.map((flag: string) => (
                                                                <Badge key={flag} variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20">
                                                                    {flag}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <Badge variant="outline" className="text-green-500 border-green-500/30">No immediate risks</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center py-20">
                                                <div className="text-center space-y-2">
                                                    <RefreshCw className="w-8 h-8 text-gray-800 animate-spin mx-auto" />
                                                    <p className="text-xs text-gray-600 font-mono">Computing delta...</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
