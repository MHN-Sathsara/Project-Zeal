export type Theme = "dark" | "light";

export function getTheme(): Theme {
  return (localStorage.getItem("zeal_theme") as Theme) ?? "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("zeal_theme", theme);
}