'use client';

interface TimelineStep {
  block: number;
  description: string;
  timestamp: number;
  stage?: string; // Optional stage identifier
}

interface FutureTimelineProps {
  stages?: TimelineStep[]; // Renamed from timeline to match usage
}

export default function FutureTimeline({ stages = [] }: FutureTimelineProps) {
  // Use stages if provided, otherwise empty array
  const timelineData = stages || [];

  if (timelineData.length === 0) {
    return (
      <div className="bg-gray-900/50 p-8 flex flex-col items-center justify-center text-center h-full">
        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
          <span className="text-2xl">⏳</span>
        </div>
        <p className="text-gray-400 text-sm font-medium">Waiting for simulation data...</p>
        <p className="text-gray-600 text-xs mt-1">Timeline events will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-transparent p-0">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-4 bottom-4 w-px bg-gray-800" />

        <div className="space-y-6 p-6">
          {timelineData.map((step, index) => (
            <div key={index} className="relative flex items-start gap-4">
              {/* Timeline dot */}
              <div className={`relative z-10 w-3 h-3 mt-1.5 rounded-full border-2 ${step.description.toLowerCase().includes('drain') || step.description.toLowerCase().includes('risk')
                  ? 'bg-gray-900 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                  : 'bg-gray-900 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                }`} />

              <div className="flex-1 min-w-0 bg-gray-800/40 rounded-lg p-3 border border-gray-700/50 hover:bg-gray-800/60 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${step.block === 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                    Block +{step.block}
                  </span>
                  {step.description.toLowerCase().includes('drain') && (
                    <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                      RISK DETECTED
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-200 leading-relaxed font-light">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}