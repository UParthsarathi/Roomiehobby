import React from 'react';

interface ControlsProps {
  volume: number;
  setVolume: (v: number) => void;
  sustain: boolean;
  setSustain: (s: boolean) => void;
  showLabels: boolean;
  setShowLabels: (s: boolean) => void;
}

export const Controls: React.FC<ControlsProps> = ({ 
  volume, setVolume, sustain, setSustain, showLabels, setShowLabels 
}) => {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between shadow-xl z-20">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-500 hidden md:block">
          Maestro Touch
        </h1>
        <h1 className="text-xl font-bold text-amber-400 md:hidden">
          Maestro
        </h1>
      </div>

      <div className="flex items-center space-x-6">
        {/* Sustain Toggle */}
        <button
          onClick={() => setSustain(!sustain)}
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all
            ${sustain 
              ? 'bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_10px_rgba(74,222,128,0.3)]' 
              : 'bg-gray-700 text-gray-400 border border-gray-600'
            }
          `}
        >
          Sustain {sustain ? 'ON' : 'OFF'}
        </button>

        {/* Labels Toggle */}
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`hidden md:block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all
            ${showLabels 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' 
              : 'bg-gray-700 text-gray-400 border border-gray-600'
            }
          `}
        >
          Labels
        </button>

        {/* Volume Slider */}
        <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 11H2a1 1 0 01-1-1V9a1 1 0 011-1h2.586l3.707-5.707a1 1 0 01.97-.008zM11 6a1 1 0 100 8 1 1 0 000-8z" clipRule="evenodd" />
            </svg>
            <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 md:w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
        </div>
      </div>
    </div>
  );
};