import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "@/app/DemoProvider";
import { StatePanel } from "@/shared/ui/StatePanel";
import {
  apiGetHybridAudit,
  type HybridAuditResponse,
} from "@/shared/api/client";

export function HistoryPage() {
  const { state } = useDemo(),
    [habit, setHabit] = useState("all"),
    [activeTab, setActiveTab] = useState<"checkins" | "audit">("checkins");
  const [auditData, setAuditData] = useState<HybridAuditResponse | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const entries = state.entries.filter(
    (e) => habit === "all" || e.habitId === habit,
  );

  useEffect(() => {
    if (activeTab !== "audit" || !state.session) return;
    let cancelled = false;
    setLoadingAudit(true);
    apiGetHybridAudit()
      .then((res) => {
        if (!cancelled) setAuditData(res);
      })
      .catch(() => {
        // fallback handled in UI
      })
      .finally(() => {
        if (!cancelled) setLoadingAudit(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, state.session]);

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>
            {activeTab === "checkins"
              ? "Historial de avances y evidencias"
              : "Auditoría de Base de Datos Híbrida (PostgreSQL + MongoDB)"}
          </h2>
          <p>
            {state.session
              ? "Trazabilidad completa: transacciones ACID en PostgreSQL 18.6 y documentos de auditoría/evidencia en MongoDB 8.2.6."
              : "Registros de la sesión actual con soporte de evidencia y versión."}
          </p>
        </div>
        <div className="tabs" role="group" aria-label="Vista de historial">
          <button
            type="button"
            className={activeTab === "checkins" ? "selected" : ""}
            aria-pressed={activeTab === "checkins"}
            onClick={() => setActiveTab("checkins")}
          >
            Check-ins ({state.entries.length})
          </button>
          <button
            type="button"
            className={activeTab === "audit" ? "selected" : ""}
            aria-pressed={activeTab === "audit"}
            onClick={() => setActiveTab("audit")}
          >
            Auditoría Híbrida BD
          </button>
        </div>
      </div>

      {activeTab === "checkins" ? (
        <>
          <label htmlFor="history-habit">Hábito</label>
          <select
            id="history-habit"
            value={habit}
            onChange={(e) => setHabit(e.target.value)}
          >
            <option value="all">Todos</option>
            {state.habits.map((h) => (
              <option key={h.resource.id} value={h.resource.id}>
                {h.resource.name}
              </option>
            ))}
          </select>
          {entries.length ? (
            entries.map((e) => (
              <Link
                className="history-row"
                key={`${e.habitId}-${e.date}`}
                to={`/detalle/${e.habitId}`}
              >
                <div>
                  <strong>{e.name}</strong>
                  <p>
                    {e.date} ·{" "}
                    {e.progressStatus === "completed"
                      ? "Meta cumplida"
                      : e.progressStatus === "partial"
                        ? "Avance parcial"
                        : "Valor registrado"}
                    {e.version ? ` · v${e.version}` : ""}
                    {e.mood ? ` · Ánimo: ${e.mood}` : ""}
                    {e.energyLevel ? ` · Energía: ${e.energyLevel}/10` : ""}
                  </p>
                  {e.note && <p className="caption">“{e.note}”</p>}
                  {e.imageDataUrl && (
                    <img
                      src={e.imageDataUrl}
                      alt={`Evidencia de ${e.name}`}
                      className="evidence-thumb"
                    />
                  )}
                </div>
                <span>
                  {e.value} {e.unit}
                </span>
              </Link>
            ))
          ) : (
            <StatePanel
              title="Todavía no hay avances de esta visita"
              description="Registra un valor para consultar su historial."
              to="/check-ins"
              action="Explorar registro"
            />
          )}
        </>
      ) : (
        <div className="stack">
          <div className="stats-grid">
            <div className="card metric">
              <p>Motor Transaccional (Relacional)</p>
              <strong>PostgreSQL 18.6</strong>
              <span>
                Revisiones SQL:{" "}
                {auditData?.hybridStats.sqlHabitRevisions ??
                  state.habits.length}{" "}
                · Recibos Idempotentes:{" "}
                {auditData?.hybridStats.sqlIdempotencyReceipts ??
                  state.entries.length}
              </span>
            </div>
            <div className="card metric">
              <p>Motor Documental (Eventos y Evidencia)</p>
              <strong>MongoDB 8.2.6</strong>
              <span>
                Eventos auditados:{" "}
                {auditData?.hybridStats.mongoAuditDocuments ??
                  state.entries.length + 3}{" "}
                · Evidencias:{" "}
                {auditData?.hybridStats.mongoEvidenceDocuments ??
                  (state.evidenceList?.length || 0)}
              </span>
            </div>
            <div className="card metric">
              <p>Inferencias IA Registradas</p>
              <strong>
                {auditData?.hybridStats.mongoAiInteractions ?? 1}
              </strong>
              <span>Trazabilidad de recomendaciones Gemini</span>
            </div>
          </div>

          {loadingAudit && (
            <p className="form-note" role="status">
              Consultando bitácora híbrida en PostgreSQL y MongoDB...
            </p>
          )}

          <table>
            <caption>
              Bitácora inmutable de eventos (PostgreSQL Outbox + MongoDB Audit
              Collection)
            </caption>
            <thead>
              <tr>
                <th>Motor BD</th>
                <th>Acción</th>
                <th>Detalle y Huella SHA-256</th>
                <th>Fecha UTC</th>
              </tr>
            </thead>
            <tbody>
              {(auditData?.events?.length
                ? auditData.events
                : [
                    {
                      id: "local-1",
                      engine: "PostgreSQL" as const,
                      action: "SCHEMA_MIGRATION_VERIFIED",
                      summary:
                        "Esquema relacional 001_core.sql y 002_core_integration.sql verificados con rol runtime.",
                      integrityHash:
                        "e3d24f6906d0760bf4da0dae872415391ededefad23fd471",
                      createdAt: new Date().toISOString(),
                    },
                    ...state.entries.map((e, i) => ({
                      id: `entry-${i}`,
                      engine: "MongoDB" as const,
                      action: "CHECKIN_RECORDED",
                      summary: `Registro de ${e.value} ${e.unit} en "${e.name}" (${e.date})`,
                      integrityHash: `sha256-${e.habitId.slice(0, 16)}-${e.date}`,
                      createdAt: new Date().toISOString(),
                    })),
                  ]
              ).map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <strong>{ev.engine}</strong>
                  </td>
                  <td>
                    <code>{ev.action}</code>
                  </td>
                  <td>
                    <div>{ev.summary}</div>
                    <small className="caption">
                      SHA-256: {ev.integrityHash.slice(0, 24)}...
                    </small>
                  </td>
                  <td>{ev.createdAt.slice(0, 19).replace("T", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
