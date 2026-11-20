import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import contract from "../../../../../packages/contracts/openapi.json";
import type { HabitList, Profile, Problem } from "./schema";
import type { ReadSession } from "@/features/identity/data/session";
import { abortable } from "./abort";

const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
ajv.addSchema({ $id: "core", components: { schemas: contract.components.schemas } });
const profile = ajv.compile<Profile>({ $ref: "core#/components/schemas/Profile" });
const habits = ajv.compile<HabitList>({ $ref: "core#/components/schemas/HabitList" });
const problem = ajv.compile<Problem>({ $ref: "core#/components/schemas/Problem" });

export class ReadError extends Error {
  constructor(public kind: "session" | "http" | "response" | "network" | "timeout" | "cancelled",
    public status?: number, public code?: string) { super(kind); }
}

export function createReads(base: string, identity: ReadSession) {
  async function get(path: string, signal: AbortSignal): Promise<unknown> {
    const generation = identity.generation();
    const timeout = AbortSignal.timeout(8000);
    const combined = AbortSignal.any([signal, timeout]);
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (combined.aborted) throw new ReadError("cancelled");
        let token: string;
        try { token = await abortable(identity.accessToken(attempt === 1), combined); }
        catch { throw new ReadError("session"); }
        if (combined.aborted || generation !== identity.generation()) throw new ReadError("cancelled");
        const response = await fetch(`${base}/${path}`, { method: "GET",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          credentials: "omit", cache: "no-store", redirect: "error", signal: combined });
        if (generation !== identity.generation()) throw new ReadError("cancelled");
        if (response.status === 401) {
          if (attempt === 0) continue;
          identity.expire();
          throw new ReadError("session", 401);
        }
        if (!response.ok) {
          let code: string | undefined;
          if (response.headers.get("content-type")?.includes("application/problem+json")) {
            const body: unknown = await response.json().catch(() => null);
            if (problem(body) && body.status === response.status) code = body.code;
          }
          throw new ReadError("http", response.status, code);
        }
        if (!response.headers.get("content-type")?.includes("application/json")) throw new ReadError("response");
        try {
          const body: unknown = await response.json();
          if (generation !== identity.generation() || combined.aborted) throw new ReadError("cancelled");
          return body;
        } catch (error) { throw error instanceof ReadError ? error : new ReadError("response"); }
      }
    } catch (error) {
      if (signal.aborted || generation !== identity.generation()) throw new ReadError("cancelled");
      if (timeout.aborted) throw new ReadError("timeout");
      if (error instanceof ReadError) throw error;
      throw new ReadError("network");
    }
  }
  return {
    async profile(signal: AbortSignal): Promise<Profile> {
      const body = await get("me", signal);
      if (!profile(body)) throw new ReadError("response");
      if (body.status !== "active") throw new ReadError("http", 403, "PROFILE_NOT_ACTIVE");
      return body;
    },
    async habits(signal: AbortSignal, status: "" | "active" | "paused" | "archived", cursor?: string): Promise<HabitList> {
      const query = new URLSearchParams({ limit: "20" });
      if (status) query.set("status", status);
      if (cursor) query.set("cursor", cursor);
      const body = await get(`habits?${query}`, signal);
      if (!habits(body)) throw new ReadError("response");
      return body;
    },
  };
}

export function readErrorMessage(error: unknown) {
  if (!(error instanceof ReadError)) return "No se pudo completar la consulta. Vuelve a intentarlo.";
  if (error.kind === "session") return "Tu sesión terminó. Vuelve a acceder con Keycloak.";
  if (error.status === 403) return error.code === "PROFILE_NOT_ACTIVE"
    ? "Tu perfil no está habilitado. Solicita su revisión al responsable del entorno."
    : "No tienes permiso para consultar estos datos o tu perfil no está habilitado.";
  if (error.status === 404) return "El recurso solicitado no está disponible para tu cuenta.";
  if (error.status === 429) return "Se alcanzó el límite de solicitudes. Espera antes de reintentar.";
  if (error.kind === "timeout") return "La API tardó demasiado en responder. Vuelve a intentarlo.";
  if (error.kind === "network") return "No se pudo conectar con la API. Revisa la red y la configuración de CORS.";
  if (error.kind === "response") return "La API devolvió una respuesta incompatible con el contrato.";
  return `La consulta falló${error.status ? ` (HTTP ${error.status})` : ""}. Vuelve a intentarlo.`;
}
