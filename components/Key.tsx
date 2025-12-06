import React from 'react';

interface KeyProps {
  note: string;
  isSharp: boolean;
  isPressed: boolean;
  label?: string; // e.g., C4
  onPress: () => void;
  onRelease: () => void;
  leftPos?: number; // Only for black keys to position absolutely
}

const WhiteKey: React.FC<Omit<KeyProps, 'leftPos' | 'isSharp'>> = ({ 
  note, isPressed, label, onPress, onRelease 
}) => {
  return (
    <div
      className={`relative flex-shrink-0 h-64 md:h-80 w-12 md:w-14 border border-gray-400/50 rounded-b-md select-none cursor-pointer transition-transform duration-75 ease-out origin-top
        ${isPressed 
          ? 'bg-gray-200 shadow-inner scale-[0.99] translate-y-[1px]' 
          : 'bg-gradient-to-b from-white to-gray-100 shadow-[0_4px_5px_rgba(0,0,0,0.3)] hover:bg-white'
        }
      `}
      onMouseDown={(e) => { e.preventDefault(); onPress(); }}
      onMouseUp={(e) => { e.preventDefault(); onRelease(); }}
      onMouseLeave={onRelease}
      onTouchStart={(e) => { e.preventDefault(); onPress(); }}
      onTouchEnd={(e) => { e.preventDefault(); onRelease(); }}
    >
      {/* Key texture/shine */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-200/50 to-transparent rounded-b-md pointer-events-none"></div>
      
      <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-gray-400 font-bold pointer-events-none opacity-60">
        {label}
      </div>
    </div>
  );
};

const BlackKey: React.FC<Omit<KeyProps, 'isSharp'>> = ({ 
  isPressed, onPress, onRelease, leftPos 
}) => {
  return (
    <div
      className={`absolute z-20 w-8 md:w-10 h-40 md:h-48 rounded-b-lg select-none cursor-pointer transition-transform duration-50 ease-out origin-top border-x border-b border-black
        ${isPressed 
          ? 'bg-gray-800 scale-y-[0.98] shadow-none translate-y-[1px]' 
          : 'bg-gradient-to-b from-gray-900 to-black shadow-[2px_3px_5px_rgba(0,0,0,0.6)]'
        }
      `}
      style={{ left: leftPos }}
      onMouseDown={(e) => { e.stopPropagation(); onPress(); }}
      onMouseUp={(e) => { e.stopPropagation(); onRelease(); }}
      onMouseLeave={onRelease}
      onTouchStart={(e) => { e.stopPropagation(); onPress(); }}
      onTouchEnd={(e) => { e.stopPropagation(); onRelease(); }}
    >
      {/* 3D Glossy reflection effect */}
      <div className="absolute top-0 left-[2px] right-[2px] h-36 bg-gradient-to-b from-gray-700/60 to-transparent rounded-b-sm pointer-events-none opacity-60"></div>
      {/* Bottom highlight */}
      <div className="absolute bottom-2 left-1 right-1 h-4 bg-gradient-to-t from-gray-800 to-transparent opacity-40 rounded-b-lg"></div>
    </div>
  );
};

export const PianoKey: React.FC<KeyProps> = (props) => {
  if (props.isSharp) {
    return <BlackKey {...props} />;
  }
  return <WhiteKey {...props} />;
};