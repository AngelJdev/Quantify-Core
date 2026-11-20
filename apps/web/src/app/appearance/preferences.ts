export const VISUAL_PREFERENCES_KEY = "quantify.visual-preferences.v1";
export type VisualPreferences = { material: "solid" | "glass"; intensity: number; motion: "fluid" | "reduced" };
export const defaultVisualPreferences: VisualPreferences = { material: "solid", intensity: 60, motion: "fluid" };
export function parseVisualPreferences(value: string | null): VisualPreferences {
  try {
    const parsed: unknown = JSON.parse(value || "null");
    if (!parsed || typeof parsed !== "object") return { ...defaultVisualPreferences };
    const candidate = parsed as Record<string, unknown>;
    return {
      material: candidate.material === "glass" ? "glass" : "solid",
      intensity: typeof candidate.intensity === "number" && Number.isFinite(candidate.intensity)
        ? Math.min(100, Math.max(25, Math.round(candidate.intensity))) : 60,
      motion: candidate.motion === "reduced" ? "reduced" : "fluid",
    };
  } catch { return { ...defaultVisualPreferences }; }
}
