const Landing = ({ onLaunch }) => {
  return (
    <>
      {/* Navbar */}
      <nav className="flex justify-between items-center px-5 py-5 max-w-7xl mx-auto w-full border-b border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-3 font-extrabold text-xl text-[#e8edf5]">
          <div className="bg-[#0090ff] text-white w-10 h-10 rounded-xl flex items-center justify-center text-base">
            <i className="fas fa-shield-halved"></i>
          </div>
          DeepFake<span className="text-[#6ab0ff]">Detectors</span>
        </div>
        <div className="flex items-center gap-9 font-medium text-[#8892b0]">
          <a href="#" className="hover:text-[#e8edf5] transition-colors hidden md:inline">Features</a>
          <a href="#" className="hover:text-[#e8edf5] transition-colors hidden md:inline">How It Works</a>
          <a href="#" className="hover:text-[#e8edf5] transition-colors hidden md:inline">API</a>
          <a href="#" className="bg-[#0090ff] hover:bg-[#1a9aff] text-white px-7 py-2.5 rounded-full font-semibold transition-all hover:shadow-lg hover:shadow-[#0090ff]/20">
            Sign In
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-5 py-10 gap-10 w-full">
        <div className="flex-1 min-w-[300px]">
          <div className="inline-block bg-[rgba(0,144,255,0.1)] border border-[rgba(0,144,255,0.15)] px-4 py-1.5 rounded-full text-sm font-semibold text-[#6ab0ff] tracking-wide mb-5">
            <i className="fas fa-bolt mr-1.5"></i> AI-Powered Media Verification
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-[#e8edf5]">
            Upload any media.<br />
            We tell you if it's <span className="bg-gradient-to-r from-[#0090ff] to-[#7b61ff] bg-clip-text text-transparent">real.</span>
          </h1>
          <p className="text-lg text-[#8892b0] max-w-[520px] leading-relaxed my-4">
            Detect AI-generated images, cloned voices, deepfake videos, and synthetic text — all in one place. No technical skills needed.
          </p>
          <div className="flex gap-4 flex-wrap">
            <button
              className="bg-[#0090ff] hover:bg-[#1a9aff] text-white px-10 py-4 rounded-full font-semibold text-base transition-all hover:shadow-lg hover:shadow-[#0090ff]/25 flex items-center gap-2.5"
              onClick={onLaunch}
            >
              <i className="fas fa-arrow-right"></i> Launch Detector
            </button>
            <button className="bg-transparent hover:bg-[rgba(255,255,255,0.04)] text-[#e8edf5] px-8 py-4 rounded-full font-semibold text-base border border-[rgba(255,255,255,0.1)] transition-all flex items-center gap-2.5">
              <i className="fab fa-github"></i> View on GitHub
            </button>
          </div>
        </div>

        {/* 3D Visual */}
        <div className="flex-1 min-w-[300px] flex justify-center items-center">
          <div className="w-full max-w-[500px] h-[420px] perspective-[1200px] relative">
            <div className="w-full h-full relative transform-style-preserve-3d animate-[orbitRotate_28s_linear_infinite]">
              {/* Media Cards — each card has backface-visibility: hidden to prevent text from appearing backward */}
              {[
                { icon: 'fa-image', label: 'Image', badge: '⚠ FAKE', badgeClass: 'bg-[#ff4757]', top: '30%', left: '10%', rot: '0deg' },
                { icon: 'fa-microphone', label: 'Audio', badge: '⚠ FAKE', badgeClass: 'bg-[#ff4757]', top: '55%', right: '5%', rot: '72deg' },
                { icon: 'fa-video', label: 'Video', badge: '✓ REAL', badgeClass: 'bg-[#2ed573]', bottom: '15%', left: '20%', rot: '144deg' },
                { icon: 'fa-file-alt', label: 'Text', badge: '⚠ FAKE', badgeClass: 'bg-[#ff4757]', top: '20%', left: '55%', rot: '216deg' },
                { icon: 'fa-link', label: 'URL', badge: '✓ REAL', badgeClass: 'bg-[#2ed573]', bottom: '25%', right: '15%', rot: '288deg' },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="absolute w-[120px] h-[100px] rounded-2xl bg-[rgba(20,26,38,0.9)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.06)] shadow-2xl flex flex-col items-center justify-center text-3xl text-[#e8edf5] p-3 text-center transition-all"
                  style={{
                    transform: `rotateY(${card.rot}) translateZ(220px)`,
                    top: card.top,
                    left: card.left,
                    bottom: card.bottom,
                    right: card.right,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  <i className={`fas ${card.icon}`}></i>
                  <span className="text-[0.7rem] font-semibold mt-1.5 text-[#8892b0] uppercase tracking-wide">{card.label}</span>
                  <div className={`${card.badgeClass} text-white text-[0.55rem] font-bold px-2.5 py-0.5 rounded-full mt-1 tracking-wide`}>{card.badge}</div>
                </div>
              ))}

              {/* Particles only — center orb removed */}
              <div className="absolute w-1.5 h-1.5 rounded-full bg-[#0090ff] opacity-15 animate-[floatParticle_6s_ease-in-out_infinite]" style={{ top: '10%', left: '5%' }}></div>
              <div className="absolute w-1 h-1 rounded-full bg-[#0090ff] opacity-15 animate-[floatParticle_6s_ease-in-out_infinite] delay-2000" style={{ top: '80%', right: '8%' }}></div>
              <div className="absolute w-2 h-2 rounded-full bg-[#0090ff] opacity-15 animate-[floatParticle_6s_ease-in-out_infinite] delay-[4000ms]" style={{ bottom: '20%', left: '5%' }}></div>
              <div className="absolute w-1.5 h-1.5 rounded-full bg-[#0090ff] opacity-15 animate-[floatParticle_6s_ease-in-out_infinite] delay-1000" style={{ top: '40%', right: '2%' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-5 py-14 w-full text-center">
        <h2 className="text-4xl font-extrabold text-[#e8edf5]">What We Check</h2>
        <p className="text-[#8892b0] mb-10">Four specialized detection modules, one unified result.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: 'fa-image', title: 'Image Detection', desc: 'GAN artifacts, unnatural lighting, EXIF tampering' },
            { icon: 'fa-microphone', title: 'Audio Detection', desc: 'Cloned voices, missing breath sounds, flat prosody' },
            { icon: 'fa-video', title: 'Video Detection', desc: 'Frame analysis, lip-sync, optical flow, rPPG signal' },
            { icon: 'fa-file-alt', title: 'Credibility Analysis', desc: 'Cross-checks claims against fact-check databases' },
          ].map((feature, idx) => (
            <div key={idx} className="bg-[#141a26] p-7 rounded-2xl border border-[rgba(255,255,255,0.04)] transition-all hover:-translate-y-1.5 hover:border-[rgba(0,144,255,0.2)] hover:shadow-xl">
              <div className="text-3xl text-[#0090ff] mb-3"><i className={`fas ${feature.icon}`}></i></div>
              <h4 className="font-bold text-[#e8edf5]">{feature.title}</h4>
              <p className="text-sm text-[#8892b0] mt-1 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer — simplified */}
      <footer className="max-w-7xl mx-auto px-5 py-7 w-full flex justify-center border-t border-[rgba(255,255,255,0.04)] text-sm text-[#4a5470]">
        <div><i className="fas fa-shield-halved text-[#6ab0ff] mr-2"></i> DeepFake Detectors &copy; 2026</div>
      </footer>
    </>
  );
};

export default Landing;