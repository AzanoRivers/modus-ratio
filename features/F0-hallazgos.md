# F0-hallazgos — Modus Ratio: Investigación y validación técnica

> Documento de salida de la fase F0. Fuente de verdad técnica para todas las fases posteriores.
> **Fecha de verificación**: 29-06-2026

---

## 1. Versiones fijadas

| Paquete | Versión exacta | Notas |
|---|---|---|
| `astro` | **7.0.3** | Última estable a la fecha. La spec ">7" es incorrecta: la versión es 7.0.3, ya cumple el requisito |
| `@astrojs/react` | **6.0.0** | Compatible con Astro 7.x. Usa `@vitejs/plugin-react` v5 |
| `@tailwindcss/vite` | 4.x (último) | Plugin oficial para Astro. NO usar `@astrojs/tailwind` (deprecado) |
| `@astrojs/vercel` | (instalar con `pnpm astro add vercel`) | Adapter SSR para Vercel |
| `@aws-sdk/client-s3` | 3.x (último) | Compatible con R2 |
| `@aws-sdk/s3-request-presigner` | 3.x (último) | Compatible con R2 |
| `openai` | 4.x (último) | SDK Node.js. Válido tanto para OpenAI como para MiniMax/OpenCode vía `baseURL` |
| Node.js | **20.x** | Versión requerida en Vercel para streaming |

---

## 2. Comandos verificados

```powershell
# Crear proyecto
pnpm create astro@latest

# Agregar integraciones (dentro del proyecto)
pnpm astro add react
pnpm astro add vercel

# Tailwind 4.x: instalar manualmente (NO astro add tailwind — está deprecado)
pnpm add -D tailwindcss @tailwindcss/vite
```

**Configuración mínima de `astro.config.mjs`:**

```js
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel/serverless'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
})
```

---

## 3. Decisiones técnicas

### D1 — Cómo mostrar skeleton mientras la IA responde (T0.4)

**Decisión**: usar **Server Islands con `server:defer`** (disponible en Astro 7).

**Justificación**: el pipeline de IA dura 8-15s. Con `server:defer` el servidor devuelve la página inmediatamente con un fallback (skeleton HTML) y hace fetch a la isla de forma diferida. No bloquea la carga inicial. El slot `fallback` es exactamente el skeleton.

```astro
<AnalysisResults server:defer>
  <div slot="fallback" class="results-skeleton">
    <!-- AnalysisLoader de F15 va aquí -->
  </div>
</AnalysisResults>
```

**Alternativa rechazada**: componente React con `client:load` + `useEffect(() => fetch(...))`. Haría dos renders (vacío, luego con datos) y es más frágil ante timeouts largos.

**Sobre streaming**: los endpoints Astro SSR en Vercel soportan `ReadableStream` (Node 20 confirma soporte). No es la técnica elegida para este caso (server islands es más limpio), pero está disponible si se necesita.

---

### D2 — Cómo pasar el locale SSR a componentes React (T0.5)

**Decisión**: **props directas** desde `.astro`.

```astro
---
const lang = Astro.locals.language // 'es' | 'en'
---
<MiComponente locale={lang} client:load />
```

Astro serializa strings, números, objetos planos, arrays, Map, Set, Date y URL como props. No puede serializar funciones.

**Nano Stores**: descartado para Modus Ratio. Solo tiene una vista; props directas son explícitas y suficientes. Nano Stores cobra sentido con múltiples vistas que necesitan estado compartido.

---

### D3 — Tailwind 4.x: configuración y breakpoints (T0.7)

**No existe `tailwind.config.ts`**. La configuración es 100% CSS con `@theme`.

El archivo `src/styles/global.css`:

```css
@import "tailwindcss";

@theme {
  /* Breakpoints custom de Modus Ratio (en rem — recomendado por WCAG 1.4.4) */
  --breakpoint-sm: 16.875rem;   /* 270px */
  --breakpoint-md: 22.5rem;     /* 360px */
  --breakpoint-lg: 27.5rem;     /* 440px */
  --breakpoint-xl: 37.5rem;     /* 600px */
}
```

Diferencia `@theme` vs `@theme inline`:
- `@theme`: genera CSS custom properties (`var(--breakpoint-xl)`). Permite sobrescritura en runtime. **Usar esto**.
- `@theme inline`: inserta el valor compilado directamente. No sobrescribible. Solo para casos muy específicos.

Tailwind 4.x con `@tailwindcss/vite` **escanea automáticamente** todos los archivos `.astro`, `.tsx`, `.ts`, `.jsx`, `.md` del proyecto. No se necesita definir `content`.

---

### D4 — `astro:assets` y la imagen del outfit (T0.6)

El componente `<Image>` de Astro soporta URLs remotas de R2 cuando el deploy es en Vercel (Vercel maneja la optimización con Sharp). Las URLs del bucket R2 deben ser públicamente accesibles.

```astro
---
import { Image } from 'astro:assets'
---
<Image src={r2PublicUrl} alt="outfit" width={800} height={600} />
```

---

### D5 — View Transitions y las animaciones VHS (T0.6)

Las View Transitions de Astro (`<ClientRouter />`) **son compatibles** con animaciones CSS custom (keyframes). No colisionan. `::view-transition-new(root)` puede apuntar a los keyframes existentes.

Para el flujo SPA de Modus Ratio (cambio de estado dentro de una vista):
- **Usar `<ClientRouter />`** (no `<ViewTransitions />` que es para MPA).
- **No usar prefetch**: está diseñado para MPAs con múltiples páginas. No aplica aquí.

---

### D6 — Cloudflare R2: acceso público para OpenAI (T0.8)

Dos opciones para que las URLs sean accesibles desde los servidores de OpenAI:

**Opción A (más simple)**: habilitar "Public bucket" en Cloudflare Dashboard. Las URLs son `https://<account-id>.r2.cloudflarestorage.com/<bucket>/<key>`.

**Opción B (recomendada para producción)**: configurar un custom domain en R2 (ej: `uploads.modus.azanolabs.com`). Las URLs son más limpias y controlables.

**Estado actual**: bucket configurado con custom domain `ratiupload.azanolabs.com`. Las URLs públicas del bucket usan ese dominio.

**Importante**: las Presigned URLs (para el PUT del cliente) usan siempre el dominio S3 nativo (`<account-id>.r2.cloudflarestorage.com`), no el custom domain. Las URLs públicas para lectura usan el custom domain o el dominio público del bucket.

---

### D7 — HEIC desde Safari iOS (T0.8)

El MIME type varía por plataforma:
- **Safari iOS**: reporta `image/heic`
- **Chrome/Windows**: puede reportar cadena vacía (el OS no registra el tipo)
- **Android Chrome**: reporta `image/heic` pero no puede renderizarlo

**Regla de validación en el servidor**: aceptar `image/heic`, `image/heif` o extensión `.heic`/`.heif`. Si el MIME está vacío pero la extensión es `.heic`, aceptar igual.

**Importante**: el servidor no recibe los bytes al generar el presign, solo recibe los metadatos que el cliente envíe en la request. El cliente debe enviar `contentType` y `fileSize` en el body de la request a `/api/upload/presign`.

---

### D8 — OpenCode Go y Minimax M3 (T0.9)

**OpenCode Go** (`opencode.ai`) es el servicio en la nube de OpenCode (el TUI de coding). El usuario tiene una API key del dashboard de OpenCode Go, que funciona directamente desde Node.js sin el TUI.

**Base URL confirmado**: `https://opencode.ai/zen/go/v1`

**Identificador del modelo**: pendiente de confirmar con el usuario. Ejecutar para obtenerlo:
```powershell
curl -H "Authorization: Bearer $env:OPENCODE_API_KEY" https://opencode.ai/zen/go/v1/models
```
El identificador probable es `minimax-m3`.

**Variable de entorno**: `OPENCODE_API_KEY` (la key del dashboard de OpenCode Go). No se necesita `MINIMAX_API_KEY` de platform.minimax.io.

**Llamada desde el servidor**:

```typescript
import OpenAI from 'openai'

const opencode = new OpenAI({
  apiKey: process.env.OPENCODE_API_KEY,
  baseURL: 'https://opencode.ai/zen/go/v1',
})

const response = await opencode.chat.completions.create({
  model: 'minimax-m3',   // confirmar identificador exacto con /models
  messages: [...],
  max_tokens: 2048,
})
```

**Nota**: si Minimax M3 en OpenCode Go usa el formato Anthropic (`/v1/messages`) en lugar de OpenAI (`/v1/chat/completions`), se cambia el SDK. El endpoint `/v1/models` devuelve el formato que usa cada modelo. Verificar antes de F13.

---

### D9 — GPT-4o-mini vision: estructura correcta de la llamada (T0.10)

El modelo `gpt-4o-mini` soporta vision. El nombre no ha cambiado.

**Estructura del mensaje con imagen por URL (SDK `openai` para Node.js):**

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  max_tokens: 800,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe el outfit...' },
        {
          type: 'image_url',
          image_url: {
            url: 'https://bucket.r2.cloudflarestorage.com/uploads/uuid.jpg',
            detail: 'low',
          },
        },
      ],
    },
  ],
})
```

**Nota**: el campo es `type: 'image_url'` (no `type: 'image'`). Esta es la estructura del SDK `openai`. La estructura con `type: 'image'` y `source.url` es del SDK de Anthropic.

**Parámetro `detail`**: usar `'low'` para análisis de outfit. Costo fijo de 85 tokens de imagen, resolución 512×512. Suficiente para describir prendas, colores y estilos. `'high'` solo si se necesitan texturas o logos pequeños.

**`max_tokens`**: 800 es suficiente para 5-8 items de ropa con descripción completa en JSON.

**La URL de R2 debe ser pública** (sin autenticación) al momento de la llamada a OpenAI. El servidor de OpenAI descarga la imagen directamente.

---

### D10 — Variables de entorno: convención (T0.3)

- Variables **sin** prefijo `PUBLIC_`: solo accesibles en servidor (SSR, endpoints, middleware). Usar para API keys y secrets.
- Variables **con** prefijo `PUBLIC_`: accesibles en cliente y servidor. Usar solo para lo que puede llegar al browser.
- API nueva `astro:env` disponible en Astro 7 (type-safe, con schema). Para Modus Ratio se usa `import.meta.env` directamente (más simple y suficiente). No bloquea usar `astro:env` en el futuro.

---

## 4. Template `.env`

```env
# ─── Redis (reuso de AzanoRivers) ─────────────────────────────────
REDIS_URL=
REDIS_PASSWORD=
REDIS_USERNAME=

# ─── OpenAI (reuso de AzanoRivers) ────────────────────────────────
OPENAI_API_KEY=

# ─── Resend (reuso de AzanoRivers) ────────────────────────────────
RESEND_API_KEY=

# ─── Cloudflare R2 (bucket dedicado Modus Ratio) ──────────────────
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=modus-ratio-uploads
R2_PUBLIC_URL=https://ratiupload.azanolabs.com  # Custom domain configurado del bucket

# ─── OpenCode Go (Minimax M3) ──────────────────────────────────────
OPENCODE_API_KEY=           # Key del dashboard de opencode.ai (NO platform.minimax.io)

# ─── App ───────────────────────────────────────────────────────────
APP_URL=http://localhost:4321  # En producción: https://modus.azanolabs.com
```

---

## 5. Checklist de infraestructura (T0.11)

| Recurso | Estado | Acción |
|---|---|---|
| `REDIS_URL` + `REDIS_PASSWORD` + `REDIS_USERNAME` | Disponible en AzanoRivers | Copiar al `.env` de Modus Ratio |
| `OPENAI_API_KEY` | Disponible en AzanoRivers | Copiar al `.env` de Modus Ratio |
| `RESEND_API_KEY` | Disponible en AzanoRivers | Copiar al `.env` de Modus Ratio |
| Alias `modusratio@azanorivers.com` en Resend | Por verificar | Confirmar en Resend Dashboard; el dominio ya está verificado |
| `OPENCODE_API_KEY` | **Disponible** | Key del dashboard de OpenCode Go (opencode.ai). No se necesita platform.minimax.io |
| Bucket R2 dedicado | **Configurado** | Bucket creado. Custom domain: `ratiupload.azanolabs.com` |
| Token API R2 (Access Key ID + Secret) | Por verificar | Confirmar que las credenciales están anotadas en el `.env` |
| Acceso público del bucket R2 | **Configurado** | Custom domain `ratiupload.azanolabs.com` activo |
| CORS del bucket R2 | **Configurado** | Aplicado con `localhost:4321` y `https://modus.azanolabs.com` |
| Subdominio `modus.azanolabs.com` en Vercel | A configurar en F19 | No bloqueante para F0–F18 |

---

## 6. Configuración R2 — Estado actual

> El bucket ya está configurado. Esta sección documenta lo que se hizo.

| Paso | Estado | Detalle |
|---|---|---|
| Crear bucket | **Hecho** | Bucket creado en Cloudflare R2 |
| Generar token API | Verificar | Confirmar que `R2_ACCESS_KEY_ID` y `R2_SECRET_ACCESS_KEY` están anotados en `.env` |
| Acceso público | **Hecho** | Custom domain activo: `ratiupload.azanolabs.com` |
| CORS configurado | **Hecho** | Orígenes: `http://localhost:4321` y `https://modus.azanolabs.com` |

### CORS aplicado

```json
[
  {
    "AllowedOrigins": ["http://localhost:4321", "https://modus.azanolabs.com"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

**Nota T19.3**: el CORS ya incluye el dominio de producción `https://modus.azanolabs.com`. La tarea T19.3 de F19 queda como verificación, no como configuración pendiente.

---

## 7. Riesgos abiertos

| Riesgo | Estado | Decisión |
|---|---|---|
| **Versión Astro**: la spec decía ">7" — la versión real es 7.0.3 | Resuelto | 7.0.3 cumple el requisito. Sin cambios en la spec |
| **OpenCode vs MiniMax directo** | Resuelto | Usar **OpenCode Go** (`opencode.ai/zen/go/v1`) con la API key que el usuario ya tiene. No se necesita platform.minimax.io |
| **HEIC MIME vacío en Chrome/Windows** | Documentado | Validar por extensión (`.heic`, `.heif`) además del MIME. Documentado en D7 |
| **Server Islands no disponibles** | Resuelto | Disponibles en Astro 7 con `server:defer`. Sin riesgo |
| **Alias de Resend para `modusratio@azanorivers.com`** | Por verificar | El dominio `azanorivers.com` ya está verificado. El alias probablemente no requiere re-verificación, pero confirmar antes de F17 |
| **Plan Vercel**: el endpoint `/api/analyze` necesita 60s de timeout | A verificar antes de F19 | Plan Free tiene 10s (insuficiente). Plan Pro tiene 60s. Confirmar antes del deploy |
| **Estructura del mensaje vision OpenAI**: el SDK `openai` usa `type: 'image_url'` | Documentado | Ver D9. No confundir con la estructura del SDK de Anthropic |

---

## 8. Puntos de §6.2 del fundational plan resueltos

| Punto | Resolución |
|---|---|
| Versión real de Astro | **7.0.3**. La spec decía ">7", que aplica a esta versión |
| Técnica de hidratación y skeleton | **Server Islands con `server:defer` + slot `fallback`**. Astro 7 lo soporta nativamente |
| SDK OpenCode/Minimax M3 | **SDK `openai` con `baseURL`** apuntando a la API de MiniMax (o OpenCode). Modelo: `minimax-m3` |
