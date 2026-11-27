#!/usr/bin/env python3
"""Normaliza el audio de un MP4 a -15 LUFS (dos pasadas, lineal, pico ≤ -1.5 dBTP) y lo reempaqueta sin recodificar el video.
Uso: finalize_audio.py output/video.mp4"""
import json, os, subprocess, sys
src = sys.argv[1]; tmp = src + ".tmp.mp4"; I, TP, LRA = -15.0, -1.5, 11.0
r = subprocess.run(["ffmpeg","-nostats","-i",src,"-vn","-af",f"loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json","-f","null","-"],capture_output=True,text=True).stderr
m = json.loads(r[r.rindex("{"):r.rindex("}")+1])
af = f"loudnorm=I={I}:TP={TP}:LRA={LRA}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
subprocess.run(["ffmpeg","-v","error","-y","-i",src,"-map","0:v","-map","0:a","-c:v","copy","-af",af,"-ar","48000","-c:a","aac","-b:a","320k","-movflags","+faststart",tmp],check=True)
os.replace(tmp, src)
r = subprocess.run(["ffmpeg","-nostats","-i",src,"-af","ebur128=peak=true","-vn","-f","null","-"],capture_output=True,text=True).stderr
print(os.path.basename(src), "antes %s LUFS ->" % m["input_i"], " ".join(l.strip() for l in r.splitlines() if " I:" in l or "Peak:" in l)[-70:])
