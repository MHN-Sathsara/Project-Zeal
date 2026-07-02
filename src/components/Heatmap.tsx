import { useState } from "react";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const CELL = 13;
const GAP  = 3;
const STEP = CELL + GAP;

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function intensityColor(count: number): string {
  if (count === 0) return "var(--surface-2)";
  if (count === 1) return "#0e4429";
  if (count === 2) return "#006d32";
  if (count === 3) return "#26a641";
  return "#39d353";
}

interface Props {
  dates: string[];
  startedAt?: string; // ISO date of first task creation
}

type ViewMode = "month" | "year";

export default function Heatmap({ dates, startedAt }: Props) {
  const today = new Date();
  const [mode, setMode] = useState<ViewMode>("month");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const countMap = new Map<string, number>();
  for (const d of dates) countMap.set(d, (countMap.get(d) ?? 0) + 1);

  const startISO = startedAt ?? dates.slice().sort()[0] ?? isoDate(today);
  const startDate = new Date(startISO + "T00:00:00");

  // ── Navigation bounds ──
  const isAtPresent = mode === "month"
    ? year === today.getFullYear() && month === today.getMonth()
    : year === today.getFullYear();

  const isBeforeStart = mode === "month"
    ? new Date(year, month, 1) < new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    : year < startDate.getFullYear();

  function goBack() {
    if (mode === "month") {
      if (month === 0) { setMonth(11); setYear(y => y - 1); }
      else setMonth(m => m - 1);
    } else {
      setYear(y => y - 1);
    }
  }

  function goForward() {
    if (isAtPresent) return;
    if (mode === "month") {
      if (month === 11) { setMonth(0); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    } else {
      setYear(y => y + 1);
    }
  }

  function goToToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  // ── Build grid ──
  type Cell = { iso: string; count: number; future: boolean; inRange: boolean };

  function buildMonthGrid(): Cell[][] {
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);

    // pad to start on Sunday
    const startPad = firstDay.getDay();
    const gridStart = new Date(firstDay);
    gridStart.setDate(gridStart.getDate() - startPad);

    // pad to end on Saturday
    const endPad = 6 - lastDay.getDay();
    const gridEnd = new Date(lastDay);
    gridEnd.setDate(gridEnd.getDate() + endPad);

    const columns: Cell[][] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const col: Cell[] = [];
      for (let d = 0; d < 7; d++) {
        const iso = isoDate(cursor);
        col.push({
          iso,
          count: countMap.get(iso) ?? 0,
          future: cursor > today,
          inRange: cursor.getMonth() === month && cursor.getFullYear() === year
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      columns.push(col);
    }
    return columns;
  }

  function buildYearGrid(): { columns: Cell[][]; monthLabels: { label: string; col: number }[] } {
    const firstDay = new Date(year, 0, 1);
    const lastDay  = new Date(year, 11, 31);

    const startPad = firstDay.getDay();
    const gridStart = new Date(firstDay);
    gridStart.setDate(gridStart.getDate() - startPad);

    const endPad = 6 - lastDay.getDay();
    const gridEnd = new Date(lastDay);
    gridEnd.setDate(gridEnd.getDate() + endPad);

    const columns: Cell[][] = [];
    const monthLabels: { label: string; col: number }[] = [];
    const cursor = new Date(gridStart);
    let colIndex = 0;

    while (cursor <= gridEnd) {
      const col: Cell[] = [];
      for (let d = 0; d < 7; d++) {
        const iso = isoDate(cursor);
        col.push({
          iso,
          count: countMap.get(iso) ?? 0,
          future: cursor > today,
          inRange: cursor.getFullYear() === year
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      // month label when first day of month appears in this column
      const firstInCol = new Date(col[0].iso + "T00:00:00");
      if (firstInCol.getDate() <= 7) {
        const label = MONTH_NAMES[firstInCol.getMonth()].slice(0, 3);
        if (!monthLabels.length || monthLabels[monthLabels.length - 1].label !== label) {
          monthLabels.push({ label, col: colIndex });
        }
      }
      columns.push(col);
      colIndex++;
    }
    return { columns, monthLabels };
  }

  // ── Render ──
  const isBeforeStartRange = mode === "month"
    ? new Date(year, month, 1) < new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    : year < startDate.getFullYear();

  const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  if (isBeforeStartRange) {
    return (
      <div>
        <HeatmapNav
          mode={mode} setMode={(m) => setMode(m)}
          label={mode === "month" ? `${MONTH_NAMES[month]} ${year}` : `${year}`}
          onBack={goBack} onForward={goForward} onToday={goToToday}
          isAtPresent={isAtPresent} isBeforeStart={isBeforeStart}
        />
        <div style={{
          marginTop: 16, padding: "24px 0", textAlign: "center",
          color: "var(--muted)", fontSize: 13
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
          <div>Your journey started on <strong>{startISO}</strong>.</div>
          <div style={{ marginTop: 4 }}>No records before that date.</div>
        </div>
      </div>
    );
  }

  if (mode === "month") {
    const columns = buildMonthGrid();
    return (
      <div>
        <HeatmapNav
          mode={mode} setMode={setMode}
          label={`${MONTH_NAMES[month]} ${year}`}
          onBack={goBack} onForward={goForward} onToday={goToToday}
          isAtPresent={isAtPresent} isBeforeStart={isBeforeStart}
        />
        {/* Day labels */}
        <div style={{ display: "flex", gap: GAP, marginTop: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: GAP, marginRight: 4 }}>
            {DAY_LABELS.map((d) => (
              <div key={d} style={{ height: CELL, fontSize: 10, color: "var(--muted)",
                display: "flex", alignItems: "center", width: 24 }}>
                {d}
              </div>
            ))}
          </div>
          {columns.map((col, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
              {col.map((cell) => (
                <Cell key={cell.iso} cell={cell} />
              ))}
            </div>
          ))}
        </div>
        <Legend />
      </div>
    );
  }

  // year view
  const { columns, monthLabels } = buildYearGrid();
  const gridWidth = columns.length * STEP - GAP;

  return (
    <div>
      <HeatmapNav
        mode={mode} setMode={setMode}
        label={`${year}`}
        onBack={goBack} onForward={goForward} onToday={goToToday}
        isAtPresent={isAtPresent} isBeforeStart={isBeforeStart}
      />
      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <div style={{ width: gridWidth, position: "relative" }}>
          {/* Month labels */}
          <div style={{ position: "relative", height: 18, marginBottom: 4 }}>
            {monthLabels.map((m) => (
              <span key={`${m.label}-${m.col}`} style={{
                position: "absolute", left: m.col * STEP,
                fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap"
              }}>
                {m.label}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: GAP }}>
            {columns.map((col, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                {col.map((cell) => (
                  <Cell key={cell.iso} cell={cell} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Legend />
    </div>
  );
}

// ── Sub-components ──

type CellProps = { cell: { iso: string; count: number; future: boolean; inRange: boolean } };

function Cell({ cell }: CellProps) {
  return (
    <div
      title={`${cell.iso}${cell.count ? ` · ${cell.count} task${cell.count > 1 ? "s" : ""}` : ""}`}
      style={{
        width: CELL, height: CELL, borderRadius: 3,
        background: cell.future || !cell.inRange
          ? "transparent"
          : intensityColor(cell.count),
        border: !cell.inRange ? "none" : undefined,
        transition: "transform 0.1s",
        cursor: cell.count > 0 ? "pointer" : "default"
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.35)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    />
  );
}

function Legend() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4,
      marginTop: 10, justifyContent: "flex-end" }}>
      <span style={{ fontSize: 11, color: "var(--muted)" }}>Less</span>
      {[0, 1, 2, 3, 4].map((n) => (
        <div key={n} style={{ width: 11, height: 11, borderRadius: 2,
          background: intensityColor(n) }} />
      ))}
      <span style={{ fontSize: 11, color: "var(--muted)" }}>More</span>
    </div>
  );
}

interface NavProps {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
  label: string;
  onBack: () => void;
  onForward: () => void;
  onToday: () => void;
  isAtPresent: boolean;
  isBeforeStart: boolean;
}

function HeatmapNav({ mode, setMode, label, onBack, onForward, onToday, isAtPresent, isBeforeStart }: NavProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", background: "var(--surface-2)",
        borderRadius: 8, padding: 2, gap: 2 }}>
        {(["month", "year"] as ViewMode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600,
            background: mode === m ? "var(--surface)" : "transparent",
            color: mode === m ? "var(--text)" : "var(--muted)",
            boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,.2)" : "none"
          }}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Back */}
      <button onClick={onBack} disabled={isBeforeStart} style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        color: isBeforeStart ? "var(--muted)" : "var(--text)",
        borderRadius: 6, padding: "4px 10px", cursor: isBeforeStart ? "default" : "pointer",
        fontSize: 13
      }}>‹</button>

      {/* Label */}
      <span style={{ fontWeight: 700, fontSize: 14, minWidth: 130, textAlign: "center" }}>
        {label}
      </span>

      {/* Forward */}
      <button onClick={onForward} disabled={isAtPresent} style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        color: isAtPresent ? "var(--muted)" : "var(--text)",
        borderRadius: 6, padding: "4px 10px", cursor: isAtPresent ? "default" : "pointer",
        fontSize: 13
      }}>›</button>

      {/* Today shortcut */}
      {!isAtPresent && (
        <button onClick={onToday} style={{
          background: "transparent", border: "1px solid var(--border)",
          color: "var(--muted)", borderRadius: 6, padding: "4px 10px",
          cursor: "pointer", fontSize: 12
        }}>
          Today
        </button>
      )}
    </div>
  );
}