import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { RegisterSWOptions } from "vite-plugin-pwa/types";

const sw = vi.hoisted(() => ({
  ready: false,
  refresh: false,
  update: vi.fn().mockResolvedValue(undefined),
  setReady: vi.fn(),
  setRefresh: vi.fn(),
  reload: vi.fn(),
  standalone: false,
  options: undefined as RegisterSWOptions | undefined,
}));
vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: (options: RegisterSWOptions) => {
    sw.options = options;
    return {
      offlineReady: [sw.ready, sw.setReady],
      needRefresh: [sw.refresh, sw.setRefresh],
      updateServiceWorker: sw.update,
    };
  },
}));
import { PwaControls } from "@/app/pwa/PwaControls";
import { PwaProvider } from "@/app/pwa/PwaProvider";
import { InstallPage } from "@/app/pwa/InstallPage";
import { ThemeProvider } from "@/app/ThemeProvider";
import { DemoProvider } from "@/app/DemoProvider";

function openInstallPage() {
  return render(<MemoryRouter><ThemeProvider><DemoProvider><PwaProvider reloadPage={sw.reload}>
    <PwaControls /><InstallPage />
  </PwaProvider></DemoProvider></ThemeProvider></MemoryRouter>);
}
function openNotice() {
  return render(<PwaProvider reloadPage={sw.reload}><PwaControls /></PwaProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("scrollTo", vi.fn());
  sw.ready = sw.refresh = false;
  sw.standalone = false;
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
    matches: query === "(display-mode: standalone)" && sw.standalone,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  const workers = Object.assign(new EventTarget(), {
    getRegistration: vi.fn().mockResolvedValue({ waiting: {} }),
  });
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: workers });
  sw.update.mockImplementation(async () => { workers.dispatchEvent(new Event("controllerchange")); });
});
afterEach(() => { Reflect.deleteProperty(navigator, "serviceWorker"); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it("permite aplazar una actualización sin recargar ni perder el borrador", () => {
  sw.refresh = true;
  openNotice();
  fireEvent.click(screen.getByRole("button", { name: "Más tarde" }));
  expect(sw.update).not.toHaveBeenCalled();
  expect(screen.queryByRole("complementary")).toBeNull();
});
it("exige confirmación explícita para descartar el estado temporal", async () => {
  sw.refresh = true;
  openNotice();
  fireEvent.click(screen.getByRole("button", { name: "Revisar actualización" }));
  expect(sw.update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Conservar cambios" }));
  expect(sw.update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Revisar actualización" }));
  fireEvent.click(screen.getByRole("button", { name: "Descartar y actualizar" }));
  await waitFor(() => expect(sw.reload).toHaveBeenCalledOnce());
  expect(sw.update).toHaveBeenCalledWith(true);
});
it("explica que el shell offline no persiste ni sincroniza", () => {
  sw.ready = true;
  openNotice();
  expect(screen.getByRole("status")).toHaveTextContent(/no se sincronizan/);
});
it("un fallo al activar mantiene el documento abierto y muestra el error", async () => {
  sw.refresh = true;
  sw.update.mockRejectedValueOnce(new Error("worker failed"));
  openNotice();
  fireEvent.click(screen.getByRole("button", { name: "Revisar actualización" }));
  fireEvent.click(screen.getByRole("button", { name: "Descartar y actualizar" }));
  expect(await screen.findByText(/No se pudo actualizar/)).toBeInTheDocument();
  expect(sw.reload).not.toHaveBeenCalled();
});
it("ofrece instalación solo después del evento del navegador", async () => {
  openNotice();
  expect(screen.queryByText("Instalar prototipo")).toBeNull();
  const event = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn().mockResolvedValue(undefined);
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome: "dismissed" }) });
  fireEvent(window, event);
  expect(event.defaultPrevented).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Instalar prototipo" }));
  expect(prompt).toHaveBeenCalledOnce();
  await waitFor(() => expect(screen.queryByRole("complementary")).toBeNull());
});

it("la instalación tiene instrucciones accesibles sin requerir API ni un prompt nativo", () => {
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  openInstallPage();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Tu espacio, a un toque");
  expect(screen.getByRole("link", { name: "Ver cómo instalar" })).toHaveAttribute("href", "#installation-steps");
  expect(screen.queryByRole("button", { name: "Instalar Quantify" })).toBeNull();
  expect(request).not.toHaveBeenCalled();
});

it("aceptar el diálogo no se presenta como instalación terminada hasta appinstalled", async () => {
  openInstallPage();
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt, userChoice: Promise.resolve({ outcome: "accepted" }),
  });
  fireEvent(window, event);
  fireEvent.click(screen.getByRole("button", { name: "Instalar Quantify" }));
  expect(await screen.findByText(/Solicitud enviada al navegador/)).toBeInTheDocument();
  expect(screen.queryByText("Instalación confirmada")).toBeNull();
  fireEvent(window, new Event("appinstalled"));
  expect(screen.getByText("Instalación confirmada")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Instalar Quantify" })).toBeNull();
  expect(prompt).toHaveBeenCalledOnce();
});

it("reconoce una ventana standalone sin volver a ofrecer el instalador", () => {
  sw.standalone = true;
  openInstallPage();
  expect(screen.getByText("Ventana de aplicación")).toBeInTheDocument();
  expect(screen.getByText("Estás usando Quantify como aplicación.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Instalar Quantify" })).toBeNull();
});

it("una confirmación appinstalled temprana no se reemplaza por una solicitud pendiente", async () => {
  openInstallPage();
  let choose!: (choice: { outcome: string }) => void;
  const userChoice = new Promise<{ outcome: string }>((resolve) => { choose = resolve; });
  fireEvent(window, Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt: vi.fn().mockResolvedValue(undefined), userChoice,
  }));
  fireEvent.click(screen.getByRole("button", { name: "Instalar Quantify" }));
  fireEvent(window, new Event("appinstalled"));
  await act(async () => { choose({ outcome: "accepted" }); });
  expect(screen.getByText("Instalación confirmada")).toBeInTheDocument();
  expect(screen.queryByText(/Solicitud enviada al navegador/)).toBeNull();
});

it("cerrar el aviso no pierde el estado offline ni la posibilidad de instalar desde la página", () => {
  sw.ready = true;
  openInstallPage();
  fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
  expect(screen.getByText("Pantallas disponibles")).toBeInTheDocument();
  expect(sw.setReady).not.toHaveBeenCalled();
});

it("reconoce un SW ya activado al volver a abrir la app", () => {
  openInstallPage();
  act(() => sw.options?.onRegisteredSW?.("/sw.js", { active: { state: "activated" } } as ServiceWorkerRegistration));
  expect(screen.getByText("Pantallas disponibles")).toBeInTheDocument();
});

it("explica la desconexión sin afirmar que hubo sincronización", () => {
  openInstallPage();
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  fireEvent(window, new Event("offline"));
  expect(screen.getByRole("status")).toHaveTextContent(/no se guardan ni sincronizan/);
  expect(screen.getByText("Red del dispositivo").nextElementSibling).toHaveTextContent("Sin conexión");
});
