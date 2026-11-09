import { createBrowserRouter, RouterProvider, Link } from "react-router-dom";
import { MainLayout } from "./layout/MainLayout";
import {
  WelcomePage,
  AuthPage,
  SessionPage,
} from "@/features/identity/ui/IdentityPages";
import { DashboardPage } from "@/features/dashboard/ui/DashboardPage";
import { HabitsPage } from "@/features/habits/ui/HabitsPage";
import { HabitEditorPage } from "@/features/habits/ui/HabitEditorPage";
import { HabitDetailPage } from "@/features/habits/ui/HabitDetailPage";
import { CheckInPage } from "@/features/checkins/ui/CheckInPage";
import { HistoryPage } from "@/features/history/ui/HistoryPage";
import { AnalyticsPage } from "@/features/analytics/ui/AnalyticsPage";
import { SuggestionsPage } from "@/features/suggestions/ui/SuggestionsPage";
import { NoticesPage } from "@/features/notices/ui/NoticesPage";
import { ProfilePage } from "@/features/profile/ui/ProfilePage";
import { StatePanel } from "@/shared/ui/StatePanel";
function RouteError() {
  return (
    <main className="welcome-page">
      <section className="card" role="alert">
        <h1>No pudimos abrir esta vista</h1>
        <p>
          Vuelve al inicio y prueba otra sección. Los datos de esta visita no se
          han enviado.
        </p>
        <Link className="button primary" to="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
export const routes = [
  { path: "/", element: <WelcomePage />, errorElement: <RouteError /> },
  { path: "/auth", element: <AuthPage />, errorElement: <RouteError /> },
  {
    path: "/auth/callback",
    element: <SessionPage callback />,
    errorElement: <RouteError />,
  },
  {
    path: "/sesion/:estado",
    element: <SessionPage />,
    errorElement: <RouteError />,
  },
  {
    element: <MainLayout />,
    errorElement: <RouteError />,
    children: [
      { path: "/hoy", element: <DashboardPage /> },
      { path: "/habitos", element: <HabitsPage /> },
      { path: "/nuevo", element: <HabitEditorPage /> },
      { path: "/detalle/:habitId", element: <HabitDetailPage /> },
      { path: "/editar/:habitId", element: <HabitEditorPage /> },
      { path: "/check-ins/:habitId?", element: <CheckInPage /> },
      { path: "/historial", element: <HistoryPage /> },
      { path: "/analisis", element: <AnalyticsPage /> },
      { path: "/sugerencias", element: <SuggestionsPage /> },
      { path: "/avisos", element: <NoticesPage /> },
      { path: "/ajustes", element: <ProfilePage /> },
      {
        path: "*",
        element: (
          <StatePanel
            title="Esta página no está aquí"
            description="Revisa el enlace o vuelve a una sección disponible."
          />
        ),
      },
    ],
  },
];
const router = createBrowserRouter(routes);
export function AppRouter() {
  return <RouterProvider router={router} />;
}
