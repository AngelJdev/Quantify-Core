#!/usr/bin/env python3
"""Audio del Video 1: música «Sci-Fi Score» (Arulo, Mixkit) + SFX sintetizados sincronizados a los compases."""
import json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "vendor", "claude-motion"))
from sfx.mix import Mix
from sfx.synth import blip, chime, click, impact, pop, riser, whoosh
D = json.loads(re.search(r"\[.*\]", open(os.path.join(ROOT, "video-01-launch", "beats.js")).read()).group(0))
T = lambda n, o=0.0: D[n] + o
DUR = 75.0
m = Mix(DUR); put = m.put
NOTE = [587.33, 659.25, 739.99, 880.0, 987.77, 1108.7, 1174.7, 1318.5]
for i in range(1, 28): put(0.7 + i * 0.11, click(2100 + i * 25, 0.03), 0.05, -0.3 + i * 0.02)
put(T(6, 0.1), whoosh(0.5, 300, 1800, peak=0.5), 0.08)
put(T(8) - 1.9, riser(1.9, 300, 6500), 0.13)
put(T(8), impact(1.4), 0.30); put(T(8), chime([1174.7, 1760.0, 2349.3], dur=2.0, tau=0.7), 0.11)
for i in range(8): put(T(8, 0.4 + i * 0.06), blip(NOTE[i], 0.3, 0.09), 0.09, -0.5 + i * 0.14)
put(T(8, 1.15), pop(900, 420), 0.18)
put(T(10) - 0.1, whoosh(0.8, 400, 3200, peak=0.5), 0.16)
for k in (2.04, 4.15, 6.24): put(T(10, k) - 0.05, whoosh(0.6, 600, 3400, peak=0.4), 0.11)
for i, t in enumerate([0.9, 2.7, 4.5]): put(T(10, t), pop(900 + i * 150, 380), 0.10)
put(T(14, 1.7), click(1700), 0.26); put(T(14, 3.5), click(1700), 0.26)
put(T(14, 1.74), blip(880, 0.4, 0.12), 0.12); put(T(14, 3.54), chime([987.77, 1479.98, 1975.53], dur=1.8, tau=0.6), 0.14)
put(T(14, 3.8), whoosh(0.7, 500, 2600, peak=0.4), 0.10); put(T(18) - 0.3, whoosh(0.45, 500, 3000, peak=0.5), 0.13)
put(T(18), whoosh(0.7, 300, 2600, peak=0.5), 0.14); put(T(18, 3.0), whoosh(1.4, 400, 1800, peak=0.5), 0.08)
for i in range(5): put(T(18, 3.9 + i * 0.35), pop(900 + i * 140, 400 + i * 40), 0.2, -0.4 + i * 0.2)
put(T(22) - 0.3, whoosh(0.45, 500, 3000, peak=0.5), 0.13); put(T(22), whoosh(0.8, 300, 2800, peak=0.5), 0.14)
for k in (2.7, 5.7, 8.3): put(T(22, k) - 0.05, whoosh(0.6, 600, 3400, peak=0.4), 0.10)
for k in (4.1, 8.4): put(T(22, k), blip(990, 0.4, 0.12), 0.11)
put(T(27) - 0.1, whoosh(0.8, 400, 3000, peak=0.5), 0.15); put(T(27, 1.0), whoosh(0.7, 500, 2800, peak=0.5), 0.11, 0.4); put(T(27, 1.5), whoosh(0.7, 500, 2800, peak=0.5), 0.11, 0.6)
put(T(27, 3.4), whoosh(1.0, 300, 4200, peak=0.7), 0.13); put(T(27, 5.8), pop(700, 340), 0.2); put(T(32) - 0.3, whoosh(0.45, 500, 3000, peak=0.5), 0.13)
put(T(32) - 1.1, riser(1.1, 400, 6000), 0.11); put(T(32), whoosh(0.6, 3200, 500, peak=0.4), 0.15); put(T(32), chime([1174.7, 1568.0, 2349.3], dur=2.0, tau=0.7), 0.10)
for i, t in enumerate([T(32, 0.12), T(32, 0.22), T(32, 1.1), T(32, 1.24)]): put(t, whoosh(0.3, 600, 2600, peak=0.45), 0.09, -0.3 + i * 0.2)
put(T(34, 0.3), chime([1174.7, 1568.0, 2349.3], dur=2.2, tau=0.8), 0.12)
m.master(target_lufs=-18.0, fade_out=0.4)
os.makedirs(os.path.join(ROOT, "audio", "sfx"), exist_ok=True); sfx = os.path.join(ROOT, "audio/sfx/v1-sfx.wav"); m.write(sfx)
os.makedirs(os.path.join(ROOT, "audio/mix"), exist_ok=True)
cache = os.path.join(ROOT, ".cache"); music = os.path.join(cache, "v1-music.wav")
subprocess.run(["ffmpeg","-v","error","-y","-i",os.path.join(cache,"music/mixkit-464.mp3"),"-t",str(DUR),"-af",f"loudnorm=I=-17:TP=-2:LRA=7,afade=t=in:d=0.4,afade=t=out:st={DUR-2.2}:d=2.2","-ar","48000","-ac","2",music],check=True)
out = os.path.join(ROOT, "audio/mix/video-01-launch.wav")
subprocess.run(["ffmpeg","-v","error","-y","-i",music,"-i",sfx,"-filter_complex",f"[1:a]apad=whole_dur={DUR}[s];[0:a][s]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=7,alimiter=limit=0.89,atrim=0:{DUR}","-ar","48000","-ac","2",out],check=True)
r = subprocess.run(["ffmpeg","-nostats","-i",out,"-af","ebur128=peak=true","-f","null","-"],capture_output=True,text=True).stderr
print("\n".join(l for l in r.splitlines() if " I:" in l or "Peak:" in l)[-120:])
