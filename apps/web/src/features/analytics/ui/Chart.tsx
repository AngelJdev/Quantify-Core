import { weeklyValues } from "@/shared/fixtures/demo";
export function Chart({ expanded = false }: { expanded?: boolean }) {
  return (
    <div
      className={`chart ${expanded ? "expanded" : ""}`}
      role="img"
      aria-label="Gráfica de ejemplo: lunes 60%, martes 80%, miércoles 40%, jueves 100%, viernes 80%, sábado 60%, domingo 80%"
    >
      <div className="chart-grid" aria-hidden="true">
        <span>100%</span>
        <span>50%</span>
        <span>0%</span>
      </div>
      <div className="bars" aria-hidden="true">
        {weeklyValues.map((value, i) => (
          <div className="bar-column" key={i}>
            <div className="bar-track">
              <span style={{ height: `${value}%` }}>
                <i>{value}%</i>
              </span>
            </div>
            <small>{["L", "M", "X", "J", "V", "S", "D"][i]}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
