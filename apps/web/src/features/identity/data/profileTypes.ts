/**
 * Tipos de datos para el módulo de Identidad y Perfil Propio (RF-01 / RF-02).
 * Alineados con el endpoint GET /me de packages/contracts/openapi.json.
 */

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  timezone: string; // Formato IANA (ej. America/Mexico_City)
  roles: string[];
  createdAt: string;
}

