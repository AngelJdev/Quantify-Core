import { Link } from "react-router-dom";
import { PublicShell } from "@/shared/ui/Prototype";
import { usePwa } from "./PwaProvider";

export function InstallPage() {
  const pwa = usePwa();

  return (
    <PublicShell title="Instalar app">
      <div className="pwa-islands">
        <section className="card pwa-hero" aria-labelledby="install-title">
          <div className="stack">
            <p className="eyebrow">QUANTIFY CORE · APP WEB</p>
            <h1 id="install-title" tabIndex={-1}>
              Tu espacio, a un toque.
            </h1>
            <p>
              Abre Quantify desde tus aplicaciones, en una ventana propia y con
              las pantallas disponibles sin conexión después de una primera
              visita con red.
            </p>
            {pwa.installed ? (
              <p role="status" className="form-note">
                {pwa.standalone
                  ? "Estás usando Quantify como aplicación."
                  : "Instalación confirmada. Puedes abrir Quantify desde tus aplicaciones."}
              </p>
            ) : pwa.canInstall ? (
              <button
                className="button primary"
                disabled={pwa.installing}
                onClick={() => void pwa.installApp()}
              >
                {pwa.installing ? "Abriendo instalador…" : "Instalar Quantify"}
              </button>
            ) : (
              <a className="button primary" href="#installation-steps">
                Ver cómo instalar
              </a>
            )}
            <Link className="text-link" to="/hoy">
              Explorar pantallas de ejemplo
            </Link>
            {pwa.installMessage && <p role="status">{pwa.installMessage}</p>}
            {pwa.error && <p role="alert">{pwa.error}</p>}
          </div>
          <div
            className="pwa-install-card"
            role="group"
            aria-label="Quantify en tu dispositivo"
          >
            <img src="/pwa-192.png" width="96" height="96" alt="" />
            <strong>Quantify Core</strong>
            <span>
              Pequeños hábitos.
              <br />
              Un espacio para volver a ti.
            </span>
            <span className="pill">Vista previa</span>
          </div>
        </section>

        <section aria-labelledby="pwa-status-title">
          <h2 id="pwa-status-title">En este dispositivo</h2>
          <dl className="pwa-status-grid">
            <div>
              <dt>Presentación</dt>
              <dd>
                {pwa.standalone
                  ? "Ventana de aplicación"
                  : pwa.installed
                    ? "Instalación confirmada"
                    : "Navegador"}
              </dd>
            </div>
            <div>
              <dt>Sin conexión</dt>
              <dd>
                {pwa.offlineAvailable
                  ? "Pantallas disponibles"
                  : pwa.development
                    ? "Requiere versión instalable"
                    : !pwa.supported
                      ? "No disponible en este navegador"
                      : "Preparación por confirmar"}
              </dd>
            </div>
            <div>
              <dt>Red del dispositivo</dt>
              <dd>{pwa.online ? "En línea" : "Sin conexión"}</dd>
            </div>
          </dl>
          {pwa.development && (
            <p className="form-note">
              Estás en la vista de desarrollo. Para probar instalación y
              apertura sin conexión, utiliza la versión compilada del frontend.
            </p>
          )}
          {!pwa.online && (
            <p role="status" className="form-note">
              Sin conexión. Puedes recorrer las pantallas ya preparadas; los
              cambios de ejemplo no se guardan ni sincronizan.
            </p>
          )}
          {pwa.refresh && (
            <button className="button secondary" onClick={pwa.showNotice}>
              Ver aviso de actualización
            </button>
          )}
        </section>

        <section
          className="card pwa-instructions"
          id="installation-steps"
          aria-labelledby="install-steps-title"
        >
          <h2 id="install-steps-title">Instala desde tu navegador</h2>
          <p>
            Si no aparece el botón de instalación, busca esta opción en el menú
            del navegador. Si ya la instalaste, ábrela desde tus aplicaciones.
          </p>
          <details>
            <summary>Chrome en computadora</summary>
            <ol>
              <li>Abre el menú de tres puntos.</li>
              <li>
                En «Enviar, guardar y compartir», elige instalar la página como
                aplicación.
              </li>
              <li>Revisa y confirma el diálogo del navegador.</li>
            </ol>
            <a
              className="text-link"
              href="https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DDesktop&hl=es-AM"
            >
              Ayuda oficial de Chrome
            </a>
          </details>
          <details>
            <summary>Microsoft Edge</summary>
            <p>
              Abre el menú del navegador, entra en Aplicaciones y busca la
              opción para instalar este sitio como aplicación.
            </p>
            <a
              className="text-link"
              href="https://support.microsoft.com/es-es/edge/install-manage-or-uninstall-apps-in-microsoft-edge"
            >
              Ayuda oficial de Edge
            </a>
          </details>
          <details>
            <summary>Safari en iPhone</summary>
            <p>
              Desde Compartir, elige «Añadir a pantalla de inicio». Si aparece
              «Abrir como app web», actívalo antes de añadir.
            </p>
            <a
              className="text-link"
              href="https://support.apple.com/es-es/guide/iphone/iphea86e5236/ios"
            >
              Ayuda oficial de Safari
            </a>
          </details>
        </section>

        <section className="card">
          <h2>Una vista previa con datos de ejemplo</h2>
          <p>
            Puedes explorar las pantallas, la navegación y los temas. Los
            cambios duran esta visita; guardar en una cuenta y sincronizar se
            incorporará en una etapa posterior.
          </p>
          <p>
            La instalación prepara la interfaz. No almacena datos personales ni
            activa notificaciones.
          </p>
        </section>
        <Link className="text-link" to="/">
          Volver al inicio
        </Link>
      </div>
    </PublicShell>
  );
}
