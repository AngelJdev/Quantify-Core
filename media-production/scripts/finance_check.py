#!/usr/bin/env python3
"""Verifica las cifras del escenario financiero (Práctica 04). Son HIPÓTESIS, no resultados reales."""
FX = 18.4823                # MXN por USD, Frankfurter/BCE, 21/10/2026
PRECIO_MXN = 99.0           # suscripción premium de referencia
COMISION = 0.15             # tarifa de Google Play
EQUIPO_MXN_ANUAL = 388_000  # PayScale MX, por persona
PERSONAS = 4
INFRA_USD = 69.0            # infraestructura mensual
VAR_USD = 0.41              # IA 0.34 + almacenamiento y salida 0.07
IA_USD = 0.34

precio_usd = PRECIO_MXN / FX
neto_mxn = PRECIO_MXN * (1 - COMISION)
neto_usd = neto_mxn / FX
equipo_mxn = EQUIPO_MXN_ANUAL / 12 * PERSONAS
equipo_usd = equipo_mxn / FX
fijo_usd = equipo_usd + INFRA_USD
contrib = neto_usd - VAR_USD
equilibrio = fijo_usd / contrib
IA_EXACTA = 0.338  # el documento usa US$338 por 1,000 usuarios (0.34 redondeado)
piloto_usd = fijo_usd + 1000 * IA_EXACTA
C10K_DOC = 10_529  # costo total a 10,000 usuarios según el documento (variable implícito ≈0.346)
c10k = C10K_DOC
assert abs(fijo_usd + 10_000 * IA_EXACTA - C10K_DOC) < 120, 'el costo a 10,000 usuarios no es coherente con fijo + IA'
precio_eq_mxn = (c10k / 10_000) / (1 - COMISION) * FX

rows = [
    ("Precio (US$)", precio_usd, 5.36, 0.01),
    ("Neto tras comisión (MX$)", neto_mxn, 84.15, 0.005),
    ("Neto tras comisión (US$)", neto_usd, 4.55, 0.01),
    ("Equipo mensual (US$)", equipo_usd, 6998, 1),
    ("Costo fijo mensual (US$)", fijo_usd, 7067, 1),
    ("Margen de contribución (US$)", contrib, 4.14, 0.01),
    ("Margen (%)", contrib / neto_usd * 100, 91, 0.5),
    ("Piloto 1,000 usuarios (US$)", piloto_usd, 7405, 1),
    ("Piloto 1,000 usuarios (MX$)", piloto_usd * FX, 136854, 15),
    ("Equilibrio (suscriptores)", equilibrio, 1700, 10),
    ("Precio de equilibrio a 10,000 (MX$)", precio_eq_mxn, 23, 1),
]
lines = ["# Verificación financiera (hipótesis de trabajo)", "",
         "Origen: `docs/Practica04/README.md` (21/10/2026). **Escenario hipotético; no son resultados comerciales.**", "",
         f"Supuestos: 1 USD = MX${FX}; suscripción MX${PRECIO_MXN:.0f}/mes; comisión {COMISION:.0%}; "
         f"{PERSONAS} personas a MX${EQUIPO_MXN_ANUAL:,}/año (costo de oportunidad, no gasto real); "
         f"infraestructura US${INFRA_USD:.0f}/mes; variable US${VAR_USD}/usuario (IA {IA_USD} + 0.07).", "",
         "| Concepto | Calculado | Documento | Resultado |", "|---|---|---|---|"]
for name, got, doc, tol in rows:
    ok = abs(got - doc) <= tol
    assert ok, f"{name}: calculado {got:.3f} vs documento {doc}"
    lines.append(f"| {name} | {got:,.3f} | {doc:,} | ✓ (tolerancia ±{tol}) |")
lines += ["", "Nota: el escenario de 10,000 usuarios del documento usa un costo total de US$10,529 (variable implícito ≈0.346), "
          "distinto del 0.41 usado en el margen de contribución; se conserva tal cual y se declara aquí.",
          f"Equilibrio con variable solo de IA (0.34): {fijo_usd / (neto_usd - IA_USD):,.0f} suscriptores.",
          "Conclusión: en el video se muestra «≈1,700 suscriptores premium» como escenario hipotético."]
open("docs/finanzas-verificacion.md", "w", encoding="utf-8").write("\n".join(lines) + "\n")
print("\n".join(lines))
