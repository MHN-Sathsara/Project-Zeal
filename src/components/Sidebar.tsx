import { levelFromXp } from "../lib/rewards";

type View = "tasks" | "rewards" | "settings";

interface Props {
  view: View;
  setView: (v: View) => void;
  xp: number;
  displayName: string;
}

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "tasks",   label: "Tasks",   icon: "✅" },
  { id: "rewards", label: "Rewards", icon: "🏆" },
  { id: "settings",label: "Settings",icon: "⚙️" },
];

export default function Sidebar({ view, setView, xp, displayName }: Props) {
  const { level, xpIntoLevel, xpForNextLevel } = levelFromXp(xp);
  const pct = Math.round((xpIntoLevel / xpForNextLevel) * 100);
  const initials = displayName ? displayName[0].toUpperCase() : "Z";

  return (
    <div className="sidebar">
      <div className="sidebar-profile">
        <div className="avatar">{initials}</div>
        <div className="profile-name">{displayName || "Adventurer"}</div>
        <div className="profile-level">Level {level}</div>
        <div className="xp-bar-wrap">
          <div className="xp-bar" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>
          {xpIntoLevel} / {xpForNextLevel} XP
        </div>
      </div>

      {NAV.map((n) => (
        <button
          key={n.id}
          className={`nav-item ${view === n.id ? "active" : ""}`}
          onClick={() => setView(n.id)}
        >
          <span>{n.icon}</span> {n.label}
        </button>
      ))}

      <div className="nav-spacer" />
      <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", paddingBottom: 4 }}>
        Zeal 🔥
      </div>
    </div>
  );
}