// API simulada para las capturas: datos 100 % ficticios, determinísticos y sin red.
// Responde solo a http://localhost:3000/api/v1/* con el contrato de packages/contracts.

export const NOW_ISO = "2026-11-26T15:30:00.000Z"; // 09:30 en Ciudad de México
export const TODAY = "2026-11-26";
export const ZONE = "America/Mexico_City";
export const DEMO_EMAIL = "sofia.ramirez@example.com"; // dominio reservado (RFC 2606)
export const DEMO_NAME = "Sofía Ramírez";

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
// JWT de forma válida pero ficticio: sin firma real, no corresponde a ningún servicio.
export const FAKE_JWT = [
  b64u({ alg: "none", typ: "JWT" }),
  b64u({
    sub: "00000000-0000-4000-8000-000000000001",
    email: DEMO_EMAIL,
    name: DEMO_NAME,
    preferred_username: "sofia.demo",
    email_verified: true,
    realm_access: { roles: ["user"] },
    exp: Math.floor(Date.parse("2027-12-31T00:00:00Z") / 1000),
  }),
  "firma-demo",
].join(".");

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const addDays = (date, n) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const HABITS = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Tomar agua", targetValue: 8, unit: "vasos", todayValue: 5, rate: 0.9 },
  { id: "22222222-2222-4222-8222-222222222222", name: "Leer", targetValue: 30, unit: "min", todayValue: 20, rate: 0.8 },
  { id: "33333333-3333-4333-8333-333333333333", name: "Caminar", targetValue: 6000, unit: "pasos", todayValue: 4200, rate: 0.75 },
  { id: "44444444-4444-4444-8444-444444444444", name: "Meditar", targetValue: 10, unit: "min", todayValue: 0, rate: 0.7 },
];

export function createState() {
  const habits = HABITS.map((h, i) => ({
    id: h.id, name: h.name, targetValue: h.targetValue, unit: h.unit,
    schedule: { weekdays: [1, 2, 3, 4, 5, 6, 7], effectiveFrom: addDays(TODAY, -40) },
    timeZone: ZONE, status: "active", version: 1,
    createdAt: "2026-10-17T15:00:00Z", updatedAt: "2026-10-17T15:00:00Z",
  }));
  const checkIns = []; // { habitId, ...CheckIn }
  HABITS.forEach((h, hi) => {
    const rnd = mulberry32(1000 + hi * 77);
    for (let off = 40; off >= 1; off--) {
      const date = addDays(TODAY, -off);
      // Las últimas 9-12 jornadas son consecutivas para mostrar rachas.
      const forced = off <= 9 + hi * 1;
      const roll = rnd();
      let value;
      if (forced || roll < h.rate) value = h.targetValue * (1 + Math.round(rnd() * 3) / 20);
      else if (roll < h.rate + 0.12) value = Math.round(h.targetValue * (0.4 + rnd() * 0.4));
      else continue;
      checkIns.push(makeCheckIn(h.id, date, Math.round(value), h.targetValue));
    }
    if (h.todayValue > 0) checkIns.push(makeCheckIn(h.id, TODAY, h.todayValue, h.targetValue));
  });
  return { habits, checkIns, evidence: [], profile: { displayName: DEMO_NAME, email: DEMO_EMAIL } };
}

let seq = 0;
function makeCheckIn(habitId, businessDate, value, target) {
  seq += 1;
  return {
    id: `c0000000-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    habitId, clientEventId: `e0000000-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    businessDate, occurredAt: `${businessDate}T18:00:00.000Z`, recordedAt: `${businessDate}T18:00:01.000Z`,
    timeZone: ZONE, value, version: 1,
    progressStatus: value <= 0 ? "zero" : value >= target ? "completed" : "partial",
  };
}

function metrics(state, habitId, from, to) {
  const habit = state.habits.find((h) => h.id === habitId);
  const days = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  const byDate = new Map(state.checkIns.filter((c) => c.habitId === habitId).map((c) => [c.businessDate, c]));
  const done = (d) => byDate.get(d)?.progressStatus === "completed";
  const completed = days.filter(done).length;
  let current = 0;
  for (let d = to; d >= from; d = addDays(d, -1)) {
    if (done(d)) current++; else if (d === to) continue; else break;
  }
  let longest = 0, run = 0;
  for (const d of days) { run = done(d) ? run + 1 : 0; longest = Math.max(longest, run); }
  return {
    habitId, from, to, timeZone: ZONE, ruleVersion: "demo-1", calculatedAt: NOW_ISO,
    eligiblePeriods: days.length, completedPeriods: completed,
    completionRate: days.length ? Math.round((completed / days.length) * 1000) / 10 : null,
    currentStreak: current, longestStreak: longest, noDataReason: null,
  };
}

const json = (status, body, headers = {}) => ({
  status, contentType: "application/json", body: JSON.stringify(body),
  headers: { "access-control-allow-origin": "*", "access-control-expose-headers": "etag", ...headers },
});

/** Instala la API simulada en un contexto de Playwright. Devuelve el estado y los hosts bloqueados. */
export async function installMockApi(context, log = () => {}) {
  const state = createState();
  const blocked = new Set();
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const isDevServer = url.hostname === "127.0.0.1" && url.port === "5173";
    const isApi = url.hostname === "localhost" && url.port === "3000" && url.pathname.startsWith("/api/v1/");
    if (isDevServer) return route.continue();
    if (!isApi) { blocked.add(url.origin); return route.abort(); }
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });

    const path = url.pathname.replace("/api/v1", "");
    const method = route.request().method();
    const body = route.request().postData() ? JSON.parse(route.request().postData()) : {};
    let m;
    if (method === "POST" && path === "/workspace/auth/login")
      return route.fulfill(json(200, { access_token: FAKE_JWT, refresh_token: undefined, id_token: FAKE_JWT, profile: { id: "00000000-0000-4000-8000-000000000001", displayName: DEMO_NAME, email: DEMO_EMAIL, timeZone: ZONE } }));
    if (path === "/me") return route.fulfill(json(200, { id: "00000000-0000-4000-8000-000000000001", timeZone: ZONE, roles: ["user"], status: "active" }));
    if (path === "/workspace/profile") {
      if (method === "POST") Object.assign(state.profile, body);
      return route.fulfill(json(200, { ...state.profile, timeZone: ZONE }));
    }
    if (path === "/workspace/evidence") {
      if (method === "POST") { const ev = { id: `ev-${state.evidence.length + 1}`, ownerId: "demo", createdAt: NOW_ISO, ...body }; state.evidence.push(ev); return route.fulfill(json(201, ev)); }
      return route.fulfill(json(200, state.evidence));
    }
    if (method === "GET" && path === "/habits") return route.fulfill(json(200, { items: state.habits, nextCursor: null }));
    if (method === "POST" && path === "/habits") {
      const h = { id: `5555555${state.habits.length}-5555-4555-8555-555555555555`, ...body, status: "active", version: 1, createdAt: NOW_ISO, updatedAt: NOW_ISO };
      state.habits.push(h); return route.fulfill(json(201, h, { etag: '"1"' }));
    }
    if ((m = path.match(/^\/habits\/([^/]+)$/)) && method === "PATCH") {
      const h = state.habits.find((x) => x.id === m[1]); Object.assign(h, body, { version: h.version + 1, updatedAt: NOW_ISO });
      return route.fulfill(json(200, h, { etag: `"${h.version}"` }));
    }
    if ((m = path.match(/^\/habits\/([^/]+)\/check-ins$/))) {
      if (method === "POST") {
        const habit = state.habits.find((x) => x.id === m[1]);
        const existing = state.checkIns.find((c) => c.habitId === m[1] && c.businessDate === body.businessDate);
        if (existing) { existing.value = body.value; existing.version += 1; existing.progressStatus = body.value <= 0 ? "zero" : body.value >= habit.targetValue ? "completed" : "partial"; return route.fulfill(json(200, existing)); }
        const ci = makeCheckIn(m[1], body.businessDate, body.value, habit.targetValue); state.checkIns.push(ci); return route.fulfill(json(201, ci));
      }
      const from = url.searchParams.get("from"), to = url.searchParams.get("to");
      return route.fulfill(json(200, { items: state.checkIns.filter((c) => c.habitId === m[1] && c.businessDate >= from && c.businessDate <= to).sort((a, b) => a.businessDate.localeCompare(b.businessDate)), nextCursor: null }));
    }
    if ((m = path.match(/^\/habits\/([^/]+)\/metrics$/)))
      return route.fulfill(json(200, metrics(state, m[1], url.searchParams.get("from"), url.searchParams.get("to"))));
    log(`API simulada sin ruta: ${method} ${path}`);
    return route.fulfill(json(404, { code: "DEMO_NO_ROUTE", title: "Ruta no simulada" }));
  });
  return { state, blocked };
}
