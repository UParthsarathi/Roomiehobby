export interface NoteDefinition {
  note: string;
  octave: number;
  freq: number;
  isSharp: boolean;
  midi: number;
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const generateKeyboard = (): NoteDefinition[] => {
  const keys: NoteDefinition[] = [];
  // Standard 88 keys: A0 (MIDI 21) to C8 (MIDI 108)
  for (let i = 0; i < 88; i++) {
    const midi = i + 21;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    
    // Determine note name and octave
    // MIDI 21 is A0.
    // 21 % 12 = 9. In our NOTES array, 'A' is index 9.
    // The NOTES array starts at C (0), so we need to adjust.
    const noteIndex = (midi - 12) % 12; // MIDI 12 is C0
    const noteName = NOTES[noteIndex];
    const octave = Math.floor((midi - 12) / 12);
    
    keys.push({
      note: noteName,
      octave,
      freq,
      isSharp: noteName.includes('#'),
      midi,
    });
  }
  return keys;
};

export const PIANO_KEYS = generateKeyboard();