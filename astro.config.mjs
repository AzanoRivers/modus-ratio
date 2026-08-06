// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  output: 'server',
  // maxDuration explícito: el pipeline de análisis tiene 2 pasos (extracción
  // de imagen + scoring de contexto), cada uno con su propio modelo de
  // fallback (ver src/lib/env.ts), así que en el peor caso hay hasta 4
  // llamadas a IA en serie dentro de una misma request. Presupuesto de
  // timeouts: 15s + 15s + 40s + 15s = 85s (ver los timeouts en
  // extractOutfitDescription.ts y analyzeOutfitScore.ts); 100s deja margen
  // sin acercarse al máximo de 300s del plan Hobby/Pro con Fluid Compute.
  adapter: vercel({ maxDuration: 100 }),
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
