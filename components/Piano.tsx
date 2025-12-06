import React, { useRef, useEffect, useState } from 'react';
import { PIANO_KEYS } from '../constants';
import { PianoKey } from './Key';
import { audioEngine } from '../utils/audio';

interface PianoProps {
  showLabels: boolean;
}

export const Piano: React.FC<PianoProps> = ({ showLabels }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());

  // Scroll to Middle C (C4) on mount
  useEffect(() => {
    if (scrollRef.current) {
      // Find Middle C (MIDI 60)
      const middleCIndex = PIANO_KEYS.findIndex(k => k.midi === 60);
      const whiteKeysBefore = PIANO_KEYS.slice(0, middleCIndex).filter(k => !k.isSharp).length;
      
      const keyWidth = window.innerWidth < 768 ? 48 : 56;
      const scrollPos = (whiteKeysBefore * keyWidth) - (window.innerWidth / 2) + (keyWidth / 2);
      
      scrollRef.current.scrollLeft = scrollPos;
    }
  }, []);

  const handleNoteStart = (midi: number) => {
    setActiveKeys(prev => {
      const newSet = new Set(prev);
      newSet.add(midi);
      return newSet;
    });
    audioEngine.playTone(midi);
  };

  const handleNoteStop = (midi: number) => {
    setActiveKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(midi);
      return newSet;
    });
    audioEngine.stopTone(midi);
  };

  const whiteKeys = PIANO_KEYS.filter(k => !k.isSharp);
  const blackKeys = PIANO_KEYS.filter(k => k.isSharp);

  const getBlackKeyPosition = (blackKeyMidi: number) => {
     const prevWhiteKeyIndex = whiteKeys.findIndex(wk => wk.midi === blackKeyMidi - 1);
     
     const WHITE_KEY_WIDTH_MOBILE = 48;
     const WHITE_KEY_WIDTH_DESKTOP = 56;
     
     const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
     const width = isDesktop ? WHITE_KEY_WIDTH_DESKTOP : WHITE_KEY_WIDTH_MOBILE;
     
     const BLACK_KEY_WIDTH_MOBILE = 32;
     const BLACK_KEY_WIDTH_DESKTOP = 40;
     const bWidth = isDesktop ? BLACK_KEY_WIDTH_DESKTOP : BLACK_KEY_WIDTH_MOBILE;

     return ((prevWhiteKeyIndex + 1) * width) - (bWidth / 2);
  };

  return (
    <div 
      ref={scrollRef}
      className="relative flex-1 overflow-x-auto overflow-y-hidden no-scrollbar bg-[#1a1a1a] select-none shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
      style={{ touchAction: 'pan-x' }}
    >
        {/* Container for keys */}
        <div className="relative inline-flex h-full pl-4 pr-10 py-6 md:py-8 min-w-max">
            
            {/* White Keys Layer */}
            {whiteKeys.map((k) => (
                <PianoKey
                    key={k.midi}
                    note={k.note}
                    isSharp={false}
                    midi={k.midi}
                    isPressed={activeKeys.has(k.midi)}
                    label={showLabels && k.note === 'C' ? `C${k.octave}` : (showLabels ? k.note : '')}
                    onPress={() => handleNoteStart(k.midi)}
                    onRelease={() => handleNoteStop(k.midi)}
                />
            ))}

            {/* Black Keys Layer */}
            {blackKeys.map((k) => {
                 const left = getBlackKeyPosition(k.midi);
                 return (
                    <PianoKey
                        key={k.midi}
                        note={k.note}
                        isSharp={true}
                        midi={k.midi}
                        isPressed={activeKeys.has(k.midi)}
                        onPress={() => handleNoteStart(k.midi)}
                        onRelease={() => handleNoteStop(k.midi)}
                        leftPos={left + 16} // +16 for the initial pl-4 padding
                    />
                 );
            })}
        </div>
    </div>
  );
};