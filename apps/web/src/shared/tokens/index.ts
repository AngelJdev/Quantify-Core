/**
 * Adaptador de tokens de diseño para Quantify Web.
 * Se vincula con packages/design-tokens/preview.json y themes.css.
 */
import tokensData from '@tokens/preview.json';

export const designTokens = {
  version: tokensData.version,
  font: tokensData.font,
  colors: tokensData.colors,
  themes: tokensData.themes,
  space: tokensData.space,
  radius: tokensData.radius,
  fontSize: tokensData.fontSize,
  typography: tokensData.typography,
} as const;

export type ThemeMode = 'light' | 'dark';

/**
 * Obtiene el tema actual aplicado en el documento.
 */
export function getCurrentTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'light';
  const current = document.documentElement.getAttribute('data-qc-theme');
  return current === 'dark' ? 'dark' : 'light';
}

/**
 * Establece el tema en el elemento raíz HTML según las variables de themes.css.
 */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-qc-theme', theme);
  try {
    localStorage.setItem('qc-theme', theme);
  } catch {
    // Modo privado o sin almacenamiento disponible
  }
}

