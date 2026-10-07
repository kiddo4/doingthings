import type { CSSProperties } from 'react';

export type SigilKind = 'tech' | 'music' | 'beauty' | 'art' | 'product';

// Golden spiral from Fibonacci quarter-arcs
const SPIRAL = (() => {
  const fib = [2, 3, 5, 8, 13, 21, 34, 55];
  const dirs = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  let d = 'M100 100';
  fib.forEach((r, i) => {
    const [sx, sy] = dirs[i % 4];
    d += ` a${r} ${r} 0 0 1 ${sx * r} ${sy * r}`;
  });
  return d;
})();

const NODES = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
  return { x: 100 + Math.cos(a) * 72, y: 100 + Math.sin(a) * 72, mx: 100 + Math.cos(a) * 46, my: 100 + Math.sin(a) * 46 };
});

// ─────────────────────────────────────────────────────────────────
// One glyph per god. `draw` (0→1) traces the strokes in.
// ─────────────────────────────────────────────────────────────────
export default function Sigil({ kind, draw = 1, className = '' }: { kind: SigilKind; draw?: number; className?: string }) {
  const style = { '--draw': 1 - Math.max(0, Math.min(1, draw)) } as CSSProperties;

  return (
    <svg viewBox="0 0 200 200" className={`sigil sigil-${kind} ${className}`} style={style} aria-hidden>
      <defs>
        <radialGradient id={`halo-${kind}`}>
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill={`url(#halo-${kind})`} className="halo" />
      <circle cx="100" cy="100" r="88" pathLength={1} className="trace thin" />

      {kind === 'tech' && (
        <g className="spin">
          <rect x="72" y="72" width="56" height="56" pathLength={1} className="trace" transform="rotate(45 100 100)" />
          {NODES.map((n, i) => (
            <g key={i}>
              <path d={`M100 100 L${n.mx} ${n.my} L${n.x} ${n.y}`} pathLength={1} className="trace thin" />
              <circle cx={n.x} cy={n.y} r="3.5" className="node" style={{ animationDelay: `${i * 0.25}s` }} />
            </g>
          ))}
          <circle cx="100" cy="100" r="7" className="core" />
        </g>
      )}

      {kind === 'music' && (
        <g>
          {Array.from({ length: 11 }, (_, i) => {
            const h = 14 + Math.sin((i / 10) * Math.PI) * 58;
            return (
              <rect
                key={i}
                x={47 + i * 10} y={100 - h / 2} width="4" height={h} rx="2"
                className="bar"
                style={{ animationDelay: `${(i % 5) * 0.13}s`, opacity: draw > i / 11 ? 1 : 0.08 }}
              />
            );
          })}
        </g>
      )}

      {kind === 'beauty' && (
        <g className="spin slow">
          <path d={SPIRAL} pathLength={1} className="trace" />
          <circle cx="100" cy="100" r="34" pathLength={1} className="trace thin" />
          <circle cx="100" cy="100" r="55" pathLength={1} className="trace thin" />
          <circle cx="100" cy="100" r="5" className="core" />
        </g>
      )}

      {kind === 'art' && (
        <g>
          <path
            d="M38 132 C58 70, 92 58, 104 92 S140 150, 162 74"
            pathLength={1} className="trace brush"
          />
          <path d="M52 146 C80 128, 118 132, 150 112" pathLength={1} className="trace thin" />
          {[[150, 52, 4], [166, 62, 2.5], [140, 44, 2], [44, 120, 2.5]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} className="node" style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </g>
      )}

      {kind === 'product' && (
        <g className="float">
          <path d="M100 42 L150 71 L150 129 L100 158 L50 129 L50 71 Z" pathLength={1} className="trace" />
          <path d="M50 71 L100 100 L150 71 M100 100 L100 158" pathLength={1} className="trace" />
          <path d="M75 56.5 L125 85.5 M125 56.5 L75 85.5" pathLength={1} className="trace thin" />
        </g>
      )}
    </svg>
  );
}
