import { useState } from "react";
import { useDemo } from "@/app/DemoProvider";
import { Chart } from "./Chart";
import {
  fixtureMetrics,
  fixtureMonthlyMetrics,
  weeklyValues,
} from "@/shared/fixtures/demo";
import { weekdayLabels } from "@/features/habits/data/model";
export function AnalyticsPage() {
  const [period, setPeriod] = useState("Semana"),
    { habits } = useDemo();
  const metrics = period === "Semana" ? fixtureMetrics : fixtureMonthlyMetrics;
  return (
    <>
      <div className="toolbar">
        <div className="tabs" role="group" aria-label="Periodo">
          {["Semana", "Mes"].map((p) => (
            <button
              key={p}
              aria-pressed={period === p}
              className={period === p ? "selected" : ""}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="period-label">{metrics.period}</span>
      </div>
      <section className="stats-grid">
        <div className="card metric">
          <p>Cumplimiento de ejemplo</p>
          <strong>
            {metrics.completionRate}
            <small>%</small>
          </strong>
          <span>Fixture fijo, no calculado a partir de tus cambios</span>
        </div>
        <div className="card metric">
          <p>Oportunidades completas de ejemplo</p>
          <strong>
            {metrics.completed}
            <small> / {metrics.eligible}</small>
          </strong>
          <span>Ventana de muestra, sin métricas oficiales</span>
        </div>
        <div className="card metric">
          <p>Hábitos en memoria</p>
          <strong>{habits.length}</strong>
          <span>Incluye pausados y archivados</span>
        </div>
      </section>
      <section className="card">
        <h2>Un paso cada día</h2>
        <p>Serie ilustrativa, compartida por las dos vistas de periodo.</p>
        <Chart expanded />
        <details>
          <summary>Consultar valores de la gráfica</summary>
          <table>
            <caption>Porcentajes de muestra</caption>
            <thead>
              <tr>
                <th>Día</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {weeklyValues.map((v, i) => (
                <tr key={i}>
                  <th scope="row">{weekdayLabels[i]}</th>
                  <td>{v}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        <div className="form-note">
          Las métricas confirmadas requerirán ventana, zona, versión de regla y
          fecha de cálculo de la API.
        </div>
      </section>
    </>
  );
}
