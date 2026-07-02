import { useEffect, useState } from "react";
import { db, type Task, type Completion } from "./lib/db";
import { newId } from "./lib/id";
import { computeStreaks, isoToday } from "./lib/streaks";
import { REWARDS, xpForCompletion, levelFromXp } from "./lib/rewards";
import { getTheme, applyTheme, type Theme } from "./lib/theme";
import Heatmap from "./components/Heatmap";
import Sidebar from "./components/Sidebar";
import Welcome from "./components/Welcome";

type View = "tasks" | "rewards" | "settings";

const pillStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: 999,
  padding: "6px 14px",
  cursor: "pointer",
  fontSize: 13
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [draft, setDraft] = useState("");
  const [xp, setXp] = useState(0);
  const [unlockedRewards, setUnlockedRewards] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setThemeState] = useState<Theme>(getTheme());
  const [view, setView] = useState<View>("tasks");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    const allTasks = await db.tasks.toArray();
    const allCompletions = await db.completions.toArray();
    const metaXp = await db.meta.get("xp");
    const metaRewards = await db.meta.get("unlockedRewards");
    const metaName = await db.meta.get("displayName");
    setTasks(allTasks.filter((t) => !t.archived));
    setCompletions(allCompletions);
    setXp(metaXp?.value ?? 0);
    setUnlockedRewards(metaRewards?.value ?? []);
    setDisplayName(metaName?.value ?? null);
    setLoading(false);
  }
  // compute earliest task date
const startedAt = tasks
  .map((t) => t.createdAt.slice(0, 10))
  .sort()[0];

// in JSX:
<Heatmap
  dates={completions.map((c) => c.date)}
  startedAt={startedAt}
/>

  useEffect(() => {
    applyTheme(theme);
    loadAll();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function finishWelcome(name: string) {
    await db.meta.put({ key: "displayName", value: name });
    setDisplayName(name);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setThemeState(next);
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    await db.tasks.add({
      id: newId(), title, archived: false,
      createdAt: new Date().toISOString()
    });
    setDraft("");
    loadAll();
  }

  async function removeTask(id: string) {
    await db.tasks.update(id, { archived: true });
    loadAll();
  }

  async function toggleToday(taskId: string) {
    const today = isoToday();
    const existing = completions.find((c) => c.taskId === taskId && c.date === today);
    if (existing) {
      await db.completions.delete(existing.id);
      await loadAll();
      return;
    }
    await db.completions.add({ id: newId(), taskId, date: today });
    const xpLogId = `${taskId}_${today}`;
    const alreadyAwarded = await db.xpLog.get(xpLogId);
    if (!alreadyAwarded) {
      const allCompletions = await db.completions.toArray();
      const taskDates = allCompletions.filter((c) => c.taskId === taskId).map((c) => c.date);
      const { current } = computeStreaks(taskDates);
      const gained = xpForCompletion(current);
      const newXp = xp + gained;
      await db.meta.put({ key: "xp", value: newXp });
      await db.xpLog.put({ id: xpLogId, taskId, date: today });
      const metaRewards = await db.meta.get("unlockedRewards");
      const alreadyUnlocked: string[] = metaRewards?.value ?? [];
      const newlyUnlocked = REWARDS.filter(
        (r) => current >= r.streakRequired && !alreadyUnlocked.includes(r.id)
      );
      if (newlyUnlocked.length > 0) {
        const updated = [...alreadyUnlocked, ...newlyUnlocked.map((r) => r.id)];
        await db.meta.put({ key: "unlockedRewards", value: updated });
        showToast(`🏆 Unlocked: ${newlyUnlocked.map((r) => r.title).join(", ")}`);
      } else {
        showToast(`+${gained} XP`);
      }
    }
    await loadAll();
  }

  if (loading) return null;
  if (!displayName) return <Welcome onDone={finishWelcome} />;

  const PAGE_TITLES: Record<View, string> = {
    tasks: "My Quests",
    rewards: "Rewards",
    settings: "Settings"
  };

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        setView={setView}
        xp={xp}
        displayName={displayName}
      />

      <div className="main-area">
        {/* Topbar */}
        <div className="topbar">
          <span className="topbar-title">{PAGE_TITLES[view]}</span>
          <button className="btn" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        {/* Pages */}
        <div className="page-content">

          {/* ── Tasks ── */}
          {view === "tasks" && (
            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
                  Activity
                </div>
                <Heatmap dates={completions.map((c) => c.date)} />
              </div>

              <form onSubmit={addTask} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                  className="input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Add a new quest…"
                />
                <button type="submit" className="btn btn-primary">Add</button>
              </form>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tasks.length === 0 && (
                  <div style={{ color: "var(--muted)", fontSize: 14, padding: "20px 0" }}>
                    No quests yet — add one above to start your streak.
                  </div>
                )}
                {tasks.map((t) => {
                  const dates = completions.filter((c) => c.taskId === t.id).map((c) => c.date);
                  const { current, best } = computeStreaks(dates);
                  const doneToday = dates.includes(isoToday());
                  return (
                    <div key={t.id} className="card" style={{
                      display: "flex", alignItems: "center", gap: 12,
                      borderColor: doneToday ? "var(--green-hi)" : "var(--border)"
                    }}>
                      <input
                        type="checkbox"
                        checked={doneToday}
                        onChange={() => toggleToday(t.id)}
                        style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--green-hi)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                          🔥 {current} day streak · best {best}
                        </div>
                      </div>
                      <button
                        className="btn btn-ghost"
                        onClick={() => removeTask(t.id)}
                        title="Delete quest"
                      >
                        🗑
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Rewards ── */}
          {view === "rewards" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {REWARDS.map((r) => {
                const unlocked = unlockedRewards.includes(r.id);
                return (
                  <div key={r.id} className="card" style={{
                    display: "flex", alignItems: "center", gap: 14,
                    opacity: unlocked ? 1 : 0.45,
                    borderColor: unlocked ? "var(--green-hi)" : "var(--border)"
                  }}>
                    <div style={{ fontSize: 28 }}>{unlocked ? "🏆" : "🔒"}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{r.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Settings ── */}
          {view === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 480 }}>
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Profile</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
                  Display name
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="input"
                    defaultValue={displayName ?? ""}
                    onBlur={async (e) => {
                      const val = e.target.value.trim();
                      if (val && val !== displayName) {
                        await db.meta.put({ key: "displayName", value: val });
                        setDisplayName(val);
                        showToast("Name updated");
                      }
                    }}
                  />
                </div>
              </div>

              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Appearance</div>
                <button className="btn" onClick={toggleTheme}>
                  {theme === "dark" ? "☀️ Switch to Light mode" : "🌙 Switch to Dark mode"}
                </button>
              </div>

              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Cloud Sync</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                  Optional — Zeal works fully offline without this.
                  Sign in to sync your quests across devices.
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", padding: "10px 0",
                  borderTop: "1px solid var(--border)" }}>
                  🔧 Coming soon — add your Supabase keys to enable sync.
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--surface)", border: "1px solid var(--green-hi)",
          color: "var(--text)", padding: "10px 20px", borderRadius: 999,
          fontSize: 14, fontWeight: 600, zIndex: 999
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}