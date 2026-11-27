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
- [ ] Push, borrador de Release, PR a `develop` (el líder integra); después: Release definitivo sobre el commit de merge y limpieza de rama

## Decisiones
- HyperFrames sin su skill oficial instalada (envía beacon de uso); se usan sus referencias como guía local. Telemetría desactivada por variables de entorno.
- PWA 390 px con desbordes: móvil = capturas OPPO/Flutter del repo.
- Remotion descartado (licencia de pago para ≥4 personas).

- Voz de narración: **provisional** `es_MX-claude-high` (la elección de voz del usuario aún no se recibió). Cambiarla implica regenerar narración, `fill_clips.py`, audio y renderizar V2/V3 (tiempos distintos).
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
