import { Link } from "react-router-dom";
import { PublicShell, WeekStrip } from "@/shared/ui/Prototype";
import { Icon } from "@/shared/ui/Icon";
import "./welcome.css";

function RoutinePreview() {
  return (
    <div className="welcome-stage">
      <div className="welcome-orbit" aria-hidden="true" />
      <div className="welcome-stage-label">
        <span /> TU DÍA, EN PERSPECTIVA <span>01 / 03</span>
      </div>
      <section className="welcome-routine" aria-labelledby="routine-title">
        <div className="welcome-window" aria-hidden="true">
          <i />
          <i />
          <i />
          <span>QUANTIFY / TU ESPACIO</span>
        </div>
        <div className="welcome-routine-body">
          <div className="welcome-routine-heading">
            <div>
              <p className="eyebrow">UN MOMENTO PARA TI</p>
              <h2 id="routine-title">Tu rutina de hoy</h2>
            </div>
            <span className="prototype-tag">Ejemplo</span>
          </div>
          <div className="welcome-completion">
            <div>
              <strong>Un paso más cerca.</strong>
              <p>1 de 2 metas completas</p>
            </div>
            <div
              className="welcome-ring"
              role="img"
              aria-label="50 por ciento de las metas de ejemplo completas"
            >
              <span>
                50<small>%</small>
              </span>
            </div>
          </div>
          <div className="welcome-habit">
            <span className="welcome-habit-icon">
              <Icon name="lectura" />
            </span>
            <div>
              <strong>Lectura</strong>
              <small>20 / 20 min</small>
            </div>
            <span className="welcome-done">
              <Icon name="confirmado" />
            </span>
          </div>
          <div className="welcome-habit">
            <span className="welcome-habit-icon">
              <Icon name="movimiento" />
            </span>
            <div>
              <strong>Caminar</strong>
              <small>12 / 20 min</small>
            </div>
            <span
              className="welcome-habit-meter"
              role="img"
              aria-label="Caminar: 60 por ciento de la meta de ejemplo"
            >
              <i />
            </span>
          </div>
          <div className="welcome-week-heading">
            <span>Tu semana, paso a paso</span>
            <span>5 de 7 días</span>
          </div>
          <WeekStrip />
        </div>
      </section>
      <div className="welcome-reminder">
        <span className="welcome-reminder-icon">
          <Icon name="recordatorio" />
        </span>
        <div>
          <small>UN ESPACIO EN TU DÍA</small>
          <strong>Tu momento de lectura</strong>
        </div>
        <span>18:00</span>
      </div>
      <p className="welcome-stage-caption">
        <span>DISEÑADO ALREDEDOR DE TI</span>
        <span>Vista de ejemplo ↗</span>
      </p>
    </div>
  );
}

export function WelcomePage() {
  return (
    <PublicShell title="Bienvenida" className="welcome-v2">
      <section className="welcome-hero">
        <div className="welcome-copy">
          <p className="welcome-label">
            <span /> TU RUTINA. TU PROPIO RITMO.
          </p>
          <h1 tabIndex={-1}>
            Pequeños hábitos.
            <br />
            <span>Grandes cambios.</span>
          </h1>
          <p className="welcome-lead">
            Dale intención a tu día.
            <br />Y perspectiva a cada pequeño avance.
          </p>
          <p className="welcome-description">
            Un espacio para organizar tus hábitos, reconocer tu constancia y
            construir una rutina que se sienta tuya.
          </p>
          <div className="welcome-actions">
            <Link className="button primary" to="/registro">
              Crear mi cuenta <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button secondary" to="/login">
              Iniciar sesión
            </Link>
          </div>
          <Link className="welcome-explore" to="/hoy">
            <span aria-hidden="true">↗</span> Explorar dashboard de ejemplo
          </Link>
          <div className="welcome-principles">
            <span>
              <Icon name="privacidad" /> Tu espacio
            </span>
            <span>
              <Icon name="calendario" /> Tu ritmo
            </span>
            <span>
              <Icon name="ajustes" /> Tus decisiones
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
              <span>01 / ELIGE</span>
            </div>
            <h3>
              Algo pequeño.
              <br />
              Algo tuyo.
            </h3>
            <p>
              Leer, caminar o hacer una pausa. Tu rutina empieza con una
              intención.
            </p>
            <div className="welcome-choice" aria-hidden="true">
              <span>
                <Icon name="lectura" /> Leer un poco <Icon name="confirmado" />
              </span>
              <span>
                <Icon name="movimiento" /> Salir a caminar <span>+</span>
              </span>
            </div>
          </article>
          <article className="welcome-feature welcome-feature-time">
            <div className="welcome-feature-top">
              <Icon name="calendario" />
              <span>02 / DALE ESPACIO</span>
            </div>
            <h3>
              Un momento.
              <br />
              No una obligación.
            </h3>
            <p>
              Encuentra un lugar en tu día. Ajusta el ritmo cuando lo necesites.
            </p>
            <div className="welcome-time" aria-hidden="true">
              <span>
                18<span>:</span>00
              </span>
              <small>TU MOMENTO DE LECTURA</small>
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
              <span>03 / OBSERVA</span>
            </div>
            <h3>
              Tu avance merece
              <br />
              otra perspectiva.
            </h3>
            <p>
              Mira tu constancia con contexto. Cada registro cuenta una parte.
            </p>
            <div className="welcome-progress-art">
              <WeekStrip />
              <span>Una semana ilustrativa · cinco días completos</span>
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
          <p>Conoce el espacio donde tu rutina toma forma.</p>
          <Link className="button primary" to="/conoce">
            Conoce Quantify <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <span className="welcome-closing-orbit" aria-hidden="true" />
      </section>
      <p className="welcome-disclosure">
        <Icon name="informacion" /> Vista previa de interfaz · Los datos son de
        ejemplo y los cambios son temporales. El acceso se conectará más
        adelante.
      </p>
    </PublicShell>
  );
}
