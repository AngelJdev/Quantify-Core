import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicShell } from "@/shared/ui/Prototype";
import { Icon } from "@/shared/ui/Icon";
import { usePwa } from "./PwaProvider";

export function InstallPage() {
  const pwa = usePwa();
  const [apkNotice, setApkNotice] = useState<string | null>(null);

  return (
    <PublicShell title="Instalar app">
      <div className="pwa-islands">
        <section className="card pwa-hero" aria-labelledby="install-title">
          <div className="stack">
            <p className="eyebrow">QUANTIFY CORE · ANDROID APK & APP WEB</p>
            <h1 id="install-title" tabIndex={-1}>
              Tu espacio, a un toque.
            </h1>
            <p>
              Descarga el instalador directo (`.apk`) de Quantify para tu
              teléfono Android o instala la aplicación web progresiva en tu
              computadora y dispositivos móviles.
            </p>
            <div className="form-actions" style={{ gap: "12px" }}>
              <a
                className="button primary"
                href="/quantify-core.apk"
                download="Quantify-Core-V2.apk"
                onClick={() =>
                  setApkNotice(
                    "✓ Descarga de Quantify-Core-V2.apk iniciada. Abre el archivo en tu dispositivo Android para instalar la app.",
                  )
                }
              >
                <Icon name="dispositivo" />
                Descargar APK para Android (.apk)
              </a>
              {pwa.installed ? (
                <p role="status" className="form-note">
                  {pwa.standalone
                    ? "Estás usando Quantify como aplicación."
                    : "Instalación confirmada. Puedes abrir Quantify desde tus aplicaciones."}
                </p>
              ) : pwa.canInstall ? (
                <button
                  className="button secondary"
                  disabled={pwa.installing}
                  onClick={() => void pwa.installApp()}
                >
                  {pwa.installing ? "Abriendo instalador…" : "Instalar Quantify"}
                </button>
              ) : (
                <a className="button secondary" href="#installation-steps">
                  Ver cómo instalar
                </a>
              )}
            </div>
            {apkNotice && (
              <p role="status" className="form-note">
                {apkNotice}
              </p>
            )}
            <Link className="text-link" to="/login">
              Iniciar sesión en mi cuenta →
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
            <strong>Quantify Core V2.0</strong>
            <span>
              Android APK + App Web.
              <br />
              Tus hábitos sincronizados.
            </span>
            <span className="pill">Versión 2.0 Oficial</span>
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
          <h2 id="install-steps-title">Guía de instalación por plataforma</h2>
          <p>
            Elige tu dispositivo para instalar Quantify en segundos:
          </p>
          <details open>
            <summary>Teléfono Android (vía archivo APK)</summary>
            <ol>
              <li>
                Haz clic arriba en <strong>Descargar APK para Android (.apk)</strong>.
              </li>
              <li>
                Abre el archivo descargado <code>Quantify-Core-V2.apk</code> en
                tu teléfono.
              </li>
              <li>
                Confirma la instalación y accede con tu cuenta de Quantify o
                Google.
              </li>
            </ol>
          </details>
          <details>
            <summary>Chrome en computadora</summary>
            <ol>
              <li>Abre el menú de tres puntos en la esquina superior derecha.</li>
              <li>
                En «Guardar y compartir», selecciona «Instalar página como
                aplicación».
              </li>
              <li>Confirma el diálogo del navegador.</li>
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
              Abre el menú del navegador, entra en Aplicaciones y selecciona la
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
              Desde el botón Compartir, elige «Añadir a pantalla de inicio» y
              activa «Abrir como app web».
            </p>
            <a
              className="text-link"
              href="https://support.apple.com/es-es/guide/iphone/iphea86e5236/ios"
            >
              Ayuda oficial de Safari
            </a>
          </details>
        </section>

        <Link className="text-link" to="/">
          Volver al inicio
        </Link>
      </div>
    </PublicShell>
  );
}
