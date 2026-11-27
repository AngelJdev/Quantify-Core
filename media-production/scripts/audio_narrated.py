#!/usr/bin/env python3
"""Mezcla de un video narrado: narración + música con ducking + SFX sincronizados a timeline.js. Uso: audio_narrated.py video-02-demo"""
import json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, os.path.join(ROOT, "vendor", "claude-motion"))
from sfx.mix import Mix
from sfx.synth import blip, chime, click, impact, pop, riser, whoosh
video = sys.argv[1]
T = json.loads(re.search(r"=(.*);", open(os.path.join(ROOT, video, "timeline.js"), encoding="utf-8").read(), re.S).group(1)); L = T["lines"]; TOTAL = T["total"]
ls = lambda i, o=0.0: L[i]["start"] + o
m = Mix(TOTAL); put = m.put
def trans(i, kind="w"): put(ls(i, -0.4), whoosh(0.7, 400, 3000, peak=0.5), 0.12)
def tick(t, k=0): put(t, pop(900 + k * 110, 400 + k * 30), 0.10, -0.2 + 0.1 * k)
def cue_v2():
    for i in range(12): trans(i)
    for i in range(12): tick(ls(i, 0.3))
    for k in range(4): tick(ls(1, 3.9 + k * 0.8), k)
    for k, o in enumerate((3.0, 4.8, 6.5)): tick(ls(2, o), k)
    put(ls(3, 2.5), click(1700), 0.22); put(ls(3, 4.5), click(1700), 0.22); put(ls(3, 2.54), blip(880, 0.4, 0.12), 0.10); put(ls(3, 4.54), chime([987.77, 1479.98, 1975.53], dur=1.6, tau=0.6), 0.10)
    for k, o in enumerate((2.3, 3.6, 4.9, 6.2)): tick(ls(4, o), k)
    for k, o in enumerate((2.7, 4.0)): tick(ls(5, o), k)
    for o in (2.6, 4.9): put(ls(6, o) - 0.05, whoosh(0.6, 600, 3400, peak=0.4), 0.08)
    put(ls(6, 4.1), blip(990, 0.4, 0.12), 0.09); put(ls(7, 2.0), blip(880, 0.35, 0.1), 0.09); put(ls(7, 4.6), blip(990, 0.35, 0.1), 0.09)
    put(ls(8, 1.3), whoosh(1.0, 300, 4200, peak=0.7), 0.10); put(ls(8, 5.6), pop(700, 340), 0.14)
    for k in range(4): put(ls(9, 1.2 + k * 0.5 - 0.1 if k else -0.3), whoosh(0.7, 500, 2800, peak=0.5), 0.09, -0.4 + 0.3 * k)
    for k, o in enumerate((1.8, 3.7, 5.4)): put(ls(10, o), chime([1174.7 + k * 150, 1760.0], dur=1.4, tau=0.6), 0.08); tick(ls(10, o), k)
    put(ls(11, 0) - 0.9, riser(0.9, 400, 5200), 0.09); put(ls(11, 0), impact(1.2), 0.20); put(ls(11, 0.6), chime([1174.7, 1568.0, 2349.3], dur=2.2, tau=0.8), 0.10)
    for k, o in enumerate((1.7, 1.8, 2.2, 2.34)): put(ls(11, o), whoosh(0.3, 600, 2600, peak=0.45), 0.07, -0.3 + 0.2 * k)
def cue_v3():
    for i in range(13): trans(i)
    for i in range(13): tick(ls(i, 0.3))
    for k in range(12): put(ls(0, 1.4 + 0.12 * k), click(2100 + 25 * k, 0.03), 0.05, -0.3 + 0.05 * k)
    for k in range(12): put(ls(0, 5.9 + 0.07 * k), pop(500 + 12 * k, 300), 0.04)
    for k, o in enumerate((2.7, 4.0, 5.1)): put(ls(1, o), chime([1174.7 + k * 200, 1760.0], dur=1.4, tau=0.6), 0.08); tick(ls(1, o), k)
    tick(ls(2, 1.8)); put(ls(2, 4.4), whoosh(0.5, 400, 2400, peak=0.5), 0.10); put(ls(2, 5.2), chime([1318.5, 1975.5], dur=1.2, tau=0.5), 0.09)
    tick(ls(3, 1.4)); put(ls(3, 3.6), click(1500), 0.22); put(ls(3, 3.65), chime([1318.5, 1975.5], dur=1.2, tau=0.5), 0.09)
    for o in (2.6, 3.4, 6.0): tick(ls(4, o), 1)
    for k, o in enumerate((1.8, 3.9, 6.0, 7.7, 9.1, 11.0)): tick(ls(5, o), k)
    for o in (6.0, 7.9, 9.3, 11.2): put(ls(5, o), whoosh(0.5, 500, 2600, peak=0.4), 0.08)
    put(ls(5, 10.1), whoosh(0.8, 300, 2400, peak=0.6), 0.09)
    put(ls(6, 2.2), riser(1.6, 400, 4800), 0.08); put(ls(6, 3.9), chime([1174.7, 1568.0, 2349.3], dur=1.8, tau=0.7), 0.10)
    for k, o in enumerate((5.3, 6.1, 6.9)): tick(ls(6, o), k)
    tick(ls(7, 3.4)); tick(ls(7, 6.0), 2); put(ls(7, 8.3), chime([1318.5, 1975.5], dur=1.4, tau=0.6), 0.08)
    put(ls(8, 1.7), riser(1.8, 400, 4800), 0.08); put(ls(8, 1.9), whoosh(1.6, 300, 2000, peak=0.5), 0.08)
    for k, o in enumerate((5.6, 7.0, 8.4, 10.0)): tick(ls(8, o), k)
    put(ls(9, 1.0), whoosh(1.2, 300, 2000, peak=0.5), 0.08); put(ls(9, 1.6), whoosh(1.3, 300, 2200, peak=0.5), 0.08)
    put(ls(9, 3.4), impact(1.2), 0.20); put(ls(9, 3.4), chime([1174.7, 1568.0, 2349.3], dur=2.0, tau=0.8), 0.10)
    for k, o in enumerate((2.3, 3.6, 6.1, 7.0)): tick(ls(10, o), k)
    for k in range(4): tick(ls(11, 0.8 + 0.45 * k), k)
    put(ls(12, 0) - 1.0, riser(1.0, 400, 5200), 0.09); put(ls(12, 0.5), chime([1174.7, 1568.0, 2349.3], dur=2.2, tau=0.8), 0.10); put(ls(12, 3.5), chime([1318.5, 1760.0], dur=2.0, tau=0.8), 0.08)
CUES = {"video-02-demo": (cue_v2, "mixkit-175.mp3", 0.0), "video-03-impact": (cue_v3, "mixkit-173.mp3", 0.0)}
cue, music_file, music_start = CUES[video]; cue(); m.master(target_lufs=-24.0, fade_out=0.4)
sfx = os.path.join(ROOT, "audio/sfx", video + "-sfx.wav"); os.makedirs(os.path.dirname(sfx), exist_ok=True); m.write(sfx)
narr = os.path.join(ROOT, "audio/narration", video + ".wav"); cache = os.path.join(ROOT, ".cache"); out = os.path.join(ROOT, "audio/mix", video + ".wav"); os.makedirs(os.path.dirname(out), exist_ok=True)
music = os.path.join(cache, video + "-music.wav")
src = os.path.join(cache, "music", music_file); dur = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",src],capture_output=True,text=True).stdout)
if TOTAL > dur - 1: subprocess.run(["ffmpeg","-v","error","-y","-i",src,"-i",src,"-filter_complex","[0][1]acrossfade=d=5","-ar","48000","-ac","2",os.path.join(cache, video + "-loop.wav")],check=True); src = os.path.join(cache, video + "-loop.wav")
subprocess.run(["ffmpeg","-v","error","-y","-ss",str(music_start),"-i",src,"-t",str(TOTAL),"-af",f"loudnorm=I=-22:TP=-2:LRA=7,afade=t=in:d=1.5,afade=t=out:st={TOTAL-3}:d=3","-ar","48000","-ac","2",music],check=True)
fc = f"[2:a]asplit=2[nk][nm];[0:a][nk]sidechaincompress=threshold=0.015:ratio=10:attack=15:release=700:makeup=1[duck];[1:a]apad=whole_dur={TOTAL}[s];[duck][s][nm]amix=inputs=3:duration=first:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=9,alimiter=limit=0.89,apad=whole_dur={TOTAL},atrim=0:{TOTAL}"
subprocess.run(["ffmpeg","-v","error","-y","-i",music,"-i",sfx,"-i",narr,"-filter_complex",fc,"-ar","48000","-ac","2",out],check=True)
r = subprocess.run(["ffmpeg","-nostats","-i",out,"-af","ebur128=peak=true","-f","null","-"],capture_output=True,text=True).stderr
print(video, "\n".join(l for l in r.splitlines() if " I:" in l or "Peak:" in l)[-90:])
