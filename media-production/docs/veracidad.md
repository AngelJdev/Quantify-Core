# Matriz de veracidad de funcionalidades

Regla: en los videos solo se presenta como disponible lo verificado en el código (`develop`, 26/11/2026).

| Nivel | Funcionalidades | Tratamiento en video |
|---|---|---|
| Implementado y conectado | Hábitos (crear, editar, pausar, archivar); check-ins con valor, ánimo, energía, nota y evidencia, idempotentes; rachas; análisis semanal y mensual; dashboard; autenticación Keycloak OIDC+PKCE, Google y OTP; API NestJS con aislamiento por usuario; app Flutter conectada a la REST API (probada en OPPO); PWA instalable; monitoreo local Prometheus/Grafana | Como disponibles |
| Solo interfaz o prototipo | Logros y niveles/XP (36 medallas, solo UI web, «no integrados en el núcleo»); sugerencias (catálogo fijo, no IA); avisos de ejemplo; dispositivos vinculados (UI local) | Con súper «Vista de interfaz»; no se narran como servicio |
| Futuro | Asistente IA, recordatorios, Wear OS, FastAPI de analítica, sincronización offline, despliegue público. El APK de `/instalar` es un placeholder | Solo en V3, bajo «En planeación» |

Evidencias: `docs/arquitectura/matriz-entrega.md`, `apps/mobile/README.md`, `apps/web/src/features/achievements/data/achievements.ts`, `apps/web/src/features/suggestions`.
Observación de captura: la PWA a 390 px tiene desbordes visuales (barra superior y pestañas); para móvil se usan las capturas del OPPO/Flutter del repositorio.
