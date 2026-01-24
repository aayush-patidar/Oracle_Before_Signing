'use client';

interface TimelineStep {
  block: number;
  description: string;
  timestamp: number;
}

interface FutureTimelineProps {
  timeline: TimelineStep[];
}

export default function FutureTimeline({ timeline }: FutureTimelineProps) {
  if (timeline.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Future Timeline</h3>
        <p className="text-gray-500 text-sm">No simulation results yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Future Timeline</h3>
      <div className="space-y-3">
        {timeline.map((step, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">
                  {step.block}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{step.description}</p>
              <p className="text-xs text-gray-500">
                Block +{step.block}
              </p>
            </div>
            {step.description.toLowerCase().includes('drain') && (
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  ⚠️ Risk
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reality Delta Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Reality Delta</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>Balance changes computed</p>
          <p>Allowance permissions analyzed</p>
          <p>Risk flags evaluated</p>
        </div>
      </div>
    </div>
  );
}