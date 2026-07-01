import { useEffect, useState } from "react";
import { db, type Task, type Completion } from "./lib/db";
import { newId } from "./lib/id";
import { computeStreaks, isoToday } from "./lib/streaks";
import { REWARDS, xpForCompletion, levelFromXp } from "./lib/rewards";
import Heatmap from "./components/Heatmap";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [draft, setDraft] = useState("");
  const [xp, setXp] = useState(0);
  const [unlockedRewards, setUnlockedRewards] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  async function loadAll() {
  const allTasks = await db.tasks.toArray();
  const allCompletions = await db.completions.toArray();
  const metaXp = await db.meta.get("xp");
  const metaRewards = await db.meta.get("unlockedRewards");
  setTasks(allTasks.filter((t) => !t.archived));
  setCompletions(allCompletions);
  setXp(metaXp?.value ?? 0);
  setUnlockedRewards(metaRewards?.value ?? []);
}

  useEffect(() => {
    loadAll();
  }, []);
  function showToast(msg: string) {
  setToast(msg);
  setTimeout(() => setToast(null), 3000);
}
  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    await db.tasks.add({
      id: newId(),
      title,
      archived: false,
      createdAt: new Date().toISOString()
    });
    setDraft("");
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

  // compute streak for this task after adding today
  const allCompletions = await db.completions.toArray();
  const taskDates = allCompletions.filter((c) => c.taskId === taskId).map((c) => c.date);
  const { current } = computeStreaks(taskDates);

  // award XP
  const gained = xpForCompletion(current);
  const newXp = xp + gained;
  await db.meta.put({ key: "xp", value: newXp });

  // check for newly unlocked rewards
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

  await loadAll();
}

  return (
  <div style={{ padding: 20, fontFamily: "sans-serif" }}>
    <h1>Zeal 🔥</h1>

    <form onSubmit={addTask}>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="New quest..."
      />
      <button type="submit">Add</button>
    </form>

    {/* Task list */}
    <div style={{ marginTop: 16 }}>
      {tasks.map((t) => {
        const dates = completions.filter((c) => c.taskId === t.id).map((c) => c.date);
        const { current, best } = computeStreaks(dates);
        const doneToday = dates.includes(isoToday());
        return (
          <div key={t.id} style={{ marginBottom: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={doneToday}
                onChange={() => toggleToday(t.id)}
              />
              {t.title} — 🔥 {current} (best {best})
            </label>
            <Heatmap dates={dates} />
          </div>
        );
      })}
    </div>

    {/* XP bar */}
    <div style={{ marginTop: 24 }}>
      {(() => {
        const { level, xpIntoLevel, xpForNextLevel } = levelFromXp(xp);
        const pct = Math.round((xpIntoLevel / xpForNextLevel) * 100);
        return (
          <>
            <div>Level {level} — {xpIntoLevel}/{xpForNextLevel} XP</div>
            <div style={{ background: "#1c2128", borderRadius: 4, height: 8, marginTop: 4, width: 300 }}>
              <div style={{ background: "#39d353", width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width .3s" }} />
            </div>
          </>
        );
      })()}
    </div>

    {/* Rewards */}
    <div style={{ marginTop: 24 }}>
      <strong>Rewards</strong>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {REWARDS.map((r) => {
          const unlocked = unlockedRewards.includes(r.id);
          return (
            <div key={r.id} style={{
              padding: "8px 12px", borderRadius: 8, fontSize: 13,
              background: unlocked ? "#0e4429" : "#1c2128",
              border: `1px solid ${unlocked ? "#39d353" : "#30363d"}`,
              opacity: unlocked ? 1 : 0.5
            }}>
              {unlocked ? "🏆" : "🔒"} {r.title}
              <div style={{ fontSize: 11, color: "#8b949e" }}>{r.desc}</div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Toast */}
    {toast && (
      <div style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        background: "#161b22", border: "1px solid #39d353", color: "#e6edf3",
        padding: "10px 20px", borderRadius: 999, fontSize: 14, fontWeight: 600
      }}>
        {toast}
      </div>
    )}
  </div>
);
}