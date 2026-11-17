import 'package:flutter/material.dart';

/// Paleta de colores canónica de Quantify Core V2.0
/// Definida en packages/design-tokens y docs/diseno/README.md
class AppColors {
  AppColors._();

  // Primarios de marca
  static const Color laserBlue = Color(0xFF275BC0);
  static const Color skyLaser = Color(0xFF4A7DE8);
  static const Color deepCobalt = Color(0xFF183D87);

  // Superficies y neutros oscuros
  static const Color obsidianSlate = Color(0xFF0B0F17);
  static const Color midnightNavy = Color(0xFF161F2E);
  static const Color surfaceDark = Color(0xFF1F2A3D);
  static const Color steelBorder = Color(0xFF283548);
  static const Color coolGray = Color(0xFF8A99AD);

  // Superficies y neutros claros
  static const Color pureMist = Color(0xFFF4F7FD);
  static const Color opticalWhite = Color(0xFFFFFFFF);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color textLight = Color(0xFF0F172A);

  // Colores semánticos de estado
  static const Color emerald = Color(0xFF10B981); // Éxito / Rachas activas
  static const Color amber = Color(0xFFF59E0B);   // Advertencia / Pendiente
  static const Color crimson = Color(0xFFEF4444); // Error / Ruptura
  static const Color electricCyan = Color(0xFF0EA5E9); // IA y métricas
}
