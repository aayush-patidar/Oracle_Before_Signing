'use client';

import { useState } from 'react';

interface Judgment {
  judgment: 'ALLOW' | 'DENY';
  reasoning_bullets: string[];
  adversarial_question: string;
  override_allowed: boolean;
}

interface JudgmentBannerProps {
  judgment: Judgment;
  onOverride: () => void;
}

export default function JudgmentBanner({ judgment, onOverride }: JudgmentBannerProps) {
  const [showOverride, setShowOverride] = useState(false);
  const [justification, setJustification] = useState('');

  const isAllow = judgment.judgment === 'ALLOW';
  const canOverride = judgment.override_allowed && !isAllow;

  return (
    <div className={`rounded-lg shadow-lg p-6 ${
      isAllow ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className={`text-2xl ${isAllow ? 'text-green-600' : 'text-red-600'}`}>
            {isAllow ? '✅' : '❌'}
          </span>
          <h3 className={`text-lg font-semibold ${
            isAllow ? 'text-green-900' : 'text-red-900'
          }`}>
            {judgment.judgment}
          </h3>
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-4">
        <ul className="space-y-1">
          {judgment.reasoning_bullets.map((bullet, index) => (
            <li key={index} className="text-sm text-gray-700 flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      {/* Adversarial Question */}
      <div className="mb-4">
        <p className={`text-sm font-medium ${
          isAllow ? 'text-green-800' : 'text-red-800'
        }`}>
          {judgment.adversarial_question}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {isAllow && (
          <button
            onClick={() => {
              // Mock signing
              alert('Transaction signed successfully! (Mock implementation)');
            }}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Sign Transaction
          </button>
        )}

        {!isAllow && canOverride && !showOverride && (
          <button
            onClick={() => setShowOverride(true)}
            className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            Request Override
          </button>
        )}

        {!isAllow && !canOverride && (
          <div className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-md text-center text-sm">
            Signing Blocked - No Override Available
          </div>
        )}

        {/* Override Justification */}
        {showOverride && canOverride && (
          <div className="space-y-3">
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why you believe this is safe (must include 'I ACCEPT')"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (justification.toLowerCase().includes('i accept')) {
                    onOverride();
                    alert('Override granted! Transaction can now be signed.');
                  } else {
                    alert('Justification must include "I ACCEPT" (case insensitive)');
                  }
                }}
                disabled={!justification.trim()}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Submit Override
              </button>
              <button
                onClick={() => {
                  setShowOverride(false);
                  setJustification('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}