import { useEffect, useMemo, useState } from "react";

export function useThemePreference() {
  const [themePreference, setThemePreference] = useState<"light" | "dark" | "system">("system");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemTheme(mediaQuery.matches ? "dark" : "light");
    updateSystemTheme();

    const storedTheme = window.localStorage.getItem("maximus-theme");
    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      setThemePreference(storedTheme);
    }

    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("maximus-theme", themePreference);
  }, [themePreference]);

  const theme = useMemo(
    () => (themePreference === "system" ? systemTheme : themePreference),
    [systemTheme, themePreference],
  );

  return { theme, themePreference, setThemePreference };
}
