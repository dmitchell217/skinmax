'use client';

import React, { useState } from 'react';
import SelfieUploader from '@/components/SelfieUploader';
import { FaceShape } from '@/lib/schema';
import { Loader2, ArrowLeft, Copy, Share2, ExternalLink, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StyleItem {
  title: string;
  rationale: string;
  image_urls?: string[];
  affiliate_url?: string;
}

interface StyleBoard {
  haircuts: StyleItem[];
  beards: StyleItem[];
  glasses: StyleItem[];
}

export default function LooksPage() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'results'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [faceShape, setFaceShape] = useState<FaceShape | null>(null);
  const [styleBoard, setStyleBoard] = useState<StyleBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleImageReady = async (file: File) => {
    setImageFile(file);
    setError(null);
    setLoadingAnalysis(true);

    // Analytics: looks_selfie_start
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'looks_selfie_start', {
        event_category: 'looks_playground',
      });
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/face-shape', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to analyze face shape.');
      }

      const shapeResult: FaceShape = await response.json();
      setFaceShape(shapeResult);

      // Analytics: face_shape_done
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'face_shape_done', {
          event_category: 'looks_playground',
          shape: shapeResult.shape,
          confidence: Math.round(shapeResult.confidence * 100) / 100,
        });
      }

      // Load style board
      const boardResponse = await fetch(`/api/style-board?shape=${shapeResult.shape}&confidence=${shapeResult.confidence}`);
      if (!boardResponse.ok) {
        throw new Error('Failed to load style recommendations');
      }
      const board: StyleBoard = await boardResponse.json();
      setStyleBoard(board);
      setStep('results');
    } catch (err: any) {
      console.error('Face shape analysis error:', err);
      setError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleCopy = async () => {
    if (!faceShape || !styleBoard) return;

    const text = `Face Shape: ${faceShape.shape}\n\nHaircuts:\n${styleBoard.haircuts.map(h => `- ${h.title}: ${h.rationale}`).join('\n')}\n\nBeards:\n${styleBoard.beards.map(b => `- ${b.title}: ${b.rationale}`).join('\n')}\n\nGlasses:\n${styleBoard.glasses.map(g => `- ${g.title}: ${g.rationale}`).join('\n')}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = () => {
    // Analytics: looks_share_click
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'looks_share_click', {
        event_category: 'looks_playground',
        shape: faceShape?.shape,
      });
    }

    if (navigator.share) {
      navigator.share({
        title: 'My Face Shape Analysis',
        text: `My face shape is ${faceShape?.shape}! Check out my style recommendations.`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const addAffiliateRef = (url: string): string => {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('ref', 'skinroute');
      return urlObj.toString();
    } catch {
      return url;
    }
  };

  const handleAffiliateClick = (item: StyleItem) => {
    if (item.affiliate_url) {
      // Analytics: affiliate_click
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'affiliate_click', {
          event_category: 'looks_playground',
          event_label: item.title,
          shape: faceShape?.shape,
        });
      }

      const url = addAffiliateRef(item.affiliate_url);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-zinc-900">Looks Playground</h1>
          <div className="w-1/4" /> {/* Spacer */}
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm text-amber-900 font-medium">Cosmetic Coaching Only</p>
              <p className="text-xs text-amber-700 mt-1">
                This is cosmetic coaching, not medical advice. Recommendations are based on general styling principles and may vary based on personal preference.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {step === 'upload' && (
          <div className="flex flex-col items-center">
            <SelfieUploader onImageReady={handleImageReady} />
            {loadingAnalysis && (
              <div className="mt-6 flex items-center gap-2 text-zinc-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing face shape...</span>
              </div>
            )}
          </div>
        )}

        {step === 'results' && faceShape && styleBoard && (
          <div className="space-y-8">
            {/* Face Shape Result Chip */}
            <div className="flex items-center justify-center">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 ${
                faceShape.confidence >= 0.6
                  ? 'bg-green-50 border-green-200 text-green-900'
                  : faceShape.confidence >= 0.5
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <span className="text-lg font-semibold capitalize">{faceShape.shape}</span>
                <span className="text-sm opacity-75">
                  {Math.round(faceShape.confidence * 100)}% confidence
                </span>
              </div>
            </div>

            {faceShape.confidence < 0.5 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <strong>Low confidence</strong>—photo angle/lighting may affect shape. Try again in better lighting with a front-facing photo.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                {copied ? (
                  <>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Recommendations
                  </>
                )}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>

            {/* Haircut Advisor */}
            <section>
              <h2 className="text-2xl font-bold text-zinc-900 mb-4">Haircut Recommendations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {styleBoard.haircuts.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-zinc-200 p-4 shadow-sm">
                    <h3 className="font-semibold text-zinc-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-zinc-600 mb-3">{item.rationale}</p>
                    {item.image_urls && item.image_urls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {item.image_urls.slice(0, 2).map((url, imgIdx) => (
                          <img
                            key={imgIdx}
                            src={url}
                            alt={`${item.title} example ${imgIdx + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Beard Advisor */}
            <section>
              <h2 className="text-2xl font-bold text-zinc-900 mb-4">Beard Recommendations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {styleBoard.beards.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-zinc-200 p-4 shadow-sm">
                    <h3 className="font-semibold text-zinc-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-zinc-600 mb-3">{item.rationale}</p>
                    {item.image_urls && item.image_urls.length > 0 && (
                      <img
                        src={item.image_urls[0]}
                        alt={`${item.title} example`}
                        className="w-full h-48 object-cover rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Glasses Advisor */}
            <section>
              <h2 className="text-2xl font-bold text-zinc-900 mb-4">Glasses Recommendations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {styleBoard.glasses.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-zinc-200 p-4 shadow-sm">
                    <h3 className="font-semibold text-zinc-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-zinc-600 mb-3">{item.rationale}</p>
                    {item.affiliate_url && (
                      <button
                        onClick={() => handleAffiliateClick(item)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        <span>Shop Now</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Footer Disclaimer */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mt-8">
              <p className="text-xs text-zinc-600">
                <strong>Disclaimer:</strong> This analysis is for cosmetic coaching purposes only and is not medical advice.
                Recommendations are based on general styling principles and may vary based on personal preference, hair texture, and lifestyle.
              </p>
            </div>

            {/* Start Over Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setStep('upload');
                  setImageFile(null);
                  setFaceShape(null);
                  setStyleBoard(null);
                  setError(null);
                }}
                className="px-6 py-2 text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

