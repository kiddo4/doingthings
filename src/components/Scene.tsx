import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────
// A pinned, full-screen shot. Its children get scroll progress 0→1
// while the visitor scrolls through `length` screens of film.
// ─────────────────────────────────────────────────────────────────
export function Scene({ id, chapter, length, className = '', children }: {
  id?: string; chapter: string; length: number; className?: string;
  children: (p: number) => ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = ref.current!.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      setP(Math.max(0, Math.min(1, -r.top / Math.max(total, 1))));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      data-chapter={chapter}
      className={`scene ${className}`}
      style={{ height: `${length * 100}vh` }}
    >
      <div className="scene-pin" style={{ '--p': p } as CSSProperties}>
        {children(p)}
      </div>
    </section>
  );
}

// A line of film dialogue that drifts in from a blur
export function Sub({ o, className = '', children }: { o: number; className?: string; children: ReactNode }) {
  return (
    <p
      className={`sub ${className}`}
      aria-hidden={o < 0.05}
      style={{
        opacity: o,
        transform: `translateY(${(1 - o) * 14}px)`,
        filter: o < 1 ? `blur(${(1 - o) * 8}px)` : undefined,
      }}
    >
      {children}
    </p>
  );
}

// Chapter title card
export function ChapterCard({ title, o = 1 }: { title: string; o?: number }) {
  return (
    <div className="chapter-card" style={{ opacity: o }}>
      <span className="cc-rule" aria-hidden />
      <span className="cc-t"><em>{title}</em></span>
    </div>
  );
}
