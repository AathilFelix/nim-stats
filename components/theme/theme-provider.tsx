"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  resolved: Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "nim-stats-theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme());
  const [resolved, setResolved] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme());

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    root.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e: MediaQueryListEvent) => {
      if (getStoredTheme() === null) {
        setTheme(e.matches ? "light" : "dark");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    setResolved(theme);
  }, [theme]);

  const toggle = useMemo(
    () => () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  const value = useMemo(
    () => ({ theme, toggle, resolved }),
    [theme, toggle, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "dark" as Theme, toggle: () => {}, resolved: "dark" as Theme };
  return ctx;
}
