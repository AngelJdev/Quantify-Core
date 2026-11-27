# Producción audiovisual de QUANTIFY 2.0

Entorno independiente del producto (no modifica el código de la app). Motor: **HyperFrames** (HTML + GSAP → MP4, render local). FFmpeg para codificación, mezcla y QA. Presupuesto adicional: **$0 MXN** (ver `COST-REPORT.md`).

## Entregables (carpeta `output/`, publicados como GitHub Release; los MP4 no se versionan en git)
| Archivo | Descripción | Duración |
|---|---|---|
| `Quantify-01-Lanzamiento.mp4` | Video 1 · Transforma tus hábitos (sin narración) | ~75 s |
| `Quantify-02-Experiencia.mp4` | Video 2 · Descubre la experiencia (narrado, subtítulos incrustados) | ~97 s |
| `Quantify-03-Innovacion-Impacto.mp4` | Video 3 · Innovación, propósito e impacto (narrado, subtítulos incrustados) | ~118 s |
| `Quantify-00-Teaser.mp4` | Teaser (prueba audiovisual aprobada) | ~15 s |
| `*-portada.png` | Portadas 1920×1080 | — |
| `docs/guiones/*.srt` | Subtítulos de V2 y V3 | — |

Formato: 1920×1080 · 60 fps · H.264 High · AAC 48 kHz · español de México · exclusivamente horizontal 16:9.

## Documentación
`storyboards/` (guion, storyboard y cronograma por video) · `docs/veracidad.md` (qué es real, prototipo o futuro) · `docs/finanzas-verificacion.md` (cifras recalculadas; hipótesis) · `LICENSES.md` · `QUALITY-REPORT.md` · `COST-REPORT.md` · `PROGRESS.md`.

## Requisitos
Node ≥ 22, FFmpeg, Python 3.12 (con `uv`), `npx playwright install chromium`. Para la narración: `uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python piper-tts kokoro-onnx soundfile numpy` y los modelos de voz en `.cache/voices/` (ver `LICENSES.md`).

## Previsualizar y volver a renderizar
```bash
cd media-production && npm install
export HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1
# 1) Capturas reales con datos ficticios (requiere `npm ci && npm run dev -- --host 127.0.0.1 --port 5173` en apps/web)
node scripts/capture_flows.mjs
# 2) Audio: V1 → python3 scripts/audio_v1.py ; V2/V3 → .venv/bin/python scripts/build_narration.py docs/guiones/v2.json && python3 scripts/fill_clips.py video-02-demo && python3 scripts/audio_narrated.py video-02-demo
# 3) Copiar recursos y revisar
node scripts/sync_video.mjs video-02-demo && cd video-02-demo && npx hyperframes check && npx hyperframes preview
# 4) Render final y QA
npx hyperframes render -f 60 -q high --crf 14 -o ../output/Quantify-02-Experiencia.mp4
cd .. && python3 scripts/finalize_audio.py output/Quantify-02-Experiencia.mp4 && scripts/qa_video.sh output/Quantify-02-Experiencia.mp4
```
Estructura: `shared/` (tokens, componentes y kit de escenas reutilizables) · `video-0X-*/` (composición + línea de tiempo) · `scripts/` · `vendor/claude-motion/` (motor SFX MIT) · `pilot/` (teaser).

Las capturas usan un contexto efímero, sesión y API **ficticias** (`sofia.ramirez@example.com`) y abortan toda petición no local.
