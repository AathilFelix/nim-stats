"use client";

import { useTheme } from "./theme-provider";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="relative inline-flex h-6 w-10 items-center rounded-md border border-border-base bg-surface-recessed"
      >
        <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-zinc-200 translate-x-6" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="relative inline-flex h-6 w-10 items-center rounded-md border border-border-base bg-surface-recessed transition-colors duration-150 hover:border-border-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded transition-transform duration-150"
        style={{
          transform: isDark ? "translateX(2px)" : "translateX(22px)",
          backgroundColor: isDark ? "#18181b" : "#ffffff",
        }}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-zinc-400" aria-hidden="true" />
        ) : (
          <Sun className="h-3 w-3 text-amber-500" aria-hidden="true" />
        )}
      </span>
    </button>
  );
}
