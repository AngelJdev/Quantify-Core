import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { VisualPreferencesProvider } from "./appearance/VisualPreferences";
const ThemeContext = createContext<{
  dark: boolean;
  setDark: (dark: boolean) => void;
} | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    document.documentElement.dataset.qcTheme = dark ? "dark" : "light";
  }, [dark]);
  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      <VisualPreferencesProvider>{children}</VisualPreferencesProvider>
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("ThemeProvider required");
  return theme;
}
