// An original, generative score. All sound is synthesized locally after a gesture.
// Soft felt-like notes, a slowly moving harmonic bed, and spatial transition washes.
export class FilmScore {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private voices: OscillatorNode[] = [];
  private timer: ReturnType<typeof setInterval> | undefined;
  private active = false;
  private chapter = 0;
  private beat = 0;
  private lastScene = -1;

  async enable() {
    if (!this.ctx) this.create();
    await this.ctx!.resume();
    this.active = true;
    this.master!.gain.setTargetAtTime(0.48, this.ctx!.currentTime, 0.8);
    if (!this.timer) this.timer = setInterval(() => this.tick(), 780);
  }

  private create() {
    const ctx = new AudioContext(); this.ctx = ctx;
    const master = ctx.createGain(); master.gain.value = 0; this.master = master;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16; compressor.ratio.value = 5;
    master.connect(compressor).connect(ctx.destination);
    const reverb = ctx.createConvolver(); this.reverb = reverb;
    const impulse = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 3.5), ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3.2) * 0.55;
    }
    reverb.buffer = impulse;
    const wet = ctx.createGain(); wet.gain.value = 0.38;
    reverb.connect(wet).connect(master);
    [55, 82.4069, 110, 164.8138].forEach((frequency, index) => {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = frequency;
      const gain = ctx.createGain(); gain.gain.value = 0.045 / (1 + index * 0.7);
      const pan = ctx.createStereoPanner(); pan.pan.value = index % 2 ? -0.55 : 0.55;
      osc.connect(gain).connect(pan).connect(master); gain.connect(reverb);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.065 + index * 0.018;
      const depth = ctx.createGain(); depth.gain.value = 0.011;
      lfo.connect(depth).connect(gain.gain); osc.start(); lfo.start();
      this.voices.push(osc, lfo);
    });
  }

  private note(frequency: number, velocity = 0.12, pan = 0) {
    if (!this.ctx || !this.master || !this.active) return;
    const ctx = this.ctx, now = ctx.currentTime;
    [1, 2.002, 3.996].forEach((harmonic, index) => {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = frequency * harmonic;
      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0, now);
      amp.gain.linearRampToValueAtTime(velocity / (1 + index * 5), now + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + 2.8 - index * 0.4);
      const stereo = ctx.createStereoPanner(); stereo.pan.value = pan;
      osc.connect(amp).connect(stereo).connect(this.master!); amp.connect(this.reverb!);
      osc.start(now); osc.stop(now + 3);
      osc.onended = () => { osc.disconnect(); amp.disconnect(); stereo.disconnect(); };
    });
  }

  private tick() {
    if (!this.active || document.hidden || !this.ctx) return;
    const scales = this.chapter === 7 ? [110, 130.81, 164.81, 207.65] : this.chapter >= 8 ? [220, 277.18, 329.63, 415.3, 440, 659.25] : [164.81, 220, 246.94, 329.63, 440, 493.88];
    const sequence = [0, 2, 4, 1, 3, 2, 5, 1];
    const note = scales[sequence[this.beat % sequence.length] % scales.length];
    if (this.beat % 4 !== 3 || this.chapter === 3) this.note(note, this.chapter === 7 ? 0.04 : 0.095, Math.sin(this.beat * 0.8) * 0.7);
    this.beat++;
  }

  scene(index: number) {
    this.chapter = index;
    if (index === this.lastScene) return;
    this.lastScene = index;
    if (!this.ctx || !this.active) return;
    const now = this.ctx.currentTime;
    this.voices.forEach((voice, i) => {
      if (i % 2 === 0) voice.frequency.setTargetAtTime(([55, 82.4069, 110, 164.8138][i / 2]) * (index === 7 ? 0.89 : index >= 8 ? 1.12246 : 1), now, 1.5);
    });
    this.wash(index === 7 ? 0.075 : 0.035);
    this.note(index >= 8 ? 659.25 : 440, 0.075, -0.45);
  }

  spark() {
    if (!this.active) return;
    this.note(659.25, 0.07, -0.45);
    this.note(987.77, 0.035, 0.45);
  }

  private wash(volume: number) {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource(); source.buffer = buffer;
    const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.Q.value = 0.5;
    filter.frequency.setValueAtTime(300, ctx.currentTime); filter.frequency.exponentialRampToValueAtTime(1900, ctx.currentTime + 1.4);
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.7); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    const pan = ctx.createStereoPanner(); pan.pan.setValueAtTime(-0.8, ctx.currentTime); pan.pan.linearRampToValueAtTime(0.8, ctx.currentTime + 2);
    source.connect(filter).connect(gain).connect(pan).connect(this.master!); gain.connect(this.reverb!);
    source.start(); source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); pan.disconnect(); };
  }

  mute() { this.active = false; if (this.ctx && this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12); clearInterval(this.timer); this.timer = undefined; }
  suspend() { if (this.ctx) void this.ctx.suspend(); }
  resume() { if (this.ctx && this.active) void this.ctx.resume(); }
  dispose() { this.mute(); this.voices.forEach(voice => { try { voice.stop(); } catch { /* already stopped */ } }); if (this.ctx) void this.ctx.close(); this.ctx = null; }
}
