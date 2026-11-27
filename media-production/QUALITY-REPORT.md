# Informe de control de calidad (27/11/2026)

## Verificaciones técnicas realizadas (FFmpeg/FFprobe, `scripts/qa_video.sh`)
| Archivo | Duración | Resolución | FPS | Códecs | Tamaño | Sonoridad | Pico real | Errores de decodificación |
|---|---|---|---|---|---|---|---|---|
| Quantify-00-Teaser.mp4 | 14.97 s | 1920×1080, SAR 1:1 | 60 | H.264 High yuv420p / AAC 48 kHz | 14.1 MB | −14.7 LUFS | −2.7 dBFS | 0 |
| Quantify-01-Lanzamiento.mp4 | 75.00 s | 1920×1080 | 60 | ídem | 61.1 MB | −14.9 LUFS | −1.7 dBFS | 0 |
| Quantify-02-Experiencia.mp4 | 96.82 s | 1920×1080 | 60 | ídem | 78.6 MB | −15.0 LUFS | −2.9 dBFS | 0 |
| Quantify-03-Innovacion-Impacto.mp4 | 118.00 s | 1920×1080 | 60 | ídem | 55.5 MB | −14.9 LUFS | −2.2 dBFS | 0 |

Los 4 son horizontales 16:9, MP4 con `faststart`, sin dependencias de Internet. SHA-256 en `output/README.md`.

## Revisión visual y de movimiento (no solo fotogramas fijos)
- Hojas de contacto por beat y revisión de cada escena (legibilidad, composición, contraste, ortografía, recortes, zona segura). `hyperframes check`: 0 errores y 0 advertencias de diseño en los tres videos (solo avisos informativos de estructura).
- Tiras de fotogramas **consecutivos** en transiciones y movimientos de cámara (V1: 3.4–3.9, 7.2–7.6, 5.5–6.3, 23.9–25.0, 49.7–51.4 s; V2: 58.3–58.5 s; piloto: transiciones). Sin saltos, pops ni elementos de un solo cuadro.
- Curva de diferencia cuadro a cuadro (`scripts/motion_qa.py`): los picos corresponden a golpes, cortes y cambios de plano planeados; ninguno se debe a parpadeo.
- `blackdetect`: sin negros no deseados. `freezedetect`: solo pausas de lectura (V1 y V3, ≤ 2.8 s; V2 sin congelamientos > 0.8 s tras añadir movimiento de cámara en la escena 2).
- Determinismo: HyperFrames renderiza buscando cada cuadro; mismo resultado en cada render.

## Sincronía audiovisual (medida)
- Impacto de V1 (compás 8): esperado 16.602 s, detectado 16.602 s en la mezcla final (0 ms).
- Impacto de V2: esperado 89.726 s, detectado 89.746 s (≈ 1 cuadro a 60 fps).
- Efectos y gestos visuales comparten la misma línea de tiempo (`beats.js` / `timeline.js`); subtítulos generados desde las mismas duraciones de la voz.

## Veracidad del contenido
- `docs/veracidad.md`: funcionalidades reales vs interfaz/prototipo vs futuro. Las sugerencias de hábitos **no** se presentan como IA: no hay escena de sugerencias, y la etiqueta «IA hábitos» del menú (de la app) se difumina en toda pantalla de V1 y V2. La IA, recordatorios, Wear OS y sincronización sin conexión solo aparecen en V3 como «En planeación».
- Logros/Nivel/XP (solo interfaz web): no se narran ni se muestran en V2/V3; «Nivel 22» aparece de forma incidental en la pantalla Hoy (V1/V2) con la leyenda «Datos de demostración».
- Cifras financieras: recalculadas (`scripts/finance_check.py`), rotuladas «Escenario hipotético · no son resultados comerciales», con supuestos visibles. Equilibrio calculado 1,706; en video «≈1,700».
- Pruebas: 152 = 89 (web) + 37 (API) + 26 (Flutter) según las notas de las versiones 2.0.0-rc.1/rc.2.
- Datos y capturas: sesión y API ficticias; sin credenciales ni datos personales. El APK de la página «Instalar» es un placeholder y no se muestra.

## Limitaciones (lo que NO pude verificar)
1. **Audición humana**: música, efectos y voz solo se midieron (sonoridad, picos, sincronía); no se escucharon.
2. **Pronunciación de la voz**: se sustituyeron términos con ortografía fonética para el sintetizador (p. ej. «Quantify dos punto cero», «Líquid Glas», «Flúter», «Kíclok»); no se pudo comprobar el resultado a oído. Los subtítulos conservan la escritura original.
3. **Voz provisional**: `es_MX-claude-high`; el usuario no ha elegido voz. Su licencia declarada es Apache-2.0, pero la procedencia de los datos de entrenamiento no es verificable (ver `LICENSES.md`); alternativa con licencia explícita: `es_MX-ald-medium` (Unlicense).
4. **Licencia de Mixkit**: el texto completo carga dinámicamente y no se pudo leer automáticamente; revisar manualmente antes de publicar.
5. No se probó la reproducción en proyector/TV ni en QuickTime/VLC; solo decodificación completa con FFmpeg (0 errores) y metadatos.
6. La interfaz de la PWA a 390 px tiene desbordes; para móvil se usan capturas del prototipo Flutter del repositorio.
