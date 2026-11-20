import { useState } from "react";
import { usePwa } from "./PwaProvider";
import "./pwa.css";

export function PwaControls() {
  const pwa = usePwa();
  const { ready, refresh, canInstall, error, updating } = pwa;
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  if (!pwa.noticeOpen || (!ready && !refresh && !canInstall && !error)) return null;
  return (
    <aside id="pwa-notice" className="pwa-panel" aria-label="Aplicación instalable">
      {error && <p role="status">{error}</p>}
      {refresh ? (
        <>
          <p role="status"><strong>Hay una nueva versión disponible.</strong></p>
          <p>Actualizar recarga esta ventana, termina su sesión en memoria y restablece sus hábitos, avances y formularios de ejemplo.</p>
          {confirmUpdate ? (
            <>
              <p>¿Quieres descartar los cambios temporales y actualizar?</p>
              <button className="button primary" disabled={updating} onClick={() => void pwa.applyUpdate()}>{updating ? "Actualizando…" : "Descartar y actualizar"}</button>
              <button className="button secondary" disabled={updating} onClick={() => setConfirmUpdate(false)}>Conservar cambios</button>
            </>
          ) : (
            <button className="button primary" onClick={() => setConfirmUpdate(true)}>Revisar actualización</button>
          )}
        </>
      ) : ready ? (
        <p role="status">Interfaz lista para abrir sin conexión. Los cambios de ejemplo son temporales; no se sincronizan.</p>
      ) : null}
      {canInstall && <button className="button primary" disabled={pwa.installing} onClick={() => void pwa.installApp()}>Instalar prototipo</button>}
      <button className="button secondary" disabled={updating} onClick={() => {
        pwa.dismissNotice();
        setConfirmUpdate(false);
      }}>{refresh ? "Más tarde" : "Cerrar aviso"}</button>
    </aside>
  );
}
