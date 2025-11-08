'use client';

import { useState } from 'react';
import SelfieUploader from '@/components/SelfieUploader';
import ReadoutCard from '@/components/ReadoutCard';
import TonightPlan from '@/components/TonightPlan';
import { VisionSummary, TonightPlan as TonightPlanType } from '@/lib/schema';
import { Loader2 } from 'lucide-react';

export default function GlowPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [visionSummary, setVisionSummary] = useState<VisionSummary | null>(null);
  const [tonightPlan, setTonightPlan] = useState<TonightPlanType | null>(null);
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageReady = async (file: File) => {
    setImageFile(file);
    setVisionSummary(null);
    setTonightPlan(null);
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/vision-score', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze image');
      }

      const data = await response.json();
      setVisionSummary(data.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image');
      console.error('Vision score error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildPlan = async () => {
    if (!visionSummary) return;

    setPlanLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tonight-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vision_summary: visionSummary,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate plan');
      }

      const data = await response.json();
      setTonightPlan(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate plan');
      console.error('Tonight plan error:', err);
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Glow Score</h1>
          <p className="text-zinc-600">
            Upload a photo to get your personalized skin analysis and tonight's skincare plan.
          </p>
        </div>

        {/* Upload Section */}
        {!visionSummary && (
          <div className="mb-8">
            <SelfieUploader onImageReady={handleImageReady} />
            {loading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-zinc-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing your photo...</span>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Readout Card */}
        {visionSummary && (
          <div className="mb-8">
            <ReadoutCard summary={visionSummary} onBuildPlan={handleBuildPlan} />
            {planLoading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-zinc-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Generating your plan...</span>
              </div>
            )}
          </div>
        )}

        {/* Tonight's Plan */}
        {tonightPlan && (
          <div className="mb-8">
            <TonightPlan plan={tonightPlan} />
          </div>
        )}

        {/* Reset Button */}
        {(visionSummary || tonightPlan) && (
          <div className="text-center">
            <button
              onClick={() => {
                setImageFile(null);
                setVisionSummary(null);
                setTonightPlan(null);
                setError(null);
              }}
              className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

