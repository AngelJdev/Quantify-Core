#!/usr/bin/env python3
"""Ajusta data-start/data-duration de los clips con data-scene="i" a partir de timeline.js. Uso: fill_clips.py video-02-demo"""
import json, re, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); V = os.path.join(ROOT, sys.argv[1])
T = json.loads(re.search(r"=(.*);", open(os.path.join(V, "timeline.js"), encoding="utf-8").read(), re.S).group(1))
L = T["lines"]; N = len(L); html = open(os.path.join(V, "index.html"), encoding="utf-8").read()
def bounds(i): a = 0 if i == 0 else L[i]["start"] - 0.5; b = T["total"] if i == N - 1 else L[i + 1]["start"] - 0.5 + 0.4; return round(a, 2), round(b - a, 2)
for i in range(N):
    a, d = bounds(i)
    html = re.sub(r'(<div id="s%d" data-scene="%d" class="clip fill" )data-start="[^"]*" data-duration="[^"]*"' % (i + 1, i), r'\1data-start="%s" data-duration="%s"' % (a, d), html)
html = re.sub(r'(data-composition-id="[^"]+" data-start="0" )data-duration="[^"]*"', r'\1data-duration="%s"' % T["total"], html)
html = re.sub(r'(id="(?:bd|fx|subs-clip|mix)"[^>]*?)data-duration="[^"]*"', r'\1data-duration="%s"' % T["total"], html)
open(os.path.join(V, "index.html"), "w", encoding="utf-8").write(html); print("clips ajustados;", "total", T["total"])
