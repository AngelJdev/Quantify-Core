import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { VisualPreferencesProvider } from "@/app/appearance/VisualPreferences";
import { AppearanceControls } from "@/app/appearance/AppearanceControls";
import { parseVisualPreferences, VISUAL_PREFERENCES_KEY } from "@/app/appearance/preferences";
let media: Map<string, { matches: boolean; listeners: Set<() => void> }>;
beforeEach(() => {
  localStorage.clear(); media = new Map();
  window.matchMedia = vi.fn(query => {
    if (!media.has(query)) media.set(query, { matches: false, listeners: new Set() });
    const state = media.get(query)!;
    return { get matches() { return state.matches; }, media: query,
      addEventListener: (_: string, listener: () => void) => state.listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => state.listeners.delete(listener),
    } as unknown as MediaQueryList;
  });
});
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
function open() { return render(<VisualPreferencesProvider><AppearanceControls /></VisualPreferencesProvider>); }
describe("Preferencias visuales locales", () => {
  it("recupera datos corruptos y limita valores almacenados sin aceptar opciones desconocidas", () => {
    expect(parseVisualPreferences("{broken")).toEqual({ material: "solid", intensity: 60, motion: "fluid" });
    expect(parseVisualPreferences('{"material":"glass","intensity":999,"motion":"other"}'))
      .toEqual({ material: "glass", intensity: 100, motion: "fluid" });
    expect(parseVisualPreferences('{"intensity":-12}').intensity).toBe(25);
  });
  it("mantiene cristal e intensidad al volver a montar y restablece valores seguros", () => {
    const first = open();
    fireEvent.click(screen.getByRole("button", { name: /Liquid Glass/ }));
    fireEvent.change(screen.getByLabelText(/Intensidad del cristal/), { target: { value: "85" } });
    expect(document.documentElement.dataset.qcMaterial).toBe("glass");
    expect(JSON.parse(localStorage.getItem(VISUAL_PREFERENCES_KEY)!)).toEqual({ material: "glass", intensity: 85, motion: "fluid" });
    first.unmount(); open();
    expect(screen.getByLabelText(/Intensidad del cristal/)).toHaveValue("85");
    fireEvent.click(screen.getByRole("button", { name: "Restablecer apariencia" }));
    expect(document.documentElement.dataset.qcMaterial).toBe("solid");
  });
  it("prioriza cambios de accesibilidad del sistema sin borrar la elección de cristal", () => {
    localStorage.setItem(VISUAL_PREFERENCES_KEY, '{"material":"glass","intensity":60,"motion":"fluid"}');
    open();
    act(() => {
      for (const query of ["(prefers-reduced-motion: reduce)", "(prefers-reduced-transparency: reduce)"]) {
        const state = media.get(query)!; state.matches = true; state.listeners.forEach(listener => listener());
      }
    });
    expect(document.documentElement.dataset.qcMaterial).toBe("solid");
    expect(document.documentElement.dataset.qcMotion).toBe("reduced");
    expect(JSON.parse(localStorage.getItem(VISUAL_PREFERENCES_KEY)!).material).toBe("glass");
  });
  it("sigue funcionando y explica el alcance cuando el almacenamiento está bloqueado", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Unavailable"); });
    open(); fireEvent.click(screen.getByRole("button", { name: /Liquid Glass/ }));
    expect(document.documentElement.dataset.qcMaterial).toBe("glass");
    expect(screen.getByRole("status")).toHaveTextContent("Disponible durante esta visita");
  });
});
