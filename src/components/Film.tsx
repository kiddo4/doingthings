import { useEffect, useRef, useState } from 'react';

const RUNTIME = 180; // seconds of "film" across the whole scroll
const FPS = 24;

function timecode(t: number) {
  const s = Math.floor(t);
  const f = Math.floor((t - s) * FPS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}:${pad(f)}`;
}

// ─────────────────────────────────────────────────────────────────
// Generated ambient score — no audio files, just a soft drone whose
// filter opens as the story progresses.
// ─────────────────────────────────────────────────────────────────
class Score {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private filter!: BiquadFilterNode;

  start() {
    if (!this.ctx) {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.filter = ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 380;
      this.filter.Q.value = 0.7;
      this.filter.connect(this.master);
      this.master.connect(ctx.destination);

      // A2 · E3 · A3 · C#4 · E4 — open, hopeful
      [110, 164.81, 220, 277.18, 329.63].forEach((hz, i) => {
        [-4, 4].forEach((det) => {
          const o = ctx.createOscillator();
          o.type = i < 2 ? 'sine' : 'triangle';
          o.frequency.value = hz;
          o.detune.value = det;
          const g = ctx.createGain();
          g.gain.value = 0.05 / (i + 1);
          // slow breathing per voice
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 0.05 + i * 0.023;
          const lg = ctx.createGain();
          lg.gain.value = 0.02 / (i + 1);
          lfo.connect(lg).connect(g.gain);
          o.connect(g).connect(this.filter);
          o.start(); lfo.start();
        });
      });
    }
    this.ctx.resume();
    this.master.gain.setTargetAtTime(0.5, this.ctx.currentTime, 1.2);
  }

  stop() {
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
  }

  progress(p: number) {
    if (!this.ctx) return;
    this.filter.frequency.setTargetAtTime(320 + p * 2200, this.ctx.currentTime, 0.6);
  }
}

// ─────────────────────────────────────────────────────────────────
// Letterbox bars with the studio mark, chapter, timecode and sound
// ─────────────────────────────────────────────────────────────────
export default function FilmChrome() {
  const [shown, setShown] = useState(false);
  const [p, setP] = useState(0);
  const [chapter, setChapter] = useState('prologue');
  const [sound, setSound] = useState(false);
  const score = useRef<Score | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 400);
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const prog = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      setP(prog);
      score.current?.progress(prog);
      const mid = window.innerHeight * 0.5;
      let name = 'prologue';
      document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((el) => {
        if (el.getBoundingClientRect().top <= mid) name = el.dataset.chapter!;
      });
      setChapter(name);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const toggleSound = () => {
    if (!score.current) score.current = new Score();
    if (sound) score.current.stop(); else score.current.start();
    setSound(!sound);
  };

  return (
    <div className={`film${shown ? ' in' : ''}`}>
      <header className="bar bar-top">
        <a href="#top" className="wordmark" aria-label="doingthings, back to the start">
          <span className="wm-a">doing</span><span className="wm-b">things</span>
        </a>
        <span className="presents">a doingthings original</span>
        <nav className="nav">
          <a href="#top" className="nav-link">the story</a>
          <a href="#contact" className="nav-link">contact</a>
        </nav>
      </header>

      <div className="bar bar-bottom">
        <span className="hud-chapter"><i aria-hidden />{chapter}</span>
        <span className="hud-track" aria-hidden><span style={{ transform: `scaleX(${p})` }} /></span>
        <span className="hud-tc" aria-hidden>{timecode(p * RUNTIME)}</span>
        <button type="button" className={`sound${sound ? ' on' : ''}`} onClick={toggleSound} aria-pressed={sound}>
          <span className="eq" aria-hidden><b /><b /><b /><b /></span>
          sound {sound ? 'on' : 'off'}
        </button>
      </div>
    </div>
  );
}
