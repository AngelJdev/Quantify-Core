import { useId, useRef } from "react";
import { Icon } from "@/shared/ui/Icon";
import { useVisualPreferences } from "./VisualPreferences";
export function AppearanceControls() {
  const id = useId();
  const { preferences, update, reset, saved, reducedMotion, reducedTransparency } = useVisualPreferences();
  return <div className="appearance-controls">
    <div className="appearance-intro"><span className="appearance-kicker">HECHO A TU MEDIDA</span>
      <h3>Elige cómo se siente tu espacio.</h3>
      <p>La misma identidad. Una textura y un ritmo que van contigo.</p></div>
    <fieldset className="material-options"><legend>Material de la interfaz</legend>
      {(["solid", "glass"] as const).map(material => <button key={material} type="button"
        className={`material-option ${preferences.material === material ? "is-selected" : ""}`}
        aria-pressed={preferences.material === material} onClick={() => update({ material })}>
        <span className={`material-swatch ${material}`} aria-hidden="true"><i /><i /><i /></span>
        <span><strong>{material === "glass" ? "Liquid Glass" : "Sólido"}</strong>
          <small>{material === "glass" ? "Luz, capas y transparencia" : "Calma, claridad y contraste"}</small></span>
        <Icon name={preferences.material === material ? "confirmado" : "ver"} />
      </button>)}
    </fieldset>
    {preferences.material === "glass" && <div className="glass-intensity">
      <label htmlFor={`${id}-intensity`}>Intensidad del cristal <span className="intensity-value" aria-hidden="true">{preferences.intensity}%</span></label>
      <input id={`${id}-intensity`} type="range" min="25" max="100" step="5" value={preferences.intensity} aria-valuetext={`${preferences.intensity}%`}
        onChange={event => update({ intensity: Number(event.target.value) })} />
      <div aria-hidden="true"><span>Sutil</span><span>Envolvente</span></div>
    </div>}
    <div className="appearance-motion"><div><strong>Movimiento reducido</strong><p>Sin desplazamientos ni efectos de profundidad.</p></div>
      <button type="button" className="switch" role="switch" aria-label="Movimiento reducido"
        aria-checked={preferences.motion === "reduced"} onClick={() => update({ motion: preferences.motion === "reduced" ? "fluid" : "reduced" })}><span /></button>
    </div>
    <div className="appearance-preview" aria-label="Vista previa del material seleccionado">
      <span className="material-sample"><Icon name="lectura" /><span><strong>Un paso más cerca.</strong><small>Tu espacio, a tu ritmo.</small></span><Icon name="confirmado" /></span>
    </div>
    <p className="appearance-note" role="status">{reducedTransparency ? "Tu dispositivo prioriza superficies sólidas para facilitar la lectura. " : ""}
      {reducedMotion ? `El movimiento está reducido${preferences.motion === "fluid" ? " por tu dispositivo" : ""}. ` : "El movimiento respeta las preferencias de tu dispositivo. "}
      {saved ? "Guardado solo en este navegador." : "Disponible durante esta visita; el navegador no permite guardar la preferencia."}</p>
    <button className="appearance-reset text-link" type="button" onClick={reset}>Restablecer apariencia</button>
  </div>;
}
export function AppearanceButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return <>
    <button type="button" className="icon-button appearance-trigger" aria-label="Personalizar apariencia"
      aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}><Icon name="ajustes" /><span className="appearance-trigger-label">Apariencia</span></button>
    <dialog ref={dialog} className="appearance-dialog" aria-labelledby={titleId}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
      }}>
      <div className="appearance-dialog-heading"><span><Icon name="sugerencias" /><h2 id={titleId}>Tu forma de verlo</h2></span>
        <button type="button" className="icon-button" aria-label="Cerrar personalización" onClick={() => dialog.current?.close()}><Icon name="cancelar" /></button></div>
      <AppearanceControls />
    </dialog>
  </>;
}
