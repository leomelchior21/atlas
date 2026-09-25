export interface Rng {
  next(): number;
  float(min: number, max: number): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  pickWeighted<T>(items: readonly T[], weight: (item: T) => number): T;
  bool(probability?: number): boolean;
  shuffle<T>(items: readonly T[]): T[];
  sample<T>(items: readonly T[], count: number): T[];
  sign(): 1 | -1;
}

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: string): Rng {
  const next = mulberry32(xmur3(seed)());

  const rng: Rng = {
    next,
    float(min, max) {
      return min + next() * (max - min);
    },
    int(min, max) {
      if (max < min) return min;
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick(items) {
      return items[Math.floor(next() * items.length)];
    },
    pickWeighted(items, weight) {
      const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0);
      if (total <= 0) return items[0];
      let roll = next() * total;
      for (const item of items) {
        roll -= Math.max(0, weight(item));
        if (roll <= 0) return item;
      }
      return items[items.length - 1];
    },
    bool(probability = 0.5) {
      return next() < probability;
    },
    shuffle(items) {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    sample(items, count) {
      return rng.shuffle(items).slice(0, Math.max(0, Math.min(count, items.length)));
    },
    sign() {
      return next() < 0.5 ? -1 : 1;
    },
  };

  return rng;
}

const SEED_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function randomSeedToken(length = 5): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += SEED_ALPHABET[Math.floor(Math.random() * SEED_ALPHABET.length)];
  }
  return out;
}

export function makeSeed(prefix: string): string {
  return `${prefix}-${randomSeedToken()}`;
}
