"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

// false on the server and the client's first render (they match), true after
// hydration. useSyncExternalStore avoids a setState-in-effect for the mounted flag.
const subscribe = () => () => {};
function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

/**
 * 36px outline icon button. The icon names the action: sun in dark (switch to
 * light), moon in light. Which glyph shows is pure CSS off the theme class that
 * ThemeScript sets before first paint, so nothing waits on hydration but the
 * accessible label.
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const hydrated = useHydrated();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={hydrated ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      title={hydrated ? (isDark ? "Light mode" : "Dark mode") : undefined}
      className="theme-toggle btn btn-outline btn-icon shrink-0"
    >
      <Sun className="theme-glyph--sun" strokeWidth={1.8} aria-hidden="true" />
      <Moon className="theme-glyph--moon" strokeWidth={1.8} aria-hidden="true" />
    </button>
  );
}
