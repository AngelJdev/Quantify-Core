#!/usr/bin/env python3
"""Diseño sonoro del piloto: SFX sintetizados (sin samples) sincronizados con pilot/timeline.json."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "vendor", "claude-motion"))
from sfx.mix import Mix
from sfx.synth import blip, chime, click, impact, pop, riser, scratch, whoosh

tl = json.load(open(os.path.join(ROOT, "pilot", "timeline.json")))
mix = Mix(tl["duration"])
put = mix.put
# Tonalidad única: re mayor.
LETTER = [587.33, 659.25, 739.99, 880.0, 987.77, 1108.7, 1174.7, 1318.5]

put(tl["qDraw"], scratch(1.4), 0.10, -0.1)
put(tl["qHit"] - 1.5, riser(1.5, 300, 5200), 0.10)
put(tl["qHit"], chime([1174.7, 1760.0, 2349.3], dur=1.8, tau=0.6), 0.12)
for i in range(8):
    put(tl["qHit"] + 0.05 + i * 0.067, blip(LETTER[i], dur=0.3, tau=0.09), 0.10, -0.5 + i * 0.14)
put(tl["devices"] - 0.1, whoosh(0.7, 400, 3000, peak=0.5), 0.16, -0.2)
put(tl["phone"] - 0.05, whoosh(0.6, 500, 2600, peak=0.5), 0.14, 0.4)
for i, t in enumerate(tl["chips"]):
    put(t, pop(900 + i * 160, 380 + i * 60), 0.22, -0.4 + i * 0.27)
put(tl["punch"] - 0.1, whoosh(0.6, 700, 3600, peak=0.4), 0.15)
put(tl["drop"] - 1.2, riser(1.2, 400, 6500), 0.12)
put(tl["drop"], impact(1.2), 0.30)
put(tl["drop"] - 0.05, whoosh(0.45, 3200, 500, peak=0.4), 0.14)
for i, t in enumerate([tl["title1"], tl["title1"] + 0.14, tl["title2"], tl["title2"] + 0.14, tl["title2"] + 0.28]):
    put(t, whoosh(0.3, 600, 2600, peak=0.45), 0.09, -0.3 + i * 0.15)
    put(t + 0.12, blip(LETTER[i], dur=0.3, tau=0.08), 0.10)
put(tl["endcard"], chime([1174.7, 1568.0, 2349.3], dur=1.8, tau=0.7), 0.12)

mix.master(target_lufs=-18.0, fade_out=0.4)  # los SFX quedan debajo de la música
out = os.path.join(ROOT, "audio", "sfx", "pilot-sfx.wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
mix.write(out)
print("SFX ->", out)
