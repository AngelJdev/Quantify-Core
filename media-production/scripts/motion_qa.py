#!/usr/bin/env python3
"""QA de movimiento: diferencia de luma entre cuadros consecutivos (YDIF). Los picos fuera de eventos planeados indican saltos o parpadeo."""
import subprocess, sys, re, json
video = sys.argv[1]; planned = [float(x) for x in sys.argv[2].split(",")] if len(sys.argv) > 2 else []
out = subprocess.run(["ffmpeg","-v","error","-i",video,"-vf","signalstats,metadata=print:key=lavfi.signalstats.YDIF:file=-","-an","-f","null","-"],capture_output=True,text=True).stdout
vals = [(float(m.group(1)), float(m.group(2))) for m in re.finditer(r"pts_time:([\d.]+)\s+lavfi.signalstats.YDIF=([\d.]+)", out.replace("\n"," "))]
ys = [v for _, v in vals]; mean = sum(ys)/len(ys)
print(f"frames={len(ys)} meanYDIF={mean:.3f} max={max(ys):.2f}")
spikes = [(t, v) for (t, v), (_, p) in zip(vals[1:], vals[:-1]) if v > max(3.0, mean * 5) and v > 2.2 * p]
for t, v in spikes:
    tag = "planeado" if any(abs(t - p) < 0.2 for p in planned) else "REVISAR"
    print(f"  pico t={t:.3f}s YDIF={v:.2f} [{tag}]")
json.dump(vals, open(video.rsplit(".", 1)[0] + ".ydif.json", "w"))
