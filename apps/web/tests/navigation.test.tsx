import { render, screen, fireEvent } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { routes } from "@/app/router";
import { DemoProvider } from "@/app/DemoProvider";
import { ThemeProvider } from "@/app/ThemeProvider";
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
        <RouterProvider
          router={createMemoryRouter(routes, { initialEntries: [path] })}
        />
      </DemoProvider>
    </ThemeProvider>,
  );
}
describe("Recorridos frontend desconectados", () => {
  it("comunica el alcance de la demostración desde bienvenida", async () => {
    open("/");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Cada avance cuenta",
    );
    fireEvent.click(
      screen.getByRole("link", { name: "Explorar demostración" }),
    );
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Tu rutina, a tu ritmo",
    );
    expect(
      screen.getByText(/Sin autenticación, persistencia ni métricas reales/),
    ).toBeInTheDocument();
  });
  it("no tiene formularios de contraseña ni concede sesión desde callback", () => {
    const { container } = open("/auth/callback?code=no-procesar");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Retorno OIDC no configurado",
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
