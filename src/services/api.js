import axios from 'axios';

// API Base URLs from your friend
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
      timeout: 60000, // 60 seconds
    });

    // Transform response to our unified format
    const data = response.data;
    
    // Map prediction to verdict
    let verdict = 'LIKELY SYNTHETIC';
    let isFake = true;
    
    if (data.prediction === 'bona-fide' || data.confidence < 0.45) {
      verdict = 'LIKELY AUTHENTIC';
      isFake = false;
    } else if (data.confidence >= 0.45 && data.confidence <= 0.55) {
      verdict = 'POSSIBLY SYNTHETIC';
      isFake = true;
    } else {
      verdict = 'LIKELY SYNTHETIC';
      isFake = true;
    }

    // Build explanation from scores
    const explanation = [];
    if (data.scores) {
      if (data.scores.wav2vec2_score !== undefined) {
        explanation.push(`Wav2Vec2 analysis shows ${data.scores.wav2vec2_score > 0.5 ? 'synthetic' : 'natural'} speech patterns`);
      }
      if (data.scores.aasist_score !== undefined) {
        explanation.push(`AASIST analysis detects ${data.scores.aasist_score > 0.5 ? 'artifacts' : 'no artifacts'}`);
      }
    }

    return {
      verdict: verdict,
      confidence: data.confidence || 0,
      explanation: explanation.length > 0 ? explanation : ['Analysis complete. Review the report for details.'],
      request_id: data.request_id,
      report_link: data.report_download_link || null,
      raw: data
    };
  } catch (error) {
    console.error('Audio API Error:', error);
    throw error;
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
        timeout: 60000, // 60 seconds
      }
    );

    const data = response.data;

    // Transform response to our unified format
    let verdict = 'LIKELY AUTHENTIC';
    const score = data.credibility_score || 0;

    if (score >= 0.75) {
      verdict = 'LIKELY AUTHENTIC';
    } else if (score >= 0.33) {
      verdict = 'NEEDS REVIEW';
    } else {
      verdict = 'LIKELY MISINFORMATION';
    }

    // Build explanation from signals
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

    // Add some default explanations if none were generated
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
    throw error;
  }
};

// ============================================================
// MAIN SERVICE — Detect media type and route accordingly
// ============================================================

export const analyzeMedia = async (input) => {
  // If input is a File object
  if (input instanceof File) {
    const fileType = input.type.split('/')[0];
    
    // Audio files
    if (['audio'].includes(fileType)) {
      return await analyzeAudio(input);
    }
    
    // Video files - check if it's video
    if (fileType === 'video') {
      // Video API not yet available - placeholder
      return {
        verdict: 'POSSIBLY SYNTHETIC',
        confidence: 0.75,
        explanation: ['Video analysis is coming soon. Please check the audio or images for now.'],
      };
    }
    
    // Image files
    if (fileType === 'image') {
      // Image API not yet available - placeholder
      return {
        verdict: 'POSSIBLY SYNTHETIC',
        confidence: 0.70,
        explanation: ['Image analysis is coming soon. Please check the audio or text for now.'],
      };
    }
    
    // Default fallback
    return {
      verdict: 'POSSIBLY SYNTHETIC',
      confidence: 0.50,
      explanation: ['Unsupported file type for automated analysis.'],
    };
  }
  
  // If input has a URL property
  if (input.url) {
    // For URL, we could fetch and analyze the content
    // For now, return a placeholder
    return {
      verdict: 'NEEDS REVIEW',
      confidence: 0.50,
      explanation: ['URL analysis is coming soon. For now, please paste the text content directly.'],
    };
  }
  
  // If input is a string (text)
  if (typeof input === 'string') {
    return await analyzeText(input);
  }

  // Default fallback
  throw new Error('Unsupported input type');
};

export default { analyzeMedia, analyzeAudio, analyzeText };
