#!/usr/bin/env bash
# QA técnico de un video final. Uso: scripts/qa_video.sh output/archivo.mp4 [tiempos_planeados_csv]
V="$1"; P="${2:-}"
echo "== ffprobe"; ffprobe -v error -show_entries stream=codec_name,profile,width,height,r_frame_rate,pix_fmt,sample_aspect_ratio,sample_rate,channels,nb_frames -show_entries format=duration,size,bit_rate -of default=nw=1 "$V" | tr '\n' ' '; echo
echo "== negros"; ffmpeg -v info -i "$V" -vf blackdetect=d=0.1:pix_th=0.04 -an -f null - 2>&1 | grep -E "black_(start|end)" | head
echo "== congelados (>0.8 s)"; ffmpeg -v info -i "$V" -vf freezedetect=n=-60dB:d=0.8 -an -f null - 2>&1 | grep -E "freeze_(start|duration)" | paste - - | sed 's/\[Parsed[^]]*\] lavfi.freezedetect.//g' | head
echo "== audio"; ffmpeg -nostats -i "$V" -af ebur128=peak=true -vn -f null - 2>&1 | grep -E " I:| Peak:| LRA:" | tail -3
echo "== silencios (>1.5 s)"; ffmpeg -v info -i "$V" -af silencedetect=n=-50dB:d=1.5 -vn -f null - 2>&1 | grep -E "silence_(start|end)" | head -4
echo "== movimiento"; python3 "$(dirname "$0")/motion_qa.py" "$V" "$P"
