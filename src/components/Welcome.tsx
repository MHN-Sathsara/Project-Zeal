import { useState } from "react";

interface Props {
  onDone: (name: string) => void;
}

export default function Welcome({ onDone }: Props) {
  const [name, setName] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onDone(trimmed);
  }

  return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)", flexDirection: "column", gap: 24
    }}>
      <div style={{ fontSize: 48 }}>🔥</div>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Welcome to Zeal</h1>
        <p style={{ color: "var(--muted)", fontSize: 15 }}>
          Your daily quest tracker. Build streaks. Level up.
        </p>
      </div>
      <form onSubmit={submit} style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          className="input"
          style={{ width: 240 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What's your name?"
          autoFocus
        />
        <button type="submit" className="btn btn-primary">
          Let's go →
        </button>
      </form>
    </div>
  );
}