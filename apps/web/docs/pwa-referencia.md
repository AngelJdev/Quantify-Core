# Referencia PWA preservada

Origen: `chore/QUANCORE-42-auditoria-prototipo-web`, commit `6920fc8`, `apps/web/vite.config.ts` y `src/main.tsx`. El prototipo utilizaba `vite-plugin-pwa` 2.0.0, `generateSW`, `registerType: 'prompt'`, manifest español, icono SVG y precache de estáticos. No tenía cache de API ni cola offline. Su evento de actualización no tenía una interfaz que lo consumiera.

La consolidación **no registra un service worker ni instala el plugin**. No ofrece shell offline, cache de datos ni escrituras pendientes. Se preserva esta referencia para recuperar la capacidad de manera deliberada después de decidir despliegue, alcance, actualización y presupuesto de recursos.

Configuración de referencia del prototipo, sin ejecución en esta aplicación:

```ts
VitePWA({
  registerType: 'prompt',
  includeAssets: ['icon.svg'],
  manifest: {
    name: 'Quantify Core', short_name: 'Quantify',
    description: 'Prototipo instalable para el seguimiento consciente de hábitos.',
    theme_color: '#275BC0', background_color: '#F4F7FD', display: 'standalone',
    start_url: './', scope: './', lang: 'es-MX',
    icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
  },
  workbox: {
    navigateFallback: 'index.html',
    globPatterns: ['**/*.{js,css,html,svg,woff2,png,jpeg}'],
    runtimeCaching: [],
  },
  devOptions: { enabled: true },
})
```

Antes de habilitarlo: optimizar la fotografía de ~1,97 MB, preparar iconos autorizados por plataforma, excluir identidad/API/datos privados, diseñar aviso de versión sin perder formularios y verificar cache antigua/primera visita/actualización. La escritura offline requiere política por cuenta, cola, migraciones, claves estables y resolución de conflictos aprobadas; no se implementa con un cache genérico de POST. No reactivar automáticamente el SW de desarrollo de la referencia.
