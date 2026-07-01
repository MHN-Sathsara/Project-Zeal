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

      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((t) => {
          const dates = completions.filter((c) => c.taskId === t.id).map((c) => c.date);
          const { current, best } = computeStreaks(dates);
          const doneToday = dates.includes(isoToday());
          return (
            <li key={t.id} style={{ margin: "8px 0" }}>
              <label>
                <input
                  type="checkbox"
                  checked={doneToday}
                  onChange={() => toggleToday(t.id)}
                />
                {" "}{t.title} — 🔥 {current} (best {best})
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}