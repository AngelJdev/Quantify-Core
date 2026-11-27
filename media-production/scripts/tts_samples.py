#!/usr/bin/env python3
"""Muestras de narración en español con 4 voces gratuitas y locales (Piper es_MX x2, Kokoro ef_dora / em_alex)."""
import os, wave, subprocess
import soundfile as sf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = os.path.join(ROOT, ".cache", "voices"); OUT = os.path.join(ROOT, "audio", "narration", "samples")
os.makedirs(OUT, exist_ok=True)
TEXT = ("Esto es QUANTIFY 2.0. Registras un hábito, marcas tu avance del día y ves cómo tu constancia "
        "se convierte en progreso. Sin prisa, a tu ritmo. Porque lo que haces, también cuenta.")

def piper(name, model):
    from piper import PiperVoice
    voice = PiperVoice.load(os.path.join(V, model + ".onnx"))
    path = os.path.join(OUT, f"{name}_crudo.wav")
    with wave.open(path, "wb") as w:
        voice.synthesize_wav(TEXT, w)
    return path

def kokoro(name, voice_id):
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(V, "kokoro-v1.0.onnx"), os.path.join(V, "voices-v1.0.bin"))
    samples, sr = k.create(TEXT, voice=voice_id, speed=0.97, lang="es")
    path = os.path.join(OUT, f"{name}_crudo.wav"); sf.write(path, samples, sr); return path

def process(path):
    out = path.replace("_crudo", "_procesado")
    # EQ suave (quita grave, presencia), compresión, normalización a -16 LUFS
    af = "highpass=f=80,equalizer=f=3200:t=q:w=1.2:g=2,acompressor=threshold=-20dB:ratio=3:attack=8:release=120,loudnorm=I=-16:TP=-1.5:LRA=7"
    subprocess.run(["ffmpeg","-v","error","-y","-i",path,"-af",af,"-ar","48000","-ac","1",out],check=True)
    return out

jobs = [("1-piper-claude", lambda n: piper(n, "es_MX-claude-high")),
        ("2-piper-ald", lambda n: piper(n, "es_MX-ald-medium")),
        ("3-kokoro-dora", lambda n: kokoro(n, "ef_dora")),
        ("4-kokoro-alex", lambda n: kokoro(n, "em_alex"))]
for name, fn in jobs:
    p = fn(name); q = process(p)
    d = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",q],capture_output=True,text=True).stdout)
    print(f"{name}: {d:.1f} s -> {os.path.relpath(q, ROOT)}")
