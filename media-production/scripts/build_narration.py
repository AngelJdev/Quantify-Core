#!/usr/bin/env python3
"""Genera la narración (Piper, local) de un guion, su línea de tiempo, subtítulos SRT y timeline.js.
Uso: .venv/bin/python scripts/build_narration.py docs/guiones/v2.json [voz]   (voz por defecto: es_MX-claude-high)"""
import json, os, re, subprocess, sys, wave
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = json.load(open(os.path.join(ROOT, sys.argv[1]))); voice_name = sys.argv[2] if len(sys.argv) > 2 else "es_MX-claude-high"
from piper import PiperVoice, SynthesisConfig
voice = PiperVoice.load(os.path.join(ROOT, ".cache/voices", voice_name + ".onnx"))
vdir = os.path.join(ROOT, spec["video"]); ndir = os.path.join(ROOT, "audio/narration", spec["video"]); os.makedirs(ndir, exist_ok=True)
SR = 48000
def clean(t): return t.replace("QUANTIFY 2.0", "Quantify dos punto cero").replace("Wear OS", "Uer O Es").replace("Liquid Glass", "Líquid Glas").replace("Flutter", "Flúter").replace("NestJS", "Nest jei es").replace("Keycloak", "Kíclok").replace("PostgreSQL", "Postgres ese cu ele").replace("Docker", "Dóquer").replace("React", "Riáct").replace("freemium", "frimium").replace("QUANTIFY", "Quantify")
lines = []; t = spec["lead"]
for ln in spec["lines"]:
    raw = os.path.join(ndir, ln["id"] + "_raw.wav")
    with wave.open(raw, "wb") as w: voice.synthesize_wav(clean(ln["text"]), w, syn_config=SynthesisConfig(length_scale=1.06))
    wav = os.path.join(ndir, ln["id"] + ".wav")
    subprocess.run(["ffmpeg","-v","error","-y","-i",raw,"-af","highpass=f=80,equalizer=f=3200:t=q:w=1.2:g=2,acompressor=threshold=-20dB:ratio=3:attack=8:release=120,loudnorm=I=-16:TP=-1.5:LRA=7","-ar",str(SR),"-ac","1",wav],check=True)
    d = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",wav],capture_output=True,text=True).stdout)
    lines.append({"id": ln["id"], "text": ln["text"], "start": round(t, 3), "end": round(t + d, 3), "wav": wav}); t += d + spec["gap"]
total = round(lines[-1]["end"] + spec["tail"], 2)
# pista única de narración (estéreo, con silencios)
inputs = []; filt = []
for i, l in enumerate(lines): inputs += ["-i", l["wav"]]; filt.append(f"[{i}:a]adelay={int(l['start']*1000)}|{int(l['start']*1000)}[a{i}]")
mix = "".join(f"[a{i}]" for i in range(len(lines))) + f"amix=inputs={len(lines)}:normalize=0,apad=whole_dur={total},atrim=0:{total}"
out = os.path.join(ROOT, "audio/narration", spec["video"] + ".wav")
subprocess.run(["ffmpeg","-v","error","-y",*inputs,"-filter_complex",";".join(filt)+";"+mix,"-ar",str(SR),"-ac","2",out],check=True)
# subtítulos: fragmentos de ≤ 90 caracteres repartidos por duración proporcional
def chunks(text):
    parts = re.split(r"(?<=[.:;])\s+", text); res = []
    for p in parts:
        while len(p) > 90:
            cut = p.rfind(", ", 0, 90); cut = cut if cut > 30 else p.rfind(" ", 0, 90); res.append(p[:cut + (1 if p[cut] == "," else 0)].strip()); p = p[cut + 1:].strip()
        if p: res.append(p)
    return res
subs = []
for l in lines:
    cs = chunks(l["text"]); tot = sum(len(c) for c in cs); a = l["start"]
    for c in cs: dur = (l["end"] - l["start"]) * len(c) / tot; subs.append({"text": c, "start": round(a, 3), "end": round(a + dur - 0.02, 3)}); a += dur
def ts(x): h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60; return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")
srt = "\n".join(f"{i+1}\n{ts(s['start'])} --> {ts(s['end'])}\n{s['text']}\n" for i, s in enumerate(subs))
os.makedirs(os.path.join(ROOT, "output"), exist_ok=True)
open(os.path.join(ROOT, "docs/guiones", spec["video"] + ".srt"), "w", encoding="utf-8").write(srt)
open(os.path.join(vdir, "timeline.js"), "w", encoding="utf-8").write("window.TLN=" + json.dumps({"total": total, "lines": [{k: l[k] for k in ("id", "text", "start", "end")} for l in lines], "subs": subs}, ensure_ascii=False) + ";\n")
print(spec["video"], "voz", voice_name, "duración total", total, "s");  [print(f"  {l['id']:4s} {l['start']:6.2f} → {l['end']:6.2f}  ({l['end']-l['start']:.1f}s)") for l in lines]
