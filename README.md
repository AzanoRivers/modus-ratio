# Modus Ratio

Analizador de outfits con IA para AzanoLabs. El usuario sube una foto de su outfit, indica el estilo que quiere lograr (y opcionalmente altura, tono de piel, contextura y preferencia de género), y la app devuelve un puntaje por dimensión, alertas, un punto fuerte y recomendaciones concretas, todo personalizado a la imagen real.

## Qué hace

1. El usuario completa un formulario corto y sube una foto.
2. La foto se sube directo desde el navegador a Cloudflare R2 (nunca pasa por el servidor de la app).
3. Un modelo de visión (GPT-4o-mini) extrae una descripción estructurada del outfit a partir de la URL pública de la imagen (prendas, colores, patrones, silueta, etc.). Si la imagen no es analizable (no hay persona, no es ropa, calidad muy baja, contenido inapropiado), se rechaza en este paso con un motivo específico.
4. Un modelo de lenguaje (glm-5.2, vía el proxy de OpenCode) puntúa el outfit en 5 dimensiones (armonía de color, coherencia de estilo, ajuste/silueta, originalidad, encaje con el estilo elegido), calcula un puntaje global ponderado según el estilo declarado, y redacta una reseña personalizada por cada score, alerta, punto fuerte y recomendación.
5. La imagen se elimina de R2 (ver [Privacidad y manejo de datos](#privacidad-y-manejo-de-datos)).
6. El usuario ve los resultados y puede analizar otro outfit.

## Stack

- **Framework**: Astro 7 (SSR, `output: 'server'`) + React 19 para las partes interactivas
- **Estilos**: Tailwind CSS 4 (`@theme`, sin `tailwind.config`) + diseño atómico (atoms/molecules/organisms/templates)
- **Estado**: Zustand (persistencia parcial en `localStorage`: solo preferencias de formulario y timestamps de uso, nunca imágenes ni resultados)
- **IA**: OpenAI `gpt-4o-mini` (descripción visual) + `glm-5.2` vía [OpenCode](https://opencode.ai) (scoring y redacción)
- **Almacenamiento de imágenes**: Cloudflare R2, subida directa desde el cliente con URLs prefirmadas
- **Rate limiting**: Redis
- **Alertas**: Resend (email a un destinatario interno cuando algo falla técnicamente)
- **Deploy**: Vercel (`@astrojs/vercel`, funciones serverless)

## Privacidad y manejo de datos

Esto es lo más importante a entender antes de tocar el pipeline de análisis:

- **La imagen nunca pasa por el servidor de la app.** El cliente pide una URL prefirmada (`POST /api/upload/presign`) y sube el archivo directo a Cloudflare R2 vía `PUT`. La URL prefirmada expira en 5 minutos.
- **La imagen se le pasa a GPT-4o-mini como URL pública** del bucket de R2 (no como base64), con el parámetro `detail: 'low'`, que reduce la resolución con la que OpenAI procesa la imagen (menor costo y latencia).
- **Si el análisis se completa (éxito o rechazo del modelo), la imagen se borra de R2 inmediatamente** al terminar la request.
- **Si el análisis falla por un error técnico, la imagen no se borra al instante**, pero un barrido de limpieza (`cleanupOrphanUploads`) corre después de cada intento fallido y en cada análisis exitoso, y elimina cualquier objeto en `uploads/` con más de 15 minutos de antigüedad. En el peor caso (el usuario cierra la pestaña a mitad de proceso, o el análisis falla), la imagen no vive en R2 más de ~15 minutos.
- **No hay base de datos**: no se guarda la imagen, la descripción extraída ni los resultados del análisis en ningún lado más allá de la sesión del navegador del usuario. No se usa para entrenar modelos.
- **Lo único persistido en el cliente** (`localStorage`, vía Zustand) son las preferencias del formulario (para no tener que reescribirlas) y los timestamps de uso (para calcular el límite de 25 análisis/hora del propio usuario).

## Seguridad y límites de uso

- **Límite de uso**: 25 análisis por hora por IP.
- **Ban de seguridad**: una IP que excede varias veces ese límite en la misma hora queda bloqueada 24 horas.
- **Bloqueo por abuso de imágenes inválidas**: 3 imágenes rechazadas por el modelo (fotos de objetos, mascotas, etc., en vez de outfits) en 10 minutos bloquean nuevos análisis desde esa IP por 15 minutos. Es independiente del límite de 25/hora.

## Requisitos

- Node.js ≥ 22.12
- pnpm
- Cuentas/credenciales de: Cloudflare R2, OpenAI, OpenCode, Redis, Resend (ver variables de entorno abajo)

## Variables de entorno

Copiá `.env.example` a `.env` y completá los valores reales (nunca commitear `.env`, ya está en `.gitignore`):

| Grupo | Variables | Para qué |
|---|---|---|
| Redis | `REDIS_URL`, `REDIS_PASSWORD`, `REDIS_USERNAME` | Rate limiting (límite de uso, bans, bloqueos) |
| Cloudflare R2 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Almacenamiento temporal de las fotos subidas |
| OpenAI | `OPENAI_API_KEY` | Extracción de la descripción visual del outfit (GPT-4o-mini) |
| OpenCode | `OPENCODE_API_KEY` | Scoring y redacción de resultados (glm-5.2) |
| Resend | `RESEND_API_KEY` | Alertas por email cuando algo falla técnicamente |
| App | `APP_URL` (opcional, default `http://localhost:4321`) | URL base de la app |

## Desarrollo local

```bash
pnpm install
cp .env.example .env   # y completar con las credenciales reales
pnpm dev
```

Otros comandos:

```bash
pnpm build              # build de producción
pnpm preview            # sirve el build de producción localmente
pnpm exec astro check   # chequeo de tipos (usar esto, no tsc directo)
```

## Estructura del proyecto

```
src/
├── components/       # Diseño atómico: atoms, molecules, organisms, templates
├── i18n/             # Diccionarios es/en, tipados
├── layouts/          # Layouts base de Astro
├── lib/              # Lógica de servidor: env, R2, IA, prompts, rate limit, validación
│   ├── client/       # Código que corre en el navegador (subida directa a R2)
│   └── prompts/      # Prompts de sistema para GPT-4o-mini y glm-5.2
├── pages/            # Rutas de Astro
│   └── api/          # Endpoints: presign, analyze
├── store/            # Estado global (Zustand)
└── styles/           # CSS global y tokens de Tailwind
```

## Deploy

Se despliega en Vercel con el adapter `@astrojs/vercel`, con `maxDuration: 60` configurado explícitamente (`astro.config.mjs`) porque el pipeline de IA (descripción + scoring) puede tardar decenas de segundos.
