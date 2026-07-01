import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/theme.css";

const root = document.getElementById("app");
if (root) createRoot(root).render(<App />);

console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite',
);
