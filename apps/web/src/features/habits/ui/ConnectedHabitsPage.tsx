import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { session } from "@/features/identity/data/session";
import { connectionConfig } from "@/shared/api/config";
import { createReads, readErrorMessage } from "@/shared/api/reads";
import type { Habit, HabitList, Profile } from "@/shared/api/schema";

type Reads = ReturnType<typeof createReads>;
type Result = { state: "loading" } | { state: "error"; message: string } |
  { state: "ready"; profile: Profile; page: HabitList };
const statuses = { active: "Activo", paused: "Pausado", archived: "Archivado" };
const days = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// This view receives only server-confirmed data, never DemoProvider's fixtures.
export function OwnHabits({ api }: { api: Reads }) {
  const [filter, setFilter] = useState<"" | Habit["status"]>("");
  const [cursor, setCursor] = useState<string>();
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<Result>({ state: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    setResult({ state: "loading" });
    void (async () => {
      try {
        const profile = await api.profile(controller.signal);
        const page = await api.habits(controller.signal, filter, cursor);
        if (!controller.signal.aborted) setResult({ state: "ready", profile, page });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ state: "error", message: readErrorMessage(error) });
      }
    })();
    return () => controller.abort();
  }, [api, filter, cursor, reload]);
  return (
    <section className="stack" aria-label="Hábitos propios" aria-busy={result.state === "loading"}>
      <label>Estado del hábito
        <select value={filter} disabled={result.state === "loading"} onChange={(event) => {
          setCursor(undefined);
          setFilter(event.target.value as typeof filter);
        }}>
          <option value="">Todos los estados</option>
          {Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      {result.state === "loading" && <p role="status">Consultando perfil y hábitos en la API…</p>}
      {result.state === "error" && <p role="alert">{result.message}</p>}
      {result.state === "ready" && <>
        <p>Perfil propio habilitado · Zona del perfil: {result.profile.timeZone}</p>
        <p className="caption">Cada página refleja la configuración más reciente planificada. La fecha efectiva indica su vigencia; no representa el progreso de hoy.</p>
        {result.page.items.length === 0
          ? <p role="status">No hay hábitos en esta página para el estado seleccionado.</p>
          : <ul className="stack" aria-label="Listado de hábitos de la API">
            {result.page.items.map((habit) => <li className="card" key={habit.id}>
              <h2>{habit.name}</h2>
              <p>{statuses[habit.status]} · Meta: {habit.targetValue} {habit.unit}</p>
              <p>Días: {habit.schedule.weekdays.map((day) => days[day]).join(", ")}</p>
              <p>Zona: {habit.timeZone} · Vigente desde: <time dateTime={habit.schedule.effectiveFrom}>{habit.schedule.effectiveFrom}</time></p>
              <p className="caption">Versión {habit.version}</p>
            </li>)}
          </ul>}
        {result.page.nextCursor !== null && <button className="button secondary"
          onClick={() => setCursor(result.page.nextCursor!)}>Página siguiente</button>}
      </>}
      <button className="button secondary" disabled={result.state === "loading"}
        onClick={() => { setCursor(undefined); setReload((value) => value + 1); }}>
        {result.state === "error" ? "Reintentar desde el inicio" : "Actualizar desde el inicio"}
      </button>
    </section>
  );
}

export function ConnectedHabitsPage() {
  const state = useSyncExternalStore(session.subscribe, session.snapshot);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const api = useMemo(() => {
    try { const config = connectionConfig(); return config ? createReads(config.base, session) : null; }
    catch { return null; }
  }, []);
  useEffect(() => { void session.initialize(); }, []);
  useEffect(() => {
    if (pathname === "/auth/callback" && state === "authenticated") void navigate("/conexion", { replace: true });
  }, [pathname, state, navigate]);
  useEffect(() => { document.title = "Hábitos de la API · Quantify Core"; }, []);
  return (
    <main className="welcome-page">
      <section className="card stack">
        <p className="eyebrow">CONEXIÓN LOCAL · SOLO LECTURA</p>
        <h1>Hábitos de tu cuenta</h1>
        <p>Consulta tu perfil y tus hábitos confirmados por la API. Las consultas requieren conexión y autorización.</p>
        {(state === "idle" || state === "connecting") && <p role="status">Preparando conexión con Keycloak…</p>}
        {state === "unconfigured" && <p role="status">Falta configurar la API y Keycloak. Consulta la guía local de integración web.</p>}
        {state === "error" && <p role="alert">No se pudo establecer la sesión. Revisa Keycloak, el origen y la configuración local.</p>}
        {state === "expired" && <p role="alert">Tu sesión terminó. Vuelve a acceder con Keycloak.</p>}
        {state === "signedOut" && <p role="status">Accede con Keycloak para consultar tus datos. No se crean cuentas ni perfiles desde esta vista.</p>}
        {["signedOut", "expired", "error"].includes(state) && <button className="button primary" onClick={() => void session.login()}>Iniciar sesión con Keycloak</button>}
        {state === "authenticated" && api && <>
          <button className="button secondary" onClick={() => void session.logout()}>Cerrar sesión</button>
          <OwnHabits api={api} />
        </>}
        <Link className="text-link" to="/">Volver al inicio</Link>
      </section>
    </main>
  );
}
