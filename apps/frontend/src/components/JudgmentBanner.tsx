'use client';

import { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, ChevronRight, Lock } from 'lucide-react';

interface Judgment {
  judgment: 'ALLOW' | 'DENY';
  reasoning_bullets: string[];
  adversarial_question?: string;
  override_allowed: boolean;
  monitor_mode_override?: boolean;
  warning?: string;
  risk_score?: number;
}

interface JudgmentBannerProps {
  judgment: Judgment;
  onOverride: () => void;
}

export default function JudgmentBanner({ judgment, onOverride }: JudgmentBannerProps) {
  const [showOverride, setShowOverride] = useState(false);
  const [justification, setJustification] = useState('');

  const isAllow = judgment.judgment === 'ALLOW' || !!judgment.monitor_mode_override;
  const isWarning = !!judgment.monitor_mode_override || judgment.warning === 'INSUFFICIENT_FUNDS';
  const riskScore = judgment.risk_score ?? (isAllow ? 5 : 95);

  return (
    <div className={`relative overflow-hidden rounded-[2.5rem] border transition-all duration-500 shadow-2xl ${isWarning
        ? 'bg-amber-950/20 border-amber-500/30 shadow-amber-900/10'
        : isAllow
          ? 'bg-emerald-950/20 border-emerald-500/30 shadow-emerald-900/5'
          : 'bg-rose-950/20 border-rose-500/30 shadow-rose-900/10'
      }`}>
      {/* Decorative Background Element */}
      <div className={`absolute top-0 right-0 w-96 h-96 -mr-48 -mt-48 rounded-full blur-[120px] opacity-20 pointer-events-none ${isWarning ? 'bg-amber-500' : isAllow ? 'bg-emerald-500' : 'bg-rose-500'
        }`} />

      <div className="relative p-10 md:p-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">

          <div className="flex-1 flex items-start gap-8">
            <div className={`mt-1 p-6 rounded-3xl border-2 flex items-center justify-center transition-transform hover:rotate-6 ${isWarning
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
                : isAllow
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
              }`}>
              {!isAllow ? <XCircle className="w-10 h-10" /> : isWarning ? <AlertTriangle className="w-10 h-10 font-bold" /> : <CheckCircle className="w-10 h-10" />}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className={`px-3 py-1 rounded-lg border text-[11px] font-black uppercase tracking-[0.2em] ${isWarning ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : isAllow ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                    }`}>
                    {judgment.monitor_mode_override ? 'Monitor Override' : 'Simulation Verdict'}
                  </div>
                  <div className="h-5 w-px bg-white/10" />
                  <span className="text-xs text-slate-500 font-black uppercase tracking-[0.2em]">Risk: {riskScore}/100</span>
                </div>

                <h1 className={`text-5xl font-black uppercase tracking-tighter ${isWarning ? 'text-amber-400' : isAllow ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                  {judgment.judgment === 'DENY' ? 'Transaction Blocked' : isWarning ? 'Warning Issued' : 'Verified Secure'}
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
                {judgment.reasoning_bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-4 animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isWarning ? 'text-amber-500/50' : isAllow ? 'text-emerald-500/50' : 'text-rose-500/50'}`} />
                    <span className="text-base font-bold text-slate-200 tracking-tight leading-relaxed">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-80 space-y-6 pt-8 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/5 lg:pl-12 flex flex-col justify-center">
            {isAllow ? (
              <button
                onClick={() => alert('Final verification signature requested...')}
                className={`group relative w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-xs overflow-hidden transition-all hover:scale-105 active:scale-95 ${isWarning
                    ? 'bg-amber-500 text-black shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:bg-amber-400'
                    : 'bg-emerald-500 text-black shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:bg-emerald-400'
                  }`}
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <Lock className="w-5 h-5" />
                  {isWarning ? 'Sign with Risk' : 'Execute Securely'}
                </div>
              </button>
            ) : judgment.override_allowed && !showOverride ? (
              <button
                onClick={() => setShowOverride(true)}
                className="w-full h-16 bg-white/5 border border-white/10 rounded-[1.5rem] font-bold uppercase tracking-widest text-xs text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 hover:border-white/20"
              >
                <Shield className="w-5 h-5 text-rose-500" />
                Request Policy Override
              </button>
            ) : !isAllow && !judgment.override_allowed ? (
              <div className="w-full h-16 bg-rose-500/5 border border-rose-500/20 rounded-[1.5rem] flex flex-col items-center justify-center opacity-80 backdrop-blur-sm">
                <span className="text-[10px] font-black uppercase text-rose-500/60 tracking-widest leading-none mb-1">Execution Pipeline</span>
                <span className="text-[12px] font-black uppercase text-rose-500 tracking-tighter">Hard Restricted</span>
              </div>
            ) : null}

            <p className="text-[11px] text-slate-500 text-center uppercase font-black tracking-widest leading-relaxed">
              Adversarial simulation synthesized via forked block snapshot.
            </p>
          </div>
        </div>

        {/* Override Section */}
        {showOverride && (
          <div className="mt-10 pt-10 border-t border-white/5 space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-black/40 rounded-3xl p-8 border border-white/5">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Critical Override Justification Required</p>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explain why you are bypassing security protocols (must include 'I ACCEPT RISK')"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder:text-slate-700 min-h-[120px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  if (justification.toUpperCase().includes('I ACCEPT RISK')) {
                    onOverride();
                    setShowOverride(false);
                    alert('Governance Override Applied. Signature enabled.');
                  } else {
                    alert('Verification phrase "I ACCEPT RISK" required.');
                  }
                }}
                className="flex-1 h-14 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-rose-950/20"
              >
                Submit Governance Override
              </button>
              <button
                onClick={() => setShowOverride(false)}
                className="px-10 h-14 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase tracking-widest text-xs rounded-2xl transition-all"
              >
                Abort
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}