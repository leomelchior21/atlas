export function isInteger(value: number, tolerance = 1e-9): boolean {
  return Math.abs(value - Math.round(value)) <= tolerance * Math.max(1, Math.abs(value));
}

export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** integer when exact, otherwise fixed decimals without trailing zeros */
export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  if (isInteger(value)) return String(Math.round(value));
  const fixed = round(value, decimals).toFixed(decimals);
  return fixed.replace(/\.?0+$/, "");
}

export function formatFixed(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return round(value, decimals).toFixed(decimals);
}

/** smallest radical form for pedagogically clean answers */
export function radical(n: number): { outside: number; inside: number } | null {
  if (!Number.isFinite(n) || n < 0) return null;
  const rounded = Math.round(n);
  if (Math.abs(n - rounded) > 1e-9) return null;
  let outside = 1;
  let inside = rounded;
  for (let factor = 2; factor * factor <= inside; factor++) {
    while (inside % (factor * factor) === 0) {
      inside /= factor * factor;
      outside *= factor;
    }
  }
  return { outside, inside };
}

export function formatRadical(n: number): string {
  if (isInteger(Math.sqrt(n))) return String(Math.round(Math.sqrt(n)));
  const parts = radical(n);
  if (!parts) return formatNumber(n, 2);
  const { outside, inside } = parts;
  if (inside === 1) return String(outside);
  return outside === 1 ? `√${inside}` : `${outside}√${inside}`;
}

export function formatYears(years: number[], short = true): string {
  if (!years.length) return "todos os anos";
  const labels: Record<number, string> = {
    6: "6º",
    7: "7º",
    8: "8º",
    9: "9º",
    10: "1º EM",
    11: "2º EM",
    12: "3º EM",
  };
  if (!short) {
    const full: Record<number, string> = {
      6: "6º ano",
      7: "7º ano",
      8: "8º ano",
      9: "9º ano",
      10: "1º EM",
      11: "2º EM",
      12: "3º EM",
    };
    return years.map((y) => full[y] ?? String(y)).join(" · ");
  }
  const fundamental = years.filter((y) => y <= 9);
  if (fundamental.length === years.length && years.length > 1) {
    return `${labels[years[0]]} ao ${labels[years[years.length - 1]]}`;
  }
  return years.map((y) => labels[y] ?? String(y)).join(" · ");
}
