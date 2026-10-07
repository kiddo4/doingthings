import { useEffect, useRef, useState, type ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────
// Dot + trailing ring cursor (fine pointers only)
// ─────────────────────────────────────────────────────────────────
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    document.documentElement.classList.add('has-cursor');
    const p = { x: -100, y: -100 }, r = { x: -100, y: -100 };
    let raf = 0;

    const move = (e: PointerEvent) => {
      p.x = e.clientX; p.y = e.clientY;
      const hot = (e.target as HTMLElement).closest('a,button,[data-hot]');
      ring.current?.classList.toggle('hot', !!hot);
      dot.current?.classList.toggle('hot', !!hot);
    };
    const leave = () => { p.x = p.y = -100; };
    const down = () => ring.current?.classList.add('press');
    const up = () => ring.current?.classList.remove('press');
    const loop = () => {
      r.x += (p.x - r.x) * 0.18;
      r.y += (p.y - r.y) * 0.18;
      if (dot.current) dot.current.style.transform = `translate(${p.x}px,${p.y}px)`;
      if (ring.current) ring.current.style.transform = `translate(${r.x}px,${r.y}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', move);
    document.addEventListener('pointerleave', leave);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden><span /></div>
      <div ref={dot} className="cursor-dot" aria-hidden><span /></div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Fade-up on first scroll into view
// ─────────────────────────────────────────────────────────────────
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: {
  children: ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'p' | 'h2';
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal${shown ? ' in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
