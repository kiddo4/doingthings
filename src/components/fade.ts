// Opacity envelope: 0 outside [a, b], ramps in/out over `e`
export function fade(p: number, a: number, b: number, e = 0.07) {
  if (p <= a || p >= b) return 0;
  return Math.min(1, (p - a) / e, (b - p) / e);
}
