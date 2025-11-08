'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Routine, Step } from '@/lib/schema';
import { ExternalLink, Share2, Check, MessageCircle } from 'lucide-react';
import ChatDrawer from './ChatDrawer';

interface RoutineScreenProps {
  routine: Routine;
  slug?: string;
}

export default function RoutineScreen({ routine, slug }: RoutineScreenProps) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleShare = async () => {
    const url = slug 
      ? `${window.location.origin}/r/${slug}`
      : window.location.href;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const StepCard = ({ step, timeOfDay }: { step: Step; timeOfDay: 'AM' | 'PM' }) => (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-3">
        <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
          {timeOfDay}
        </span>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-900">{step.title}</h3>
      
      {step.actives.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {step.actives.map((active, idx) => (
            <span
              key={idx}
              className="inline-block rounded-md bg-zinc-50 px-2 py-1 text-xs text-zinc-700"
            >
              {active}
            </span>
          ))}
        </div>
      )}

      <p className="mb-4 text-sm text-zinc-600">{step.why}</p>

      <div className="space-y-3">
        <p className="text-xs font-medium text-zinc-700">Product Options:</p>
        {step.options.length > 0 ? (
          step.options.map((option, idx) => (
            <a
              key={idx}
              href={option.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:border-zinc-300 hover:bg-zinc-100"
            >
              <div className="flex-1">
                <p className="font-medium text-zinc-900">{option.brand}</p>
                <p className="text-sm text-zinc-600">{option.name}</p>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900">
                  {formatPrice(option.price_cents)}
                </span>
                <ExternalLink className="h-4 w-4 text-zinc-400" />
              </div>
            </a>
          ))
        ) : (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-sm text-zinc-500 italic">
              No products found for this step. Consider consulting with a dermatologist for personalized recommendations.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Your Skincare Routine</h1>
            <p className="mt-2 text-zinc-600">
              {routine.profile.goal} • {routine.profile.skin_type} skin
            </p>
          </div>
          <div className="flex items-center gap-2">
            {slug && (
              <button
                onClick={() => setChatOpen(true)}
                className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
              >
                <MessageCircle className="h-4 w-4" />
                Ask Questions
              </button>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Share
                </>
              )}
            </button>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Profile</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-zinc-500">Age Range</p>
              <p className="font-medium text-zinc-900">{routine.profile.age_range}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Skin Type</p>
              <p className="font-medium text-zinc-900 capitalize">{routine.profile.skin_type}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Goal</p>
              <p className="font-medium text-zinc-900 capitalize">{routine.profile.goal}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Budget</p>
              <p className="font-medium text-zinc-900">
                ${(routine.profile.budget_per_month_cents / 100).toFixed(0)}/mo
              </p>
            </div>
          </div>
        </div>

        {/* Routine Columns */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Morning Routine */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900">Morning Routine</h2>
            <div className="space-y-4">
              {routine.morning.length > 0 ? (
                routine.morning.map((step, idx) => (
                  <StepCard key={step.step_id || idx} step={step} timeOfDay="AM" />
                ))
              ) : (
                <p className="text-zinc-500">No morning steps configured</p>
              )}
            </div>
          </div>

          {/* Evening Routine */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900">Evening Routine</h2>
            <div className="space-y-4">
              {routine.evening.length > 0 ? (
                routine.evening.map((step, idx) => (
                  <StepCard key={step.step_id || idx} step={step} timeOfDay="PM" />
                ))
              ) : (
                <p className="text-zinc-500">No evening steps configured</p>
              )}
            </div>
          </div>
        </div>

        {/* Conflicts & Cautions */}
        {(routine.conflicts.length > 0 || routine.cautions.length > 0) && (
          <div className="mt-8 space-y-4">
            {routine.conflicts.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                <h3 className="mb-3 font-semibold text-amber-900">⚠️ Conflicts</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
                  {routine.conflicts.map((conflict, idx) => (
                    <li key={idx}>{conflict}</li>
                  ))}
                </ul>
              </div>
            )}

            {routine.cautions.length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h3 className="mb-3 font-semibold text-blue-900">ℹ️ Cautions</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-blue-800">
                  {routine.cautions.map((caution, idx) => (
                    <li key={idx}>{caution}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs text-zinc-600">
            <strong>Disclaimer:</strong> Educational only, not medical advice. For persistent or
            severe issues, see a board-certified dermatologist.
          </p>
        </div>
      </div>

      {/* Chat Drawer */}
      {slug && (
        <ChatDrawer
          slug={slug}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}

