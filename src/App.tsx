import { useEffect, useState } from "react";
import { db, type Task, type Completion } from "./lib/db";
import { newId } from "./lib/id";
import { computeStreaks, isoToday } from "./lib/streaks";
import Heatmap from "./components/Heatmap";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [draft, setDraft] = useState("");

  async function loadAll() {
    const allTasks = await db.tasks.toArray();
    const allCompletions = await db.completions.toArray();
    setTasks(allTasks.filter((t) => !t.archived));
    setCompletions(allCompletions);
  }

  useEffect(() => {
    loadAll();
  }, []);

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
    } else {
      await db.completions.add({ id: newId(), taskId, date: today });
    }
    loadAll();
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

      <div style={{ marginTop: 16 }}>
  {tasks.map((t) => {
    const dates = completions.filter((c) => c.taskId === t.id).map((c) => c.date);
    const { current, best } = computeStreaks(dates);
    const doneToday = dates.includes(isoToday());
    return (
      <div key={t.id} style={{ marginBottom: 16 }}>
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
    </div>
  );
}