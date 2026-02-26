import { useEffect, useRef, useState, useCallback } from 'react';
import './App.css';

type Act = 'silence' | 'line' | 'pulse' | 'fracture' | 'reveal' | 'breathe';
const LINES = ['doing things', 'that touch', 'lives.'];
const CYCLE = ['ideate.', 'research.', 'build.', 'touch lives.'];

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  hx: number; hy: number; hz: number;
  sx: number; sy: number;
  baseSize: number;
  alpha: number;
  delay: number;
  seed: number;
}

function StoryCanvas({ onAct }: { onAct: (a: Act) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cbRef = useRef(onAct);
  cbRef.current = onAct;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = window.innerWidth, H = window.innerHeight;
    let raf = 0, actStart = 0;
    let act: Act = 'silence';
    let particles: Particle[] = [];
    let lineY = 0;
    let crackPoints: { x: number; y: number; angle: number; len: number }[] = [];
    const mouse = { x: -9999, y: -9999, sx: 0, sy: 0 };

    let fontSize = 0, lineH = 0, originX = 0, originY = 0;

    const easeOut3  = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeOut5  = (t: number) => 1 - Math.pow(1 - t, 5);
    const easeInOut = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    const lerp      = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp     = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

    function go(a: Act) {
      act = a; actStart = performance.now();
      cbRef.current(a);
    }

    function setupMetrics() {
      const mobile = W < 768;
      // Tighter font on mobile so text fits and doesn't crowd bottom UI
      fontSize  = mobile
        ? Math.floor(Math.min(W * 0.115, H * 0.11))
        : Math.floor(Math.min(W * 0.088, 122));
      lineH     = fontSize * 0.9;
      originX   = mobile ? W * 0.05 : W * 0.06;
      // Place text in top 45% of screen on mobile — well clear of bottom UI
      originY   = mobile ? H * 0.14 : H * 0.2;
      lineY     = H * 0.5;
    }

    function buildParticles() {
      const off    = document.createElement('canvas');
      const mobile = W < 768;
      // Denser sampling on desktop, sparser on mobile for performance + clarity
      const step   = mobile ? 6 : 3;
      const font   = `700 ${fontSize}px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif`;

      const oCtx = off.getContext('2d')!;
      oCtx.font = font;
      const maxW = Math.max(...LINES.map(l => oCtx.measureText(l).width));
      off.width  = Math.ceil(maxW) + 8;
      off.height = Math.ceil(LINES.length * lineH) + fontSize;

      oCtx.font = font;
      oCtx.fillStyle = '#fff';
      oCtx.textBaseline = 'top';
      LINES.forEach((l, i) => oCtx.fillText(l, 0, i * lineH));

      const { data } = oCtx.getImageData(0, 0, off.width, off.height);
      particles = [];

      for (let py = 0; py < off.height; py += step) {
        for (let px = 0; px < off.width; px += step) {
          if (data[(py * off.width + px) * 4 + 3] > 110) {
            const hx = originX + px;
            const hy = originY + py;
            const hz = (Math.random() - 0.5) * 80;

            const angle  = Math.random() * Math.PI * 2;
            const radius = Math.random() * Math.max(W, H) * 0.65 + 80;

            particles.push({
              x: W * 0.5 + Math.cos(angle) * radius,
              y: lineY  + Math.sin(angle) * radius * 0.55,
              z: hz,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              vz: 0,
              hx, hy, hz,
              sx: W * 0.5 + Math.cos(angle) * radius,
              sy: lineY  + Math.sin(angle) * radius * 0.55,
              // Smaller dots on mobile
              baseSize: mobile
                ? Math.random() * 0.9 + 0.4
                : Math.random() * 1.4 + 0.6,
              alpha: 0,
              delay: Math.random() * 1600,
              seed: Math.random() * 1000,
            });
          }
        }
      }
    }

    function buildCracks() {
      crackPoints = [];
      for (let i = 0; i < 20; i++) {
        const base  = (i / 20) * Math.PI * 2;
        const angle = base + (Math.random() - 0.5) * 0.45;
        crackPoints.push({
          x: W / 2, y: lineY, angle,
          len: Math.random() * Math.min(W, H) * 0.36 + 60,
        });
      }
    }

    function tick(now: number) {
      const el = now - actStart;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, W, H);

      mouse.sx = lerp(mouse.sx, mouse.x, 0.07);
      mouse.sy = lerp(mouse.sy, mouse.y, 0.07);

      if (act === 'silence') {
        if (el > 800) go('line');
        raf = requestAnimationFrame(tick); return;
      }

      // ── line draws itself ──
      if (act === 'line') {
        const t = clamp(el / 1100);
        const e = easeOut3(t);
        const half = W * 0.3 * e, cx = W / 2;
        line(cx - half, lineY, cx + half, lineY, `rgba(255,255,255,${e * 0.75})`, 1);
        glowLine(cx - half, lineY, cx + half, lineY, e * 0.15);
        if (t >= 1) go('pulse');
      }

      // ── heartbeat ──
      if (act === 'pulse') {
        const period = 680;
        const beat   = Math.floor(el / period);
        const phase  = (el % period) / period;
        if (beat >= 2 && el > 1360) { buildCracks(); go('fracture'); }
        else {
          const amp = Math.sin(phase * Math.PI) * (beat === 0 ? 14 : 22);
          const cx = W / 2, len = W * 0.3;
          ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx - len, lineY);
          ctx.bezierCurveTo(cx-55, lineY, cx-26, lineY-amp, cx,   lineY-amp);
          ctx.bezierCurveTo(cx+26, lineY-amp, cx+55, lineY, cx+len, lineY);
          ctx.stroke();
          ctx.save(); ctx.filter = 'blur(4px)';
          ctx.strokeStyle = `rgba(255,255,255,${0.1 + Math.abs(amp)/160})`; ctx.lineWidth = 7;
          ctx.beginPath(); ctx.moveTo(cx-len, lineY); ctx.lineTo(cx+len, lineY); ctx.stroke();
          ctx.restore();
        }
      }

      // ── fracture ──
      if (act === 'fracture') {
        const t = clamp(el / 700);
        const e = easeOut5(t);
        for (const c of crackPoints) {
          ctx.strokeStyle = `rgba(255,255,255,${0.55 * (1 - t * 0.6)})`;
          ctx.lineWidth   = lerp(1.4, 0.3, t);
          ctx.beginPath(); ctx.moveTo(c.x, c.y);
          ctx.lineTo(c.x + Math.cos(c.angle)*c.len*e, c.y + Math.sin(c.angle)*c.len*e);
          ctx.stroke();
        }
        const g = ctx.createRadialGradient(W/2, lineY, 0, W/2, lineY, 280*e);
        g.addColorStop(0,   `rgba(255,255,255,${e*0.6})`);
        g.addColorStop(0.3, `rgba(255,255,255,${e*0.18})`);
        g.addColorStop(1,   'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        if (t >= 1) { buildParticles(); go('reveal'); }
      }

      // ── particles home in ──
      if (act === 'reveal') {
        drawParticles(now, el, false);
        const cf = clamp(1 - el / 600);
        for (const c of crackPoints) {
          ctx.strokeStyle = `rgba(255,255,255,${0.28 * cf})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(c.x, c.y);
          ctx.lineTo(c.x + Math.cos(c.angle)*c.len, c.y + Math.sin(c.angle)*c.len);
          ctx.stroke();
        }
        if (el > 2800) go('breathe');
      }

      // ── alive forever ──
      if (act === 'breathe') drawParticles(now, el, true);

      raf = requestAnimationFrame(tick);
    }

    function line(x1: number, y1: number, x2: number, y2: number, color: string, w: number) {
      ctx.strokeStyle = color; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    }
    function glowLine(x1: number, y1: number, x2: number, y2: number, a: number) {
      ctx.save(); ctx.filter = 'blur(5px)';
      ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      ctx.restore();
    }

    function drawParticles(now: number, el: number, breathe: boolean) {
      const FOV = 500;
      const REPEL_R = 100, REPEL_F = 7;
      const mx = mouse.sx, my = mouse.sy;

      for (const p of particles) {
        const localEl = el - p.delay;

        if (!breathe) {
          if (localEl < 0) {
            p.vx += (Math.random()-0.5)*0.06; p.vy += (Math.random()-0.5)*0.06;
            p.vx *= 0.97; p.vy *= 0.97;
            p.x += p.vx; p.y += p.vy;
            p.alpha = lerp(p.alpha, 0.07, 0.04);
          } else {
            const t = clamp(localEl / 1400);
            const spring = lerp(0.04, 0.11, easeOut3(t));
            p.vx = (p.vx + (p.hx - p.x) * spring) * 0.73;
            p.vy = (p.vy + (p.hy - p.y) * spring) * 0.73;
            p.vz = (p.vz + (p.hz - p.z) * spring) * 0.73;
            p.x += p.vx; p.y += p.vy; p.z += p.vz;
            p.alpha = lerp(p.alpha, 0.7 + easeOut3(t) * 0.22, 0.05);
          }
        } else {
          const dx = p.x - mx, dy = p.y - my;
          const dist = Math.sqrt(dx*dx + dy*dy);
          let rx = 0, ry = 0;
          if (dist < REPEL_R && dist > 0) {
            const f = Math.pow((REPEL_R-dist)/REPEL_R, 1.8) * REPEL_F;
            rx = (dx/dist)*f; ry = (dy/dist)*f;
          }
          const bx = Math.cos(now*0.00052 + p.seed) * 0.55;
          const by = Math.sin(now*0.00068 + p.seed*1.4) * 0.55;
          const bz = Math.sin(now*0.00045 + p.seed*0.7) * 1.5;
          p.vx = (p.vx + (p.hx-p.x)*0.09 + rx + bx) * 0.74;
          p.vy = (p.vy + (p.hy-p.y)*0.09 + ry + by) * 0.74;
          p.vz = (p.vz + (p.hz-p.z)*0.06 + bz)      * 0.74;
          p.x += p.vx; p.y += p.vy; p.z += p.vz;
          p.alpha = lerp(p.alpha, 0.5 + (p.z/80)*0.3 + Math.sin(now*0.0009+p.seed)*0.14, 0.04);
        }

        if (p.alpha < 0.02) continue;

        // 3D projection
        const scale = FOV / (FOV - p.z);
        const px2   = (p.x - W*0.5)*scale + W*0.5;
        const py2   = (p.y - H*0.5)*scale + H*0.5;
        const r     = Math.max(0.3, p.baseSize * scale);
        const depth = clamp(0.45 + (p.z/80)*0.55);

        // Glow on closer/brighter dots
        if (r > 0.8 && p.alpha > 0.3) {
          const g = ctx.createRadialGradient(px2, py2, 0, px2, py2, r*4);
          g.addColorStop(0, `rgba(255,255,255,${p.alpha*depth*0.2})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.beginPath(); ctx.arc(px2, py2, r*4, 0, Math.PI*2);
          ctx.fillStyle = g; ctx.fill();
        }

        ctx.beginPath(); ctx.arc(px2, py2, r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha*depth})`;
        ctx.fill();
      }

      if (breathe && mx > 0) {
        const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 160);
        mg.addColorStop(0, 'rgba(255,255,255,0.04)');
        mg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = mg; ctx.fillRect(0,0,W,H);
      }
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      mouse.sx = W/2; mouse.sy = H/2;
      canvas.width  = W*dpr; canvas.height = H*dpr;
      canvas.style.width = W+'px'; canvas.style.height = H+'px';
      ctx.scale(dpr, dpr);
      setupMetrics();
      particles = []; crackPoints = [];
      go('silence');
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

  return <canvas ref={ref} className="story-canvas" />;
}

function TypeWriter({ on }: { on: boolean }) {
  const [idx, setIdx] = useState(0);
  const [txt, setTxt] = useState('');
  const [del, setDel] = useState(false);
  useEffect(() => {
    if (!on) return;
    const word = CYCLE[idx];
    let t: ReturnType<typeof setTimeout>;
    if (!del) {
      if (txt.length < word.length) t = setTimeout(() => setTxt(word.slice(0, txt.length+1)), 72);
      else t = setTimeout(() => setDel(true), 2400);
    } else {
      if (txt.length > 0) t = setTimeout(() => setTxt(s => s.slice(0,-1)), 38);
      else { setDel(false); setIdx(i => (i+1)%CYCLE.length); }
    }
    return () => clearTimeout(t);
  }, [on, txt, del, idx]);

  return (
    <span className="tw">
      <span className="tw-t">{txt}</span>
      <span className={`tw-c${on?' blink':''}`} />
    </span>
  );
}

export default function App() {
  const [act, setAct] = useState<Act>('silence');
  const handle = useCallback((a: Act) => setAct(a), []);
  const live = act === 'breathe';

  return (
    <div className="shell">
      <div className="grain" />
      <StoryCanvas onAct={handle} />

      <header className={`hdr${live?' in':''}`}>
        <span className="wm"><b>doing</b>things</span>
        <a href="mailto:hello@doingthings.studio" className="clink">contact</a>
      </header>

      <footer className={`ftr${live?' in':''}`}>
        <div className="sub-block">
          <p className="sub-line">We&nbsp;<TypeWriter on={live} /></p>
          <p className="sub-desc">A product studio. Thoughtful software for people who deserve better.</p>
        </div>
        <div className="cols">
          <div className="col"><span className="cl">what we do</span><span className="cv">research · design · build</span></div>
          <div className="col"><span className="cl">who we serve</span><span className="cv">people who deserve better</span></div>
          <div className="col mobile-hide"><span className="cl">where we are</span><span className="cv">everywhere it matters</span></div>
        </div>
        <span className="copy">© 2026 doingthings</span>
      </footer>
    </div>
  );
}
