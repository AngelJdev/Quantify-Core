import { render, screen, fireEvent } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { routes } from "@/app/router";
import { DemoProvider } from "@/app/DemoProvider";
import { ThemeProvider } from "@/app/ThemeProvider";
import { PwaProvider } from "@/app/pwa/PwaProvider";
vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    offlineReady: [false, () => { }],
    needRefresh: [false, () => { }],
    updateServiceWorker: async () => { },
  }),
}));
beforeAll(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  window.scrollTo = vi.fn();
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
});
function open(path: string) {
  return render(
    <ThemeProvider>
      <DemoProvider>
        <PwaProvider>
          <RouterProvider
            router={createMemoryRouter(routes, { initialEntries: [path] })}
          />
        </PwaProvider>
      </DemoProvider>
    </ThemeProvider>,
  );
}
describe("Recorridos frontend desconectados", () => {
  it("permite llegar a la instalación desde bienvenida sin pasar por identidad", async () => {
    open("/");
    fireEvent.click(screen.getByRole("link", { name: "Instalar app" }));
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Tu espacio, a un toque",
    );
    expect(
      screen.getByRole("link", { name: "Explorar pantallas de ejemplo" }),
    ).toHaveAttribute("href", "/hoy");
  });
  it("navega desde bienvenida hacia la vista de acceso", async () => {
    open("/");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Lo que haces.También cuenta.",
    );
    fireEvent.click(
      screen.getAllByRole("link", { name: /^Iniciar sesión$/ })[0],
    );
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Accede a tu espacio",
    );
  });
  it("conecta las rutas públicas con registro, login y recuperación", async () => {
    const view = open("/");
    fireEvent.click(screen.getByRole("link", { name: "Crear mi cuenta" }));
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Accede a tu espacio",
    );
    expect(screen.getByLabelText("Nombre completo")).toBeEnabled();
    expect(screen.getByLabelText("Confirmar contraseña")).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /^Iniciar sesión$/ }));
    expect(screen.getByLabelText("Contraseña", { exact: true })).toBeEnabled();
    fireEvent.click(
      screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }),
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Recuperar contraseña",
    );
    expect(screen.getByLabelText("Correo de tu cuenta")).toBeEnabled();
    view.unmount();
    open("/recuperar");
    expect(screen.getByLabelText("Correo de tu cuenta")).toBeEnabled();
  });
  it("registra progreso desde las islas y conserva el acceso a logros", async () => {
    open("/hoy");
    const pendingBefore = screen.getAllByRole("button", {
      name: "✓ Completar hoy",
    }).length;
    fireEvent.click(
      screen.getAllByRole("button", { name: "✓ Completar hoy" })[0],
    );
    expect(
      screen.getAllByRole("button", { name: "✓ Completar hoy" }),
    ).toHaveLength(pendingBefore - 1);
    const shortcuts = screen.getByRole("navigation", {
      name: "Accesos rápidos",
    });
    fireEvent.click(shortcuts.querySelector('a[href="/logros"]')!);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Tus logros y medallas",
    );
  });
  it("conserva cuatro destinos y la sección activa en vistas hijas", () => {
    open("/detalle/22222222-2222-4222-8222-222222222222");
    const nav = screen.getByRole("navigation", {
      name: "Navegación principal",
    });
    expect([...nav.querySelectorAll("a")].map((a) => a.textContent)).toEqual([
      "Hoy",
      "Progreso",
      "IA hábitos",
      "Perfil",
    ]);
    expect(nav.querySelector('[aria-current="page"]')).toHaveAttribute(
      "href",
      "/hoy",
    );
    const toggle = screen.getByRole("button", { name: "Contraer navegación" });
    fireEvent.click(toggle);
    expect(
      screen.getByRole("button", { name: "Expandir navegación" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
  it("no tiene formularios de contraseña ni concede sesión desde callback sin configuración", async () => {
    const { container } = open("/auth/callback?code=no-procesar");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Hábitos de tu cuenta",
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Falta configurar",
    );
    expect(container.querySelector("input[type=password]")).toBeNull();
    expect(screen.queryByText("no-procesar")).toBeNull();
  });
  it("muestra sesión vencida y hábito inexistente sin filtrar excepciones", async () => {
    const view = open("/sesion/vencida");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Tu sesión terminó",
    );
    view.unmount();
    open("/detalle/desconocido");
    expect(
      await screen.findByText("Este hábito no está disponible"),
    ).toBeInTheDocument();
  });
  it("asocia errores a nombre, meta y días sin perder borrador", async () => {
    open("/nuevo");
    fireEvent.change(screen.getByLabelText("Nombre del hábito"), {
      target: { value: " " },
    });
    fireEvent.change(screen.getByLabelText("Meta diaria"), {
      target: { value: "0" },
    });
    screen.getAllByRole("checkbox").forEach((input) => fireEvent.click(input));
    fireEvent.click(
      screen.getByRole("button", { name: "Previsualizar hábito" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Elige al menos un día",
    );
    expect(screen.getByLabelText("Meta diaria")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
