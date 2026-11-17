"""Subconjunto de Inter local para incrustar la fuente en las láminas SVG.

Requiere fonttools y brotli, herramientas de autoría; no son dependencias web.
La licencia original se conserva en assets/inter-license.txt.
"""
from pathlib import Path
from fontTools import subset

assets = Path(__file__).resolve().parent.parent / "assets"
options = subset.Options()
options.flavor = "woff2"
options.recalc_timestamp = False
font = subset.load_font(str(assets / "inter.woff2"), options)
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=list(range(0x20, 0x100)) + [0x2013, 0x2014, 0x2019, 0x2022, 0x2026, 0x2192, 0x2713])
subsetter.subset(font)
subset.save_font(font, str(assets / "inter-islas.woff2"), options)
print("Inter Latin: subconjunto local para láminas independientes.")
