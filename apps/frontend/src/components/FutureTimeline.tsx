'use client';

import { CheckCircle2, AlertCircle, ShieldEllipsis, Terminal } from 'lucide-react';

interface TimelineStep {
  block?: number;
  event?: string;
  description?: string;
  time?: string;
  status?: 'success' | 'warning' | 'critical' | 'danger';
}

interface FutureTimelineProps {
  stages?: TimelineStep[];
}

export default function FutureTimeline({ stages = [] }: FutureTimelineProps) {
  const timelineData = stages || [];

  if (timelineData.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
        <div className="w-16 h-16 bg-slate-900 border border-white/5 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
          <Terminal className="w-6 h-6 text-slate-700 transition-colors group-hover:text-blue-500" />
        </div>
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Synthesizer Active</h3>
          <p className="text-[11px] text-slate-600 font-medium leading-relaxed max-w-[180px] mx-auto">
            Awaiting adversarial event modeling inputs for future snapshot generation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col bg-black/20">
      <div className="relative flex-1 overflow-y-auto min-h-0 py-8 px-10 scrollbar-hide">
        {/* Modern Timeline Track */}
        <div className="absolute left-[3.1rem] top-0 bottom-0 w-[1px] bg-gradient-to-b from-blue-500/50 via-white/10 to-transparent" />

        <div className="space-y-8">
          {timelineData.map((step, index) => {
            const desc = (step.description || step.event || '').toLowerCase();
            const isDanger = step.status === 'critical' || step.status === 'danger' || desc.includes('drain') || desc.includes('theft');
            const isWarning = step.status === 'warning' || desc.includes('exposure') || desc.includes('risk');

            return (
              <div key={index} className="group relative flex items-start gap-8 animate-in fade-in slide-in-from-left duration-700 fill-mode-both" style={{ animationDelay: `${index * 150}ms` }}>

                {/* Visual Connector / Indicator */}
                <div className="relative mt-2">
                  <div className={`w-10 h-10 rounded-xl border-2 rotate-45 flex items-center justify-center relative z-10 transition-all duration-500 group-hover:rotate-[225deg] ${isDanger
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : isWarning
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    }`}>
                    <div className="-rotate-45 group-hover:rotate-[-225deg] transition-all duration-500">
                      {isDanger ? <AlertCircle className="w-4 h-4" /> : isWarning ? <ShieldEllipsis className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  </div>
                  {/* Ring background */}
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ${isDanger ? 'border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]' : 'border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
                    }`} />
                </div>

                <div className="flex-1 min-w-0 flex flex-col pt-1.5">
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`text-[10px] font-black font-mono tracking-tighter px-2 py-0.5 rounded border ${isDanger ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-900 border-white/10 text-slate-400'
                      }`}>
                      {step.time || `+${step.block}B`}
                    </span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  </div>

                  <div className="space-y-1">
                    <h4 className={`text-xs font-black uppercase tracking-widest ${isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-200'
                      }`}>
                      {step.event || 'System Event'}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {step.description || 'Snapshot synchronization event verified on synthetic chain fork.'}
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info line */}
      <div className="px-10 py-4 bg-slate-900/40 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">Causality Analysis Active</span>
        </div>
        <span className="text-[9px] text-slate-700 font-mono italic">Synthetic_Snap_v4</span>
      </div>
    </div>
  );
}