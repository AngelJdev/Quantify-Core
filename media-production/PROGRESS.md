# Progreso — producción audiovisual QUANTIFY 2.0

Plan aprobado: `~/.claude/plans/` (v2). Rama: `feature/quantify-media-production` (desde `develop` 1b1f915). `main` de referencia: d45ed9916d8a9ec52789a8625ca0cc67a7285d00.

## Estado
- [x] Auditoría Git/entorno; rama creada
- [x] Instalado: ffmpeg 9.0.2, uv, hyperframes 0.9.102, gsap 3.15.1, playwright 1.65 + Chromium
- [x] Verificación financiera (`docs/finanzas-verificacion.md`)
- [x] Capturas reales con datos ficticios (`scripts/capture.mjs`, `assets/screenshots/`, regenerables)
- [ ] Música (selección y descarga)
- [ ] Componentes compartidos y prueba de 12 s (1080p60, música + SFX) + muestras de voz
- [ ] ALTO: aprobación del piloto
- [ ] V1, V2, V3, QA, PR

## Decisiones
- HyperFrames sin su skill oficial instalada (envía beacon de uso); se usan sus referencias como guía local. Telemetría desactivada por variables de entorno.
- PWA 390 px con desbordes: móvil = capturas OPPO/Flutter del repo.
- Remotion descartado (licencia de pago para ≥4 personas).

## Pendiente de datos: ver `docs/datos-pendientes.md`
