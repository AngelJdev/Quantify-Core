# ADR-0011: Integración del asistente conversacional Gemini para móvil mediante API NestJS

- **Estado:** propuesto
- **Fecha:** 2026-11-26
- **Responsables:** equipo móvil, backend y datos/IA (revisión del equipo pendiente)
- **Requisitos afectados:** RF-07 (RF-07.01 a RF-07.04), RNF-01, RNF-02, RNF-04, RNF-05, RNF-08, RNF-09; decisiones D-07 y D-09
- **Revisión:** pendiente de PR hacia `develop` y validación conjunta del equipo

## Contexto

La entrada oficial de la aplicación móvil en [`apps/mobile/lib/main_prototype.dart`](../../../apps/mobile/lib/main_prototype.dart) ya opera conectada a Keycloak OIDC (`ADR-0009`, `ADR-0010`) y a `services/api` para perfiles, hábitos, check-ins y métricas, pero la pestaña **IA hábitos** (`AssistantPage`) permanecía como marcador visual sin conexión.

El [alcance vigente del asistente conversacional](../../datos-ia/asistente-conversacional.md) establece que la IA vive dentro de Quantify para atender solicitudes sencillas sobre hábitos, pedir datos faltantes, proponer borradores revisables y guardar hábitos únicamente tras confirmación explícita mediante la API transaccional, sin inventar rachas, arquetipos ni porcentajes de confianza ficticios, y sin incluir credenciales del proveedor en los clientes.

El endpoint preexistente `/workspace/ai/analyze` recibía claves desde el cuerpo del cliente, pasaba el secreto en la URL de consulta, carecía de contrato OpenAPI y consentimiento verificable, y devolvía arquetipos y porcentajes fuera del alcance aprobado.

## Opciones consideradas

1. **Invocar la API de Gemini directamente desde Flutter:** expone `GEMINI_API_KEY` en el binario móvil (APK), impide aplicar control de acceso OIDC, consentimiento persistente y límites de frecuencia del servidor, e incumple `AGENTS.md` y el alcance de `D-07`.
2. **Conectar Flutter a `/workspace/ai/analyze`:** hereda exposición de clave en URL, ausencia de esquema canónico en `packages/contracts/openapi.json`, falta de consentimiento explícito y métricas preventivas fuera de alcance (`RF-07.05`).
3. **Crear `AssistantModule` en `services/api` bajo contrato OpenAPI 3.1.1 y consumirlo desde Flutter con OIDC:** conserva `GEMINI_API_KEY` exclusivamente en el servidor, exige consentimiento revocable en PostgreSQL, aplica instrucción de sistema separada y esquema JSON estructurado sobre Google Gemini REST API, y delega la creación confirmada al endpoint existente `POST /api/v1/habits`.

## Decisión

Se adopta la **opción 3** para el flujo móvil conectado:

- **Contrato canónico (`packages/contracts/openapi.json`):** se definen `GET /api/v1/me/assistant-consent`, `POST /api/v1/me/assistant-consent` (con `Idempotency-Key` UUIDv4) y `POST /api/v1/assistant/messages`, junto con los esquemas `AssistantConsent`, `AssistantConsentUpdate`, `AssistantTurn`, `AssistantMessageRequest`, `HabitDraft` y `AssistantReply`.
- **Seguridad y proveedor (`services/api/src/modules/assistant/`):** la API NestJS consume `https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent` enviando `GEMINI_API_KEY` solo en la cabecera `x-goog-api-key`, nunca en query params ni respuestas. Se fija por defecto el modelo estable de baja latencia `gemini-3.5-flash-lite` (configurable mediante `GEMINI_MODEL`, con respaldo automático a `gemini-3.5-flash-lite` si un modelo Flash superior presenta saturación `5xx` o tiempo agotado).
- **Consentimiento y privacidad (`003_assistant_consent.sql`):** antes de invocar al proveedor, la API verifica `TelemetryIdentity` (perfil propio activo) y consentimiento vigente en `assistant_consents`. El usuario puede elegir si autoriza compartir el resumen mínimo de sus propios hábitos activos/pausados (`name`, `targetValue`, `unit`, `weekdays`, `status`); nunca se envían `owner_id`, correo, `sub`, notas privadas ni datos de otros perfiles.
- **Conversación efímera sin retención de texto:** el servidor no almacena historiales de chat ni prompts en PostgreSQL, MongoDB ni logs operativos (`OperationalSignals` conserva únicamente ruta, código HTTP y latencia). El cliente móvil mantiene hasta 10 turnos recientes en memoria durante la sesión activa y los descarta al cerrar sesión o reiniciar la conversación.
- **Separación entre propuesta y escritura:** `AssistantReply.draft` no posee `id` ni modifica tablas maestras. En `AssistantPage`, la persona puede editar el borrador en `HabitEditor`, descartarlo sin efecto o confirmarlo mediante `POST /api/v1/habits` con una `Idempotency-Key` estable por borrador para evitar duplicados ante reintentos o doble toque. La creación manual permanece siempre accesible aunque el asistente falle o no esté configurado.

Para operar con datos personales reales fuera de pruebas sintéticas, el proyecto de Google AI Studio / Google Cloud asociado a `GEMINI_API_KEY` debe encontrarse en nivel de facturación de pago (*Paid tier*) y contar con la revisión institucional de `D-09`.

## Consecuencias

- El cliente móvil obtiene un asistente conversacional real con Gemini sin añadir dependencias nativas nuevas ni exponer secretos en el APK.
- Si `GEMINI_API_KEY` no está configurada o el proveedor falla/agota cuota, `/health/ready` del núcleo permanece independiente y `/assistant/messages` responde errores tipados (`application/problem+json`: `503 ASSISTANT_UNAVAILABLE`, `429 ASSISTANT_RATE_LIMITED`, `422 ASSISTANT_RESPONSE_BLOCKED`, `403 ASSISTANT_CONSENT_REQUIRED`), manteniendo operativa la captura manual.
- `D-07` y `D-09` conservan revisión pendiente del equipo para retención definitiva, paridad web y operación pública.

## Evidencia y criterio de aceptación

- Validación de `packages/contracts/openapi.json` con `SwaggerParser` (`npm run validate:openapi`), `Ajv` estricto y `node scripts/check-docs.mjs`.
- Pruebas automatizadas en `services/api` (consentimiento idempotente, bloqueo `403` sin consentimiento con cero llamadas al proveedor, aislamiento entre usuarios y rol `admin`, validación de borradores, manejo de bloqueo/cuota/indisponibilidad y límite de frecuencia).
- Pruebas unitarias y de widgets en `apps/mobile` (`flutter analyze` y `flutter test`, incluyendo consentimiento, conversación, edición/confirmación idempotente, descarte sin escritura, errores con alternativa manual y escala de texto al 200 % en 320 px).

## Reversión o reemplazo

Si el equipo decide trasladar la orquestación conversacional a `services/analytics` (FastAPI) o adoptar Vertex AI empresarial, el contrato HTTP público `/api/v1/assistant/messages` y `/api/v1/me/assistant-consent` puede mantenerse estable reemplazando únicamente el adaptador `AssistantProvider` en `services/api` mediante un nuevo ADR.
