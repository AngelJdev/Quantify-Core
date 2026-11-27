import { useState } from "react";
import { ContactSection } from "./IdentityPages";
import { Link } from "react-router-dom";
import { PublicShell, WeekStrip } from "@/shared/ui/Prototype";
import { Icon } from "@/shared/ui/Icon";
import { useDemo } from "@/app/DemoProvider";
import "./welcome.css";

function RoutinePreview() {
  const [readingDone, setReadingDone] = useState(true);
  const [walkMinutes, setWalkMinutes] = useState(12);

  const walkDone = walkMinutes >= 20;
  const completedCount = (readingDone ? 1 : 0) + (walkDone ? 1 : 0);
  const totalPct = Math.round(
    ((readingDone ? 100 : 0) + Math.min(100, (walkMinutes / 20) * 100)) / 2,
  );

  function cycleWalk() {
    setWalkMinutes((prev) => (prev >= 20 ? 8 : Math.min(20, prev + 4)));
  }

  return (
    <div className="welcome-stage">
      <div className="welcome-orbit" aria-hidden="true" />
      <div className="welcome-stage-label">
        <span /> TU DÍA, EN PERSPECTIVA · INTERACTIVO <span>01 / 03</span>
      </div>
      <section className="welcome-routine" aria-labelledby="routine-title">
        <div className="welcome-window" aria-hidden="true">
          <i />
          <i />
          <i />
          <span>QUANTIFY / VISTA INTERACTIVA</span>
        </div>
        <div className="welcome-routine-body">
          <div className="welcome-routine-heading">
            <div>
              <p className="eyebrow">UN MOMENTO PARA TI</p>
              <h2 id="routine-title">Tu rutina de hoy</h2>
            </div>
            <button
              type="button"
              className="welcome-interactive-pill"
              onClick={() => {
                setReadingDone(true);
                setWalkMinutes(20);
              }}
              title="Haz clic para simular el día al 100%"
            >
              {totalPct === 100 ? "✓ Día completado" : "⚡ Simular 100%"}
            </button>
          </div>
          <div className="welcome-completion">
            <div>
              <strong>
                {totalPct === 100
                  ? "¡Meta diaria alcanzada!"
                  : "Un paso más cerca."}
              </strong>
              <p>{completedCount} de 2 metas completas (toca un hábito)</p>
            </div>
            <div
              className="welcome-ring"
              style={{
                background: `conic-gradient(var(--qc-action) ${totalPct}%, var(--qc-line) 0)`,
              }}
              role="img"
              aria-label={`${totalPct} por ciento de las metas completas`}
            >
              <span>
                {totalPct}
                <small>%</small>
              </span>
            </div>
          </div>
          <div
            className="welcome-habit welcome-habit-interactive"
            onClick={() => setReadingDone((v) => !v)}
            title="Haz clic para alternar estado"
          >
            <span className="welcome-habit-icon">
              <Icon name="lectura" />
            </span>
            <div>
              <strong>Lectura</strong>
              <small>{readingDone ? "20 / 20 min" : "0 / 20 min"}</small>
            </div>
            {readingDone ? (
              <span className="welcome-done">
                <Icon name="confirmado" />
              </span>
            ) : (
              <span className="welcome-interactive-pill">+20 min</span>
            )}
          </div>
          <div
            className="welcome-habit welcome-habit-interactive"
            onClick={cycleWalk}
            title="Haz clic para sumar minutos"
          >
            <span className="welcome-habit-icon">
              <Icon name="movimiento" />
            </span>
            <div>
              <strong>Caminar</strong>
              <small>{walkMinutes} / 20 min</small>
            </div>
            {walkDone ? (
              <span className="welcome-done">
                <Icon name="confirmado" />
              </span>
            ) : (
              <span
                className="welcome-habit-meter"
                role="img"
                aria-label={`Caminar: ${Math.round((walkMinutes / 20) * 100)} por ciento de la meta`}
              >
                <i
                  style={{
                    width: `${Math.min(100, Math.round((walkMinutes / 20) * 100))}%`,
                    transition: "width 240ms cubic-bezier(0.23, 1, 0.32, 1)",
                  }}
                />
              </span>
            )}
          </div>
          <div className="welcome-week-heading">
            <span>Tu semana, paso a paso</span>
            <span>{totalPct === 100 ? "6 de 7 días" : "5 de 7 días"}</span>
          </div>
          <WeekStrip />
        </div>
      </section>
      <div className="welcome-reminder">
        <span className="welcome-reminder-icon">
          <Icon name="recordatorio" />
        </span>
        <div>
          <small>LOGROS Y CONSTANCIA</small>
          <strong>36 medallas listas para desbloquear</strong>
        </div>
        <span>+XP</span>
      </div>
      <p className="welcome-stage-caption">
        <span>DISEÑADO ALREDEDOR DE TI</span>
        <span>Interactúa con la tarjeta ↗</span>
      </p>
    </div>
  );
}

export function WelcomePage() {
  const { state } = useDemo();
  return (
    <PublicShell title="Bienvenida" className="welcome-v2">
      <section className="welcome-hero">
        <div className="welcome-copy">
          <p className="welcome-label">
            <span /> TU RUTINA, CON CONTEXTO
          </p>
          <h1 tabIndex={-1}>
            Lo que haces.
            <br />
            <span>También cuenta.</span>
          </h1>
          <p className="welcome-lead">
            Organiza tus hábitos y mira tus avances con perspectiva.
          </p>
          <p className="welcome-description">
            Un espacio elegante e interactivo para registrar tu progreso en un
            clic, visualizar gráficas en vivo y desbloquear 36 logros de
            constancia en tu cuenta personal.
          </p>
          <div className="welcome-actions">
            {state.session ? (
              <Link className="button primary" to="/hoy">
                Ir a mi espacio ({state.profile.displayName}) <span aria-hidden="true">↗</span>
              </Link>
            ) : (
              <>
                <Link className="button primary" to="/registro">
                  Crear mi cuenta <span aria-hidden="true">↗</span>
                </Link>
                <Link className="button secondary" to="/login">
                  Iniciar sesión
                </Link>
              </>
            )}
            <Link className="button secondary" to="/conoce">
              Conocer plataforma
            </Link>
          </div>
          <div className="welcome-principles">
            <span>
              <Icon name="privacidad" /> Acceso seguro
            </span>
            <span>
              <Icon name="calendario" /> Gráficas en vivo
            </span>
            <span>
              <Icon name="confirmado" /> 36 logros funcionales
            </span>
          </div>
        </div>
        <RoutinePreview />
      </section>
      <section
        className="welcome-method"
        aria-labelledby="welcome-method-title"
      >
        <div className="welcome-section-heading">
          <div>
            <p className="eyebrow">DE UNA INTENCIÓN A UNA RUTINA</p>
            <h2 id="welcome-method-title">
              Haz espacio.
              <br />
              <span>Lo demás, paso a paso.</span>
            </h2>
          </div>
          <p>
            No necesitas cambiarlo todo.
            <br />
            Empieza por algo que importe para ti.
          </p>
        </div>
        <div className="welcome-bento">
          <article className="welcome-feature welcome-feature-habit">
            <div className="welcome-feature-top">
              <Icon name="habitos" />
              <span>01 / REGISTRO RÁPIDO</span>
            </div>
            <h3>
              Algo pequeño.
              <br />
              En un solo toque.
            </h3>
            <p>
              Suma avance rápido desde tu agenda diaria o adjunta notas de
              reflexión y fotografías de evidencia.
            </p>
            <div className="welcome-choice" aria-hidden="true">
              <span>
                <Icon name="lectura" /> Leer 20 min <Icon name="confirmado" />
              </span>
              <span>
                <Icon name="movimiento" /> Caminata activa <span>+5 min</span>
              </span>
            </div>
          </article>
          <article className="welcome-feature welcome-feature-time">
            <div className="welcome-feature-top">
              <Icon name="confirmado" />
              <span>02 / 36 MEDALLAS Y XP</span>
            </div>
            <h3>
              Cada avance
              <br />
              desbloquea logros.
            </h3>
            <p>
              Sube de nivel con 36 medallas en Bronce, Plata, Oro y Diamante
              conectadas con tus rachas reales.
            </p>
            <div className="welcome-time" aria-hidden="true">
              <span>
                36<span>★</span>
              </span>
              <small>LOGROS FUNCIONALES DE CONSTANCIA</small>
              <div>
                <i />
                <i />
                <i className="active" />
                <i />
                <i />
              </div>
            </div>
          </article>
          <article className="welcome-feature welcome-feature-progress">
            <div className="welcome-feature-top">
              <Icon name="analisis" />
              <span>03 / ANALÍTICA EN VIVO</span>
            </div>
            <h3>
              Gráficas semanales,
              <br />
              mensuales y por hábito.
            </h3>
            <p>
              Anillos de progreso, curvas de tendencia SVG y mapa de calor de
              28 días para cada hábito.
            </p>
            <div className="welcome-progress-art">
              <WeekStrip />
              <span>Visualización reactiva · Semana y Mes</span>
            </div>
          </article>
        </div>
      </section>
      <section className="welcome-closing">
        <div>
          <p className="eyebrow">UN ESPACIO QUE VA CONTIGO</p>
          <h2>
            Tu siguiente paso
            <br />
            puede ser pequeño.
          </h2>
        </div>
        <div>
          <p>Inicia sesión o conoce a fondo cada módulo de Quantify.</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link className="button primary" to="/conoce">
              Conoce Quantify <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button secondary" to="/login">
              Iniciar sesión
            </Link>
          </div>
        </div>
        <span className="welcome-closing-orbit" aria-hidden="true" />
      </section>
      <ContactSection />
    </PublicShell>
  );
}
