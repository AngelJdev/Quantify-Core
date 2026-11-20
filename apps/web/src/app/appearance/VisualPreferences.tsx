import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultVisualPreferences, parseVisualPreferences, VISUAL_PREFERENCES_KEY, type VisualPreferences } from "./preferences";
function useSystemPreference(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    media.addEventListener?.("change", update);
    update();
    return () => media.removeEventListener?.("change", update);
  }, [query]);
  return matches;
}
const VisualContext = createContext<{
  preferences: VisualPreferences;
  update: (patch: Partial<VisualPreferences>) => void;
  reset: () => void;
  reducedMotion: boolean;
  reducedTransparency: boolean;
  saved: boolean;
} | null>(null);
export function VisualPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(() => {
    try { return parseVisualPreferences(localStorage.getItem(VISUAL_PREFERENCES_KEY)); }
    catch { return { ...defaultVisualPreferences }; }
  });
  const [saved, setSaved] = useState(true);
  const systemMotion = useSystemPreference("(prefers-reduced-motion: reduce)");
  const systemTransparency = useSystemPreference("(prefers-reduced-transparency: reduce)");
  const systemContrast = useSystemPreference("(prefers-contrast: more)");
  const forcedColors = useSystemPreference("(forced-colors: active)");
  const reducedMotion = systemMotion || preferences.motion === "reduced";
  const reducedTransparency = systemTransparency || systemContrast || forcedColors;
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.qcMaterial = reducedTransparency ? "solid" : preferences.material;
    root.dataset.qcMotion = reducedMotion ? "reduced" : "fluid";
    root.style.setProperty("--qc-glass-strength", String(preferences.intensity / 100));
    try { localStorage.setItem(VISUAL_PREFERENCES_KEY, JSON.stringify(preferences)); setSaved(true); }
    catch { setSaved(false); }
  }, [preferences, reducedMotion, reducedTransparency]);
  return <VisualContext.Provider value={{ preferences, reducedMotion, reducedTransparency, saved,
    update: patch => setPreferences(current => parseVisualPreferences(JSON.stringify({ ...current, ...patch }))),
    reset: () => setPreferences({ ...defaultVisualPreferences }),
  }}>{children}</VisualContext.Provider>;
}
export function useVisualPreferences() {
  const context = useContext(VisualContext);
  if (!context) throw new Error("VisualPreferencesProvider required");
  return context;
}
