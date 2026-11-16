import { mountEvidence, teamMarkup } from "./github.js";
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
    name: "Operación nueva",
    outcome: "Una confirmación",
    text: "Una operación nueva y válida se confirma una sola vez.",
  },
  replay: {
    name: "Reintento idéntico",
    outcome: "Sin doble conteo",
    text: "El mismo identificador y contenido recuperan el resultado original.",
  },
  conflict: {
    name: "Versión obsoleta",
    outcome: "Conflicto explícito",
    text: "La revisión cambió: no sobrescribir; consultar y resolver el estado confirmado.",
  },
};
export function serviceWorkflow(main, params) {
  let index = Math.max(0, Math.min(7, Number(params.get("paso")) || 0));
  let client = params.get("cliente") === "pwa" ? "pwa" : "mobile";
  let scenario = scenarios[params.get("escenario")]
    ? params.get("escenario")
    : "normal";
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
  q(".wf-github").open = false;
  host.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && q(".wf-github").open) {
      q(".wf-github").open = false;
      q(".wf-github summary").focus();
    }
  });
  function draw() {
    if (disposed) return;
    const bounds = canvas.getBoundingClientRect(),
      width = bounds.width,
      height = bounds.height;
    const box = (id) => {
      const b = q('[data-wf-system="' + id + '"]').getBoundingClientRect();
      return {
        left: b.left - bounds.left,
        right: b.right - bounds.left,
        top: b.top - bounds.top,
        bottom: b.bottom - bounds.top,
        cy: b.top - bounds.top + b.height * 0.58,
        cx: b.left - bounds.left + b.width / 2,
      };
    };
    const mobile = box("mobile"),
      pwa = box("pwa"),
      api = box("api");
    const vertical = pwa.top >= mobile.bottom;
    function route(source, returning) {
      if (vertical) {
        const x = width - (returning ? 5 : 15);
        return `M ${source.cx} ${source.bottom} C ${source.cx} ${source.bottom + 18} ${x} ${source.bottom + 18} ${x} ${source.bottom + 32} L ${x} ${api.top - 20} Q ${x} ${api.top - 8} ${api.cx} ${api.top - 8} L ${api.cx} ${api.top}`;
      }
      if (source === pwa) {
        const y = pwa.cy + (returning ? 26 : 0);
        return `M ${source.right} ${y} C ${source.right + 22} ${y} ${api.left - 22} ${y} ${api.left} ${y}`;
      }
      const y =
        Math.max(mobile.bottom, pwa.bottom, api.bottom) + (returning ? 40 : 23);
      return `M ${mobile.cx} ${mobile.bottom} L ${mobile.cx} ${y - 12} Q ${mobile.cx} ${y} ${mobile.cx + 12} ${y} L ${api.cx - 12} ${y} Q ${api.cx} ${y} ${api.cx} ${y - 12} L ${api.cx} ${api.bottom}`;
    }
    const source = client === "mobile" ? mobile : pwa;
    const request = route(source, false),
      response = route(source, true);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const color =
      scenario === "conflict" && index >= 5
        ? "var(--qc-amber)"
        : "var(--qc-emerald)";
    svg.innerHTML = `<defs><marker id="wf-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--qc-skyLaser)"/></marker></defs><path class="wf-wire wf-wire-halo" d="${request}"/><path id="wf-outbound" class="wf-wire wf-wire-request" d="${request}" marker-end="url(#wf-arrow)"/><path id="wf-inbound" class="wf-wire wf-wire-response" d="${response}" style="stroke:${color}"/>${!motion.matches ? `<circle class="wf-packet" r="4" fill="var(--qc-skyLaser)"><animateMotion dur="${2.4 / speed}s" repeatCount="indefinite"><mpath href="#wf-outbound"/></animateMotion></circle><circle class="wf-packet" r="3.5" fill="${color}"><animateMotion dur="${2.8 / speed}s" keyPoints="1;0" keyTimes="0;1" calcMode="linear" repeatCount="indefinite"><mpath href="#wf-inbound"/></animateMotion></circle>` : ""}`;
    if (!playing || motion.matches) svg.pauseAnimations();
    else svg.unpauseAnimations();
  }
  function render() {
    const step = steps[index],
      outcome = scenarios[scenario];
    host.dataset.client = client;
    host.dataset.scenario = scenario;
    host.dataset.playing = String(playing);
    host.dataset.step = String(index);
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
      : completed
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
    for (const button of host.querySelectorAll("[data-wf-client]"))
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.wfClient === client),
      );
    for (const button of host.querySelectorAll("[data-wf-scenario]"))
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.wfScenario === scenario),
      );
    q('[data-wf-status="mobile"]').textContent =
      client === "mobile" ? step.client : "Disponible en móvil";
    q('[data-wf-status="pwa"]').textContent =
      client === "pwa" ? step.client : "Disponible en PWA";
    q('[data-wf-status="api"]').textContent = step.api;
    q('[data-wf-status="data"]').textContent = step.data;
    if (index >= 5 && scenario === "conflict") {
      q('[data-wf-status="' + client + '"]').textContent = "Resolver conflicto";
      q('[data-wf-status="api"]').textContent = "Devolver conflicto";
      q('[data-wf-status="data"]').textContent = "Sin mutación parcial";
    } else if (index >= 5 && scenario === "replay") {
      q('[data-wf-status="api"]').textContent = "Recuperar resultado original";
      q('[data-wf-status="data"]').textContent = "Sin doble conteo";
    }
    q("#wf-response-state").textContent =
      index >= 5 ? outcome.outcome : "Operación propia";
    q("#wf-request").textContent = step.request;
    q("#wf-request-kind").textContent =
      client === "mobile" ? "MÓVIL ↔ SERVICIOS" : "PWA ↔ SERVICIOS";
    q("#wf-step-detail").innerHTML =
      `<span class="eyebrow">${String(index + 1).padStart(2, "0")} / ${escape(step.title)}</span><h2>${step.label}</h2><p>${step.description}</p><h3>Regla de la operación</h3><p>${step.rule}</p><div class="wf-outcome"><span class="tag ${scenario === "conflict" ? "pending" : "good"}">${escape(outcome.outcome)}</span><p>${outcome.text}</p></div><a href="index.html#documento?src=${encodeURIComponent(step.source)}">Consultar contrato y reglas →</a>`;
    q("#wf-previous").disabled = index === 0;
    q("#wf-next").disabled = index === 7;
    history.replaceState(
      null,
      "",
      "#workflow?" +
        new URLSearchParams({
          paso: index,
          cliente: client,
          escenario: scenario,
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
    index = 0;
    completed = false;
    playing = true;
    render();
    schedule();
  }
  for (const button of host.querySelectorAll("[data-wf-run]"))
    button.onclick = () => run(button.dataset.wfRun);
  q("#wf-play").onclick = () => {
    if (completed || index === 7) {
      run(client);
      return;
    }
    playing = !playing;
    render();
    schedule();
  };
  q("#wf-reset").onclick = () => select(0);
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
