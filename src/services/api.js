import axios from 'axios';

// API Base URLs
const AUDIO_API_URL = 'https://audio-deepfake-detector.reddune-ee354d90.francecentral.azurecontainerapps.io/api/v1';
const TEXT_API_URL = 'https://text-credibility-detector.reddune-ee354d90.francecentral.azurecontainerapps.io';
const VIDEO_API_URL = 'https://deepfake-api.reddune-ee354d90.francecentral.azurecontainerapps.io';

// ============================================================
// VIDEO DEEPFAKE DETECTION
// ============================================================

export const analyzeVideo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${VIDEO_API_URL}/detect`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes (video takes longer)
    });

    const data = response.data;
    console.log('Video API Response:', data);

    // --- Parse the response ---
    const decision = data.decision || 'UNCERTAIN';
    const confidence = data.confidence || 0.5;
    const probReal = data.prob_real || 0.5;
    const reason = data.reason || 'No detailed reason provided.';
    const reportId = data.report_id || null;

    // --- Determine verdict based on decision ---
    let verdict = 'UNCERTAIN';

    switch (decision) {
      case 'REAL':
        verdict = 'LIKELY AUTHENTIC';
        break;
      case 'FAKE':
        verdict = 'LIKELY SYNTHETIC';
        break;
      case 'UNCERTAIN':
        verdict = 'NEEDS REVIEW';
        break;
      case 'NO_FACE':
        verdict = 'NO FACE DETECTED';
        break;
      default:
        verdict = 'UNCERTAIN';
    }

    // --- Build detailed explanation ---
    const explanation = [];

    // Add the main reason
    if (reason) {
      explanation.push(reason);
    }

    // Add metrics
    if (data.visual_score !== undefined) {
      explanation.push(`Visual Score: ${(data.visual_score * 100).toFixed(1)}%`);
    }
    if (data.temporal_std !== undefined) {
      explanation.push(`Temporal Consistency: ${(data.temporal_std * 100).toFixed(1)}%`);
    }

    // Add rPPG metrics if available
    if (data.rppg) {
      if (data.rppg.bpm) {
        explanation.push(`Heart Rate: ${data.rppg.bpm.toFixed(1)} BPM`);
      }
      if (data.rppg.hrv) {
        explanation.push(`HRV: ${data.rppg.hrv.toFixed(1)} ms`);
      }
      if (data.rppg.snr) {
        explanation.push(`Signal Quality: ${data.rppg.snr.toFixed(1)} dB`);
      }
    }

    // Add confidence
    explanation.push(`Overall confidence: ${(confidence * 100).toFixed(1)}%`);
    explanation.push(`Probability of being real: ${(probReal * 100).toFixed(1)}%`);

    return {
      verdict: verdict,
      confidence: confidence,
      explanation: explanation,
      request_id: reportId,
      report_link: reportId ? `/report/${reportId}` : null,
      report_id: reportId,
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
        errorMessage = 'Video file is too large. Please upload a smaller file (max 50MB).';
      } else if (status === 400) {
        errorMessage = 'No video file provided or unsupported format.';
      } else if (status === 404) {
        errorMessage = 'Report not found or expired.';
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

    const prediction = data.prediction || 'unknown';
    const confidence = data.confidence || 0.5;
    const scores = data.scores || {};
    const reportLink = data.report_download_link || null;
    const requestId = data.request_id || null;

    let verdict = 'POSSIBLY SYNTHETIC';
    const predLower = prediction.toLowerCase();
    if (predLower === 'bona-fide' || predLower === 'real' || predLower === 'authentic') {
      verdict = 'LIKELY AUTHENTIC';
    } else if (predLower === 'spoof' || predLower === 'fake' || predLower === 'synthetic') {
      verdict = 'LIKELY SYNTHETIC';
    } else if (confidence < 0.45) {
      verdict = 'LIKELY AUTHENTIC';
    } else if (confidence >= 0.45 && confidence <= 0.55) {
      verdict = 'POSSIBLY SYNTHETIC';
    }

    const explanation = [];

    if (scores && typeof scores === 'object') {
      for (const [model, score] of Object.entries(scores)) {
        const modelName = model.charAt(0).toUpperCase() + model.slice(1).replace(/_/g, ' ');
        const status = score > 0.5 ? 'detected synthetic patterns' : 'detected natural patterns';
        explanation.push(`${modelName}: ${(score * 100).toFixed(1)}% — ${status}`);
      }
    }

    explanation.push(`Overall confidence: ${(confidence * 100).toFixed(1)}%`);

    if (data.emotion_labels && data.emotion_labels.length > 0) {
      explanation.push(`Detected emotion(s): ${data.emotion_labels.join(', ')}`);
    }

    return {
      verdict: verdict,
      confidence: confidence,
      explanation: explanation,
      request_id: requestId,
      report_link: reportLink,
      raw: data,
      isVideo: false,
    };
  } catch (error) {
    console.error('Audio API Error:', error);
    let errorMessage = 'Analysis failed. Please try again.';
    if (error.response) {
      errorMessage = `API Error ${error.response.status}: ${error.response.data?.msg || error.response.data?.detail || error.response.statusText}`;
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
        timeout: 60000,
      }
    );

    const data = response.data;
    console.log('Text API Response:', data);

    const score = data.credibility_score || 0;
    let verdict = 'LIKELY AUTHENTIC';

    if (score >= 0.75) {
      verdict = 'LIKELY AUTHENTIC';
    } else if (score >= 0.33) {
      verdict = 'NEEDS REVIEW';
    } else {
      verdict = 'LIKELY MISINFORMATION';
    }

    const explanation = [];

    if (data.signals?.fact_check?.matches) {
      explanation.push(`Fact-check: ${data.signals.fact_check.matches.length} matches found`);
    }
    if (data.signals?.claimbuster?.score !== undefined) {
      explanation.push(`ClaimBuster credibility: ${Math.round(data.signals.claimbuster.score * 100)}%`);
    }
    if (data.signals?.content_analysis?.flags) {
      data.signals.content_analysis.flags.forEach(flag => {
        explanation.push(flag);
      });
    }

    if (explanation.length === 0) {
      if (score >= 0.75) {
        explanation.push('Content shows strong credibility indicators');
      } else if (score >= 0.33) {
        explanation.push('Content has mixed signals and may need human review');
      } else {
        explanation.push('Content shows multiple warning signs of misinformation');
      }
    }

    return {
      verdict: verdict,
      confidence: score,
      explanation: explanation,
      raw: data,
      isVideo: false,
    };
  } catch (error) {
    console.error('Text API Error:', error);
    let errorMessage = 'Analysis failed. Please try again.';
    if (error.response) {
      errorMessage = `API Error ${error.response.status}: ${error.response.data?.msg || error.response.data?.detail || error.response.statusText}`;
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

    if (fileType === 'image') {
      return {
        verdict: 'POSSIBLY SYNTHETIC',
        confidence: 0.70,
        explanation: ['Image analysis is coming soon.'],
      };
    }

    return {
      verdict: 'POSSIBLY SYNTHETIC',
      confidence: 0.50,
      explanation: ['Unsupported file type.'],
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

export default { analyzeMedia, analyzeAudio, analyzeText, analyzeVideo };