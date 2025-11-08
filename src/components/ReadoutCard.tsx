'use client';

import { VisionSummary } from '@/lib/schema';
import { Sparkles, AlertCircle } from 'lucide-react';

interface ReadoutCardProps {
  summary: VisionSummary;
  onBuildPlan?: () => void;
}

export default function ReadoutCard({ summary, onBuildPlan }: ReadoutCardProps) {
  // Calculate percentage for radial gauge
  const percentage = summary.glow_score;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Your Glow Score</h2>
        {summary.confidence < 0.5 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Low confidence—try again in brighter light for a more accurate assessment.
            </p>
          </div>
        )}
        {summary.needs_better_photo && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Photo quality could be better. For best results, use good lighting and face the camera directly.
            </p>
          </div>
        )}
      </div>

      {/* Radial Gauge */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90" width="128" height="128">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-zinc-200"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`transition-all duration-500 ${
                percentage >= 80
                  ? 'text-green-500'
                  : percentage >= 60
                  ? 'text-blue-500'
                  : percentage >= 40
                  ? 'text-amber-500'
                  : 'text-red-500'
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-zinc-900">{summary.glow_score}</div>
              <div className="text-xs text-zinc-500">/ 100</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscores */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-zinc-50 rounded-lg">
          <div className="text-xs text-zinc-500 mb-1">Acne</div>
          <div className="text-lg font-semibold text-zinc-900">
            {summary.subscores.acne.toFixed(1)}/5
          </div>
        </div>
        <div className="text-center p-3 bg-zinc-50 rounded-lg">
          <div className="text-xs text-zinc-500 mb-1">Redness</div>
          <div className="text-lg font-semibold text-zinc-900">
            {summary.subscores.redness.toFixed(1)}/5
          </div>
        </div>
        <div className="text-center p-3 bg-zinc-50 rounded-lg">
          <div className="text-xs text-zinc-500 mb-1">Oil/Dry</div>
          <div className="text-lg font-semibold text-zinc-900">
            {summary.subscores.oil_dry.toFixed(1)}/5
          </div>
        </div>
        <div className="text-center p-3 bg-zinc-50 rounded-lg">
          <div className="text-xs text-zinc-500 mb-1">Irritation</div>
          <div className="text-lg font-semibold text-zinc-900">
            {summary.subscores.irritation.toFixed(1)}/5
          </div>
        </div>
      </div>

      {/* Issues */}
      {summary.issues.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-zinc-700 mb-2">Observations</h3>
          <div className="flex flex-wrap gap-2">
            {summary.issues.map((issue, idx) => (
              <span
                key={idx}
                className="inline-block rounded-md bg-amber-50 px-3 py-1 text-xs text-amber-800 border border-amber-200"
              >
                {issue}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {summary.badges.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-zinc-700 mb-2">Highlights</h3>
          <div className="flex flex-wrap gap-2">
            {summary.badges.map((badge, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md bg-green-50 px-3 py-1 text-xs text-green-800 border border-green-200"
              >
                <Sparkles className="h-3 w-3" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA Button */}
      {onBuildPlan && (
        <button
          onClick={onBuildPlan}
          className="w-full py-3 px-4 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium flex items-center justify-center gap-2"
        >
          Build My Fix
        </button>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-zinc-500 mt-4 text-center">
        Educational only, not medical advice.
      </p>
    </div>
  );
}

