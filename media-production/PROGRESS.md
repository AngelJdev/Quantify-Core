# Progreso — producción audiovisual QUANTIFY 2.0

Plan aprobado: `~/.claude/plans/` (v2). Rama: `feature/quantify-media-production` (desde `develop` 1b1f915). `main` de referencia: d45ed9916d8a9ec52789a8625ca0cc67a7285d00.

## Estado (27/11/2026)
- [x] Auditoría Git/entorno; rama `feature/quantify-media-production` desde `develop` (1b1f915); `main` intacta (d45ed99)
- [x] Herramientas instaladas: ffmpeg, uv, hyperframes 0.9.102, gsap 3.15.1, playwright 1.65 + Chromium, piper-tts, kokoro-onnx (solo local)
- [x] Verificación financiera (`docs/finanzas-verificacion.md`) y matriz de veracidad (`docs/veracidad.md`)
- [x] Capturas reales con datos ficticios (`scripts/capture.mjs`, `capture_flows.mjs`; `assets/screenshots/`, regenerables)
- [x] Teaser aprobado (prueba de 14.96 s)
- [x] Video 1 · Lanzamiento (75 s, sin narración) — renderizado y verificado
- [x] Video 2 · Experiencia (96.8 s, narrado) — renderizado y verificado
- [x] Video 3 · Innovación e impacto (118 s, narrado) — renderizado y verificado
- [x] Entregables: portadas, SRT, QUALITY-REPORT, COST-REPORT, storyboards
- [x] Push; Release en borrador `media-v1.0.0` (sin tag); PR #30 en borrador hacia `develop` (https://github.com/AngelJdev/Quantify-Core/pull/30)
- [x] Videos y voz aprobados por el equipo (27/11/2026); documentación final completa.
- [x] PR #30 integrado en `develop` el 27/11/2026 mediante merge commit (equivalente a `--no-ff`): **`0afe20bcf8b22af42e73f2e612dea66898daa6aa`** (padres `1b1f915` + `5335c44`, 12 commits).
- [x] Rama `feature/quantify-media-production` eliminada local y remotamente tras verificar la integración.
- [ ] **Pendiente:** verificaciones de licencia (ver `QUALITY-REPORT.md`). Al resolverlas: `gh release edit media-v1.0.0 --draft=false --prerelease --target 0afe20bcf8b22af42e73f2e612dea66898daa6aa` y verificar que el tag apunte a ese commit.

## Decisiones
- HyperFrames sin su skill oficial instalada (envía beacon de uso); se usan sus referencias como guía local. Telemetría desactivada por variables de entorno.
- PWA 390 px con desbordes: móvil = capturas OPPO/Flutter del repo.
- Remotion descartado (licencia de pago para ≥4 personas).

- Voz de narración: `es_MX-claude-high`, **aprobada por el equipo el 27/11/2026** (detalles menores de pronunciación aceptados). No se harán nuevos renderizados antes de la entrega (27/11/2026, 8:00).
- Sugerencias de hábitos: no se muestran como IA (catálogo fijo); la IA aparece solo en V3 bajo «En planeación».
- Logros/Nivel/XP: no se muestran en V2/V3; en V1 aparece «Nivel 22» solo de forma incidental en la pantalla Hoy con «Datos de demostración».
- APK: no se muestra la página de instalación (el APK es un placeholder).

## Pendiente de datos: ver `docs/datos-pendientes.md`

## Comandos del piloto
```bash
export HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1
python3 scripts/sfx_pilot.py && scripts/mix_pilot.sh   # audio
node scripts/sync_pilot.mjs                            # copia shared/capturas/audio a pilot/
cd pilot && npx hyperframes check && npx hyperframes render -f 60 -q high --crf 14 -o ../output/Quantify-00-Prueba-Direccion-Artistica.mp4
python3 scripts/motion_qa.py output/<video>.mp4 <tiempos_de_corte>
.venv/bin/python scripts/tts_samples.py                # muestras de voz
```
Requiere `apps/web` en `npm run dev -- --host 127.0.0.1 --port 5173` solo para regenerar capturas.

## QA del piloto
ffprobe: h264 High, 1920×1080, 60 fps, yuv420p, SAR 1:1, AAC 48 kHz; 898 fotogramas; sin negros; un único pico de movimiento (golpe a 7.45 s, planeado); sin fotogramas congelados fuera de los holds de lectura. Audio −14.5 LUFS integrados, pico −2.4 dBFS. **No verificado:** audición humana de música, SFX y voces (solo medidos).
Observaciones: la UI mostrada incluye «Nivel 22/XP» (interfaz sin integrar) y «IA hábitos» en el menú lateral (catálogo fijo); en el piloto solo aparecen de forma incidental y con la leyenda «Datos de demostración».

## Estado de Git (final)
- `develop` = `origin/develop` con el merge `0afe20b` del PR #30; la rama de producción ya no existe.
- `origin/main` = `d45ed99` (intacta durante todo el trabajo).
- Release `media-v1.0.0`: **borrador** (prerelease) con 9 archivos, apuntando a `0afe20b`; sin tag hasta su publicación.
- Respaldo local de videos y recursos: `../quantify-media-respaldo-2026-11-27/` (fuera del repositorio, verificado por SHA-256).
