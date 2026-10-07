import { useEffect, useRef, useState } from 'react';

// A lightweight perspective-projected sculpture: each point lives in three dimensions.
// No WebGL dependency; the static frame is also the reduced-motion fallback.
export default function IdeaField({ motion }: { motion: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useRef({ x: 0, y: 0, open: false });
  const redraw = useRef<() => void>(() => {});
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    let width = 0, height = 0, frame = 0, visible = false, rotation = 0, expansion = target.current.open ? 1 : 0;
    let lastTime = 0;
    const points = Array.from({ length: 2600 }, (_, i) => {
      const u = i * 2.39996323;
      const v = i * 0.61803399 * Math.PI * 2;
      const tube = 0.24 + 0.085 * Math.sin(u * 3);
      return { x: (0.73 + tube * Math.cos(v)) * Math.cos(u), y: (0.73 + tube * Math.cos(v)) * Math.sin(u), z: tube * Math.sin(v), seed: i * 0.71 };
    });
    const draw = (time: number) => {
      frame = 0;
      const elapsed = Math.min((time - lastTime) / 1000, 0.04); lastTime = time;
      if (motion) { rotation += elapsed * 0.15; expansion += ((target.current.open ? 1 : 0) - expansion) * 0.045; }
      else expansion = target.current.open ? 1 : 0;
      ctx.clearRect(0, 0, width, height);
      const scale = Math.min(width * 0.4, height * 0.43);
      const ry = rotation + (motion ? target.current.x * 0.28 : 0) + 0.4;
      const rx = 0.72 + (motion ? target.current.y * 0.2 : 0);
      const projected = points.map(p => {
        const spread = expansion * 0.38;
        const x = p.x + Math.sin(p.seed * 1.3) * spread;
        const y = p.y + Math.cos(p.seed * 0.7) * spread;
        const z = p.z + Math.sin(p.seed * 1.7) * spread;
        const xx = x * Math.cos(ry) + z * Math.sin(ry);
        const zz = -x * Math.sin(ry) + z * Math.cos(ry);
        const yy = y * Math.cos(rx) - zz * Math.sin(rx);
        const depth = y * Math.sin(rx) + zz * Math.cos(rx);
        const perspective = 3.5 / (3.5 + depth);
        return { x: width / 2 + xx * scale * perspective, y: height / 2 + yy * scale * perspective, depth, size: perspective * (0.4 + (Math.sin(p.seed) + 1) * 0.45) };
      }).sort((a, b) => b.depth - a.depth);
      for (const p of projected) {
        const alpha = Math.max(0.12, Math.min(0.92, 0.62 - p.depth * 0.48));
        ctx.fillStyle = `rgba(232,231,224,${alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      if (motion && visible && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const render = () => { if (!frame) frame = requestAnimationFrame(draw); };
    redraw.current = render;
    const resize = () => {
      const rect = el.getBoundingClientRect(); width = rect.width; height = rect.height;
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      el.width = width * dpr; el.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); render();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) render(); else { cancelAnimationFrame(frame); frame = 0; } });
    const resizeObserver = new ResizeObserver(resize);
    const visibilityChange = () => { if (!document.hidden && visible) render(); else { cancelAnimationFrame(frame); frame = 0; } };
    observer.observe(el); resizeObserver.observe(el);
    document.addEventListener('visibilitychange', visibilityChange);
    resize();
    return () => { redraw.current = () => {}; observer.disconnect(); resizeObserver.disconnect(); cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibilityChange); };
  }, [motion]);
  return <div className="idea-field" onPointerMove={event => {
    const r = event.currentTarget.getBoundingClientRect();
    target.current.x = (event.clientX - r.left) / r.width - 0.5;
    target.current.y = (event.clientY - r.top) / r.height - 0.5;
  }} onPointerLeave={() => { target.current.x = 0; target.current.y = 0; }}>
    <canvas ref={canvas} aria-hidden="true" />
    <button className="play-idea" aria-pressed={expanded} onClick={() => { target.current.open = !expanded; setExpanded(!expanded); redraw.current(); }}><span aria-hidden="true">{expanded ? '−' : '+'}</span>{expanded ? 'bring it together' : 'let your mind wander'}</button>
    <span className="sr-only">An interactive three-dimensional ring of particles. Use the button to scatter or gather its form.</span>
  </div>;
}
