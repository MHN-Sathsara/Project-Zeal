function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

const WEEKS = 18; // ~4.5 months of history

export default function Heatmap({ dates }: { dates: string[] }) {
  const set = new Set(dates);
  const today = new Date();

  // align the right edge to the end of this calendar week (Saturday)
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const days: { iso: string; active: boolean; future: boolean }[] = [];
  for (let i = WEEKS * 7 - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const iso = isoDate(d);
    days.push({
      iso,
      active: set.has(iso),
      future: daysBetween(isoDate(today), iso) > 0
    });
  }

  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div style={{ display: "flex", gap: 3 }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {week.map((day) => (
            <div
              key={day.iso}
              title={day.iso}
              style={{
                width: 11,
                height: 11,
                borderRadius: 2,
                background: day.future ? "transparent" : day.active ? "var(--green-hi)" : "var(--surface-2)"
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}