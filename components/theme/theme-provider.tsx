"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { STORAGE_KEY } from "./constants";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  resolved: Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Latest switch, so a second toggle inside the window restarts the two frames.
let switchId = 0;

// Dark-first: default to dark unless the visitor explicitly chose light.
// (The no-flash ThemeScript applies this same rule before paint.)
function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    const changing = !root.classList.contains(theme);
    // M11: one clean cut. While the class flips, every transition is suppressed
    // for two frames so nothing changes colour at a different moment from
    // anything else (the toggle's own glyph cross-fade is exempt, see globals.css).
    const id = changing ? ++switchId : switchId;
    if (changing) root.classList.add("theme-switching");
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    root.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
    if (changing) {
      void getComputedStyle(root).color; // apply the cut before transitions come back
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (id === switchId) root.classList.remove("theme-switching");
        }),
      );
    }
  }, [theme]);

  const toggle = useMemo(
    () => () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, toggle, resolved: theme }),
    [theme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "dark" as Theme, toggle: () => {}, resolved: "dark" as Theme };
  return ctx;
}
