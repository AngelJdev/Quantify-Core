/* Mapa documental: ninguna interacción realiza operaciones de negocio. */
(() => {
  const records = {
    usuario: {
      kind: "Rol humano · Usuario final",
      title: "Usuario final",
      purpose:
        "Persona que organiza sus hábitos, registra avances y consulta información propia desde la web React o la aplicación Flutter.",
      context: [
        "Decide sobre su rutina",
        "La identidad procede de Keycloak/OIDC. La API determina el propietario desde la sesión y comprueba cada recurso solicitado. Wear OS es una integración posterior por fases.",
      ],
      responsibilities: [
        "Crear hábitos con título, meta, unidad, frecuencia semanal y zona de agenda; revisar los datos antes de guardar.",
        "Editar, pausar o archivar hábitos propios. Pausar y archivar conservan el historial.",
        "Registrar el valor acumulado absoluto del día y corregirlo con trazabilidad, sin sumar otra vez un reintento.",
        "Consultar progreso, calendario, historial y rachas indicando el periodo y la zona de cálculo.",
        "Configurar recordatorios y revisar las finalidades opcionales de uso de datos.",
        "Pedir ayuda al asistente, revisar un borrador y confirmar antes de que se cree un hábito, cuando el servicio esté disponible.",
      ],
      limits: [
        "Solo puede consultar y modificar recursos propios; conocer un identificador ajeno no concede acceso.",
        "No administra cuentas ajenas, catálogos globales, permisos ni configuración operativa.",
        "Aceptar una sugerencia no autoriza nuevas finalidades de biometría o entrenamiento.",
        "Una respuesta del asistente no confirma persistencia; la operación debe pasar por la API.",
      ],
      data: "Perfil, zona horaria, hábitos, registros y resultados propios. La captura opcional de señales requiere autorización por finalidad y fuente; rechazarla conserva el núcleo manual.",
      states: [
        "Pendiente: el cliente aún no tiene confirmación del servidor.",
        "Sincronizado: la API confirmó la operación.",
        "Conflicto: hay una revisión más reciente; se debe recargar o resolver.",
        "Fallido: se informa la causa y se permite reintentar sin duplicar.",
      ],
      flowTitle: "Ejemplo · Registrar una sesión de lectura",
      flow: [
        "La persona abre su hábito y declara 15 minutos acumulados para la fecha de negocio correspondiente.",
        "El cliente envía el valor absoluto, la revisión conocida y una clave idempotente.",
        "La API valida sesión, pertenencia, agenda y revisión. Un reintento idéntico devuelve el mismo resultado.",
        "La interfaz muestra la confirmación o el conflicto; las métricas del periodo se obtienen con las reglas compartidas.",
      ],
      status:
        "El contrato del primer recorrido cubre perfil propio, hábitos, check-ins y métricas en borrador. La integración de cada cliente se verifica en su módulo; el asistente y Wear OS no se consideran implementados por aparecer en este mapa.",
      sources: [
        ["RF-01 a RF-05", "../requerimientos/catalogo.md"],
        ["Reglas de progreso", "../requerimientos/reglas-negocio.md"],
        ["Contrato del primer flujo", "../../packages/contracts/README.md"],
      ],
    },
    servicios: {
      kind: "Componente técnico · No es un tercer rol humano",
      title: "Sistema y servicios",
      purpose:
        "Capa que aplica permisos y reglas de negocio, conserva registros coherentes y entrega resultados autorizados a los clientes.",
      context: [
        "La API es la autoridad de negocio",
        "NestJS coordina el dominio y PostgreSQL conserva la verdad transaccional. Keycloak gestiona la identidad. FastAPI se mantiene como base de analítica; su participación en el asistente requiere definición.",
      ],
      responsibilities: [
        "Validar la identidad emitida por Keycloak y comprobar permisos y pertenencia en cada operación.",
        "Validar datos contra los contratos compartidos, sin mantener DTO incompatibles por cliente.",
        "Aplicar fecha de negocio y zona de agenda; conservar versiones de reglas y configuración efectiva.",
        "Deduplicar reintentos mediante idempotencia y detectar actualizaciones concurrentes con revisiones.",
        "Calcular métricas de oportunidades cerradas dentro del periodo solicitado; conservar evidencia de correcciones.",
        "Ejecutar trabajos y entregar avisos solo con autorización vigente. Los adaptadores y políticas pendientes deben resolverse antes de habilitarlos.",
      ],
      limits: [
        "Cada servicio usa una identidad técnica y permisos mínimos; no dispone de lectura libre de todas las bases.",
        "No procesa señales o contexto para finalidades revocadas ni las utiliza como permiso implícito de entrenamiento.",
        "El asistente no inventa rachas, check-ins ni métricas y no guarda hábitos sin confirmación explícita.",
        "Redis no es el único respaldo de una operación. Una proyección de eventos no reemplaza el resultado transaccional.",
      ],
      data: "PostgreSQL: registros de negocio. MongoDB: eventos o telemetría según necesidad y contrato. Redis: caché y coordinación. Logs y trazas deben minimizar datos y excluir secretos, tokens y biometría en crudo.",
      states: [
        "Identidad o permiso inválido: rechazar el acceso.",
        "Reintento idéntico: devolver el resultado existente.",
        "Clave reutilizada con otro contenido o revisión obsoleta: señalar conflicto.",
        "Asistente no disponible: conservar el formulario manual de hábitos.",
      ],
      flowTitle: "Ejemplo previsto · Del mensaje a un hábito confirmado",
      flow: [
        "El usuario pide ayuda para crear una rutina dentro de Quantify.",
        "El asistente solicita la información que falta y prepara un borrador con contexto mínimo autorizado.",
        "El usuario revisa y confirma. Cancelar no guarda ni acepta la propuesta.",
        "La API valida y persiste el hábito; confirmar dos veces debe producir un solo resultado. El contrato conversacional sigue pendiente.",
      ],
      status:
        "La base NestJS y el primer recorrido tienen evidencia local en sus módulos. La telemetría conserva su alcance sintético. No se acredita despliegue productivo, integración general, scheduler ni asistente. D-04, D-05 y D-07 conservan decisiones abiertas.",
      sources: [
        ["Componentes y límites", "../arquitectura/componentes.md"],
        ["Contratos compartidos", "../../packages/contracts/README.md"],
        ["Asistente conversacional", "../datos-ia/asistente-conversacional.md"],
        ["Decisiones pendientes", "../arquitectura/decisiones-pendientes.md"],
      ],
    },
    administracion: {
      kind: "Rol humano · Administración",
      title: "Administración",
      purpose:
        "Persona autorizada para gestionar el catálogo, el estado de cuentas y la operación mediante permisos explícitos y acciones auditables.",
      context: [
        "Supervisa la plataforma, con límites",
        "El acceso administrativo depende de la función y del recurso. Abrir una pantalla de administración no habilita la consulta de información privada ni la ejecución de cualquier comando.",
      ],
      responsibilities: [
        "Gestionar plantillas y categorías globales con control de versiones; los hábitos ya creados conservan su configuración.",
        "Gestionar el estado de cuentas dentro del permiso concedido y registrar motivo y actor de cada cambio.",
        "Consultar indicadores operativos agregados y autorizados, como errores, latencia o estado de servicios.",
        "Revisar evidencia de auditoría minimizada para investigar cambios operativos sin exponer datos personales.",
        "Aplicar el mínimo privilegio y las condiciones de protección de cuentas privilegiadas definidas por el equipo.",
      ],
      limits: [
        "No accede por defecto a hábitos, check-ins, biometría, recomendaciones ni conversaciones privadas.",
        "No modifica rutinas personales ni registra progreso en nombre de otra persona por ser administrador.",
        "No obtiene permiso para entrenar modelos o enviar contexto privado a proveedores externos.",
        "Suscripciones, facturación, reentrenamiento y predicciones no se incorporan al alcance por aparecer en antecedentes académicos.",
      ],
      data: "Catálogo global, estado de cuentas según permiso y métricas agregadas. El diseño de los agregados debe impedir identificar individuos. La auditoría y los accesos excepcionales requieren políticas y permisos propios.",
      states: [
        "Acción sin permiso: denegada por la API.",
        "Cambio de catálogo: nueva versión; no modifica hábitos existentes.",
        "Cambio de estado de cuenta: requiere motivo y auditoría.",
        "Gestión privilegiada: probar protección del último administrador habilitado.",
      ],
      flowTitle: "Ejemplo previsto · Actualizar una plantilla del catálogo",
      flow: [
        "La persona administradora accede con su identidad y permiso para gestionar el catálogo.",
        "Revisa la plantilla, modifica la propuesta y aporta el motivo de la acción.",
        "La API comprueba la autorización, registra la nueva versión y la evidencia de auditoría.",
        "Los hábitos personales existentes conservan la versión que incorporaron; el cambio no permite abrirlos ni reescribirlos.",
      ],
      status:
        "RF-09 describe la administración prevista. El contrato del primer recorrido no incluye endpoints administrativos. D-11 debe cerrar permisos y privacidad de agregados; D-09, las políticas de datos. Esta ficha no acredita un panel operativo implementado.",
      sources: [
        ["Actores y permisos", "../requerimientos/README.md"],
        ["Seguridad", "../seguridad/README.md"],
        ["Reglas RN-P23 y RN-P24", "../requerimientos/reglas-negocio.md"],
        ["Decisiones D-09 y D-11", "../arquitectura/decisiones-pendientes.md"],
      ],
    },
  };
  const features = [
    [
      "Hábitos a tu medida",
      "RF-03 · Usuario + API",
      "El usuario define meta, unidad y días de la semana. La API valida y conserva versiones; pausar o archivar mantiene los registros anteriores.",
    ],
    [
      "Progreso sin duplicados",
      "RF-04 · Usuario + API",
      "El usuario declara un valor acumulado por día. La API verifica fecha, pertenencia e idempotencia y devuelve una confirmación o un conflicto.",
    ],
    [
      "Historial con contexto",
      "RF-05 · Usuario + API",
      "El usuario consulta calendario, tendencias y rachas propias. El sistema aplica un periodo explícito y las reglas de oportunidades cerradas.",
    ],
    [
      "Recordatorios configurables",
      "RF-06 · Capacidad prevista",
      "El usuario elige horarios y preferencias. El sistema deberá respetar permisos y cambios de agenda; scheduler y canales de entrega requieren definición.",
    ],
    [
      "Ayuda para crear hábitos",
      "RF-07 · Asistente pendiente",
      "El asistente conversa y prepara un borrador revisable. Solo la confirmación del usuario guarda mediante la API; el formulario manual sigue disponible.",
    ],
  ];
  const matrix = [
    [
      "Consultar perfil y preferencias",
      "Consulta su perfil",
      "Verifica identidad y pertenencia",
      "Sin acceso general al perfil privado",
    ],
    [
      "Crear y editar hábitos",
      "Gestiona hábitos propios",
      "Valida, versiona y persiste",
      "Sin acceso",
    ],
    [
      "Pausar o archivar hábitos",
      "Decide sobre su rutina",
      "Conserva historial y aplica vigencia",
      "Sin acceso",
    ],
    [
      "Registrar o corregir progreso",
      "Declara valores propios",
      "Deduplica y audita correcciones",
      "Sin acceso",
    ],
    [
      "Consultar historial y rachas",
      "Consulta resultados propios",
      "Calcula según periodo y reglas",
      "Sin acceso",
    ],
    [
      "Configurar recordatorios",
      "Define preferencias propias",
      "Entrega autorizada · pendiente",
      "Sin acceso a avisos privados",
    ],
    [
      "Gestionar consentimientos",
      "Autoriza o revoca finalidades propias",
      "Verifica vigencia y detiene la finalidad revocada",
      "No concede consentimiento ajeno",
    ],
    [
      "Conversar y revisar un borrador",
      "Solicita, edita o descarta",
      "Asistente conversacional · pendiente",
      "Sin acceso a conversaciones",
    ],
    [
      "Confirmar un hábito sugerido",
      "Confirma explícitamente",
      "Valida y guarda sin duplicar · integración pendiente",
      "Sin acceso",
    ],
    [
      "Gestionar catálogo global",
      "Usa plantillas disponibles",
      "Valida permiso y conserva versiones",
      "Gestiona con permiso y auditoría",
    ],
    [
      "Gestionar estado de cuentas",
      "Sin permiso administrativo",
      "Autoriza y registra motivo",
      "Actúa según permiso concedido",
    ],
    [
      "Consultar operación y auditoría",
      "Sin permiso administrativo",
      "Emite evidencia técnica minimizada",
      "Consulta agregados y auditoría autorizados",
    ],
  ];
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function list(items, tag = "ul") {
    const node = element(tag);
    node.append(...items.map((item) => element("li", "", item)));
    return node;
  }
  const featureHost = document.querySelector("#roles-features");
  features.forEach(([title, ref, text], index) => {
    const row = element("article", "feature-row");
    const heading = element("div");
    heading.append(element("h3", "", title), element("small", "", ref));
    row.append(
      element("span", "feature-number", String(index + 1).padStart(2, "0")),
      heading,
      element("p", "", text),
    );
    featureHost.append(row);
  });
  const matrixHost = document.querySelector("#roles-matrix");
  matrix.forEach(([action, ...columns]) => {
    const row = element("tr");
    const heading = element("th", "", action);
    heading.scope = "row";
    row.append(heading);
    columns.forEach((text) => {
      const cell = element("td");
      cell.append(
        element(
          "span",
          /^(Sin acceso|Sin permiso)/.test(text) ? "permission-no" : "",
          text,
        ),
      );
      row.append(cell);
    });
    matrixHost.append(row);
  });

  const root = document.documentElement;
  const page = document.querySelector(".roles-page");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const motionToggle = document.querySelector("#roles-motion-toggle");
  let motionPaused = false;
  const canAnimate = () => !reducedMotion.matches && !motionPaused;
  function updateMotion() {
    root.dataset.rolesMotion = canAnimate() ? "running" : "paused";
    motionToggle.disabled = reducedMotion.matches;
    motionToggle.setAttribute("aria-pressed", String(!canAnimate()));
    motionToggle.firstElementChild.textContent = canAnimate() ? "Ⅱ" : "▷";
    motionToggle.lastElementChild.textContent = reducedMotion.matches
      ? "Movimiento reducido"
      : motionPaused
        ? "Reanudar animaciones"
        : "Pausar animaciones";
    if (!canAnimate())
      document
        .querySelector("#detail-body")
        .getAnimations()
        .forEach((animation) => animation.cancel());
  }
  motionToggle.addEventListener("click", () => {
    motionPaused = !motionPaused;
    updateMotion();
  });
  reducedMotion.addEventListener("change", updateMotion);
  updateMotion();

  // No bucle de renderizado: el fondo compartido y los flujos usan CSS.
  // El progreso solo se actualiza al desplazarse; el brillo solo con el puntero.
  const progress = document.querySelector(".roles-progress");
  let progressFrame = 0;
  function updateProgress() {
    if (progressFrame) return;
    progressFrame = requestAnimationFrame(() => {
      const range = root.scrollHeight - innerHeight;
      progress.style.setProperty(
        "--roles-progress",
        `${range > 0 ? Math.min(100, (scrollY / range) * 100) : 0}%`,
      );
      progressFrame = 0;
    });
  }
  addEventListener("scroll", updateProgress, { passive: true });
  addEventListener("resize", updateProgress);
  updateProgress();
  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        reveal.unobserve(entry.target);
      }),
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(
      ".roles-hero, .roles-panel, .roles-scope, .feature-row, .role-node",
    )
    .forEach((target) => {
      target.classList.add("roles-reveal");
      if (target.matches(".role-node"))
        target.style.setProperty(
          "--reveal-delay",
          `${[...target.parentElement.children].indexOf(target) * 80}ms`,
        );
      reveal.observe(target);
    });
  let mapVisible = true;
  const updateIdle = () =>
    root.classList.toggle("roles-motion-idle", document.hidden || !mapVisible);
  new IntersectionObserver(([entry]) => {
    mapVisible = entry.isIntersecting;
    updateIdle();
  }).observe(document.querySelector(".roles-map"));
  document.addEventListener("visibilitychange", updateIdle);

  const dialog = document.querySelector("#role-dialog");
  const body = document.querySelector("#detail-body");
  const close = document.querySelector("#detail-close");
  let trigger = null;
  let hovered = null;
  let focused = null;
  let closeTimer = 0;
  function paintRelations() {
    const active = dialog.open ? body.dataset.actor : hovered || focused;
    page.dataset.active = active || "";
    document
      .querySelectorAll("[data-node]")
      .forEach((node) =>
        node.classList.toggle("is-active", node.dataset.node === active),
      );
    document
      .querySelectorAll("[data-flow]")
      .forEach((flow) =>
        flow.classList.toggle(
          "is-related",
          !!active && flow.dataset.flow.split(" ").includes(active),
        ),
      );
  }
  function showRecord(id) {
    const record = records[id];
    if (!record) return;
    body.dataset.actor = id;
    const title = element("h2", "", record.title);
    title.id = "detail-title";
    const purpose = element("p", "detail-purpose", record.purpose);
    purpose.id = "detail-purpose";
    const context = element("p", "detail-context");
    context.append(
      element("strong", "", record.context[0]),
      document.createTextNode(record.context[1]),
    );
    const grid = element("div", "detail-grid");
    [
      ["Responsabilidades principales", record.responsibilities],
      ["Límites de acceso", record.limits],
      ["Datos y alcance", record.data],
      ["Controles y estados esperados", record.states],
    ].forEach(([label, content]) => {
      const section = element("section");
      section.append(
        element("h3", "", label),
        Array.isArray(content) ? list(content) : element("p", "", content),
      );
      grid.append(section);
    });
    const flow = element("section", "detail-flow");
    flow.append(element("h3", "", record.flowTitle), list(record.flow, "ol"));
    const evidence = element("section", "detail-evidence");
    const sources = element("nav");
    sources.setAttribute("aria-label", "Fuentes de la ficha");
    record.sources.forEach(([label, path]) => {
      const link = element("a", "", label + " ↗");
      link.href = path;
      sources.append(link);
    });
    evidence.append(
      element("h3", "", "Estado y trazabilidad"),
      element("p", "", record.status),
      sources,
    );
    body.replaceChildren(
      element("span", "roles-status", record.kind),
      title,
      purpose,
      context,
      grid,
      flow,
      evidence,
    );
    document
      .querySelectorAll("[data-detail]")
      .forEach((button) =>
        button.setAttribute(
          "aria-current",
          String(button.dataset.detail === id),
        ),
      );
    dialog.scrollTop = 0;
    body.getAnimations().forEach((animation) => animation.cancel());
    if (dialog.open && canAnimate())
      body.animate(
        [
          { opacity: 0.4, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
    paintRelations();
  }
  function closeDialog() {
    if (!dialog.open || dialog.classList.contains("is-closing")) return;
    if (!canAnimate()) {
      dialog.close();
      return;
    }
    body.getAnimations().forEach((animation) => animation.cancel());
    dialog.classList.add("is-closing");
    // El plazo cubre una animación interrumpida por un cambio de preferencia.
    closeTimer = setTimeout(() => {
      if (dialog.open) dialog.close();
    }, 180);
  }
  dialog.addEventListener("animationend", (event) => {
    if (
      event.target === dialog &&
      event.animationName === "roles-dialog-out" &&
      dialog.open
    )
      dialog.close();
  });
  document.querySelectorAll("[data-node]").forEach((button) =>
    button.addEventListener("click", () => {
      trigger = button;
      showRecord(button.dataset.node);
      dialog.showModal();
      dialog.scrollTop = 0;
      close.focus({ preventScroll: true });
      paintRelations();
    }),
  );
  document.querySelectorAll("[data-node]").forEach((button) => {
    button.addEventListener("pointerenter", () => {
      hovered = button.dataset.node;
      paintRelations();
    });
    button.addEventListener("pointerleave", () => {
      hovered = null;
      paintRelations();
    });
    button.addEventListener("focus", () => {
      focused = button.dataset.node;
      paintRelations();
    });
    button.addEventListener("blur", () => {
      focused = null;
      paintRelations();
    });
    button.addEventListener("pointermove", (event) => {
      if (!canAnimate() || event.pointerType !== "mouse") return;
      const rect = button.getBoundingClientRect();
      button.style.setProperty(
        "--pointer-x",
        `${((event.clientX - rect.left) / rect.width) * 100}%`,
      );
      button.style.setProperty(
        "--pointer-y",
        `${((event.clientY - rect.top) / rect.height) * 100}%`,
      );
    });
  });
  document
    .querySelectorAll("[data-detail]")
    .forEach((button) =>
      button.addEventListener("click", () => showRecord(button.dataset.detail)),
    );
  close.addEventListener("click", closeDialog);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      closeDialog();
  });
  dialog.addEventListener("close", () => {
    clearTimeout(closeTimer);
    dialog.classList.remove("is-closing");
    trigger?.focus({ preventScroll: true });
    paintRelations();
  });
})();
