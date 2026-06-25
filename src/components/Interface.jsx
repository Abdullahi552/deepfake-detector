import { useState } from 'react';
import UploadPill from './UploadPill';
import Results from './Results';
import { analyzeMedia } from '../services/api';

const Interface = ({ onBack }) => {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (input) => {
    setIsLoading(true);
    setResult(null);

    try {
      let response;
      
      if (input instanceof File) {
        response = await analyzeMedia(input);
      } else if (input.url) {
        response = {
          verdict: 'NEEDS REVIEW',
          confidence: 0.50,
          explanation: ['URL analysis is coming soon. Please upload a file directly or paste text content.'],
        };
      } else if (typeof input === 'string') {
        response = await analyzeMedia(input);
      } else {
        throw new Error('Unsupported input type');
      }
      
      setResult(response);
    } catch (error) {
      console.error('Analysis failed:', error);
      setResult({
        verdict: 'ERROR',
        confidence: 0,
        explanation: [error.message || 'Analysis failed. Please try again.'],
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      {/* Back button */}
      <button
        className="inline-flex items-center gap-2 bg-transparent border-none font-medium text-[#8892b0] hover:text-[#e8edf5] transition-colors text-sm mb-6"
        onClick={onBack}
      >
        <i className="fas fa-arrow-left"></i> Back to Landing
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#e8edf5]">
          <i className="fas fa-shield-halved text-[#0090ff] mr-3"></i>DeepFake Detector
        </h1>
        <p className="text-[#8892b0]">Upload any media or paste a URL. We'll tell you if it's real or AI-generated.</p>
        <p className="text-[#4a5470] text-sm mt-1">
          Supports: Audio (WAV, FLAC, MP3, M4A, OGG) • Video (MP4, AVI, MOV, WebM, FLV) • 
          Image (JPEG, PNG, WEBP) • Text content
        </p>
        <p className="text-[#4a5470] text-xs mt-1">
          ⏱️ Video analysis: 30-90 seconds • First request may take up to 60s (cold start)
        </p>
      </div>

      {/* Upload pill */}
      <UploadPill onAnalyze={handleAnalyze} isLoading={isLoading} />

      {/* Results */}
      <Results result={result} isLoading={isLoading} />
    </div>
  );
};

export default Interface;