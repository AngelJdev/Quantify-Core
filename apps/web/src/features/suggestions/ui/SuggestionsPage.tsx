import { Link } from "react-router-dom";
import { Icon } from "@/shared/ui/Icon";
import ritual from "../../../../../../docs/GUI/assets/ritual-cotidiano.png";
export function SuggestionsPage() {
  return (
    <div className="two-columns">
      <section className="card empty suggestion-empty">
        <span className="symbol large cyan">
          <Icon name="sugerencias" />
        </span>
        <span className="eyebrow">IDEAS QUE RESPETAN TU RITMO</span>
        <h2>Primero, conocerte mejor</h2>
        <p>
          Aquí encontrarás sugerencias cuando existan registros suficientes y
          decidas activar el análisis. Mientras tanto, tu rutina sigue siendo
          tuya.
        </p>
        <Link to="/habitos" className="button primary">
          Explorar mis hábitos
        </Link>
        <Link to="/ajustes?seccion=Privacidad" className="text-link">
          Revisar mis preferencias →
        </Link>
      </section>
      <div className="stack">
        <div className="photo-card">
          <img
            src={ritual}
            alt="Un espacio tranquilo para una pausa cotidiana"
          />
          <div>
            <h2>Lo pequeño también importa</h2>
            <p>No todos los días se ven igual. Encuentra un momento para ti.</p>
          </div>
        </div>
        <section className="quiet-card">
          <Icon name="privacidad" />
          <div>
            <h3>Tú decides</h3>
            <p>
              El análisis es voluntario. Puedes revisar cada finalidad en tus
              ajustes.
            </p>
            <Link to="/ajustes?seccion=Privacidad" className="text-link">
              Consultar privacidad →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
