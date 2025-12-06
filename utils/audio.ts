export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  
  // Mastering Chain Nodes
  private compressor: DynamicsCompressorNode | null = null;
  private eqLow: BiquadFilterNode | null = null;
  private eqMid: BiquadFilterNode | null = null;
  private eqHigh: BiquadFilterNode | null = null;

  private buffers: Map<number, AudioBuffer> = new Map();
  private activeSources: Map<number, { source: AudioBufferSourceNode; gain: GainNode; panner: StereoPannerNode }> = new Map();
  private sustain = false;
  private volume = 0.8;
  
  // Mapping of MIDI notes to URL filenames (Salamander Grand Piano V3)
  private readonly sampleMap: Record<number, string> = {
    21: 'A0.mp3', 24: 'C1.mp3', 27: 'Ds1.mp3', 30: 'Fs1.mp3',
    33: 'A1.mp3', 36: 'C2.mp3', 39: 'Ds2.mp3', 42: 'Fs2.mp3',
    45: 'A2.mp3', 48: 'C3.mp3', 51: 'Ds3.mp3', 54: 'Fs3.mp3',
    57: 'A3.mp3', 60: 'C4.mp3', 63: 'Ds4.mp3', 66: 'Fs4.mp3',
    69: 'A4.mp3', 72: 'C5.mp3', 75: 'Ds5.mp3', 78: 'Fs5.mp3',
    81: 'A5.mp3', 84: 'C6.mp3', 87: 'Ds6.mp3', 90: 'Fs6.mp3',
    93: 'A6.mp3', 96: 'C7.mp3', 99: 'Ds7.mp3', 102: 'Fs7.mp3',
    105: 'A7.mp3', 108: 'C8.mp3'
  };

  private readonly baseUrl = 'https://tonejs.github.io/audio/salamander/';

  constructor() {}

  public async init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass({ latencyHint: 'interactive' });
    
    // --- STUDIO MASTERING CHAIN ---
    
    // 1. Master Output Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;

    // 2. Dynamics Compressor (The "Glue" that makes it punchy)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24; // Kick in early
    this.compressor.knee.value = 30;       // Smooth transition
    this.compressor.ratio.value = 3;       // Mild compression
    this.compressor.attack.value = 0.003;  // Fast attack to catch peaks
    this.compressor.release.value = 0.25;  // Musical release

    // 3. 3-Band EQ (Sculpting the tone)
    
    // Low Shelf: Boost Bass/Body (+3dB @ 200Hz)
    this.eqLow = this.ctx.createBiquadFilter();
    this.eqLow.type = 'lowshelf';
    this.eqLow.frequency.value = 200;
    this.eqLow.gain.value = 3.0;

    // Mid Peaking: Cut Mud (-2dB @ 800Hz)
    this.eqMid = this.ctx.createBiquadFilter();
    this.eqMid.type = 'peaking';
    this.eqMid.frequency.value = 800;
    this.eqMid.Q.value = 1.0;
    this.eqMid.gain.value = -2.0;

    // High Shelf: Boost Air/Clarity (+4dB @ 3000Hz)
    this.eqHigh = this.ctx.createBiquadFilter();
    this.eqHigh.type = 'highshelf';
    this.eqHigh.frequency.value = 3000;
    this.eqHigh.gain.value = 4.0;

    // 4. Reverb (Concert Hall)
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createReverbImpulse(this.ctx);

    // --- ROUTING ---
    
    // Create a Mixing Bus
    const mixBus = this.ctx.createGain();

    // Reverb Send/Return
    const reverbSend = this.ctx.createGain();
    reverbSend.gain.value = 0.25; // Reverb amount

    // Connect:
    // Sources connect to -> mixBus AND reverbSend
    reverbSend.connect(this.reverbNode);
    this.reverbNode.connect(mixBus); // Return reverb to mix

    // Mastering Chain: MixBus -> EQ Low -> EQ Mid -> EQ High -> Compressor -> Master Gain -> Destination
    mixBus.connect(this.eqLow);
    this.eqLow.connect(this.eqMid);
    this.eqMid.connect(this.eqHigh);
    this.eqHigh.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
    
    // Store mixBus for voices to connect to
    // (We'll attach this property to the class instance for easy access in playTone)
    (this as any).mixBus = mixBus;
    (this as any).reverbSend = reverbSend;
  }

  // High-fidelity Concert Hall Impulse Response
  private createReverbImpulse(ctx: AudioContext): AudioBuffer {
    const duration = 3.0; // Long decay for a "Hall" sound
    const decay = 3.0;
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      // Exponential decay
      const n = i / length;
      const env = Math.pow(1 - n, decay);
      
      // White noise base
      const noiseL = (Math.random() * 2 - 1);
      const noiseR = (Math.random() * 2 - 1);
      
      left[i] = noiseL * env;
      right[i] = noiseR * env;
    }
    return impulse;
  }

  public async loadSamples(onProgress: (percent: number) => void) {
    // If not init, init
    if (!this.ctx) await this.init();
    if (!this.ctx) return;

    const notesToLoad = Object.keys(this.sampleMap).map(Number);
    const total = notesToLoad.length;
    let loaded = 0;

    const loadPromises = notesToLoad.map(async (midi) => {
      const filename = this.sampleMap[midi];
      try {
        const response = await fetch(`${this.baseUrl}${filename}`);
        const arrayBuffer = await response.arrayBuffer();
        if (this.ctx) {
          const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
          this.buffers.set(midi, audioBuffer);
        }
      } catch (err) {
        console.error(`Failed to load sample ${filename}`, err);
      } finally {
        loaded++;
        onProgress(Math.round((loaded / total) * 100));
      }
    });

    await Promise.all(loadPromises);
  }

  public setVolume(val: number) {
    this.volume = val;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1);
    }
  }

  public setSustain(active: boolean) {
    this.sustain = active;
  }

  private getClosestBuffer(midi: number): { buffer: AudioBuffer; rate: number } | null {
    if (this.buffers.has(midi)) {
      return { buffer: this.buffers.get(midi)!, rate: 1.0 };
    }

    // Find closest loaded sample
    let closestMidi = -1;
    let minDistance = Infinity;

    for (const m of this.buffers.keys()) {
      const dist = Math.abs(midi - m);
      if (dist < minDistance) {
        minDistance = dist;
        closestMidi = m;
      }
    }

    if (closestMidi === -1) return null;

    const buffer = this.buffers.get(closestMidi)!;
    const distance = midi - closestMidi;
    const rate = Math.pow(2, distance / 12); 

    return { buffer, rate };
  }

  public playTone(midi: number) {
    if (!this.ctx) return;
    const mixBus = (this as any).mixBus as GainNode;
    const reverbSend = (this as any).reverbSend as GainNode;
    
    if (!mixBus) return; // Audio not ready
    
    // Stop previous instance of this note to avoid phasing
    this.stopTone(midi, true);

    const sample = this.getClosestBuffer(midi);
    if (!sample) return;

    const source = this.ctx.createBufferSource();
    source.buffer = sample.buffer;
    source.playbackRate.value = sample.rate;

    // --- VOICE CHAIN ---
    
    // 1. Panner (Stereo Imaging)
    // Map MIDI 21 (Left) -> 108 (Right)
    const panner = this.ctx.createStereoPanner();
    // Center point roughly at MIDI 60-64. 
    // Range -0.9 to 0.9 to avoid extreme hard panning which sounds unnatural on headphones
    const panAmount = ((midi - 64) / 44) * 0.9; 
    panner.pan.value = Math.max(-0.9, Math.min(0.9, panAmount));

    // 2. Gain (Velocity/Volume)
    const gainNode = this.ctx.createGain();
    // Humanize velocity: random variance between 0.85 and 1.0
    // Bass notes naturally louder? No, keep even but add random flair.
    const velocity = 0.85 + Math.random() * 0.15; 
    gainNode.gain.value = velocity;

    // Connect Source -> Gain -> Panner -> MixBus/Reverb
    source.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(mixBus);    // Dry signal to Mix
    panner.connect(reverbSend); // Send to Reverb

    source.start(0);

    this.activeSources.set(midi, { source, gain: gainNode, panner });
  }

  public stopTone(midi: number, force = false) {
    if (!this.ctx) return;
    
    const active = this.activeSources.get(midi);
    if (!active) return;

    const t = this.ctx.currentTime;
    
    // Release Physics
    // Low notes have heavier strings, take longer to dampen.
    // High notes dampen instantly.
    let releaseTime = this.sustain && !force ? 2.5 : 0.4; 
    if (!this.sustain && !force) {
        if (midi < 40) releaseTime = 0.6; // Bass damper is heavier/slower
        else if (midi > 80) releaseTime = 0.15; // High treble dampens fast
    }

    try {
        // Smooth release
        active.gain.gain.cancelScheduledValues(t);
        active.gain.gain.setValueAtTime(active.gain.gain.value, t);
        active.gain.gain.exponentialRampToValueAtTime(0.001, t + releaseTime);
        
        active.source.stop(t + releaseTime);
        
        // Garbage collection
        setTimeout(() => {
            const current = this.activeSources.get(midi);
            if (current === active) {
                // Disconnect nodes to free memory
                active.source.disconnect();
                active.gain.disconnect();
                active.panner.disconnect();
                this.activeSources.delete(midi);
            }
        }, releaseTime * 1000 + 100);
    } catch (e) {
        // Ignore errors if context is weird
    }
  }
}

export const audioEngine = new AudioEngine();