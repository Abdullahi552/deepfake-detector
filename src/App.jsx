import { useState } from 'react';
import Landing from './components/Landing';
import Interface from './components/Interface';

function App() {
  const [showInterface, setShowInterface] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0d12]">
      {showInterface ? (
        <Interface onBack={() => setShowInterface(false)} />
      ) : (
        <Landing onLaunch={() => setShowInterface(true)} />
      )}
    </div>
  );
}

export default App;