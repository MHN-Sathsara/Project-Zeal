import { useEffect, useState } from "react";
import { db, type Task } from "./lib/db";
import { newId } from "./lib/id";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);

  async function loadTasks() {
    const all = await db.tasks.toArray();
    setTasks(all.filter((t) => !t.archived));
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function addTestTask() {
    await db.tasks.add({
      id: newId(),
      title: "Test task " + Math.floor(Math.random() * 100),
      archived: false,
      createdAt: new Date().toISOString()
    });
    loadTasks();
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Zeal 🔥</h1>
      <button onClick={addTestTask}>Add test task</button>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>{t.title}</li>
        ))}
      </ul>
    </div>
  );
}