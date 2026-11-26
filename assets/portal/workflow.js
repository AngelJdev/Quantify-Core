import { mountEvidence, teamMarkup } from "./github.js";
import { mountGantt } from "./gantt.js";
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const repo = "https://github.com/AngelJdev/Quantify-Core";
const steps = [
  {
    title: "Identidad",
    label: "Acceso con Keycloak",
    request: "Authorization Code + PKCE S256",
    description:
      "La persona se identifica en Keycloak. El cliente valida state y nonce antes de utilizar la sesión.",
    rule: "La contraseña permanece en el proveedor de identidad.",
    client: "Preparando sesión",
    api: "Identidad OIDC",
    data: "Sin escritura",
    source: "infrastructure/keycloak/README.md",
  },
  {
    title: "Rutina",
    label: "Consultar hábitos propios",
    request: "GET /habits",
    description:
      "El cliente consulta los hábitos de la cuenta autenticada. NestJS valida el JWT y obtiene al dueño desde la sesión.",
    rule: "Los permisos de administración no conceden acceso general a hábitos privados.",
    client: "Cargando rutina",
    api: "Validar sesión y propiedad",
    data: "Consulta autorizada",
    source: "packages/contracts/README.md",
  },
  {
    title: "Progreso",
    label: "Preparar el check-in",
    request: "value · businessDate · timeZone · expectedVersion",
    description:
      "La persona establece el valor acumulado del día. La operación conserva fecha de negocio, zona horaria y revisión esperada.",
    rule: "El valor es un total acumulado, no un incremento ciego.",
    client: "Editando progreso",
    api: "Esperando operación",
    data: "Historial conservado",
    source: "docs/requerimientos/reglas-negocio.md",
  },
  {
    title: "Solicitud",
    label: "Enviar una operación identificada",
    request: "POST /habits/{habitId}/check-ins",
    description:
      "El cliente envía el check-in con su identificador. Si pierde la respuesta, conserva el mismo contenido para reintentar.",
    rule: "Un reintento idéntico no debe contar el progreso dos veces.",
    client: "Enviando check-in",
    api: "Recibir operación",
    data: "Buscar clientEventId",
    source: "packages/contracts/README.md",
  },
  {
    title: "Validación",
    label: "Verificar antes de escribir",
    request: "JWT · propietario · agenda · fecha · versión",
    description:
      "La API verifica identidad, propiedad, agenda y concurrencia antes de permitir un cambio de estado.",
    rule: "Un cliente no puede elegir al propietario de un recurso privado.",
    client: "Esperando confirmación",
    api: "Validando operación",
    data: "Comprobar revisión",
    source: "docs/arquitectura/flujos.md",
  },
  {
    title: "Transacción",
    label: "Confirmar o resolver",
    request: "Operación nueva · replay · conflicto",
    description:
      "PostgreSQL confirma de forma atómica una operación válida o permite recuperar el resultado de un reintento idéntico.",
    rule: "Una revisión obsoleta produce conflicto sin sobrescribir el estado confirmado.",
    client: "Confirmación pendiente",
    api: "Resolver idempotencia",
    data: "Transacción atómica",
    source: "services/api/README.md",
  },
  {
    title: "Resultado",
    label: "Devolver el estado confirmado",
    request: "Resultado persistido y revisión de servidor",
    description:
      "El cliente recibe el resultado confirmado. Ante conflicto, consulta el estado actual y presenta una resolución explícita.",
    rule: "No crear otra operación automáticamente para eludir un conflicto.",
    client: "Actualizar historial",
    api: "Responder al cliente",
    data: "Revisión trazable",
    source: "docs/arquitectura/flujos.md",
  },
  {
    title: "Dashboard",
    label: "Consultar métricas propias",
    request: "GET /me/dashboard/progress",
    description:
      "Móvil o PWA consultan el progreso y las tendencias del periodo autorizado, compatibles con la historia del hábito.",
    rule: "No recalcular el pasado usando solamente la meta actual.",
    client: "Refrescar dashboard",
    api: "Consultar métricas",
    data: "Estadísticas SQL",
    source: "docs/datos-ia/estadisticas-dashboard.md",
  },
];
const scenarios = {
  normal: {
    name: "Una confirmación",
    outcome: "Una confirmación",
    text: "Una operación nueva y válida se confirma una sola vez.",
  },
  identical: {
    name: "Operación idéntica",
    outcome: "Evento ya confirmado",
    text: "Otra clave de solicitud con el mismo clientEventId y contenido recupera el resultado previo; no crea otro check-in.",
  },
  replay: {
    name: "Reintento idempotente",
    outcome: "Sin doble conteo",
    text: "El mismo identificador y contenido recuperan el resultado original.",
  },
  conflict: {
    name: "Versión obsoleta",
    outcome: "Conflicto explícito",
    text: "La revisión cambió: no sobrescribir; consultar y resolver el estado confirmado.",
  },
};
// Fixtures de documentación; no se envían a la API ni se guardan en el cliente.
const eventId = "925ed4ea-6e06-493c-a3c1-26052d0f61b5";
const habitId = "b7a92689-b9e1-4c01-897a-7c19307193cd";
const checkInId = "8c6ea7cf-08cd-41b3-a4d5-77b293ca2971";
const originalKey = "bfa30981-46ef-44d6-8865-7fcfc8feb709";
const secondKey = "43286aba-fdda-4bb6-9676-a7fba9ca19cb";
const checkInPath = `/habits/${habitId}/check-ins`;
const dashboardPath = "/me/dashboard/progress?from=2026-11-01&to=2026-11-18";
function commandFor(scenario) {
  return {
    clientEventId: eventId,
    businessDate: "2026-11-18",
    occurredAt: "2026-11-18T16:00:00.000Z",
    timeZone: "America/Mexico_City",
    value: 1.5,
    expectedVersion: scenario === "conflict" ? 1 : 0,
    ...(scenario === "conflict"
      ? { correctionReason: "Corregir valor del día" }
      : {}),
  };
}
function confirmedCheckIn() {
  const { expectedVersion, ...command } = commandFor("normal");
  return {
    id: checkInId,
    habitId,
    ...command,
    recordedAt: "2026-11-18T16:00:01.000Z",
    version: 1,
    progressStatus: "partial",
  };
}
export function serviceWorkflow(main, params) {
  let index = Math.max(0, Math.min(7, Number(params.get("paso")) || 0));
  let client = params.get("cliente") === "pwa" ? "pwa" : "mobile";
  let scenario = scenarios[params.get("escenario")]
    ? params.get("escenario")
    : "normal";
  let offline = params.get("red") === "offline";
  let outbox = null;
  let exchangeOpen = false;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let playing = false,
    completed = false,
    speed = 1,
    timer,
    disposed = false;
  main.innerHTML = `<section class="orchestrator" aria-labelledby="workflow-title"><div class="wf-heading"><div><span class="eyebrow">QUANTIFY CORE / WORKFLOW</span><h1 id="workflow-title">Así se conecta tu progreso.</h1><p>De una acción en el cliente a un resultado confirmado en tus métricas.</p></div><span class="wf-demo-label">Simulación visual</span></div><div class="wf-toolbar"><div class="wf-client-switch" role="group" aria-label="Cliente de origen"><button data-wf-client="mobile" aria-pressed="true">Móvil <small>Flutter</small></button><button data-wf-client="pwa" aria-pressed="false">PWA <small>React</small></button></div><div class="wf-playback"><button id="wf-play" type="button">Pausar recorrido</button><button id="wf-reset" type="button">Reiniciar</button><label>Velocidad<select id="wf-speed"><option value="1">1×</option><option value="0.5">0.5×</option><option value="2">2×</option></select></label></div></div><div class="wf-layout"><section class="wf-board" aria-label="Diagrama de integración"><div class="wf-board-top"><span>FLUJO DE DATOS</span><span id="wf-position" role="status"></span></div><div class="wf-canvas"><svg class="wf-connections" aria-hidden="true"></svg><div class="wf-systems"><section class="wf-system wf-mobile" data-wf-system="mobile"><div class="wf-system-header"><span class="wf-system-index">01</span><div><h2>App móvil</h2><p>Flutter · cuenta personal</p></div><span class="wf-status-dot"></span></div><div class="wf-device"><div class="wf-phone-top"><span>QUANTIFY</span><span>•••</span></div><div class="wf-phone-greeting">Tu progreso empieza aquí.</div><div class="wf-habit"><span>EJEMPLO / HÁBITO</span><strong>Hidratación</strong><div class="wf-example-value">1.5 <small>/ 3 L</small></div><div class="wf-meter"><i></i></div><div class="wf-mini-row"><span>Registro de hoy</span><b>Valor acumulado</b></div></div><button type="button" class="wf-command" data-wf-run="mobile" aria-label="Registrar progreso y ejecutar el flujo móvil">Registrar progreso <span aria-hidden="true">→</span></button><div class="wf-mobile-state" data-wf-status="mobile"></div><div class="wf-phone-nav"><span>Hoy</span><span>Hábitos</span><span>Análisis</span></div></div><div class="wf-system-foot"><span>RF-01 / RF-04</span><span>Cliente → API</span></div></section><section class="wf-system wf-pwa" data-wf-system="pwa"><div class="wf-system-header"><span class="wf-system-index">02</span><div><h2>Web / PWA</h2><p>React · misma API</p></div><span class="wf-status-dot"></span></div><div class="wf-browser"><div class="wf-browser-bar"><i></i><i></i><i></i><span>Quantify / Tu espacio</span></div><div class="wf-web-layout"><div class="wf-mini-nav"><span>Q</span><b>Hoy</b><span>Hábitos</span><span>Análisis</span></div><div class="wf-web-body"><strong>Tu rutina, en perspectiva.</strong><div class="wf-mini-stats"><span>Tu progreso<b>Diario</b></span><span>Historial<b>Propio</b></span></div><div class="wf-chart" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="wf-web-result" data-wf-status="pwa"></div></div></div></div><button type="button" class="wf-command wf-pwa-command" data-wf-run="pwa" aria-label="Registrar progreso y ejecutar el flujo PWA">Registrar progreso <span aria-hidden="true">→</span></button><div class="wf-sync-note">Misma cuenta. Mismo contrato.</div><div class="wf-system-foot"><span>React / TypeScript</span><span>Cliente → API</span></div></section><section class="wf-system wf-api" data-wf-system="api"><div class="wf-system-header"><span class="wf-system-index">03</span><div><h2>API + datos</h2><p>NestJS · PostgreSQL</p></div><span class="wf-status-dot"></span></div><div class="wf-api-stack"><div class="wf-api-node"><span>IDENTIDAD Y PERMISOS</span><strong>JWT / OIDC</strong><small>Keycloak · propietario del recurso</small></div><div class="wf-stack-link" aria-hidden="true">↓</div><div class="wf-api-node wf-write-node"><span>OPERACIÓN DE NEGOCIO</span><strong data-wf-status="api"></strong><small>Validación · concurrencia · dedupe</small></div><div class="wf-stack-link" aria-hidden="true">↓</div><div class="wf-api-node wf-database"><span>PERSISTENCIA</span><strong data-wf-status="data"></strong><small>Historial y reglas versionadas</small></div></div><div class="wf-system-foot"><span>REST / SQL</span><span id="wf-response-state"></span></div></section></div><div class="wf-wire-caption"><span class="wf-legend-request"></span>Solicitud<span class="wf-legend-response"></span>Respuesta del servidor</div></div><div class="wf-request-bar"><span id="wf-request-kind">INTERCAMBIO</span><code id="wf-request"></code></div><div class="wf-timeline" role="group" aria-label="Secuencia del proceso">${steps.map((step, i) => `<button type="button" data-dev-step="${i}" aria-pressed="false"><span>${String(i + 1).padStart(2, "0")}</span>${step.title}<i></i></button>`).join("")}</div></section><aside class="wf-inspector" id="development-detail" aria-label="Detalle del paso"><div id="wf-step-detail" aria-live="polite"></div><div class="wf-step-controls"><button id="wf-previous" type="button">← Anterior</button><button id="wf-next" type="button">Siguiente →</button></div><div class="wf-scenarios"><h3>Prueba otro resultado</h3>${Object.entries(
    scenarios,
  )
    .map(
      ([id, value]) =>
        `<button type="button" data-wf-scenario="${id}" aria-pressed="false"><span></span>${value.name}</button>`,
    )
    .join(
      "",
    )}</div></aside></div><div class="wf-boundary"><span>DIAGRAMA EXPLICATIVO</span> La animación representa el flujo previsto. La API tiene evidencia local; la conexión final de React/Flutter y las capacidades PWA siguen pendientes.</div><div class="wf-evidence-slot"><details class="wf-github"><summary><span>El código detrás del recorrido</span><small>GitHub · nombres, roles, commits y PR</small></summary><div id="workflow-team"></div><div class="wf-evidence-grid"><div class="card"><h2>Evidencia del repositorio</h2><div id="workflow-evidence"></div></div><div class="card pull-request-list" id="workflow-prs"></div></div></details></div></section>`;
  const host = main.querySelector(".orchestrator"),
    canvas = host.querySelector(".wf-canvas"),
    svg = host.querySelector("svg");
  const q = (selector) => host.querySelector(selector);
  q(".wf-mobile .wf-status-dot").remove();
  q(".wf-mobile .wf-system-header").insertAdjacentHTML(
    "beforeend",
    `<button type="button" class="wf-network" id="wf-network" role="switch" aria-checked="true" aria-label="Conexión móvil simulada"><span aria-hidden="true">●</span><span id="wf-network-label"></span><span aria-hidden="true">⇄</span></button>`,
  );
  q(".wf-mobile-state").insertAdjacentHTML(
    "beforebegin",
    `<div class="wf-outbox" role="status" aria-live="polite"><strong id="wf-outbox-state"></strong><code id="wf-outbox-id"></code></div>`,
  );
  ["identity", "business", "persistence"].forEach((layer, i) => {
    host.querySelectorAll(".wf-api-node")[i].dataset.wfLayer = layer;
  });
  q(".wf-sync-note").id = "wf-refresh-note";
  q(".wf-step-controls").insertAdjacentHTML(
    "beforebegin",
    `<details class="wf-exchange"><summary id="wf-http-status">Intercambio HTTP / JSON</summary><div class="wf-exchange-body"><small>Ejemplo sintético · base /api/v1</small><pre tabindex="0" role="region" aria-label="Solicitud y respuesta de ejemplo"><code id="wf-http-code"></code></pre></div></details>`,
  );
  q(".wf-exchange").addEventListener("toggle", () => {
    exchangeOpen = q(".wf-exchange").open;
  });
  const gantt = document.createElement("section");
  gantt.className = "gantt-panel";
  gantt.hidden = true;
  gantt.setAttribute("aria-label", "Gantt de Jira");
  host.append(gantt);
  const views = document.createElement("div");
  views.className = "wf-view-tabs";
  views.setAttribute("role", "group");
  views.setAttribute("aria-label", "Vista del workflow");
  views.innerHTML =
    '<button type="button" data-wf-view="flow" aria-pressed="true">Recorrido técnico</button><button type="button" data-wf-view="gantt" aria-pressed="false">Gantt de Jira</button>';
  q(".wf-demo-label").replaceWith(views);
  let ganttLoaded = false;
  const setView = (showGantt) => {
    if (showGantt) {
      playing = false;
      clearInterval(timer);
      render();
    }
    host.classList.toggle("is-gantt", showGantt);
    gantt.hidden = !showGantt;
    q("#workflow-title").textContent = showGantt
      ? "Cronograma de Quantify."
      : "Así se conecta tu progreso.";
    q(".wf-heading p").textContent = showGantt
      ? "Fechas, responsables y dependencias registradas en Jira."
      : "De una acción en el cliente a un resultado confirmado en tus métricas.";
    for (const button of views.querySelectorAll("button"))
      button.setAttribute(
        "aria-pressed",
        String((button.dataset.wfView === "gantt") === showGantt),
      );
    if (showGantt && !ganttLoaded) {
      ganttLoaded = true;
      mountGantt(gantt);
    }
    const url = new URL(location);
    const options = new URLSearchParams(url.hash.split("?")[1]);
    options.set("vista", showGantt ? "gantt" : "flow");
    url.hash = "workflow?" + options;
    history.replaceState(null, "", url);
  };
  views
    .querySelectorAll("button")
    .forEach((button) =>
      button.addEventListener("click", () =>
        setView(button.dataset.wfView === "gantt"),
      ),
    );
  q(".wf-github").open = false;
  host.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && q(".wf-github").open) {
      q(".wf-github").open = false;
      q(".wf-github summary").focus();
    }
  });
  function choreography() {
    const held = offline && client === "mobile";
    const duplicate = scenario === "replay" || scenario === "identical";
    const blocked =
      index >= 4 && index <= 5 && (duplicate || scenario === "conflict");
    const layer =
      held || index === 2
        ? null
        : blocked || (duplicate && index === 6)
          ? "business"
          : [
              "identity",
              "persistence",
              null,
              "identity",
              "business",
              "persistence",
              "business",
              "persistence",
            ][index];
    // En conflicto, el paso 07 consulta el estado antes de permitir una resolución.
    const currentLayer =
      !held && scenario === "conflict" && index === 6 ? "persistence" : layer;
    const systems =
      held || index === 2
        ? [client]
        : index === 7
          ? ["pwa", "api"]
          : index === 4 || index === 5
            ? ["api"]
            : [client, "api"];
    return {
      layer: currentLayer,
      systems,
      blocked,
      duplicate,
      write: !held && index === 5 && scenario === "normal",
    };
  }
  function exchange() {
    const json = (body) => JSON.stringify(body, null, 2);
    const command =
      outbox && client === "mobile" ? outbox.command : commandFor(scenario);
    const request = `POST /api/v1${checkInPath}\nIdempotency-Key: ${scenario === "identical" ? secondKey : originalKey}\nContent-Type: application/json\n\n${json(command)}`;
    const reply = (status, body, type = "application/json") =>
      `HTTP/1.1 ${status}\nContent-Type: ${type}\n\n${json(body)}`;
    if (offline && client === "mobile")
      return {
        status: "Sin red · sin petición HTTP",
        code: `OUTBOX LOCAL · ${outbox ? "pending" : "vacía"}\n${outbox ? json(outbox.command) : "Registra progreso para encolar un comando."}`,
      };
    if (index === 0)
      return {
        status: "OIDC · Authorization Code + PKCE S256",
        code: "Keycloak → código de autorización\nCliente → canje con code_verifier\nValidar state, nonce y sesión\nAPI → validar JWT y propietario",
      };
    if (index === 1)
      return {
        status: "200 OK · rutina propia",
        code: "GET /api/v1/habits\n\nHTTP/1.1 200 OK\nConsulta autorizada de hábitos propios.",
      };
    if (index === 2)
      return { status: "Comando preparado · sin envío", code: json(command) };
    if (index < 5)
      return { status: "Petición · pendiente de resolución", code: request };
    if (index === 7) {
      const empty = {
        opportunities: 0,
        recorded: 0,
        completed: 0,
        partial: 0,
        explicitZero: 0,
        missing: 0,
        completionRate: null,
        coverageRate: null,
        noDataReason: "NO_ELIGIBLE_OPPORTUNITIES",
      };
      return {
        status: "200 OK · dashboard revalidado",
        code: `GET /api/v1${dashboardPath}\n\n${reply("200 OK", {
          window: {
            from: "2026-11-01",
            to: "2026-11-18",
            habitId: null,
            ruleVersion: "dashboard-opportunities-1.0.0",
            calculatedAt: "2026-11-18T16:00:02.000Z",
            timeBasis: "habit-business-date",
            timeZones: ["America/Mexico_City"],
            source: "postgresql-check-ins",
          },
          closed: empty,
          open: {
            ...empty,
            opportunities: 1,
            recorded: 1,
            partial: 1,
            coverageRate: 100,
            completionRate: 0,
            noDataReason: null,
          },
          futureOpportunities: 0,
        })}`,
      };
    }
    if (scenario === "conflict") {
      const conflict = reply(
        "409 Conflict",
        {
          type: "about:blank",
          title: "Conflict",
          status: 409,
          code: "VERSION_CONFLICT",
          requestId: secondKey,
        },
        "application/problem+json",
      );
      return {
        status:
          index === 6
            ? "409 → GET · resincronizar"
            : "409 Conflict · sin sobrescritura",
        code: `${request}\n\n${conflict}${index === 6 ? `\n\nGET /api/v1${checkInPath}?from=2026-11-18&to=2026-11-18\n\n${reply("200 OK", { items: [{ ...confirmedCheckIn(), clientEventId: secondKey, value: 2, version: 2 }], nextCursor: null })}\n\nResolución explícita antes de un nuevo comando con expectedVersion: 2.\nNo reintentar automáticamente la intención obsoleta.` : ""}`,
      };
    }
    const duplicate = scenario === "identical" || scenario === "replay";
    return {
      status: duplicate ? "200 OK - Replay" : "201 Created · confirmado",
      code: `${request}\n\n${reply(duplicate ? "200 OK" : "201 Created", confirmedCheckIn())}${duplicate ? "\n\nReplay: mismo resultado persistido; sin nueva escritura de check-in.\nLa etiqueta Replay es explicativa, no una cabecera HTTP." : ""}`,
    };
  }
  function draw() {
    if (disposed) return;
    const bounds = canvas.getBoundingClientRect(),
      width = bounds.width,
      height = bounds.height;
    const box = (selector) => {
      const b = q(selector).getBoundingClientRect();
      return {
        left: b.left - bounds.left,
        right: b.right - bounds.left,
        top: b.top - bounds.top,
        bottom: b.bottom - bounds.top,
        cy: b.top - bounds.top + b.height * 0.58,
        cx: b.left - bounds.left + b.width / 2,
      };
    };
    const mobile = box(".wf-mobile"),
      pwa = box(".wf-pwa"),
      api = box(".wf-api");
    const flow = choreography();
    if (!flow.layer) {
      svg.innerHTML = "";
      return;
    }
    const target = box(`[data-wf-layer="${flow.layer}"]`);
    const vertical = pwa.top >= mobile.bottom;
    function route(source, returning) {
      if (vertical) {
        const x = width - (returning ? 5 : 15);
        return `M ${source.right} ${source.cy} L ${x} ${source.cy} L ${x} ${target.cy} L ${target.right} ${target.cy}`;
      }
      if (source === pwa) {
        const offset = returning ? 5 : -5;
        return `M ${source.right} ${source.cy + offset} C ${source.right + 12} ${source.cy + offset} ${api.left - 12} ${target.cy + offset} ${target.left} ${target.cy + offset}`;
      }
      const y =
        Math.max(mobile.bottom, pwa.bottom, api.bottom) + (returning ? 40 : 23);
      const x = api.left - (returning ? 5 : 13);
      return `M ${mobile.cx} ${mobile.bottom} L ${mobile.cx} ${y - 12} Q ${mobile.cx} ${y} ${mobile.cx + 12} ${y} L ${x - 8} ${y} Q ${x} ${y} ${x} ${y - 8} L ${x} ${target.cy} L ${target.left} ${target.cy}`;
    }
    const source = index === 7 || client === "pwa" ? pwa : mobile;
    const request = route(source, false),
      response = route(source, true);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const warning = scenario === "conflict" && index >= 4 && index < 7;
    const color = warning ? "var(--qc-amber)" : "var(--qc-emerald)";
    const requestColor = warning ? color : "var(--qc-skyLaser)";
    svg.innerHTML = `<defs><marker id="wf-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="${requestColor}"/></marker><marker id="wf-return-arrow" markerWidth="8" markerHeight="8" refX="0" refY="3" orient="auto-start-reverse"><path d="M0,0 L6,3 L0,6" fill="${color}"/></marker></defs><path class="wf-wire wf-wire-halo" d="${request}"/><path id="wf-outbound" class="wf-wire wf-wire-request" data-target-layer="${flow.layer}" d="${request}" style="stroke:${requestColor}" marker-end="url(#wf-arrow)"/><path id="wf-inbound" class="wf-wire wf-wire-response" d="${response}" style="stroke:${color}" marker-start="url(#wf-return-arrow)"/>${!motion.matches ? `<circle class="wf-packet" r="4" fill="${requestColor}"><animateMotion dur="${2.4 / speed}s" repeatCount="indefinite"><mpath href="#wf-outbound"/></animateMotion></circle><circle class="wf-packet" r="3.5" fill="${color}"><animateMotion dur="${2.8 / speed}s" keyPoints="1;0" keyTimes="0;1" calcMode="linear" repeatCount="indefinite"><mpath href="#wf-inbound"/></animateMotion></circle>` : ""}`;
    svg.setCurrentTime(0.01);
    if (!playing || motion.matches) svg.pauseAnimations();
    else svg.unpauseAnimations();
  }
  function render() {
    if (offline && client === "mobile") index = Math.min(index, 2);
    const step = steps[index],
      outcome = scenarios[scenario];
    const flow = choreography();
    if (outbox?.status === "sending" && client === "mobile" && index >= 6)
      outbox.status = scenario === "conflict" ? "conflict" : "synced";
    host.dataset.client = client;
    host.dataset.scenario = scenario;
    host.dataset.playing = String(playing);
    host.dataset.step = String(index);
    host.dataset.network = offline ? "offline" : "online";
    host.dataset.flow = flow.blocked
      ? "blocked"
      : flow.write
        ? "write"
        : "read";
    host.dataset.outbox = outbox?.status || "empty";
    for (const system of host.querySelectorAll("[data-wf-system]")) {
      const active = flow.systems.includes(system.dataset.wfSystem);
      system.classList.toggle("is-active", active);
      system.classList.toggle("is-dimmed", !active);
    }
    for (const node of host.querySelectorAll("[data-wf-layer]")) {
      node.classList.toggle(
        "is-processing",
        node.dataset.wfLayer === flow.layer,
      );
      node.classList.toggle(
        "is-skipped",
        flow.blocked && node.dataset.wfLayer === "persistence",
      );
    }
    host.querySelectorAll(".wf-stack-link").forEach((link, i) => {
      link.classList.toggle(
        "is-processing",
        i === 0 ? flow.layer === "business" : flow.layer === "persistence",
      );
      link.classList.toggle("is-skipped", i === 1 && flow.blocked);
      link.textContent =
        i === 1 && flow.blocked ? "⊘ Sin nueva escritura" : "↓";
    });
    q("#wf-network").setAttribute("aria-checked", String(!offline));
    q("#wf-network-label").textContent = offline ? "Sin conexión" : "En línea";
    q("#wf-outbox-state").textContent = !outbox
      ? "Outbox local · 0 pendientes"
      : {
          pending: "Outbox · 1 pending (provisional)",
          sending: "Outbox · enviando 1 comando",
          synced: "Outbox · 0 pendientes · synced",
          conflict: "Outbox · conflict · resolver",
        }[outbox.status];
    q("#wf-outbox-id").textContent = outbox
      ? `clientEventId: ${outbox.command.clientEventId}`
      : "Conserva ID + contenido al reintentar";
    host.dataset.runState = playing
      ? "running"
      : completed
        ? "complete"
        : "paused";
    host.style.setProperty("--wf-duration", 2800 / speed + "ms");
    q("#wf-step-detail").setAttribute("aria-live", playing ? "off" : "polite");
    q("#wf-position").setAttribute("aria-live", playing ? "off" : "polite");
    q("#wf-position").textContent =
      `PASO ${String(index + 1).padStart(2, "0")} / 08`;
    q("#wf-play").textContent = playing
      ? "Pausar flujo"
      : completed || index === 7
        ? "Repetir flujo"
        : index === 0
          ? "Ejecutar flujo"
          : "Continuar flujo";
    q("#wf-play").setAttribute("aria-pressed", String(playing));
    for (const button of host.querySelectorAll("[data-dev-step]")) {
      const n = Number(button.dataset.devStep);
      button.setAttribute("aria-pressed", String(n === index));
      button.classList.toggle("wf-completed", n < index);
    }
    for (const button of host.querySelectorAll("[data-wf-client]")) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.wfClient === client),
      );
      button.disabled = outbox?.status === "sending";
    }
    for (const button of host.querySelectorAll("[data-wf-run]"))
      button.disabled = outbox?.status === "sending";
    for (const button of host.querySelectorAll("[data-wf-scenario]")) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.wfScenario === scenario),
      );
      button.disabled =
        outbox?.status === "pending" || outbox?.status === "sending";
    }
    q('[data-wf-status="mobile"]').textContent =
      client === "mobile" ? step.client : "Disponible en móvil";
    q('[data-wf-status="pwa"]').textContent =
      client === "pwa" ? step.client : "Disponible en PWA";
    q('[data-wf-status="api"]').textContent = step.api;
    q('[data-wf-status="data"]').textContent = step.data;
    if (index >= 4 && index <= 6 && scenario === "conflict") {
      q('[data-wf-status="' + client + '"]').textContent = "Resolver conflicto";
      q('[data-wf-status="api"]').textContent = "Devolver conflicto";
      q('[data-wf-status="data"]').textContent = "Sin mutación parcial";
      if (index === 6) {
        q('[data-wf-status="' + client + '"]').textContent =
          "Estado actual v2 · resolver";
        q('[data-wf-status="api"]').textContent = "GET · resincronizar";
      }
    } else if (index >= 4 && index <= 6 && flow.duplicate) {
      q('[data-wf-status="api"]').textContent = "Recuperar resultado original";
      q('[data-wf-status="data"]').textContent =
        "Sin doble conteo · 0 escrituras";
    }
    if (offline && client === "mobile") {
      q('[data-wf-status="mobile"]').textContent = outbox
        ? "Pendiente local · sin confirmar"
        : "Sin red · registra un ejemplo";
      q('[data-wf-status="api"]').textContent = "Sin petición";
      q('[data-wf-status="data"]').textContent = "Sin escritura";
    }
    if (index === 7)
      q('[data-wf-status="pwa"]').textContent =
        scenario === "conflict"
          ? "Estado confirmado · conflicto pendiente"
          : client === "mobile"
            ? "Progreso móvil leído en web"
            : "Progreso confirmado leído en web";
    if (index === 7 && client === "mobile")
      q('[data-wf-status="mobile"]').textContent =
        scenario === "conflict"
          ? "Conflicto pendiente de resolución"
          : "Check-in confirmado en API";
    q("#wf-refresh-note").textContent =
      index === 7
        ? "React · revalidar al enfocar ventana"
        : "Misma cuenta. Mismo contrato.";
    q("#wf-response-state").textContent =
      index >= 5 ? outcome.outcome : "Operación propia";
    q("#wf-request").textContent = step.request;
    if (flow.blocked)
      q("#wf-request").textContent =
        scenario === "conflict"
          ? "409 Conflict · expectedVersion 1 ≠ version 2 · 0 escrituras"
          : "200 OK - Replay · deduplicación · 0 escrituras de check-in";
    if (index === 6 && scenario === "conflict")
      q("#wf-request").textContent =
        "GET /habits/{habitId}/check-ins · leer version 2 → resolver → nuevo comando";
    if (offline && client === "mobile")
      q("#wf-request").textContent =
        "Outbox local → pending → recuperar red → enviar el mismo clientEventId";
    q("#wf-request-kind").textContent =
      index === 7
        ? "WEB ← API / SQL"
        : client === "mobile"
          ? "MÓVIL ↔ SERVICIOS"
          : "PWA ↔ SERVICIOS";
    q("#wf-step-detail").innerHTML =
      `<span class="eyebrow">${String(index + 1).padStart(2, "0")} / ${escape(step.title)}</span><h2>${step.label}</h2><p>${step.description}</p><h3>Regla de la operación</h3><p>${step.rule}</p><div class="wf-outcome"><span class="tag ${scenario === "conflict" ? "pending" : "good"}">${escape(outcome.outcome)}</span><p>${outcome.text}</p></div><a href="index.html#documento?src=${encodeURIComponent(step.source)}">Consultar contrato y reglas →</a>`;
    if (offline && client === "mobile") {
      q("#wf-step-detail h2").textContent = "Guardar antes de sincronizar";
      q("#wf-step-detail > p").textContent =
        "Flutter conserva el comando en una outbox local por cuenta. Al recuperar red y validar sesión, envía el mismo ID, clave y contenido. Aquí la cola vive solo en memoria como simulación.";
      q(".wf-outcome p").textContent =
        "Una respuesta perdida puede provocar otro envío. La deduplicación del servidor evita confirmar dos veces el mismo check-in.";
    } else if (index >= 4 && index <= 6 && flow.duplicate) {
      q("#wf-step-detail h2").textContent = "Detener en deduplicación";
      q("#wf-step-detail > p").textContent =
        "Tras validar sesión y propiedad, la API encuentra el recibo por clave o clientEventId y compara su contenido. Devuelve el JSON confirmado sin otra mutación del hábito ni del progreso.";
      q("#wf-step-detail > p:nth-of-type(2)").textContent =
        "La lectura del recibo puede acceder a SQL; 0 escrituras se refiere al check-in. Otro contenido con la misma clave o evento causa 409.";
    } else if (index === 6 && scenario === "conflict") {
      q("#wf-step-detail h2").textContent = "Resincronizar antes de resolver";
      q("#wf-step-detail > p").textContent =
        "El POST recibió 409: esperaba v1, el servidor conserva v2. El cliente consulta el check-in actual y presenta las diferencias. Una resolución explícita crea un nuevo comando con expectedVersion 2.";
    } else if (index === 7) {
      q("#wf-step-detail > p").textContent =
        "Web lee de la misma API el progreso confirmado. Propuesta React: revalidar al enfocar la ventana o recuperar conexión; una mutación en esta pestaña invalida su caché. Invalidar la caché móvil no notifica a otra pestaña.";
      if (scenario === "conflict")
        q(".wf-outcome p").textContent =
          "Dashboard muestra el estado del servidor. El comando en conflicto permanece pendiente de resolución; no se presenta como aceptado.";
    }
    const http = exchange();
    q("#wf-step-detail").scrollTop = 0;
    q("#wf-http-status").textContent = http.status;
    q("#wf-http-code").textContent = http.code;
    q(".wf-exchange").open = exchangeOpen;
    q("#wf-previous").disabled = index === 0;
    q("#wf-next").disabled =
      index === 7 || (offline && client === "mobile" && index === 2);
    history.replaceState(
      null,
      "",
      "#workflow?" +
        new URLSearchParams({
          paso: index,
          cliente: client,
          escenario: scenario,
          red: offline ? "offline" : "online",
        }),
    );
    draw();
  }
  function schedule() {
    clearInterval(timer);
    if (playing)
      timer = setInterval(() => {
        if (!host.isConnected) {
          destroy();
          return;
        }
        index = Math.min(index + 1, 7);
        if (index === 7) {
          playing = false;
          completed = true;
          clearInterval(timer);
        }
        render();
      }, 2800 / speed);
  }
  function select(i) {
    playing = false;
    completed = false;
    index = Math.max(0, Math.min(7, i));
    render();
    schedule();
  }
  function run(source) {
    client = source;
    if (source === "mobile" && offline) {
      outbox ||= {
        command: Object.freeze(commandFor(scenario)),
        status: "pending",
      };
      outbox.status = "pending";
      select(2);
      return;
    }
    if (source === "mobile") outbox = null;
    index = 0;
    completed = false;
    playing = true;
    render();
    schedule();
  }
  for (const button of host.querySelectorAll("[data-wf-run]"))
    button.onclick = () => run(button.dataset.wfRun);
  q("#wf-play").onclick = () => {
    if (offline && client === "mobile") {
      run(client);
      return;
    }
    if (completed || index === 7) {
      run(client);
      return;
    }
    playing = !playing;
    render();
    schedule();
  };
  q("#wf-reset").onclick = () => {
    outbox = null;
    select(0);
  };
  q("#wf-network").onclick = () => {
    offline = !offline;
    if (offline && client === "mobile") {
      if (outbox?.status === "sending") outbox.status = "pending";
      select(Math.min(index, 2));
    } else if (!offline && outbox?.status === "pending") {
      client = "mobile";
      index = 3;
      outbox.status = "sending";
      playing = true;
      completed = false;
      render();
      schedule();
    } else render();
  };
  q("#wf-previous").onclick = () => select(index - 1);
  q("#wf-next").onclick = () => select(index + 1);
  q("#wf-speed").onchange = (event) => {
    speed = Number(event.target.value);
    render();
    schedule();
  };
  for (const button of host.querySelectorAll("[data-dev-step]")) {
    button.onclick = () => select(Number(button.dataset.devStep));
    button.onkeydown = (event) => {
      if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        select(index + (event.key === "ArrowRight" ? 1 : -1));
        q('[data-dev-step="' + index + '"]').focus();
      }
    };
  }
  for (const button of host.querySelectorAll("[data-wf-client]"))
    button.onclick = () => {
      client = button.dataset.wfClient;
      render();
    };
  for (const button of host.querySelectorAll("[data-wf-scenario]"))
    button.onclick = () => {
      scenario = button.dataset.wfScenario;
      outbox = null;
      select(5);
    };
  const resize = new ResizeObserver(draw);
  resize.observe(canvas);
  const changeMotion = () => {
    if (motion.matches) playing = false;
    render();
    schedule();
  };
  motion.addEventListener("change", changeMotion);
  const observer = new MutationObserver(() => {
    if (!host.isConnected) destroy();
  });
  observer.observe(main, { childList: true });
  function destroy() {
    disposed = true;
    clearInterval(timer);
    resize.disconnect();
    observer.disconnect();
    motion.removeEventListener("change", changeMotion);
  }
  render();
  schedule();
  if (params.get("vista") === "gantt") setView(true);
  const team = q("#workflow-team");
  teamMarkup()
    .then((html) => {
      if (team.isConnected) team.innerHTML = html;
    })
    .catch(() => {});
  mountEvidence(q("#workflow-evidence"));
  const prs = q("#workflow-prs");
  prs.innerHTML = "<h2>Pull requests</h2><p>Consultando GitHub…</p>";
  fetch(
    "https://api.github.com/repos/AngelJdev/Quantify-Core/pulls?state=all&base=develop&per_page=5",
    { signal: AbortSignal.timeout(7000) },
  )
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((data) => {
      if (prs.isConnected)
        prs.innerHTML =
          "<h2>Pull requests</h2><ul>" +
          data
            .map(
              (pr) =>
                `<li><a href="${repo}/pull/${Number(pr.number)}" target="_blank" rel="noopener">#${Number(pr.number)} · ${escape(pr.title)}</a><span class="tag">${pr.merged_at ? "Integrado" : pr.state === "open" ? "Abierto" : "Cerrado"}</span></li>`,
            )
            .join("") +
          "</ul>";
    })
    .catch(() => {
      if (prs.isConnected)
        prs.innerHTML = `<h2>Pull requests</h2><p>Consulta actual no disponible.</p><a href="${repo}/pulls">Ver en GitHub ↗</a>`;
    });
}
