export const formatCredits = (n: number | null): string =>
  n === null ? "--" : Number.isInteger(n) ? n.toFixed(1) : String(n);

export const pct = (v: number): string => `${Math.round(v * 100)}%`;
