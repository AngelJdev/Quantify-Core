import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Quantify Core',
        short_name: 'Quantify',
        description: 'Prototipo instalable para el seguimiento consciente de hábitos.',
        theme_color: '#275BC0',
        background_color: '#F4F7FD',
        display: 'standalone',
        start_url: './',
        scope: './',
        lang: 'es-MX',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2,png,jpeg}'],
        runtimeCaching: [],
      },
      devOptions: { enabled: true },
    }),
  ],
})
