import axios from 'axios';

// API Base URLs
const AUDIO_API_URL = 'https://audio-deepfake-detector.reddune-ee354d90.francecentral.azurecontainerapps.io/api/v1';
const TEXT_API_URL = 'https://text-credibility-detector.reddune-ee354d90.francecentral.azurecontainerapps.io';

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
    console.log('Audio API Response:', data); // Debug log

    // --- Map API response to our unified format ---
    
    // Determine verdict based on prediction_label
    let verdict = 'POSSIBLY SYNTHETIC';
    let confidence = data.avg_confidence || 0.5;
    
    // Check if we have model_predictions
    if (data.model_predictions) {
      // Calculate average confidence from all models
      const scores = Object.values(data.model_predictions);
      confidence = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    
    // Use prediction_label if available
    if (data.prediction_label) {
      const label = data.prediction_label.toLowerCase();
      if (label === 'bona-fide' || label === 'real' || label === 'authentic') {
        verdict = 'LIKELY AUTHENTIC';
      } else if (label === 'spoof' || label === 'fake' || label === 'synthetic') {
        verdict = 'LIKELY SYNTHETIC';
      } else {
        verdict = 'POSSIBLY SYNTHETIC';
      }
    } else if (confidence < 0.45) {
      verdict = 'LIKELY AUTHENTIC';
    } else if (confidence >= 0.45 && confidence <= 0.55) {
      verdict = 'POSSIBLY SYNTHETIC';
    } else {
      verdict = 'LIKELY SYNTHETIC';
    }

    // --- Build explanation from available data ---
    const explanation = [];
    
    if (data.model_predictions) {
      const models = data.model_predictions;
      for (const [model, score] of Object.entries(models)) {
        const modelName = model.charAt(0).toUpperCase() + model.slice(1);
        const status = score > 0.5 ? 'detected synthetic patterns' : 'detected natural patterns';
        explanation.push(`${modelName} analysis: ${score.toFixed(2)} confidence — ${status}`);
      }
    }
    
    if (data.emotion_labels && data.emotion_labels.length > 0) {
      explanation.push(`Detected emotion(s): ${data.emotion_labels.join(', ')}`);
    }
    
    // Add overall confidence
    explanation.push(`Overall confidence: ${(confidence * 100).toFixed(1)}%`);

    return {
      verdict: verdict,
      confidence: confidence,
      explanation: explanation,
      request_id: data.request_id || null,
      report_link: data.report_download_link || null,
      raw: data
    };
  } catch (error) {
    console.error('Audio API Error:', error);
    
    // Get the actual error message from the response
    let errorMessage = 'Analysis failed. Please try again.';
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      errorMessage = `API Error: ${error.response.data?.msg || error.response.data?.detail || error.response.statusText || 'Unknown error'}`;
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
      explanation.push(`Fact-check: ${data.signals.fact_check.matches.length} matches found with known claims`);
    }
    if (data.signals?.claimbuster?.score !== undefined) {
      explanation.push(`ClaimBuster credibility score: ${Math.round(data.signals.claimbuster.score * 100)}%`);
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
      raw: data
    };
  } catch (error) {
    console.error('Text API Error:', error);
    let errorMessage = 'Analysis failed. Please try again.';
    if (error.response) {
      errorMessage = `API Error: ${error.response.data?.msg || error.response.data?.detail || error.response.statusText || 'Unknown error'}`;
    } else if (error.request) {
      errorMessage = 'No response from server. Please check your connection.';
    }
    throw new Error(errorMessage);
  }
};

// ============================================================
// MAIN SERVICE
// ============================================================

export const analyzeMedia = async (input) => {
  if (input instanceof File) {
    const fileType = input.type.split('/')[0];
    
    if (['audio'].includes(fileType)) {
      return await analyzeAudio(input);
    }
    
    if (fileType === 'video') {
      return {
        verdict: 'POSSIBLY SYNTHETIC',
        confidence: 0.75,
        explanation: ['Video analysis is coming soon.'],
      };
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

export default { analyzeMedia, analyzeAudio, analyzeText };