import { useEffect, useRef, useState, useCallback } from 'react';
import './App.css';

type Phase = 'void' | 'ink' | 'form' | 'live';

const LINES = ['doing things', 'that touch', 'lives.'];
const WORDS_CYCLE = ['ideate.', 'research.', 'build.', 'touch lives.'];

// ─────────────────────────────────────────────────────────────────
// Main canvas — ink-drop fluid effect
// ─────────────────────────────────────────────────────────────────
function InkCanvas({ onPhase }: { onPhase: (p: Phase) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<Phase>('void');
  const onPhaseRef = useRef(onPhase);
  onPhaseRef.current = onPhase;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = window.innerWidth;
    let H = window.innerHeight;
    let isMobile = W < 768;
    let raf = 0;
    let phaseStart = 0;
    let textPixels: { x: number; y: number; charIdx: number }[] = [];
    let totalChars = 0;

    // Each "drop" = one ink particle that seeks its text pixel home
    interface Drop {
      x: number; y: number;
      vx: number; vy: number;
      tx: number; ty: number;  // target text pixel
      charIdx: number;         // which character (for staggered reveal)
      alpha: number;
      size: number;
      trail: { x: number; y: number; a: number }[];
      arrived: boolean;
      seed: number;
      hue: number;
    }

    let drops: Drop[] = [];
    const mouse = { x: -9999, y: -9999 };

    function setPhase(p: Phase) {
      phaseRef.current = p;
      phaseStart = performance.now();
      onPhaseRef.current(p);
    }

    // ── Sample text into pixel coordinates ──
    function buildTextPixels() {
      const off = document.createElement('canvas');

      // ── Fit font so the widest line fills ~88% of screen width ──
      // We need to measure first, then scale to fit.
      const probe = document.createElement('canvas').getContext('2d')!;
      const targetW = isMobile ? W * 0.88 : Math.min(W * 0.82, 1100);
      // Start with a rough guess then scale
      let fontSize = isMobile
        ? Math.floor(W * 0.12)
        : Math.floor(Math.min(W * 0.094, 136));
      probe.font = `700 ${fontSize}px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif`;
      const probeMaxW = Math.max(...LINES.map(l => probe.measureText(l).width));
      fontSize = Math.floor(fontSize * (targetW / probeMaxW));

      const lineGap = fontSize * 0.95;

      const oCtx = off.getContext('2d')!;
      const fontStr = `700 ${fontSize}px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif`;
      oCtx.font = fontStr;

      const maxW = Math.max(...LINES.map(l => oCtx.measureText(l).width));
      off.width  = Math.ceil(maxW) + 4;
      off.height = Math.ceil(LINES.length * lineGap) + fontSize;

      oCtx.font = fontStr;
      oCtx.fillStyle = '#fff';
      oCtx.textBaseline = 'top';
      LINES.forEach((line, i) => oCtx.fillText(line, 0, i * lineGap));

      const { data } = oCtx.getImageData(0, 0, off.width, off.height);
      const step = isMobile ? 2 : 3;

      // Left margin so text starts with consistent padding
      const originX = isMobile ? W * 0.06 : W * 0.055;
      // Vertically: on mobile, sit in upper ~50% of viewport, clear of header & sub-block
      const textBlockHeight = LINES.length * lineGap + fontSize;
      const originY = isMobile
        ? H * 0.14 + Math.max(0, (H * 0.48 - textBlockHeight) / 2)
        : H * 0.22;

      textPixels = [];
      totalChars = 0;

      // Per-char mapping: measure each char's x boundary
      const charBounds: { x0: number; x1: number; line: number }[] = [];
      LINES.forEach((line, li) => {
        const chars = line.split('');
        let cx = 0;
        chars.forEach((ch) => {
          const w = oCtx.measureText(ch).width;
          charBounds.push({ x0: cx, x1: cx + w, line: li });
          cx += w;
        });
      });
      totalChars = charBounds.length;

      for (let py = 0; py < off.height; py += step) {
        for (let px = 0; px < off.width; px += step) {
          if (data[(py * off.width + px) * 4 + 3] > 100) {
            // Find which char this pixel belongs to
            let charIdx = 0;
            const lineIdx = Math.floor(py / lineGap);
            let lineCharStart = 0;
            for (let li = 0; li < lineIdx && li < LINES.length; li++) {
              lineCharStart += LINES[li].split('').length;
            }
            for (let ci = lineCharStart; ci < charBounds.length; ci++) {
              if (charBounds[ci].line === lineIdx && px >= charBounds[ci].x0 && px < charBounds[ci].x1) {
                charIdx = ci;
                break;
              }
            }
            textPixels.push({
              x: originX + px,
              y: originY + py,
              charIdx,
            });
          }
        }
      }
    }

    // ── Spawn ink drops ──
    function spawnDrops() {
      drops = textPixels.map((pt) => {
        // Each drop starts from a random edge or center smear
        const spawnType = Math.random();
        let sx: number, sy: number;

        if (spawnType < 0.35) {
          // Falls from top like real ink drop
          sx = pt.x + (Math.random() - 0.5) * W * 0.4;
          sy = -Math.random() * H * 0.3;
        } else if (spawnType < 0.6) {
          // Rises from bottom
          sx = pt.x + (Math.random() - 0.5) * W * 0.3;
          sy = H + Math.random() * H * 0.2;
        } else {
          // Radial burst from center
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * Math.min(W, H) * 0.6 + 100;
          sx = W * 0.5 + Math.cos(angle) * r;
          sy = H * 0.5 + Math.sin(angle) * r;
        }

        return {
          x: sx, y: sy,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          tx: pt.x, ty: pt.y,
          charIdx: pt.charIdx,
          alpha: 0,
          size: isMobile ? Math.random() * 0.8 + 0.8 : Math.random() * 1.5 + 0.6,
          trail: [],
          arrived: false,
          seed: Math.random() * 1000,
          hue: 0, // pure white; could tint later
        };
      });
    }

    // ── Draw loop ──
    function tick(now: number) {
      const el = now - phaseStart;
      const phase = phaseRef.current;

      // Phase transitions
      if (phase === 'void' && el > 600)  setPhase('ink');
      if (phase === 'ink'  && el > 1000) setPhase('form');
      if (phase === 'form' && el > 5500) setPhase('live');

      ctx.clearRect(0, 0, W, H);

      // Soft spotlight
      if (phase !== 'void') {
        const beamT = phase === 'ink' ? Math.min(el / 800, 1) : 1;
        const bAlpha = easeOut(beamT) * (phase === 'live' ? 0.045 : 0.09);
        const grad = ctx.createRadialGradient(W * 0.45, 0, 0, W * 0.45, H * 0.5, H * 0.9);
        grad.addColorStop(0,   `rgba(255,255,255,${bAlpha})`);
        grad.addColorStop(0.4, `rgba(255,255,255,${bAlpha * 0.3})`);
        grad.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      if (phase === 'void') { raf = requestAnimationFrame(tick); return; }

      const charRevealDuration = 5000; // ms for all chars to form
      const perCharDelay = charRevealDuration / Math.max(totalChars, 1);

      for (const d of drops) {
        const charDelay = d.charIdx * perCharDelay;
        const charElapsed = el - charDelay;

        if (phase === 'form' || phase === 'live') {
          if (charElapsed < 0) {
            // Not yet time for this char — drift gently
            d.vx += (Math.random() - 0.5) * 0.1;
            d.vy += (Math.random() - 0.5) * 0.1;
            d.vx *= 0.96; d.vy *= 0.96;
            d.x += d.vx; d.y += d.vy;
            d.alpha = lerp(d.alpha, 0.06, 0.04);
          } else {
            // Pull toward home
            const progress = Math.min(charElapsed / 1800, 1);
            const pull = easeOutElastic(progress);

            if (!d.arrived) {
              const dx = d.tx - d.x, dy = d.ty - d.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < 1.5) {
                d.arrived = true;
                d.x = d.tx; d.y = d.ty;
              } else {
                const spring = 0.055 + pull * 0.09;
                d.vx = (d.vx + dx * spring) * 0.72;
                d.vy = (d.vy + dy * spring) * 0.72;
                d.x += d.vx; d.y += d.vy;
              }
              const maxAlpha = W < 768 ? 0.9 : 0.55;
              d.alpha = lerp(d.alpha, maxAlpha + pull * 0.1, 0.06);
            }

            if (d.arrived && phase === 'live') {
              // Breathing + mouse repulsion
              const mx = mouse.x, my = mouse.y;
              const ddx = d.x - mx, ddy = d.y - my;
              const dist = Math.sqrt(ddx * ddx + ddy * ddy);
              const rR = 120;
              let rx = 0, ry = 0;
              if (dist < rR && dist > 0) {
                const f = Math.pow((rR - dist) / rR, 1.6) * 9;
                rx = (ddx / dist) * f; ry = (ddy / dist) * f;
              }
              const breathX = Math.cos(now * 0.00055 + d.seed) * 0.7;
              const breathY = Math.sin(now * 0.00072 + d.seed * 1.3) * 0.7;
              d.vx = (d.vx + (d.tx - d.x) * 0.1 + rx + breathX) * 0.72;
              d.vy = (d.vy + (d.ty - d.y) * 0.1 + ry + breathY) * 0.72;
              d.x += d.vx; d.y += d.vy;
              const baseAlpha = W < 768 ? 0.82 : 0.55;
              d.alpha = lerp(d.alpha, baseAlpha + Math.sin(now * 0.001 + d.seed) * 0.1, 0.04);
            }
          }
        } else {
          // 'ink' phase — chaos drift
          d.vx += (Math.random() - 0.5) * 0.15;
          d.vy += (Math.random() - 0.5) * 0.15;
          d.vx *= 0.97; d.vy *= 0.97;
          d.x += d.vx; d.y += d.vy;
          const t = Math.min(el / 800, 1);
          d.alpha = lerp(d.alpha, easeOut(t) * 0.18, 0.04);
        }

        if (d.alpha < 0.01) continue;

        // Glow halo on bright particles — skip on mobile to keep text crisp
        if (!isMobile && d.alpha > 0.3 && d.size > 1.0) {
          const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.size * 5);
          g.addColorStop(0, `rgba(255,255,255,${d.alpha * 0.18})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.size * 5, 0, Math.PI * 2);
          ctx.fillStyle = g; ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${d.alpha})`;
        ctx.fill();
      }

      // Ambient free particles on top (always drifting)
      // drawn via noise overlay (CSS), so just tick
      raf = requestAnimationFrame(tick);
    }

    function easeOut(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function easeOutElastic(t: number) {
      if (t === 0) return 0;
      if (t === 1) return 1;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    }

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

    function init() {
      buildTextPixels();
      spawnDrops();
      setPhase('void');
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      isMobile = W < 768;
      canvas.width  = W * dpr; canvas.height = H * dpr;
      canvas.style.width  = W + 'px'; canvas.style.height = H + 'px';
      ctx.scale(dpr, dpr);
      init();
    }

    const onMM = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onTM = (e: TouchEvent) => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; };
    window.addEventListener('mousemove', onMM);
    window.addEventListener('touchmove', onTM, { passive: true });
    window.addEventListener('resize', resize);

    resize();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('touchmove', onTM);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="ink-canvas" />;
}

// ─────────────────────────────────────────────────────────────────
// Ambient floating particles (CSS-driven, layered behind)
// ─────────────────────────────────────────────────────────────────
function AmbientField() {
  const count = 28;
  return (
    <div className="ambient-field" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="mote"
          style={{
            left:  `${Math.random() * 100}%`,
            top:   `${Math.random() * 100}%`,
            width:  `${Math.random() * 2 + 0.5}px`,
            height: `${Math.random() * 2 + 0.5}px`,
            animationDelay:    `${Math.random() * 8}s`,
            animationDuration: `${Math.random() * 14 + 10}s`,
            opacity: Math.random() * 0.25 + 0.05,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Typewriter cycling words
// ─────────────────────────────────────────────────────────────────
function TypeWriter({ active }: { active: boolean }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [del, setDel] = useState(false);

  useEffect(() => {
    if (!active) return;
    const word = WORDS_CYCLE[idx];
    let t: ReturnType<typeof setTimeout>;
    if (!del) {
      if (text.length < word.length) {
        t = setTimeout(() => setText(word.slice(0, text.length + 1)), 75);
      } else {
        t = setTimeout(() => setDel(true), 2200);
      }
    } else {
      if (text.length > 0) {
        t = setTimeout(() => setText(t2 => t2.slice(0, -1)), 38);
      } else {
        setDel(false);
        setIdx(i => (i + 1) % WORDS_CYCLE.length);
      }
    }
    return () => clearTimeout(t);
  }, [active, text, del, idx]);

  return (
    <span className="tw-wrap">
      <span className="tw-text">{text}</span>
      <span className={`tw-cursor${active ? ' blink' : ''}`} />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState<Phase>('void');
  const handlePhase = useCallback((p: Phase) => setPhase(p), []);
  const live = phase === 'live';

  return (
    <div className="shell">
      <div className="grain" />
      <AmbientField />

      <div className={`glow phase-${phase}`} />

      <InkCanvas onPhase={handlePhase} />

      {/* Header */}
      <header className={`hdr${live ? ' in' : ''}`}>
        <span className="wordmark">
          <span className="wm-a">doing</span><span className="wm-b">things</span>
        </span>
        <a href="mailto:hello@doingthings.studio" className="contact-link">
          contact
        </a>
      </header>

      {/* Sub-tagline — floats below the text block */}
      <div className={`sub-block${live ? ' in' : ''}`}>
        <p className="sub-line">
          We&nbsp;<TypeWriter active={live} />
        </p>
        <p className="sub-desc">
          A product studio. Thoughtful software for people who deserve better.
        </p>
      </div>

      {/* Footer */}
      <footer className={`ftr${live ? ' in' : ''}`}>
        <div className="cols">
          <div className="col">
            <span className="col-label">what we do</span>
            <span className="col-val">research · design · build</span>
          </div>
          <div className="col">
            <span className="col-label">who we serve</span>
            <span className="col-val">people who deserve better</span>
          </div>
          <div className="col">
            <span className="col-label">where we are</span>
            <span className="col-val">everywhere it matters</span>
          </div>
        </div>
        <span className="copy">© 2026 doingthings</span>
      </footer>
    </div>
  );
}
