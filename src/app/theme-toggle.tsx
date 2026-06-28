"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

// The "external system" is the `.dark` class on <html>. We read it via
// useSyncExternalStore so there's no setState-in-effect and no hydration
// mismatch: the server snapshot is stable, and the inline <head> script has
// already applied the real theme to the DOM before hydration.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore storage errors (e.g. private mode)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-base transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
