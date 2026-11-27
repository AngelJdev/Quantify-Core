#!/usr/bin/env bash
# Corta la música al compás (inicio 41.216 s = compás 2 de la ventana detectada) y la mezcla con los SFX.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=.cache/music/mixkit-162.mp3   # «Minimal Techno 01», Alejandro Magaña (A. M.), Mixkit Stock Music Free License
DUR=14.96
mkdir -p audio/mix
ffmpeg -v error -y -ss 41.216 -t $DUR -i "$SRC" -af "loudnorm=I=-17:TP=-2:LRA=7,afade=t=in:d=0.12,afade=t=out:st=13.96:d=1.0" -ar 48000 -ac 2 .cache/pilot-music.wav
ffmpeg -v error -y -i .cache/pilot-music.wav -i audio/sfx/pilot-sfx.wav \
  -filter_complex "[0:a]volume=1.0[m];[1:a]volume=1.0,apad=whole_dur=$DUR[s];[m][s]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=7,alimiter=limit=0.89,atrim=0:$DUR" \
  -ar 48000 -ac 2 audio/mix/pilot-mix.wav
ffmpeg -nostats -i audio/mix/pilot-mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
