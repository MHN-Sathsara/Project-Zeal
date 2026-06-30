export function isoToday(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function computeStreaks(dateStrings: string[]): { current: number; best: number } {
  if (dateStrings.length === 0) return { current: 0, best: 0 };

  const unique = [...new Set(dateStrings)].sort();

  // Best streak: longest run of consecutive days anywhere in history
  let best = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    if (daysBetween(unique[i - 1], unique[i]) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
  }

  // Current streak: only counts if it's still "alive" — last completion
  // was today or yesterday. Miss two days and it's reset to 0.
  const today = isoToday();
  const last = unique[unique.length - 1];
  const gap = daysBetween(last, today);

  let current = 0;
  if (gap <= 1) {
    current = 1;
    for (let i = unique.length - 1; i > 0; i--) {
      if (daysBetween(unique[i - 1], unique[i]) === 1) current += 1;
      else break;
    }
  }

  return { current, best };
}