import { useState, useRef } from 'react';

const UploadPill = ({ onAnalyze, isLoading }) => {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [isGlowing, setIsGlowing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUrl('');
      setIsGlowing(true);
    }
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    if (e.target.value.trim()) {
      setIsGlowing(true);
    } else if (!file) {
      setIsGlowing(false);
    }
  };

  const handleAnalyze = () => {
    if (file) {
      onAnalyze(file);
    } else if (url.trim()) {
      onAnalyze({ url: url.trim() });
    } else {
      alert('Please upload a file or paste a URL first.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className={`bg-[#141a26] border-2 border-[rgba(255,255,255,0.06)] rounded-[60px] p-3 pl-7 flex items-center gap-4 transition-all duration-300 cursor-pointer ${
          isGlowing ? 'border-[#0090ff] animate-[glowPulse_2s_ease-in-out_infinite]' : ''
        }`}
        onClick={(e) => {
          if (e.target.closest('.url-input') || e.target.closest('.analyze-btn')) return;
          fileInputRef.current?.click();
        }}
      >
        <div className="text-[#6ab0ff] text-xl">
          <i className="fas fa-cloud-upload-alt"></i>
        </div>

        <div className="flex-1 text-[#4a5470] font-medium">
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
          className="url-input bg-transparent border-b border-[rgba(255,255,255,0.06)] text-[#e8edf5] text-sm py-1.5 min-w-[140px] outline-none"
          placeholder="Paste URL..."
          value={url}
          onChange={handleUrlChange}
          onFocus={() => setIsGlowing(true)}
          onBlur={() => {
            if (!file && !url.trim()) setIsGlowing(false);
          }}
        />

        <button
          className="analyze-btn bg-[#0090ff] hover:bg-[#1a9aff] text-white px-8 py-3 rounded-full font-semibold text-sm transition-all duration-200 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
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
          accept="image/*,audio/*,video/*,.txt"
        />
      </div>

      <div className="flex gap-6 justify-center mt-4 text-[#4a5470] text-sm">
        <span><i className="fas fa-image text-[#6ab0ff] mr-1.5"></i> Image</span>
        <span><i className="fas fa-microphone text-[#6ab0ff] mr-1.5"></i> Audio</span>
        <span><i className="fas fa-video text-[#6ab0ff] mr-1.5"></i> Video</span>
        <span><i className="fas fa-file-alt text-[#6ab0ff] mr-1.5"></i> Text / URL</span>
      </div>
    </div>
  );
};

export default UploadPill;