"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeName = "dark" | "light";

const STORAGE_KEY = "predtibo.theme";

function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "dark";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  const isDark = theme === "dark";

  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      suppressHydrationWarning
    >
      {isDark ? <Moon aria-hidden="true" size={17} /> : <Sun aria-hidden="true" size={17} />}
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
