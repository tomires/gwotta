import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relative rather than a hardcoded '/repo-name/': works unmodified on
  // GitHub Pages project sites, user/org root sites, or any other subpath.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Elite Skill Tracker',
        short_name: 'Elite Skills',
        description: 'Track captured Guild Wars Elite skills by profession, campaign, and region.',
        theme_color: '#1a1410',
        background_color: '#1a1410',
        display: 'standalone',
        icons: [],
      },
    }),
  ],
})
