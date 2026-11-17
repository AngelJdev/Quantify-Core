# Integración de colaboradores y actualización de main

Corte del 16/11/2026. Se consultó `origin` y no había PR abiertos. Punto de partida: `develop` en `43e531f`, `main` en `7a4266f`. Esta entrega prepara una nueva instantánea de avance; no declara el producto completo ni crea el tag documental pendiente de aprobación visual.

## Aportes incorporados

| Fuente remota | Commit | Resultado y límites |
|---|---|---|
| `feature/QUANCORE-46-metricas-observabilidad` | `fa43bed` | Utilidades y pruebas de correlación, redacción, métricas y exportación de Francisco Garcia Garcia. Conservadas como módulo independiente; el middleware NestJS existente sigue usando `OperationalSignals`. Cardinalidad, timeouts y garantías de privacidad del módulo adicional requieren revisión antes de conectarlo |
| `feature/QUANCORE-31-checkin-estadisticas-movil` y su alias `feature/QUANCORE-29-crear-app-flutter` | `9fd92d9` | Demo Flutter de Francisco Garcia Garcia, Android/iOS, check-ins locales, métricas y medallas. Se conserva su guía con alcance explícito. No implementa sesión, red HTTP ni persistencia de servidor; no duplica la API como autoridad del producto |

Se conservan los commits y autores mediante conciliaciones normales en la rama de integración, sin squash, rebase ni force. El único conflicto de contenido móvil estaba en el README: se mantuvo la guía de integración y se conservó la explicación original en `apps/mobile/GUIA-DEMO.md`.

Correcciones de integración: se eliminaron logs de cabeceras en Flutter; el botón institucional pendiente permanece en la pantalla de acceso y ofrece la demo explícita, sin simular autenticación; todas las pantallas llevan `DEMO LOCAL`. Dos pruebas cubren los problemas corregidos. El diseño Flutter recibido es un antecedente del equipo y no sustituye los mockups vigentes ni acredita su implementación final.

## Ramas históricas que no se fusionan automáticamente

| Ramas revisadas | Motivo |
|---|---|
| `feature/QC-41-inicializar-api`, `feature/QUANCORE-21-23-backend-persistencia`, `feature/QUANCORE-24-rachas-idempotencia`, `feature/QUANCORE-42-scaffold-web` | Propuestas anteriores con conflictos de configuración, contratos y módulos frente a la base QUANCORE-43 ya integrada. Salud NestJS, PostgreSQL, reglas y React tienen versiones consolidadas; recuperar diferencias útiles exige revisión específica |
| `feature/QUANCORE-32-gamificacion-logros` | Incluye módulos anteriores de check-ins que chocan con las reglas vigentes. Los logros de servidor necesitan contrato y conexión revisados; las medallas móviles importadas siguen siendo demostración |
| `feature/p0-modelo-relacional-core` | Conflictos con Compose y configuración actuales; no se sustituye la topología validada por una versión anterior |
| `docs/QUANCORE-13-documentacion-proyecto`, `docs/gantt-interactivo-jira-commits` | Antecedentes con conflictos en README, índice documental y portal actual. No había PR abierto ni nuevos commits en esta consulta; no se restaura el portal histórico sobre el vigente |
| `gh-pages` | Publicación histórica; Pages sirve la raíz de `develop`. No es una rama de funcionalidades que deba mezclarse con el producto |

Las ramas anteriores se conservan en el remoto; no se borraron ni se dieron por aceptadas sus tareas en Jira.

## Validación ejecutada

- `node scripts/verify-base.mjs`: aprobó comprobaciones documentales/Keycloak, 11 pruebas del resolvedor de referencias, 37 pruebas API con PostgreSQL temporal, OpenAPI, tipos, lint, 39 pruebas web y build React.
- `node --test services/api/tests/observability/*.test.js`: pruebas independientes de QUANCORE-46 aprobadas.
- Flutter 3.47.8 / Dart 3.13.7 en Windows: `flutter analyze` sin incidencias y `flutter test` con seis pruebas aprobadas.
- El nuevo prototipo móvil no se compiló a APK/IPA ni se conectó al IdP/API durante esta integración. No se repitió el ensayo OIDC real porque no se cambió el servidor ni su configuración.

## Publicación prevista

Tras revisar el PR, avanzar `develop` por fast-forward. Preparar `release/avance-2026-11-16` desde ese estado y conciliar el commit histórico exclusivo de `main`, conservando ambas historias. Actualizar `main` y devolver la release a `develop` por fast-forward, sin forzar referencias. La preferencia actual reemplaza `--no-ff` en la guía Git Flow y la plantilla de PR. Crear un tag queda pendiente de la confirmación del responsable.
