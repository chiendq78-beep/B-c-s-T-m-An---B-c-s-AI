/**
 * Workout Music & Ambient Soundscape Service
 * Powered by Web Audio API for 100% offline reliability, zero buffering,
 * and continuous therapeutic soundscapes tailored to each exercise.
 */

export interface WorkoutTrack {
  id: string;
  name: string;
  name_en: string;
  category: string;
  description: string;
  vibe: 'zen_bowl' | 'morning_flow' | 'forest_stream' | 'deep_ocean' | 'qigong_flute' | 'piano_rain';
  iconEmoji: string;
  badge: string;
  recommendedFor: string[]; // exercise IDs or categories
}

export const WORKOUT_TRACKS: WorkoutTrack[] = [
  {
    id: 'track-zen-bowl',
    name: 'Nhạc Thiền Chuông Xoay 432Hz',
    name_en: '432Hz Tibetan Singing Bowls & Healing Drone',
    category: 'Cột sống & Giảm đau',
    description: 'Tần số 432Hz giải tỏa áp lực đĩa đệm, làm dịu rễ thần kinh và phục hồi cột sống',
    vibe: 'zen_bowl',
    iconEmoji: '🧘',
    badge: 'Trị liệu cột sống',
    recommendedFor: ['hero-yoga-spine', 'cotsong']
  },
  {
    id: 'track-morning-flow',
    name: 'Giai Điệu Bình Minh Năng Lượng',
    name_en: 'Sunrise Energy Flow & Upbeat Pulse',
    category: 'Vận động & Đốt calo',
    description: 'Nhịp điệu tươi sáng đánh thức các nhóm cơ, kích hoạt tuần hoàn và chuyển hóa năng lượng',
    vibe: 'morning_flow',
    iconEmoji: '🌅',
    badge: 'Khởi động & Đốt calo',
    recommendedFor: ['ex-sun-salutation', 'dotcalo']
  },
  {
    id: 'track-forest-stream',
    name: 'Tiếng Suối Rừng & Đàn Hạc Trị Liệu',
    name_en: 'Forest Stream & Healing Gentle Harp',
    category: 'Cổ vai gáy',
    description: 'Âm thanh dòng suối mát lành và tiếng đàn hạc xoa dịu cơ thang, giải tỏa căng cứng vai gáy',
    vibe: 'forest_stream',
    iconEmoji: '🌿',
    badge: 'Thư giãn cổ vai gáy',
    recommendedFor: ['ex-neck-shoulder']
  },
  {
    id: 'track-deep-ocean',
    name: 'Sóng Biển Tĩnh Tâm & Hơi Thở Sâu',
    name_en: 'Ocean Wave Swells & Deep Zen Breathing',
    category: 'Thở & Thiền',
    description: 'Nhịp sóng vỗ êm đềm đồng bộ với nhịp thở cơ hoành 4-7-8, cân bằng hệ thần kinh',
    vibe: 'deep_ocean',
    iconEmoji: '🌊',
    badge: 'Thiền định & An thần',
    recommendedFor: ['ex-meditation-breathing', 'thothieng']
  },
  {
    id: 'track-qigong-flute',
    name: 'Khí Công Dưỡng Sinh & Sáo Trúc',
    name_en: 'Traditional Bamboo Flute & Qi Gong Harmonics',
    category: 'Tim mạch',
    description: 'Ngũ cung trầm bổng giúp điều hòa huyết áp, nhịp tim thư thái và lưu thông khí huyết',
    vibe: 'qigong_flute',
    iconEmoji: '🎋',
    badge: 'Dưỡng sinh tim mạch',
    recommendedFor: ['ex-cardio-flow', 'timmach']
  },
  {
    id: 'track-piano-rain',
    name: 'Mưa Rào Êm Dịu & Piano Chữa Lành',
    name_en: 'Calming Rain & Therapeutic Soft Piano',
    category: 'Giảm stress',
    description: 'Tiếng mưa rơi nhẹ nhàng hòa quyện cùng phím đàn piano xóa tan mệt mỏi và âu lo',
    vibe: 'piano_rain',
    iconEmoji: '🌧️',
    badge: 'Xóa tan căng thẳng',
    recommendedFor: ['ex-stress-relief', 'giamstress']
  }
];

export function getTrackForExercise(exerciseId?: string, category?: string): WorkoutTrack {
  if (exerciseId) {
    const foundById = WORKOUT_TRACKS.find(t => t.recommendedFor.includes(exerciseId));
    if (foundById) return foundById;
  }
  if (category) {
    const foundByCategory = WORKOUT_TRACKS.find(t => t.recommendedFor.includes(category));
    if (foundByCategory) return foundByCategory;
  }
  return WORKOUT_TRACKS[0]; // Default to Zen Bowl 432Hz
}

class WorkoutMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isRunning: boolean = false;
  private currentVibe: WorkoutTrack['vibe'] = 'zen_bowl';
  private volume: number = 0.55;
  private isMuted: boolean = false;
  private intervalTimer: any = null;
  private activeNodes: (AudioNode | OscillatorNode)[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playTrack(vibe: WorkoutTrack['vibe']) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.isRunning && this.currentVibe === vibe) return;

    this.stop();
    this.currentVibe = vibe;
    this.isRunning = true;

    // Start appropriate procedural soundscape
    switch (vibe) {
      case 'zen_bowl':
        this.startZenBowlSoundscape();
        break;
      case 'morning_flow':
        this.startMorningFlowSoundscape();
        break;
      case 'forest_stream':
        this.startForestStreamSoundscape();
        break;
      case 'deep_ocean':
        this.startDeepOceanSoundscape();
        break;
      case 'qigong_flute':
        this.startQigongFluteSoundscape();
        break;
      case 'piano_rain':
        this.startPianoRainSoundscape();
        break;
      default:
        this.startZenBowlSoundscape();
    }
  }

  public pause() {
    if (!this.isRunning) return;
    this.stop();
  }

  public resume() {
    if (this.isRunning) return;
    this.playTrack(this.currentVibe);
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.activeNodes.forEach(node => {
      try {
        if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        }
        node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }

  public getCurrentVibe(): WorkoutTrack['vibe'] {
    return this.currentVibe;
  }

  /* ------------------------------------------------------------- */
  /* SOUNDSCAPE GENERATORS                                         */
  /* ------------------------------------------------------------- */

  // 1. ZEN BOWL 432Hz (Healing Spine Drone + Solfeggio singing bowl bells)
  private startZenBowlSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Harmonic Root Drone (C2 = 65.4Hz, G2 = 98Hz, C3 = 130.8Hz, 432Hz harmonic)
    const droneFreqs = [108, 216, 432];
    droneFreqs.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start();
      this.activeNodes.push(osc, gain, filter);
    });

    // Singing Bowl Chime Loop every 9-14 seconds
    const playBowlChime = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const chimeFreqs = [432, 864, 1296]; // Solfeggio 432 harmonic series
      chimeFreqs.forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        
        // Gentle strike with long exponential decay
        const amp = 0.12 / (idx + 1);
        gain.gain.setValueAtTime(amp, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 6.5);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 7);
      });
    };

    playBowlChime();
    this.intervalTimer = setInterval(playBowlChime, 11000);
  }

  // 2. MORNING FLOW (Gentle acoustic cadence & sunny chord swell)
  private startMorningFlowSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Gentle Warm Pad (G chord - C chord - D chord)
    const chords = [
      [196, 246.94, 293.66], // G
      [164.81, 196, 246.94], // Em
      [130.81, 164.81, 196], // C
      [146.83, 220, 293.66]  // D
    ];
    let chordIdx = 0;

    const playChordSwell = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach(freq => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, t);
        filter.frequency.exponentialRampToValueAtTime(800, t + 1.8);
        filter.frequency.exponentialRampToValueAtTime(450, t + 3.8);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t);
        osc.stop(t + 4.5);
      });
    };

    playChordSwell();
    this.intervalTimer = setInterval(playChordSwell, 4200);
  }

  // 3. FOREST STREAM & HARP (Filtered babbling water noise + Harp arpeggios)
  private startForestStreamSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Pink noise buffer for stream water
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.09;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const streamFilter = ctx.createBiquadFilter();
    streamFilter.type = 'bandpass';
    streamFilter.frequency.setValueAtTime(520, ctx.currentTime);
    streamFilter.Q.setValueAtTime(0.8, ctx.currentTime);

    const streamGain = ctx.createGain();
    streamGain.gain.setValueAtTime(0.12, ctx.currentTime);

    whiteNoise.connect(streamFilter);
    streamFilter.connect(streamGain);
    streamGain.connect(this.masterGain);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, streamFilter, streamGain);

    // Harp notes plucking (pentatonic: C4, D4, E4, G4, A4, C5)
    const harpNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const playHarpPluck = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const note = harpNotes[Math.floor(Math.random() * harpNotes.length)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, t);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 2.6);
    };

    playHarpPluck();
    this.intervalTimer = setInterval(playHarpPluck, 2400);
  }

  // 4. DEEP OCEAN (Ocean swell filter sweeping every 8 seconds)
  private startDeepOceanSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Low grounding drone
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(73.42, ctx.currentTime); // D2
    droneGain.gain.setValueAtTime(0.07, ctx.currentTime);
    drone.connect(droneGain);
    droneGain.connect(this.masterGain);
    drone.start();
    this.activeNodes.push(drone, droneGain);

    // Ocean Waves Swell
    const playWaveSwell = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      // Noise burst for wave swell
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, t);
      filter.frequency.linearRampToValueAtTime(750, t + 3.2); // wave peak
      filter.frequency.linearRampToValueAtTime(120, t + 7.0); // wave recedes

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 3.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 7.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 7.5);
    };

    playWaveSwell();
    this.intervalTimer = setInterval(playWaveSwell, 7800);
  }

  // 5. QIGONG FLUTE (Pentatonic flute with vibrato)
  private startQigongFluteSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Warm temple drone
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = 'triangle';
    drone.frequency.setValueAtTime(110, ctx.currentTime); // A2
    droneGain.gain.setValueAtTime(0.06, ctx.currentTime);
    drone.connect(droneGain);
    droneGain.connect(this.masterGain);
    drone.start();
    this.activeNodes.push(drone, droneGain);

    const fluteNotes = [293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
    const playFlutePhrase = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const note = fluteNotes[Math.floor(Math.random() * fluteNotes.length)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, t);
      osc.frequency.linearRampToValueAtTime(note + 2, t + 1.5); // subtle pitch glide

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 3.4);
    };

    playFlutePhrase();
    this.intervalTimer = setInterval(playFlutePhrase, 3600);
  }

  // 6. PIANO & RAIN (Soothing rain wash + Lush jazz/healing piano chords)
  private startPianoRainSoundscape() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Continuous Rain Texture
    const bufferSize = ctx.sampleRate * 2;
    const rainBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = rainBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.04;
    }
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;

    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.setValueAtTime(1200, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.08, ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.masterGain);
    rainSource.start();
    this.activeNodes.push(rainSource, rainFilter, rainGain);

    // Warm Piano Chords (Dm9, Am7, Fmaj7, Cmaj7)
    const pianoChords = [
      [146.83, 220, 261.63, 329.63], // Dm9
      [110, 164.81, 220, 261.63],    // Am7
      [174.61, 220, 261.63, 329.63], // Fmaj7
      [130.81, 196, 246.94, 261.63]  // Cmaj7
    ];
    let pChordIdx = 0;

    const playPianoChord = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const chord = pianoChords[pChordIdx % pianoChords.length];
      pChordIdx++;

      chord.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + i * 0.06);

        gain.gain.setValueAtTime(0.09, t + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 3.8);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 4.0);
      });
    };

    playPianoChord();
    this.intervalTimer = setInterval(playPianoChord, 4600);
  }
}

export const workoutMusic = new WorkoutMusicEngine();
