import React, { useState, useEffect } from 'react';
import { Piano } from './components/Piano';
import { Controls } from './components/Controls';
import { audioEngine } from './utils/audio';

function App() {
  const [volume, setVolume] = useState(0.8);
  const [sustain, setSustain] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    audioEngine.setSustain(sustain);
  }, [sustain]);

  const handleStart = async () => {
    if (loadingState !== 'idle') return;
    
    setLoadingState('loading');
    
    // Initialize audio context on user gesture
    await audioEngine.init();
    
    // Load samples
    await audioEngine.loadSamples((percent) => {
      setLoadingProgress(percent);
    });
    
    setLoadingState('ready');
  };

  return (
    <div 
      className="flex flex-col h-screen bg-gray-900 overflow-hidden"
    >
      <Controls 
        volume={volume}
        setVolume={setVolume}
        sustain={sustain}
        setSustain={setSustain}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
      />
      
      {/* Decorative Top Panel */}
      <div className="flex-none h-6 md:h-12 bg-gradient-to-b from-[#1a1a1a] to-black border-b border-gray-800 relative shadow-inner z-10">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30 mix-blend-overlay"></div>
         <div className="absolute bottom-0 w-full h-[1px] bg-red-900/50"></div>
         <div className="hidden md:flex justify-center items-center h-full">
            <span className="text-amber-700/30 font-serif tracking-[0.5em] text-sm uppercase">Studio Grand - Mastered Audio</span>
         </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0a0a0a]">
         {/* Felt line */}
         <div className="h-3 w-full bg-red-900 shadow-[0_4px_6px_rgba(0,0,0,0.7)] z-10 relative border-b border-red-950"></div>
         
         <Piano showLabels={showLabels} />
         
         {/* Loading / Start Overlay */}
         {loadingState !== 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 backdrop-blur-md">
                <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl text-center max-w-md mx-4 animate-fade-in relative overflow-hidden">
                    
                    {/* Background sheen */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>

                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Maestro Piano</h2>
                    <p className="text-gray-400 mb-8 text-sm">Initializing Studio Audio Engine (EQ, Reverb, Compression)...</p>
                    
                    {loadingState === 'idle' ? (
                      <button 
                        onClick={handleStart}
                        className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-white transition-all duration-200 bg-amber-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 hover:bg-amber-500 active:scale-95"
                      >
                          <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-gray-700"></span>
                          Load Studio Sounds
                      </button>
                    ) : (
                      <div className="w-full max-w-xs mx-auto">
                        <div className="flex justify-between text-xs text-amber-500 mb-1 font-mono">
                          <span>LOADING SAMPLES</span>
                          <span>{loadingProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-amber-500 h-2 rounded-full transition-all duration-100 ease-out" 
                            style={{ width: `${loadingProgress}%` }}
                          ></div>
                        </div>
                        <p className="mt-4 text-xs text-gray-500 italic">Configuring Salamander Grand Piano V3...</p>
                      </div>
                    )}
                </div>
            </div>
         )}
      </div>
      
      {/* Footer */}
      <div className="bg-black text-gray-600 text-[10px] md:text-xs py-2 px-4 text-center border-t border-gray-900">
        Professional Audio Engine: Stereo Panning • 3-Band EQ • Tube Compression • Hall Reverb
      </div>
    </div>
  );
}

export default App;