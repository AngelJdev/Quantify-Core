# Producción audiovisual de QUANTIFY 2.0

Entorno independiente del producto (no modifica código de la app). Motor: HyperFrames (HTML + GSAP → MP4), FFmpeg para codificación y QA.

## Requisitos
Node ≥ 22, FFmpeg, Python 3.12+ (con `uv`), Chromium de Playwright (`npx playwright install chromium`).

## Comandos
```bash
cd media-production && npm install
export HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1
python3 scripts/finance_check.py        # verifica cifras financieras (hipótesis)
# Capturas (requiere `npm ci && npm run dev -- --host 127.0.0.1 --port 5173` en apps/web)
node scripts/capture.mjs [desktop|mobile]
```
Las capturas usan un contexto efímero, sesión y API **ficticias**, y abortan toda petición que no sea local.
Costo adicional: $0 MXN. Ver `PROGRESS.md`.
