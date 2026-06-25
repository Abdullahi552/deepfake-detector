import axios from 'axios';

// ============================================================
// API BASE URLS
// ============================================================

const AUDIO_API_URL = 'https://audio-deepfake-detector.reddune-ee354d90.francecentral.azurecontainerapps.io/api/v1';
const TEXT_API_URL = 'https://text-credibility-detector.reddune-ee354d90.francecentral.azurecontainerapps.io';
const VIDEO_API_URL = 'https://deepfake-api.reddune-ee354d90.francecentral.azurecontainerapps.io';
const IMAGE_API_URL = 'http://xai-detector.germanywestcentral.azurecontainer.io:8000';

// ============================================================
// VIDEO DEEPFAKE DETECTION (DeepGuard API)
// ============================================================

export const analyzeVideo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${VIDEO_API_URL}/detect`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000, // 3 minutes for video
    });

    const data = response.data;
    console.log('Video API Response:', data);

    // --- Parse DeepGuard response ---
    const decision = data.decision || 'UNCERTAIN';
    const confidence = data.confidence || 0.5;
    const probReal = data.prob_real || 0.5;
    const reason = data.reason || 'No detailed reason provided.';
    const reportId = data.report_id || null;
    const visualScore = data.visual_score || 0;
    const temporalStd = data.temporal_std || 0;

    // --- Determine verdict based on decision ---
    let verdict = 'UNCERTAIN';
    const decisionMap = {
      'REAL': 'LIKELY AUTHENTIC',
      'FAKE': 'LIKELY SYNTHETIC',
      'UNCERTAIN': 'NEEDS REVIEW',
      'NO_FACE': 'NO FACE DETECTED'
    };
    verdict = decisionMap[decision] || 'UNCERTAIN';

    // --- Build detailed explanation ---
    const explanation = [];

    // Main reason from API
    if (reason) {
      explanation.push(reason);
    }

    // Per-model scores
    if (data.per_model_scores) {
      const models = data.per_model_scores;
      if (models.resnet18 !== undefined) {
        explanation.push(`ResNet-18: ${(models.resnet18 * 100).toFixed(1)}% confidence in fake`);
      }
      if (models.vit_b16 !== undefined) {
        explanation.push(`ViT-B/16: ${(models.vit_b16 * 100).toFixed(1)}% confidence in fake`);
      }
    }

    // Visual score and temporal variance
    if (visualScore !== undefined) {
      explanation.push(`Visual Score: ${(visualScore * 100).toFixed(1)}%`);
    }
    if (temporalStd !== undefined) {
      explanation.push(`Temporal Variance: ${temporalStd.toFixed(4)}`);
    }

    // rPPG metrics
    if (data.rppg) {
      const rppg = data.rppg;
      if (rppg.bpm !== undefined && rppg.bpm > 0) {
        explanation.push(`Heart Rate: ${rppg.bpm.toFixed(1)} BPM`);
      }
      if (rppg.hrv_rmssd !== undefined && rppg.hrv_rmssd > 0) {
        explanation.push(`HRV (RMSSD): ${rppg.hrv_rmssd.toFixed(1)} ms`);
      }
      if (rppg.snr !== undefined) {
        explanation.push(`Signal Quality (SNR): ${rppg.snr.toFixed(1)} dB`);
      }
      if (rppg.kurt !== undefined) {
        explanation.push(`Waveform Kurtosis: ${rppg.kurt.toFixed(2)}`);
      }
    }

    // Overall confidence
    explanation.push(`Overall confidence: ${(confidence * 100).toFixed(1)}%`);
    explanation.push(`Probability of being real: ${(probReal * 100).toFixed(1)}%`);

    return {
      verdict: verdict,
      confidence: confidence,
      explanation: explanation,
      request_id: reportId,
      report_id: reportId,
      report_link: reportId ? `/report/${reportId}` : null,
      raw: data,
      isVideo: true,
      decision: decision,
    };
  } catch (error) {
    console.error('Video API Error:', error);

    let errorMessage = 'Video analysis failed. Please try again.';
    if (error.response) {
      const status = error.response.status;
      if (status === 413) {
        errorMessage = 'Video file is too large. Please upload a smaller file (max 100MB).';
      } else if (status === 400) {
        errorMessage = 'No video file provided or unsupported format. Supported: MP4, AVI, MOV, WebM, FLV';
      } else if (status === 404) {
        errorMessage = 'Report not found or expired. Please re-upload the video.';
      } else if (status === 500) {
        errorMessage = 'Server error during analysis. Please try again.';
      } else {
        errorMessage = `API Error ${status}: ${error.response.data?.detail || 'Unknown error'}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server. The video analysis may be taking longer than expected.';
    }

    throw new Error(errorMessage);
  }
};

// ============================================================
// AUDIO DEEPFAKE DETECTION
// ============================================================

export const analyzeAudio = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${AUDIO_API_URL}/detect`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    const data = response.data;
    console.log('Audio API Response:', data);

    // --- Parse audio response ---
    const prediction = data.prediction || 'unknown';
    const confidence = data.confidence || 0.5;
    const scores = data.scores || {};
    const reportLink = data.report_download_link || null;
    const requestId = data.request_id || null;
    const attentionMaps = data.attention_maps || null;
    const processTimeMs = data.process_time_ms || 0;

    // --- Determine verdict ---
    let verdict = 'POSSIBLY SYNTHETIC';
    const predLower = prediction.toLowerCase();

    // Map prediction to verdict
    const predMap = {
      'bona-fide': 'LIKELY AUTHENTIC',
      'real': 'LIKELY AUTHENTIC',
      'authentic': 'LIKELY AUTHENTIC',
      'spoof': 'LIKELY SYNTHETIC',
      'fake': 'LIKELY SYNTHETIC',
      'synthetic': 'LIKELY SYNTHETIC'
    };
    verdict = predMap[predLower] || 'POSSIBLY SYNTHETIC';

    // --- Build explanation from scores ---
    const explanation = [];

    if (scores && typeof scores === 'object') {
      const modelNames = {
        'wav2vec2': 'Wav2Vec2',
        'aasist': 'AASIST',
        'ensemble': 'Ensemble'
      };
      for (const [model, score] of Object.entries(scores)) {
        const displayName = modelNames[model] || model.charAt(0).toUpperCase() + model.slice(1);
        const status = score > 0.5 ? 'detected synthetic patterns' : 'detected natural patterns';
        explanation.push(`${displayName}: ${(score * 100).toFixed(1)}% — ${status}`);
      }
    }

    // Add overall confidence
    explanation.push(`Overall confidence: ${(confidence * 100).toFixed(1)}%`);

    // Add processing time
    if (processTimeMs) {
      explanation.push(`Analysis time: ${(processTimeMs / 1000).toFixed(2)} seconds`);
    }

    // Add attention map info if available
    if (attentionMaps && attentionMaps.layer_count) {
      explanation.push(`Attention layers analyzed: ${attentionMaps.layer_count}`);
    }

    return {
      verdict: verdict,
      confidence: confidence,
      explanation: explanation,
      request_id: requestId,
      report_link: reportLink,
      raw: data,
      isVideo: false,
      attention_maps: attentionMaps,
    };
  } catch (error) {
    console.error('Audio API Error:', error);
    let errorMessage = 'Analysis failed. Please try again.';
    if (error.response) {
      const status = error.response.status;
      if (status === 413) {
        errorMessage = 'File too large. Maximum size is 50MB.';
      } else if (status === 400) {
        errorMessage = 'Unsupported format. Supported: WAV, FLAC, MP3, M4A, OGG';
      } else if (status === 404) {
        errorMessage = 'Report not found or expired.';
      } else {
        errorMessage = `API Error ${status}: ${error.response.data?.detail || error.response.data?.msg || 'Unknown error'}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server. Please check your connection.';
    }
    throw new Error(errorMessage);
  }
};

// ============================================================
// TEXT CREDIBILITY DETECTION
// ============================================================

export const analyzeText = async (text) => {
  try {
    const response = await axios.post(
      `${TEXT_API_URL}/api/v1/credibility/analyze`,
      { text: text },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 90000, // 90 seconds for cold start
      }
    );

    const data = response.data;
    console.log('Text API Response:', data);

    // --- Parse text response ---
    const score = data.credibility_score || 0;
    const rawScore = data.raw_score || 0;
    const verdictLabel = data.verdict || 'needs_review';
    const xai = data.xai || 'No explanation available.';
    const indicators = data.indicators || {};

    // --- Map verdict to display format ---
    let verdict = 'NEEDS REVIEW';
    const verdictMap = {
      'likely_credible': 'LIKELY AUTHENTIC',
      'needs_review': 'NEEDS REVIEW',
      'likely_misinformation': 'LIKELY MISINFORMATION'
    };
    verdict = verdictMap[verdictLabel] || 'NEEDS REVIEW';

    // --- Build explanation from signals ---
    const explanation = [];

    // XAI explanation from API
    if (xai) {
      explanation.push(xai);
    }

    // Fact check results
    if (indicators.fact_check) {
      const fc = indicators.fact_check;
      if (fc.status === 'matches_found' && fc.matches && fc.matches.length > 0) {
        const matchCount = fc.matches.length;
        explanation.push(`Fact-check: ${matchCount} debunked claim${matchCount > 1 ? 's' : ''} found.`);
        fc.matches.slice(0, 3).forEach((match) => {
          if (match.rating) {
            explanation.push(`  • ${match.publisher || 'Fact-checker'}: ${match.rating}`);
          }
        });
        if (fc.matches.length > 3) {
          explanation.push(`  • And ${fc.matches.length - 3} more matches...`);
        }
      } else if (fc.status === 'no_matches') {
        explanation.push('Fact-check: No matches found in databases.');
      } else if (fc.status === 'api_error') {
        explanation.push('Fact-check: API temporarily unavailable.');
      }
    }

    // ClaimBuster score
    if (indicators.claimbuster) {
      const cb = indicators.claimbuster;
      if (cb.score !== undefined) {
        const cbLabel = cb.label || 'Check-Worthy';
        explanation.push(`ClaimBuster: ${(cb.score * 100).toFixed(0)}% — ${cbLabel}`);
      }
    }

    // Content analysis
    if (indicators.content_analysis) {
      const ca = indicators.content_analysis;
      if (ca.emotional_intensity !== undefined) {
        const intensity = ca.emotional_intensity * 100;
        if (intensity > 60) {
          explanation.push(`High emotional intensity detected (${intensity.toFixed(0)}%)`);
        }
      }
      if (ca.pattern_hits && ca.pattern_hits.length > 0) {
        explanation.push(`Content patterns detected: ${ca.pattern_hits.join(', ')}`);
      }
    }

    // Fallback explanation if nothing else
    if (explanation.length <= 1) {
      if (score >= 0.75) {
        explanation.push('Content shows strong credibility indicators.');
      } else if (score >= 0.33) {
        explanation.push('Content has mixed signals and may need human review.');
      } else {
        explanation.push('Content shows multiple warning signs of misinformation.');
      }
    }

    return {
      verdict: verdict,
      confidence: score,
      explanation: explanation,
      raw: data,
      isVideo: false,
      textAnalysis: {
        rawScore: rawScore,
        verdictLabel: verdictLabel,
        xai: xai,
        indicators: indicators,
        inputText: data.input_text || text,
      }
    };
  } catch (error) {
    console.error('Text API Error:', error);
    let errorMessage = 'Analysis failed. Please try again.';
    if (error.response) {
      const status = error.response.status;
      if (status === 422) {
        errorMessage = 'Invalid request. Please check the text content.';
      } else if (status === 500) {
        errorMessage = 'Server error during analysis. Please try again.';
      } else {
        errorMessage = `API Error ${status}: ${error.response.data?.detail || 'Unknown error'}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server. The AI models may still be loading. Please try again.';
    }
    throw new Error(errorMessage);
  }
};

// ============================================================
// IMAGE DEEPFAKE DETECTION (XAI Fake Image Detector)
// ============================================================

export const analyzeImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${IMAGE_API_URL}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for image
    });

    const data = response.data;
    console.log('Image API Response:', data);

    // --- Parse image response ---
    const analysisId = data.analysis_id || null;
    const prediction = data.prediction || 'UNCERTAIN';
    const confidence = data.confidence || 0.5;
    const probabilities = data.probabilities || { REAL: 50, FAKE: 50 };
    const metadataFindings = data.metadata_findings || [];
    const evidenceItems = data.evidence_items || [];
    const nlExplanation = data.nl_explanation || 'No explanation available.';
    const pdfDownloadUrl = data.pdf_download_url || null;

    // --- Determine verdict ---
    let verdict = 'UNCERTAIN';
    const predMap = {
      'FAKE': 'LIKELY SYNTHETIC',
      'REAL': 'LIKELY AUTHENTIC'
    };
    verdict = predMap[prediction] || 'UNCERTAIN';

    // --- Build explanation from evidence ---
    const explanation = [];

    // Natural language explanation from API
    if (nlExplanation) {
      explanation.push(nlExplanation);
    }

    // Add metadata findings
    if (metadataFindings && metadataFindings.length > 0) {
      const highSeverity = metadataFindings.filter(f => f.severity === 'high');
      if (highSeverity.length > 0) {
        explanation.push(`⚠️ High severity metadata findings: ${highSeverity.map(f => f.flag).join(', ')}`);
      }
      metadataFindings.forEach((f) => {
        if (f.detail) {
          explanation.push(`• ${f.detail}`);
        }
      });
    }

    // Add evidence items summary
    if (evidenceItems && evidenceItems.length > 0) {
      const classifier = evidenceItems.find(e => e.source === 'CLASSIFIER');
      if (classifier && classifier.detail) {
        explanation.push(`• ${classifier.detail}`);
      }
    }

    // Add confidence
    explanation.push(`Overall confidence: ${confidence.toFixed(1)}%`);
    explanation.push(`Probability: FAKE ${probabilities.FAKE?.toFixed(1) || 'N/A'}% / REAL ${probabilities.REAL?.toFixed(1) || 'N/A'}%`);

    // Add attention and Grad-CAM regions
    if (data.attention_regions && data.attention_regions.length > 0) {
      explanation.push(`Attention focused on: ${data.attention_regions.join(', ')}`);
    }
    if (data.gradcam_regions && data.gradcam_regions.length > 0) {
      explanation.push(`Grad-CAM activation: ${data.gradcam_regions.join(', ')}`);
    }

    return {
      verdict: verdict,
      confidence: confidence / 100, // Convert to 0-1 scale
      explanation: explanation,
      request_id: analysisId,
      report_id: analysisId,
      report_link: pdfDownloadUrl,
      raw: data,
      isVideo: false,
      imageAnalysis: {
        analysisId: analysisId,
        prediction: prediction,
        probabilities: probabilities,
        metadataFindings: metadataFindings,
        evidenceItems: evidenceItems,
        nlExplanation: nlExplanation,
      }
    };
  } catch (error) {
    console.error('Image API Error:', error);
    let errorMessage = 'Image analysis failed. Please try again.';
    if (error.response) {
      const status = error.response.status;
      if (status === 400) {
        errorMessage = 'Unsupported file type. Please use JPEG, PNG, or WEBP.';
      } else if (status === 404) {
        errorMessage = 'Report not found or expired.';
      } else if (status === 500) {
        errorMessage = 'Server error during analysis. Please try again.';
      } else {
        errorMessage = `API Error ${status}: ${error.response.data?.detail || 'Unknown error'}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server. Please check your connection.';
    }
    throw new Error(errorMessage);
  }
};

// ============================================================
// MAIN SERVICE — Detect media type and route accordingly
// ============================================================

export const analyzeMedia = async (input) => {
  if (input instanceof File) {
    const fileType = input.type.split('/')[0];

    if (['video'].includes(fileType)) {
      return await analyzeVideo(input);
    }

    if (['audio'].includes(fileType)) {
      return await analyzeAudio(input);
    }

    if (['image'].includes(fileType)) {
      return await analyzeImage(input);
    }

    return {
      verdict: 'POSSIBLY SYNTHETIC',
      confidence: 0.50,
      explanation: ['Unsupported file type. Please use audio, video, or image files.'],
    };
  }

  if (input.url) {
    return {
      verdict: 'NEEDS REVIEW',
      confidence: 0.50,
      explanation: ['URL analysis is coming soon. Please paste the text content directly.'],
    };
  }

  if (typeof input === 'string') {
    return await analyzeText(input);
  }

  throw new Error('Unsupported input type');
};

export default { analyzeMedia, analyzeAudio, analyzeText, analyzeVideo, analyzeImage };