export interface Reward {
  id: string;
  title: string;
  desc: string;
  streakRequired: number;
}

export const REWARDS: Reward[] = [
  { id: "spark",     title: "First Spark",      desc: "Complete your first task.",  streakRequired: 1  },
  { id: "three",     title: "Warming Up",        desc: "3-day streak.",              streakRequired: 3  },
  { id: "week",      title: "One Week Strong",   desc: "7-day streak.",              streakRequired: 7  },
  { id: "fortnight", title: "Two Week Grind",    desc: "14-day streak.",             streakRequired: 14 },
  { id: "month",     title: "Monthly Master",    desc: "30-day streak.",             streakRequired: 30 },
  { id: "quarter",   title: "Quarter Legend",    desc: "90-day streak.",             streakRequired: 90 },
  { id: "year",      title: "Year of Fire",      desc: "365-day streak.",            streakRequired: 365},
];

export function xpForCompletion(currentStreak: number): number {
  // base 10xp, +2 bonus per streak day, capped at +40 bonus
  return 10 + Math.min(currentStreak, 20) * 2;
}

export function levelFromXp(xp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
  let level = 1;
  let remaining = xp;
  let needed = 50;
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = Math.round(needed * 1.25); // each level costs 25% more xp
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: needed };
}