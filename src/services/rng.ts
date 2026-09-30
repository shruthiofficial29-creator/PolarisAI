// Seeded PRNG (mulberry32) + smooth deterministic noise. No Math.random anywhere.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth 2D value-noise from integer lattice hashing (deterministic, no state).
function hash2(x: number, y: number, seed = 1337): number {
  let h = x * 374761393 + y * 668265263 + seed * 974634211;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return ((h >>> 0) % 100000) / 100000;
}
function smoothstep(t: number): number { return t * t * (3 - 2 * t); }

export function smoothNoise2(x: number, y: number, seed = 1337): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  const u = smoothstep(xf), v = smoothstep(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// Fractal noise: 3 octaves
export function fbm2(x: number, y: number, seed = 1337): number {
  return (
    0.55 * smoothNoise2(x, y, seed) +
    0.3 * smoothNoise2(x * 2.13 + 7.3, y * 2.13 + 3.1, seed + 101) +
    0.15 * smoothNoise2(x * 4.41 + 13.7, y * 4.41 + 9.2, seed + 202)
  );
}
