# Verificación financiera (hipótesis de trabajo)

Origen: `docs/Practica04/README.md` (21/10/2026). **Escenario hipotético; no son resultados comerciales.**

Supuestos: 1 USD = MX$18.4823; suscripción MX$99/mes; comisión 15%; 4 personas a MX$388,000/año (costo de oportunidad, no gasto real); infraestructura US$69/mes; variable US$0.41/usuario (IA 0.34 + 0.07).

| Concepto | Calculado | Documento | Resultado |
|---|---|---|---|
| Precio (US$) | 5.356 | 5.36 | ✓ (tolerancia ±0.01) |
| Neto tras comisión (MX$) | 84.150 | 84.15 | ✓ (tolerancia ±0.005) |
| Neto tras comisión (US$) | 4.553 | 4.55 | ✓ (tolerancia ±0.01) |
| Equipo mensual (US$) | 6,997.686 | 6,998 | ✓ (tolerancia ±1) |
| Costo fijo mensual (US$) | 7,066.686 | 7,067 | ✓ (tolerancia ±1) |
| Margen de contribución (US$) | 4.143 | 4.14 | ✓ (tolerancia ±0.01) |
| Margen (%) | 90.995 | 91 | ✓ (tolerancia ±0.5) |
| Piloto 1,000 usuarios (US$) | 7,404.686 | 7,405 | ✓ (tolerancia ±1) |
| Piloto 1,000 usuarios (MX$) | 136,855.629 | 136,854 | ✓ (tolerancia ±15) |
| Equilibrio (suscriptores) | 1,705.691 | 1,700 | ✓ (tolerancia ±10) |
| Precio de equilibrio a 10,000 (MX$) | 22.894 | 23 | ✓ (tolerancia ±1) |

Nota: el escenario de 10,000 usuarios del documento usa un costo total de US$10,529 (variable implícito ≈0.346), distinto del 0.41 usado en el margen de contribución; se conserva tal cual y se declara aquí.
Equilibrio con variable solo de IA (0.34): 1,677 suscriptores.
Conclusión: en el video se muestra «≈1,700 suscriptores premium» como escenario hipotético.
