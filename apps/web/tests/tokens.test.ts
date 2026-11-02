import { describe, it, expect } from 'vitest';
import { designTokens, getCurrentTheme, applyTheme } from '@/shared/tokens';

describe('Design Tokens Adapter', () => {
  it('debe cargar los metadatos y colores canónicos de packages/design-tokens', () => {
    expect(designTokens.font).toBe('Inter');
    expect(designTokens.colors.laserBlue).toBe('#275BC0');
    expect(designTokens.colors.emerald).toBe('#10B981');
    expect(designTokens.colors.obsidian).toBe('#0B0F17');
  });

  it('debe contar con las definiciones de temas claro y oscuro', () => {
    expect(designTokens.themes.light).toBeDefined();
    expect(designTokens.themes.dark).toBeDefined();
    expect(designTokens.themes.light.action).toBe('laserBlue');
    expect(designTokens.themes.dark.action).toBe('laserBlue');
  });

  it('debe aplicar y alternar el tema visual mediante el atributo data-qc-theme', () => {
    applyTheme('dark');
    expect(getCurrentTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-qc-theme')).toBe('dark');

    applyTheme('light');
    expect(getCurrentTheme()).toBe('light');
    expect(document.documentElement.getAttribute('data-qc-theme')).toBe('light');
  });
});

