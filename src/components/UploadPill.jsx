import { useState, useRef } from 'react';

const UploadPill = ({ onAnalyze, isLoading }) => {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [isGlowing, setIsGlowing] = useState(false);
  const [showTextArea, setShowTextArea] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUrl('');
      setText('');
      setShowTextArea(false);
      setIsGlowing(true);
    }
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    setText('');
    setShowTextArea(false);
    if (e.target.value.trim()) {
      setIsGlowing(true);
    } else if (!file && !text) {
      setIsGlowing(false);
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    setUrl('');
    if (e.target.value.trim()) {
      setIsGlowing(true);
    } else if (!file && !url) {
      setIsGlowing(false);
    }
  };

  const toggleTextArea = () => {
    setShowTextArea(!showTextArea);
    if (!showTextArea) {
      setIsGlowing(true);
    } else {
      if (!file && !url && !text) setIsGlowing(false);
    }
  };

  const handleAnalyze = () => {
    if (file) {
      onAnalyze(file);
    } else if (url.trim()) {
      onAnalyze({ url: url.trim() });
    } else if (text.trim()) {
      onAnalyze(text.trim());
    } else {
      alert('Please upload a file, paste a URL, or enter text to analyze.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className={`bg-[#141a26] border-2 border-[rgba(255,255,255,0.06)] rounded-[60px] p-3 pl-7 flex flex-wrap items-center gap-3 transition-all duration-300 cursor-pointer ${
          isGlowing ? 'border-[#0090ff] animate-[glowPulse_2s_ease-in-out_infinite]' : ''
        }`}
        onClick={(e) => {
          if (e.target.closest('.url-input') || e.target.closest('.text-input') || 
              e.target.closest('.analyze-btn') || e.target.closest('.text-toggle')) return;
          fileInputRef.current?.click();
        }}
      >
        <div className="text-[#6ab0ff] text-xl">
          <i className="fas fa-cloud-upload-alt"></i>
        </div>

        <div className="flex-1 text-[#4a5470] font-medium min-w-[100px]">
          {file ? (
            <strong className="text-[#e8edf5] font-semibold">{file.name}</strong>
          ) : (
            <>
              <strong className="text-[#e8edf5] font-semibold">Drop a file here</strong>
              <span className="hidden sm:inline"> &nbsp;or&nbsp; </span>
              <span className="text-[#6ab0ff]">browse</span>
            </>
          )}
        </div>

        <span className="text-[#4a5470] text-sm hidden sm:inline">or</span>

        <input
          type="text"
          className="url-input bg-transparent border-b border-[rgba(255,255,255,0.06)] text-[#e8edf5] text-sm py-1.5 min-w-[120px] outline-none flex-1"
          placeholder="Paste URL..."
          value={url}
          onChange={handleUrlChange}
          onFocus={() => setIsGlowing(true)}
          onBlur={() => {
            if (!file && !url.trim() && !text) setIsGlowing(false);
          }}
        />

        <button
          type="button"
          className="text-toggle text-[#6ab0ff] text-sm hover:text-[#e8edf5] transition-colors"
          onClick={(e) => { e.stopPropagation(); toggleTextArea(); }}
          title="Paste text content"
        >
          <i className="fas fa-edit"></i>
        </button>

        <button
          className="analyze-btn bg-[#0090ff] hover:bg-[#1a9aff] text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
          onClick={handleAnalyze}
          disabled={isLoading}
        >
          {isLoading ? (
            <><i className="fas fa-spinner fa-spin mr-2"></i> Analyzing...</>
          ) : (
            <><i className="fas fa-arrow-right mr-2"></i> Analyze</>
          )}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="audio/*,.wav,.flac,.mp3,.m4a,.ogg,video/*,.mp4,.avi,.mov,.mkv,.webm,.txt"
        />
      </div>

      {/* Text area (hidden by default) */}
      {showTextArea && (
        <div className="mt-3">
          <textarea
            className="w-full bg-[#141a26] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-[#e8edf5] text-sm outline-none focus:border-[#0090ff] transition-colors resize-none"
            rows="4"
            placeholder="Paste text content to analyze (articles, social media posts, WhatsApp forwards, etc.)..."
            value={text}
            onChange={handleTextChange}
            onFocus={() => setIsGlowing(true)}
            onBlur={() => {
              if (!file && !url && !text.trim()) setIsGlowing(false);
            }}
          />
          <div className="text-[#4a5470] text-xs mt-1 text-right">
            {text.length} characters
          </div>
        </div>
      )}

      <div className="flex gap-6 justify-center mt-4 text-[#4a5470] text-sm flex-wrap">
        <span><i className="fas fa-microphone text-[#6ab0ff] mr-1.5"></i> Audio</span>
        <span><i className="fas fa-file-alt text-[#6ab0ff] mr-1.5"></i> Text</span>
        <span><i className="fas fa-video text-[#6ab0ff] mr-1.5"></i> Video</span>
        <span><i className="fas fa-image text-[#4a5470] mr-1.5"></i> Image (coming soon)</span>
      </div>
    </div>
  );
};

export default UploadPill;