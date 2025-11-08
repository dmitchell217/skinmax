'use client';

import { TonightPlan as TonightPlanType, TonightPlanStep } from '@/lib/schema';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface TonightPlanProps {
  plan: TonightPlanType;
}

export default function TonightPlan({ plan }: TonightPlanProps) {
  const [copied, setCopied] = useState(false);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleCopyPlan = async () => {
    const planText = plan.plan
      .map((step, idx) => {
        const products = step.product_options
          .map(opt => `  - ${opt.brand} ${opt.name} (${formatPrice(opt.price_cents)})`)
          .join('\n');
        return `${idx + 1}. ${step.step.toUpperCase()}\n   ${step.why}\n   Actives: ${step.actives.join(', ')}\n   Products:\n${products}`;
      })
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(planText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenProducts = () => {
    plan.plan.forEach((step) => {
      step.product_options.forEach((product) => {
        window.open(product.url, '_blank', 'noopener,noreferrer');
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900">Tonight's Plan</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopyPlan}
            className="flex items-center gap-2 px-3 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors text-sm"
            title="Copy plan to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Plan
              </>
            )}
          </button>
          <button
            onClick={handleOpenProducts}
            className="flex items-center gap-2 px-3 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors text-sm"
            title="Open all product links"
          >
            <ExternalLink className="h-4 w-4" />
            Open Products
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {plan.plan.map((step, idx) => (
          <StepTile key={idx} step={step} stepNumber={idx + 1} formatPrice={formatPrice} />
        ))}
      </div>

      <p className="text-xs text-zinc-500 text-center">
        Educational only, not medical advice.
      </p>
    </div>
  );
}

function StepTile({
  step,
  stepNumber,
  formatPrice,
}: {
  step: TonightPlanStep;
  stepNumber: number;
  formatPrice: (cents: number) => string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-3">
        <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
          Step {stepNumber}
        </span>
        <h3 className="mt-2 text-lg font-semibold text-zinc-900 capitalize">{step.step}</h3>
      </div>

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
        {step.product_options.length > 0 ? (
          step.product_options.map((option, idx) => (
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
              No products found for this step.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

