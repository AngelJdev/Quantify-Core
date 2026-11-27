#!/usr/bin/env python3
"""Genera guiones legibles, storyboards y cronogramas (Markdown) desde las líneas de tiempo reales."""
import json, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def tl(v): return json.loads(re.search(r"=(.*);", open(os.path.join(ROOT, v, "timeline.js"), encoding="utf-8").read(), re.S).group(1))
def mmss(t): return f"{int(t//60)}:{t%60:05.2f}"
D = json.loads(re.search(r"\[.*\]", open(os.path.join(ROOT, "video-01-launch/beats.js")).read()).group(0))
V1 = [("Contar días no es entender tu progreso", 0, 4, "Calendario de puntos que se llena y se apaga; texto cinético", "Dibujo del conteo; sin voz"),
 ("Una racha puede reflejar lo que declaraste", 4, 8, "Contador 0→12, tachado; los puntos convergen al centro", "Riser hacia la caída"),
 ("La Q y el nombre", 8, 10, "Trazo de la Q, destello, QUANTIFY 2.0, «Transforma tus hábitos»", "Impacto único en el compás 8"),
 ("Tus hábitos, en un solo lugar", 10, 14, "Pantalla Hoy real con tres acercamientos de cámara", "Whooshes de cámara"),
 ("Un clic. Un avance.", 14, 18, "Cursor sobre la UI real: +1 vaso y Completar; el anillo sube de 53 % a 59 %", "Clics y campanilla"),
 ("Cada avance deja evidencia", 18, 22, "Formulario de check-in: valor, ánimo, energía, nota y foto", "Pops por campo"),
 ("Observa tu constancia", 22, 27, "Progreso: semana, curva, mapa de calor y mes", "Whooshes de cámara"),
 ("Computadora y celular", 27, 32, "Laptop + 2 teléfonos; claro/oscuro con iris; panel de apariencia", "Barrido del iris"),
 ("Lo que haces. También cuenta.", 32, 36, "Titulares, cierre de marca y UTXJ", "Riser, destello y campanilla")]
def t_v1(n): return D[n] if n < len(D) else 75.0
out = ["# Video 1 · Transforma tus hábitos — guion, storyboard y cronograma", "", "Formato: 1920×1080, 60 fps · ~75 s · sin narración (supers + música «Sci-Fi Score», Arulo, Mixkit) · 115.7 BPM.", "", "| # | Inicio | Fin | Escena (texto en pantalla) | Imagen | Sonido |", "|---|---|---|---|---|---|"]
for i, (n, a, b, img, snd) in enumerate(V1): out.append(f"| {i+1} | {mmss(t_v1(a))} | {mmss(t_v1(b))} | {n} | {img} | {snd} |")
open(os.path.join(ROOT, "storyboards/video-01-lanzamiento.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
VIS = {"video-02-demo": ["Bienvenida real de la app", "Cuatro hábitos (anillos de resalte)", "Pantalla Hoy: tres resaltes", "Un clic: cursor, +1 vaso y Completar", "Check-in con valor, ánimo, energía y nota", "Detalle: racha y total acumulado", "Progreso: semana, mes y mapa de calor", "Crear un hábito (formulario real)", "Apariencia: claro/oscuro, sólido/Liquid Glass", "Computadora y celular (prototipo Flutter)", "Evidencia, sin duplicados, solo tuyos (motivo gráfico)", "Cierre de marca"],
 "video-03-impact": ["Lo declarado vs lo realmente hecho", "Tres principios", "Trazabilidad: registro y reintento", "Contexto: solo con permiso", "Explicabilidad (métricas reales; recomendaciones en planeación)", "Arquitectura animada", "152 pruebas automatizadas", "Modelo freemium (hipótesis)", "Costos del escenario", "Punto de equilibrio ≈1,700", "Lo que sigue (en planeación)", "Equipo", "Cierre"]}
TITLES = {"video-02-demo": "Video 2 · Descubre la experiencia", "video-03-impact": "Video 3 · Innovación, propósito e impacto"}
FILES = {"video-02-demo": "video-02-experiencia", "video-03-impact": "video-03-innovacion-impacto"}
for v in VIS:
    T = tl(v); L = T["lines"]; srcs = json.load(open(os.path.join(ROOT, "docs/guiones", {"video-02-demo": "v2", "video-03-impact": "v3"}[v] + ".json"), encoding="utf-8"))
    o = [f"# {TITLES[v]} — guion narrado, storyboard y cronograma", "", f"Formato: 1920×1080, 60 fps · {T['total']:.1f} s · narración es_MX (Piper `es_MX-claude-high`, aprobada por el equipo el 27/11/2026) · subtítulos incrustados y SRT.", "", "| # | Inicio | Fin | Narración | Escena |", "|---|---|---|---|---|"]
    for i, l in enumerate(L): o.append(f"| {i+1} | {mmss(l['start'])} | {mmss(l['end'])} | {l['text']} | {VIS[v][i]} |")
    open(os.path.join(ROOT, "storyboards", FILES[v] + ".md"), "w", encoding="utf-8").write("\n".join(o) + "\n")
print("docs generados")
