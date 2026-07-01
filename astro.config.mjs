// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  output: 'server',
  // maxDuration explícito: el pipeline de análisis (GPT-4o-mini + Minimax M3)
  // puede tardar decenas de segundos, y sin esto Vercel podría aplicar un
  // límite por defecto más bajo que el máximo real permitido por el plan.
  adapter: vercel({ maxDuration: 60 }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    // heic2any solo se importa dinámicamente (src/lib/ensureJpeg.ts) para no
    // sumarlo al bundle inicial. Sin esto, Vite lo descubre recién la primera
    // vez que alguien sube un HEIC en dev, causando un reload/504 transitorio
    // mientras lo pre-optimiza. No afecta el code-splitting en producción.
    optimizeDeps: {
      include: ['heic2any'],
    },
  },
})
