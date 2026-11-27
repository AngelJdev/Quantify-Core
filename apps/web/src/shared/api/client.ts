import type {
  CheckIn,
  CheckInCommand,
  CheckInList,
  Habit,
  HabitCreate,
  HabitList,
  HabitPatch,
  Metrics,
  Problem,
  Profile,
} from "./schema";

export type OidcAuthMode =
  | "login"
  | "register"
  | "google"
  | "forgot-password"
  | "verify-email";

export type OidcUserSession = {
  subject: string;
  email: string;
  displayName: string;
  username: string;
  emailVerified: boolean;
  roles: Array<"user" | "admin">;
  provider: "keycloak" | "google";
  expiresAt: number;
};

export type EvidenceRecord = {
  id: string;
  ownerId: string;
  habitId: string;
  habitName: string;
  businessDate: string;
  value: number;
  unit: string;
  note: string;
  mood: string;
  energyLevel: number;
  imageDataUrl?: string;
  createdAt: string;
};

export type HybridAuditResponse = {
  hybridStats: {
    postgresConnected: boolean;
    postgresEngine: string;
    mongoConnected: boolean;
    mongoEngine: string;
    sqlHabitRevisions: number;
    sqlCheckInRevisions: number;
    sqlIdempotencyReceipts: number;
    mongoAuditDocuments: number;
    mongoEvidenceDocuments: number;
    mongoAiInteractions: number;
  };
  events: Array<{
    id: string;
    engine: "PostgreSQL" | "MongoDB";
    action: string;
    category: "auth" | "habit" | "checkin" | "profile" | "ai" | "security";
    summary: string;
    ownerId: string;
    email?: string;
    metadata?: Record<string, unknown>;
    integrityHash: string;
    createdAt: string;
  }>;
};

export type AiInsightsResponse = {
  provider: string;
  archetype: string;
  burnoutRisk: string;
  energyScore: number;
  summary: string;
  recommendations: Array<{
    id: string;
    name: string;
    targetValue: number;
    unit: string;
    detail: string;
    intention: string;
    color: "blue" | "cyan" | "emerald";
    icon: string;
    confidence: number;
    aiReason: string;
  }>;
};

type TokenMemory = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  session: OidcUserSession;
};

type PendingHandshake = {
  verifier: string;
  state: string;
  nonce: string;
  mode: OidcAuthMode;
  createdAt: number;
};

const HANDSHAKE_STORAGE_KEY = "qc_oidc_pkce_handshake";
const SESSION_META_STORAGE_KEY = "qc_active_user_session_v1";

let activeTokens: TokenMemory | null = null;

export function saveSession(session: OidcUserSession): void {
  activeTokens = {
    accessToken: activeTokens?.accessToken || "session-active",
    refreshToken: activeTokens?.refreshToken,
    idToken: activeTokens?.idToken,
    session,
  };
  try {
    localStorage.setItem(SESSION_META_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore storage errors
  }
}

export function loadSession(): OidcUserSession | null {
  if (activeTokens?.session) return activeTokens.session;
  try {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(SESSION_META_STORAGE_KEY)
        : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OidcUserSession;
    if (parsed && parsed.email && parsed.expiresAt > Date.now()) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function getOidcIssuer(): string {
  const configured = (
    import.meta.env.VITE_OIDC_ISSUER as string | undefined
  )?.trim();
  return (configured || "http://localhost:8180/realms/quantify").replace(
    /\/+$/,
    "",
  );
}

export function getOidcClientId(): string {
  const configured = (
    import.meta.env.VITE_OIDC_CLIENT_ID as string | undefined
  )?.trim();
  return configured || "quantify-web";
}

export function getApiBaseUrl(): string {
  const configured = (
    import.meta.env.VITE_API_BASE_URL as string | undefined
  )?.trim();
  return (configured || "http://localhost:3000/api/v1").replace(/\/+$/, "");
}

export function getMailpitUrl(): string {
  return "http://localhost:8025";
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createPkcePair(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  const verifier = toBase64Url(random);
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const challenge = toBase64Url(new Uint8Array(digest));
  return { verifier, challenge };
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length < 2) throw new Error("JWT inválido");
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const json = new TextDecoder().decode(
    Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)),
  );
  return JSON.parse(json) as Record<string, unknown>;
}

export function getActiveSession(): OidcUserSession | null {
  return activeTokens?.session ?? null;
}

export function setDirectTokensSession(
  accessToken: string,
  refreshToken: string | undefined,
  idToken: string | undefined,
  provider: "keycloak" | "google" = "keycloak",
  overrideDisplayName?: string,
  overrideEmail?: string,
): OidcUserSession {
  const session = buildSessionFromTokens(
    accessToken,
    idToken,
    provider === "google" ? "google" : "login",
  );
  if (overrideDisplayName) session.displayName = overrideDisplayName;
  if (overrideEmail) session.email = overrideEmail;
  activeTokens = {
    accessToken,
    refreshToken,
    idToken,
    session,
  };
  saveSession(session);
  return session;
}

export function hasPendingOidcHandshake(stateParam: string | null): boolean {
  if (!stateParam) return false;
  try {
    const raw = sessionStorage.getItem(HANDSHAKE_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as PendingHandshake;
    return Boolean(parsed?.state && parsed.state === stateParam);
  } catch {
    return false;
  }
}

export async function startOidcFlow(
  mode: OidcAuthMode,
  options?: { loginHint?: string; useGoogleIdpHint?: boolean },
): Promise<void> {
  const { verifier, challenge } = await createPkcePair();
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  const handshake: PendingHandshake = {
    verifier,
    state,
    nonce,
    mode,
    createdAt: Date.now(),
  };
  sessionStorage.setItem(HANDSHAKE_STORAGE_KEY, JSON.stringify(handshake));

  const issuer = getOidcIssuer();
  const endpoint =
    mode === "register"
      ? `${issuer}/protocol/openid-connect/registrations`
      : `${issuer}/protocol/openid-connect/auth`;

  const redirectUri = `${window.location.origin}/auth/callback`;
  const params = new URLSearchParams({
    client_id: getOidcClientId(),
    redirect_uri: redirectUri,
    response_type: "code",
    response_mode: "query",
    scope: "openid profile email",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  if (options?.loginHint) {
    params.set("login_hint", options.loginHint);
  }
  if (
    mode === "google" &&
    (options?.useGoogleIdpHint ||
      import.meta.env.VITE_GOOGLE_IDP_ENABLED === "1")
  ) {
    params.set("kc_idp_hint", "google");
  }
  if (mode === "forgot-password") {
    params.set("kc_action", "UPDATE_PASSWORD");
  }
  if (mode === "verify-email") {
    params.set("kc_action", "VERIFY_EMAIL");
  }

  window.location.assign(`${endpoint}?${params.toString()}`);
}

function buildSessionFromTokens(
  accessToken: string,
  idToken: string | undefined,
  mode: OidcAuthMode,
): OidcUserSession {
  const accessPayload = decodeJwtPayload(accessToken);
  const idPayload = idToken ? decodeJwtPayload(idToken) : {};
  const sub = String(accessPayload.sub || idPayload.sub || "usuario");
  const email = String(
    idPayload.email || accessPayload.email || "usuario@quantify.local",
  );
  const username = String(
    idPayload.preferred_username ||
      accessPayload.preferred_username ||
      email.split("@")[0] ||
      "usuario",
  );
  const displayName = String(
    idPayload.name ||
      accessPayload.name ||
      idPayload.given_name ||
      username,
  ).trim();
  const emailVerified = Boolean(
    idPayload.email_verified ?? accessPayload.email_verified ?? true,
  );
  const realmAccess = accessPayload.realm_access as
    | { roles?: unknown[] }
    | undefined;
  const roles: Array<"user" | "admin"> = Array.isArray(realmAccess?.roles)
    ? realmAccess.roles.filter(
        (r): r is "user" | "admin" => r === "user" || r === "admin",
      )
    : ["user"];
  const safeRoles: Array<"user" | "admin"> = roles.length ? roles : ["user"];
  const expSeconds = Number(accessPayload.exp || 0);
  const expiresAt = expSeconds ? expSeconds * 1000 : Date.now() + 300_000;

  return {
    subject: sub,
    email,
    displayName: displayName || username,
    username,
    emailVerified,
    roles: safeRoles,
    provider: mode === "google" ? "google" : "keycloak",
    expiresAt,
  };
}

export async function completeOidcCallback(
  code: string,
  state: string,
): Promise<OidcUserSession> {
  const raw = sessionStorage.getItem(HANDSHAKE_STORAGE_KEY);
  sessionStorage.removeItem(HANDSHAKE_STORAGE_KEY);
  if (!raw) throw new Error("No se encontró una solicitud PKCE activa.");
  const handshake = JSON.parse(raw) as PendingHandshake;
  if (handshake.state !== state) {
    throw new Error("El parámetro state de seguridad no coincide.");
  }

  const issuer = getOidcIssuer();
  const redirectUri = `${window.location.origin}/auth/callback`;
  const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: getOidcClientId(),
      redirect_uri: redirectUri,
      code,
      code_verifier: handshake.verifier,
    }),
  });

  if (!response.ok) {
    throw new Error("El proveedor rechazó el canje del código de autorización.");
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
  };

  if (data.id_token) {
    const idClaims = decodeJwtPayload(data.id_token);
    if (idClaims.nonce && idClaims.nonce !== handshake.nonce) {
      throw new Error("El nonce del token de identidad no coincide.");
    }
  }

  const session = buildSessionFromTokens(
    data.access_token,
    data.id_token,
    handshake.mode,
  );
  activeTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    session,
  };
  return session;
}

export async function refreshOidcSession(): Promise<boolean> {
  if (!activeTokens?.refreshToken) return false;
  try {
    const issuer = getOidcIssuer();
    const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: getOidcClientId(),
        refresh_token: activeTokens.refreshToken,
      }),
    });
    if (!response.ok) {
      return false;
    }
    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
    };
    const session = buildSessionFromTokens(
      data.access_token,
      data.id_token ?? activeTokens.idToken,
      activeTokens.session.provider === "google" ? "google" : "login",
    );
    activeTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? activeTokens.refreshToken,
      idToken: data.id_token ?? activeTokens.idToken,
      session,
    };
    return true;
  } catch {
    return false;
  }
}

export async function logoutOidcSession(): Promise<void> {
  const refresh = activeTokens?.refreshToken;
  activeTokens = null;
  sessionStorage.removeItem(HANDSHAKE_STORAGE_KEY);
  try {
    localStorage.removeItem(SESSION_META_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
  try {
    (
      window as {
        google?: { accounts?: { id?: { disableAutoSelect?: () => void } } };
      }
    ).google?.accounts?.id?.disableAutoSelect?.();
  } catch {
    // Ignore if Google Identity Services script is not loaded
  }
  if (!refresh) return;
  try {
    const issuer = getOidcIssuer();
    await fetch(`${issuer}/protocol/openid-connect/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: getOidcClientId(),
        refresh_token: refresh,
      }),
    });
  } catch {
    // Clean local memory even if IdP is unreachable
  }
}

async function getValidAccessToken(): Promise<string> {
  if (!activeTokens) throw new Error("SIN_SESION");
  if (Date.now() + 15_000 >= activeTokens.session.expiresAt) {
    await refreshOidcSession();
  }
  if (!activeTokens) throw new Error("SESION_VENCIDA");
  return activeTokens.accessToken;
}

export class ApiClientError extends Error {
  status: number;
  code: string;
  problem?: Problem;
  constructor(status: number, code: string, message: string, problem?: Problem) {
    super(message);
    this.status = status;
    this.code = code;
    this.problem = problem;
  }
}

async function publicApiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    let problem: Problem | undefined;
    try {
      problem = (await response.json()) as Problem;
    } catch {
      // ignore
    }
    throw new ApiClientError(
      response.status,
      problem?.code || `HTTP_${response.status}`,
      problem?.detail || problem?.title || `Error HTTP ${response.status}`,
      problem,
    );
  }
  return (await response.json()) as T;
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retryOn401 = true,
): Promise<{ data: T; etag: string | null }> {
  const token = await getValidAccessToken();
  const base = getApiBaseUrl();
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (response.status === 401 && retryOn401) {
    const refreshed = await refreshOidcSession();
    if (refreshed) return apiFetch<T>(path, init, false);
  }

  if (!response.ok) {
    let problem: Problem | undefined;
    try {
      problem = (await response.json()) as Problem;
    } catch {
      // ignore non-json error bodies
    }
    throw new ApiClientError(
      response.status,
      problem?.code || `HTTP_${response.status}`,
      problem?.detail || problem?.title || `Error HTTP ${response.status}`,
      problem,
    );
  }

  const data = (await response.json()) as T;
  return { data, etag: response.headers.get("etag") };
}

export function getBusinessDateInZone(
  timeZone = "America/Mexico_City",
  date = new Date(),
): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // fallback to UTC date
  }
  return date.toISOString().slice(0, 10);
}

export function addDaysToBusinessDate(
  businessDate: string,
  days: number,
): string {
  const dt = new Date(`${businessDate}T12:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function nextValidRevisionDate(
  currentEffectiveFrom: string,
  currentZone: string,
  nextZone = currentZone,
): string {
  const tomorrowCurrent = addDaysToBusinessDate(
    getBusinessDateInZone(currentZone),
    1,
  );
  const tomorrowNext = addDaysToBusinessDate(
    getBusinessDateInZone(nextZone),
    1,
  );
  const afterPrior = addDaysToBusinessDate(currentEffectiveFrom, 1);
  return [tomorrowCurrent, tomorrowNext, afterPrior].sort().at(-1)!;
}

export async function resizeImageToDataUrl(
  file: File,
  maxDimension = 280,
  quality = 0.76,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Formato de imagen no válido."));
      img.onload = () => {
        const scale = Math.min(
          1,
          maxDimension / Math.max(img.width || 1, img.height || 1),
        );
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// --- Direct Workspace Auth & Nodemailer OTP Endpoints ---
export async function apiRequestRegistrationOtp(payload: {
  fullName: string;
  email: string;
  password: string;
  timeZone: string;
}) {
  return publicApiFetch<{
    ok: boolean;
    email: string;
    message: string;
    mailpitUrl: string;
    deliveredTo: string[];
    devCodeHint?: string;
  }>("/workspace/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiVerifyRegistrationOtp(payload: {
  email: string;
  code: string;
}) {
  const res = await publicApiFetch<{
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    profile: {
      id: string;
      displayName: string;
      email: string;
      timeZone: string;
    };
  }>("/workspace/auth/verify-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const session = setDirectTokensSession(
    res.access_token,
    res.refresh_token,
    res.id_token,
    "keycloak",
    res.profile.displayName,
    res.profile.email,
  );
  return { session, profile: res.profile };
}

export async function apiLoginWithCredentials(payload: {
  email: string;
  password: string;
}) {
  const res = await publicApiFetch<{
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    profile: {
      id: string;
      displayName: string;
      email: string;
      timeZone: string;
      avatarDataUrl?: string;
      bio?: string;
      occupation?: string;
    };
  }>("/workspace/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const session = setDirectTokensSession(
    res.access_token,
    res.refresh_token,
    res.id_token,
    "keycloak",
    res.profile.displayName,
    res.profile.email,
  );
  return { session, profile: res.profile };
}

export async function apiLoginWithGoogle(payload: {
  email: string;
  fullName: string;
  picture?: string;
  googleAccessToken?: string;
  googleIdToken?: string;
}) {
  const res = await publicApiFetch<{
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    profile: {
      id: string;
      displayName: string;
      email: string;
      timeZone: string;
      avatarDataUrl?: string;
    };
  }>("/workspace/auth/google", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const session = setDirectTokensSession(
    res.access_token,
    res.refresh_token,
    res.id_token,
    "google",
    res.profile.displayName,
    res.profile.email,
  );
  return { session, profile: res.profile };
}

export async function apiRequestPasswordResetOtp(payload: { email: string }) {
  return publicApiFetch<{
    ok: boolean;
    email: string;
    message: string;
    mailpitUrl: string;
    deliveredTo: string[];
    devCodeHint?: string;
  }>("/workspace/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiConfirmPasswordReset(payload: {
  email: string;
  code: string;
  newPassword: string;
}) {
  return publicApiFetch<{ ok: boolean; message: string }>(
    "/workspace/auth/reset-password",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function apiSubmitContactForm(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return publicApiFetch<{ ok: boolean; message: string; mailpitUrl: string }>(
    "/workspace/contact",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

// --- Protected Workspace & Hybrid DB Endpoints ---
export async function apiGetExtendedProfile(): Promise<
  Record<string, unknown>
> {
  const { data } = await apiFetch<Record<string, unknown>>(
    "/workspace/profile",
  );
  return data;
}

export async function apiSaveExtendedProfile(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data } = await apiFetch<Record<string, unknown>>(
    "/workspace/profile",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return data;
}

export async function apiListEvidence(
  habitId?: string,
): Promise<EvidenceRecord[]> {
  const query = habitId ? `?habitId=${encodeURIComponent(habitId)}` : "";
  const { data } = await apiFetch<EvidenceRecord[]>(
    `/workspace/evidence${query}`,
  );
  return data;
}

export async function apiSaveEvidence(
  payload: Partial<EvidenceRecord>,
): Promise<EvidenceRecord> {
  const { data } = await apiFetch<EvidenceRecord>("/workspace/evidence", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

export async function apiGetHybridAudit(): Promise<HybridAuditResponse> {
  const { data } = await apiFetch<HybridAuditResponse>("/workspace/audit");
  return data;
}

export async function apiRunGeminiAi(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data } = await apiFetch<Record<string, unknown>>(
    "/workspace/ai/analyze",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return data;
}

// --- Core Canonical Endpoints ---
export async function apiGetProfile(): Promise<Profile> {
  const { data } = await apiFetch<Profile>("/me");
  return data;
}

export async function apiListHabits(): Promise<Habit[]> {
  const items: Habit[] = [];
  let cursor: string | null = null;
  do {
    const query: string = cursor
      ? `?limit=50&cursor=${encodeURIComponent(cursor)}`
      : "?limit=50";
    const response: { data: HabitList; etag: string | null } =
      await apiFetch<HabitList>(`/habits${query}`);
    items.push(...response.data.items);
    cursor = response.data.nextCursor;
  } while (cursor);
  return items;
}

export async function apiCreateHabit(command: HabitCreate): Promise<Habit> {
  const { data } = await apiFetch<Habit>("/habits", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(command),
  });
  return data;
}

export async function apiPatchHabit(
  habitId: string,
  version: number,
  patch: HabitPatch,
): Promise<Habit> {
  const { data } = await apiFetch<Habit>(`/habits/${habitId}`, {
    method: "PATCH",
    headers: {
      "Idempotency-Key": crypto.randomUUID(),
      "If-Match": `"${version}"`,
    },
    body: JSON.stringify(patch),
  });
  return data;
}

export async function apiListCheckIns(
  habitId: string,
  from: string,
  to: string,
): Promise<CheckIn[]> {
  const { data } = await apiFetch<CheckInList>(
    `/habits/${habitId}/check-ins?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=100`,
  );
  return data.items;
}

export async function apiRecordCheckIn(
  habitId: string,
  command: CheckInCommand,
): Promise<CheckIn> {
  const { data } = await apiFetch<CheckIn>(`/habits/${habitId}/check-ins`, {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(command),
  });
  return data;
}

export async function apiGetHabitMetrics(
  habitId: string,
  from: string,
  to: string,
): Promise<Metrics> {
  const { data } = await apiFetch<Metrics>(
    `/habits/${habitId}/metrics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
  return data;
}
