# 29062026 - Fundation Plan (Modus Ratio)

> Plan **general / fundacional**. Define las fases macro del proyecto en orden estricto de dependencia: cada fase consume entregables de la anterior y deja todo lo que necesitan las posteriores. No es un plan de implementación detallado: cada fase se desarrollará después en su **sub-plan dedicado** (ver convención al final).

- **Proyecto**: Modus Ratio (web app para puntuar outfits con IA).
- **Fecha**: 29-06-2026.
- **Estado**: revisado con el usuario. **Todas las decisiones de arquitectura están tomadas** (ver §6.1); no quedan puntos bloqueantes. Listo para arrancar la Fase 0.
- **Fuente de verdad**: `modus-ratio.md` (raíz del repo).

---

## 1. Resumen ejecutivo

Modus Ratio es una web app (Astro + React) que:

1. Recibe una foto de outfit + parámetros del usuario (estilo, altura, color de piel, contextura).
2. Sube la imagen **directo desde el navegador a Cloudflare R2** (nunca pasa por Vercel) y genera una URL pública.
3. Envía la URL a **GPT-4o-mini** para extraer datos del outfit (prendas, colores, proporciones, calidad) en un `.md` optimizado para agentes.
4. Envía ese `.md` + parámetros del usuario + contexto de reglas de vestimenta a **Minimax M3** (vía OpenCode) que retorna un **JSON estructurado**.
5. Renderiza un resultado gamificado (barras de estadística: equilibrio de color, armonía, proporciones) con semáforo (verde/amarillo/rojo) y advertencias.
6. Elimina la imagen del bucket tras mostrar resultados.

Estética: línea gráfica idéntica a `azanolabs-web` (blueprint/grid cyberpunk, neón, transiciones VHS), como si fuera una página interna de ese proyecto pero en subdominio propio.

**Arquitectura de ejecución**: Astro corre en **modo SSR** (`output: 'server'` + adapter Vercel), de modo que las variables sensibles (API keys de OpenAI, OpenCode/Minimax, R2, Redis, Resend) **nunca viajan al cliente**. La UI se entrega desde el servidor y los componentes interactivos usan **hidratación selectiva**: mientras el servidor procesa las llamadas a los modelos de IA se muestran **skeletons**, que se reemplazan por el contenido real cuando llega la respuesta del servidor Astro. Para incidencias reportables (rate limit, fallos de IA/R2/Redis) se envían **emails de alerta vía Resend**, reutilizando la misma API key y dominio de envío que `00_AzanoRivers`.

**Internacionalización**: la app es **bilingüe ES/EN sin selector de idioma**. Se detecta el idioma del navegador en el servidor: si es **español** (cualquier variante, LATAM o castellano) se sirve en español, en cualquier otro caso en inglés. **Ningún texto va hardcodeado**: todo string vive en diccionarios.

**Errores y límites de uso**: hay páginas dedicadas **404 / 500 / 429** con la línea gráfica de AzanoLabs (o algo mejor). El **429 es solo de seguridad**: se muestra únicamente cuando el rate limit de alto volumen (Redis) se dispara, con un mensaje intuitivo de que se alcanzó el máximo de procesamiento y hay que esperar. Aparte, existe un **límite de uso de procesamiento** independiente: aproximadamente **25 imágenes por hora**, gestionado en `localStorage` con **ventana deslizante estilo Reddit** (se guardan timestamps de cada subida, se podan los de más de 1 hora y se bloquea al llegar al tope). Como `localStorage` es evadible, este límite se **espeja en el servidor** (cap por IP/hora en Redis) como protección real; el bloqueo por uso se muestra **inline** en la UI, no en la página 429.

---

## 2. Principios rectores (aplican a TODAS las fases)

- **Dependencia primero**: ninguna fase empieza si su prerequisito no está cerrado y verificado.
- **SSR obligatorio**: Astro en `output: 'server'` con adapter Vercel. Las API keys y secretos se leen **solo en servidor** y nunca se exponen al cliente (sin prefijo `PUBLIC_`).
- **Hidratación selectiva + skeletons**: los componentes interactivos se hidratan con la directiva mínima necesaria (`client:idle`/`client:visible`/`client:load`). Todo dato que dependa del servidor (resultados de IA) se renderiza primero como **skeleton** y se sustituye al llegar la respuesta. Sin parpadeos ni apariciones secas.
- **i18n total, cero texto hardcodeado**: **ningún** string (UI, advertencias, errores, labels, aria, emails) se escribe inline. Todo se define en los diccionarios `es`/`en` con tipado, y se consume vía el helper de traducción. Idioma detectado en servidor por `accept-language`.
- **Optimización Astro 7**: aprovechar las mejores prácticas/tecnologías de la versión (imágenes con `astro:assets`/`<Image>`, islas, prefetch, `Astro.cookies`/`Astro.request`, etc.) según docs oficiales.
- **Alertas por email (Resend)**: incidencias reportables se notifican con Resend, **misma API key y mismo dominio de envío** que `00_AzanoRivers` (patrón `sendEmailAlert`).
- **`pnpm` siempre**: toda dependencia se instala con comandos `pnpm`. **Nunca** hardcodear versiones en `package.json` a mano.
- **Cero estilos inline**: prohibido `style={{}}` en TSX salvo CSS custom properties con valores calculados en runtime. Todo estilo vive en el `.css` del componente.
- **Diseño atómico**: `atoms → molecules → organisms → templates`, cada componente en su carpeta (`Componente/Componente.tsx` + `Componente.css` + `index.ts`), con barrels de import/export.
- **Tailwind 4.x + `@theme`**: tokens en `@theme`, constantes (colores/fuentes/medidas) en archivo de constantes. Sin medidas en px crudos. Sin `tailwind.config` ni `postcss.config` (no necesarios en este stack).
- **La imagen NUNCA pasa por Vercel**: subida directa cliente → R2 con SDK S3-compatible y URLs prefirmadas.
- **Privacidad**: imágenes y datos no se guardan ni comparten; se envían al modelo con instrucciones acotadas y la imagen se borra del bucket al final.
- **Reutilizar lo que ya funciona**: rate limit, patrón Redis y Resend de `00_AzanoRivers`; línea gráfica de `azanolabs-web`.

---

## 3. Hechos verificados del entorno (base real, no suposiciones)

| Referencia | Hallazgo | Implicación para Modus Ratio |
|---|---|---|
| `azanolabs-web` | Next.js 16 + React 19 + **Tailwind 4.2**. `:root` vars + `@theme inline`. | Portamos los **tokens y utilidades**, no el framework (nosotros usamos Astro). |
| `azanolabs-web/app/globals.css` | Breakpoints `sm:270 / md:360 / lg:440 / xl:1280 / 2xl:1536`. Colores neón, `.bg-az-grid` (grid 25px), glows, fuentes Orbitron/Audiowide/signature. | La spec de Modus Ratio pide `xl:600`. **Discrepancia a resolver** (ver Decisiones pendientes). |
| `azanolabs-web/lib/i18n` | Diccionarios **tipados** `en.ts`/`es.ts` + `types.ts` (interfaz `Translations`) + `index.ts` (`getDictionary(locale)`). | Patrón de diccionarios tipados a replicar (type-safety total, sin texto suelto). |
| `azanolabs-web/components` | Componentes en carpetas PascalCase (`PageTransitionWrapper`, `ProjectCard`...). Existe feature `04_04_2026_cyber_transitions`. | Base directa para transiciones VHS y estructura de página interna. |
| `00_AzanoRivers` | Es un proyecto **Astro en SSR** (`astro.config`: `output: 'server'` + adapter `@astrojs/vercel`). Rate limit en `src/middleware.ts` (Redis `incr`/`ttl`/`expire` + key `:banned`, rewrite a `/429`, alerta email). Cliente en `utils/redisClient.ts` usando `import.meta.env`. | Confirma que el patrón **SSR + Vercel** que queremos ya está probado. Seguridad **lista para portar** casi tal cual. |
| `00_AzanoRivers/utils/getLang.ts` | `getLangFromRequest(Astro)` lee `accept-language` (server-side), toma el primer tag y decide idioma; fallback a español. | Patrón de **detección de idioma por navegador en SSR** a portar (adaptado a la regla ES/EN). |
| `00_AzanoRivers/utils/sendResendEmail.ts` | Usa `Resend` con `import.meta.env.RESEND_API_KEY`. Función `sendEmailAlert({emailTo, message})` que envía desde `info@azanorivers.com`. | Reutilizamos la **misma API key y dominio** para las alertas de Modus Ratio (`sendEmailAlert` portado). |
| `00_AzanoRivers/.env` | Tiene `REDIS_URL`, `REDIS_PASSWORD`, `REDIS_USERNAME`, `OPENAI_API_KEY`, `RESEND_API_KEY`. | Reutilizamos credenciales Redis, OpenAI y Resend. Falta agregar R2 + OpenCode/Minimax. |
| `modus-ratio/` | Vacío salvo `modus-ratio.md`, `context-iphone-bugs.md`, `features/`. | Empezamos desde cero el scaffolding. |

---

## 4. Mapa de dependencias (vista rápida)

```
F0 Investigación
   └─> F1 Scaffolding ──> F2 Harness agéntico
            ├─> F3 i18n (diccionarios + detección) ─────────────┐
            └─> F4 Design system ──> F5 Transiciones ──> F6 Componentes atómicos (usa F3,F4,F5)
                       │                                          ├─> F7 Home (UI) ──> F8 Estado + localStorage (+ límite uso ~25/h)
                       └─> F9 Páginas de error 404/500/429 (usa F3,F4,F6)
   F1+F9 ──> F10 Backend base (SSR env + rate limit + Resend + locale + espejo límite uso + API) ──> F11 Subida R2 (gating uso) ──> F12 IA-1 GPT-4o-mini ──> F13 IA-2 Minimax ──> F14 Cleanup R2
   F5+F8 ──> F15 Loader
   F13+F8 ──> F16 Resultados (UI)
   F7+F11..F14+F15+F16+F5 ──> F17 Orquestación de flujo
   (UI completa) ──> F18 Apple/iPhone ──> F19 Deploy + QA
```

---

## 5. Fases

> Cada fase incluye: **Objetivo**, **Dependencias**, **Entregables**, **Criterio de cierre (Definition of Done)** y **Notas para su sub-plan**.

### Fase 0 — Investigación y validación técnica (gate)

- **Objetivo**: confirmar versiones y viabilidad real antes de escribir código, para no construir sobre supuestos.
- **Dependencias**: ninguna.
- **A validar (puntos críticos)**:
  - Versión real disponible de **Astro** (la spec dice ">7"; verificar en docs oficiales la última estable y su numeración real) e integraciones React + Tailwind compatibles.
  - **SSR**: forma correcta en la versión real de activar SSR (`output: 'server'` u opción equivalente) y el **adapter de Vercel** (`@astrojs/vercel`). Confirmar el patrón usado en `00_AzanoRivers`.
  - **Hidratación**: directivas de cliente disponibles (`client:load`/`client:idle`/`client:visible`/`client:only`) y patrón recomendado para **componentes server-driven con skeleton** que esperan respuesta del servidor (server islands / streaming / `Astro.props` desde endpoints). Confirmar la técnica idónea en Astro 7.
  - **i18n en Astro 7**: comparar diccionarios TS tipados vs **content collections** / i18n nativo de Astro; confirmar cómo pasar el locale detectado en SSR a las islas React hidratadas.
  - **Optimización Astro 7**: leer docs de buenas prácticas: imágenes (`astro:assets`, `<Image>`, formatos modernos), islas, `client:` mínimas, prefetch, view transitions nativas (y su compatibilidad con las transiciones VHS), tree-shaking/code-splitting de TSX.
  - **Tailwind 4.x**: override de breakpoints vía `@theme` (`--breakpoint-*`) y uso de utilidades por componente sin `tailwind.config`.
  - **Variables de entorno en Astro** con Vite (`import.meta.env`, server-only vs `PUBLIC_`). Confirmar que los secretos quedan **solo en servidor** bajo SSR.
  - **R2 / S3 SDK** para subida **directa desde navegador** con URL prefirmada (presigned PUT) + CORS del bucket. Confirmar que no requiere pasar bytes por Vercel.
  - **OpenCode + Minimax M3**: forma real de autenticación, endpoint y SDK/cliente. (Verificar nombre y disponibilidad del modelo.)
  - **GPT-4o-mini** con entrada de imagen por URL (vision) vía SDK OpenAI.
- **Entregables**: documento corto de hallazgos con versiones fijadas y enlaces; lista de credenciales/buckets a crear.
- **Cierre**: todas las versiones y APIs confirmadas o con alternativa decidida. Decisiones pendientes resueltas.
- **Notas para sub-plan**: si Astro real es < 7, ajustar la spec con el usuario. No fabricar versiones.

### Fase 1 — Inicialización del proyecto (scaffolding)

- **Objetivo**: repo Astro funcional con estructura base, integraciones y dependencias instaladas vía `pnpm`.
- **Dependencias**: F0.
- **Entregables**:
  - Proyecto Astro creado con `pnpm create astro` + integraciones React y Tailwind (comandos `pnpm`, sin hardcode).
  - **SSR activado**: `output: 'server'` en `astro.config` + adapter Vercel (`pnpm astro add vercel`).
  - TypeScript estricto. Zustand, SDK OpenAI, SDK S3-compatible (R2), cliente Redis (`redis`) y `resend` instalados.
  - Estructura de carpetas atómica (`src/components/atoms|molecules|organisms|templates`, `src/styles`, `src/i18n`, `src/lib`, `src/pages`, `src/store`, `src/utils`) con barrels base.
  - `.gitignore`, init de git, `README` mínimo.
- **Cierre**: `pnpm dev` levanta en modo SSR una página con Tailwind activo y un componente React **hidratado** de prueba; un endpoint server confirma que un secreto de `.env` se lee solo en servidor.
- **Notas para sub-plan**: definir convención exacta de barrels e `index.ts`.

### Fase 2 — Arquitectura agéntica (Harness) + skills

- **Objetivo**: montar el sistema de 3 agentes (Orquestador, Implementador, Revisor) en carpetas separadas del código, para ejecutar de forma disciplinada cada sub-plan posterior.
- **Dependencias**: F1 (repo existe para que los agentes operen sobre él).
- **Entregables**:
  - Estructura de agentes en **`.agents/`** en la raíz del repo (fuera de `src/`), con `AGENTS.md`/`CLAUDE.md`, roles y prompts por agente.
  - Los 3 roles usan **Sonnet 4.6**, con configuración **desacoplada por rol** (swap-ready) para poder cambiar a OpenCode más adelante sin tocar el flujo.
  - Flujo por tarea: analizar → orquestar (skills/tech) → implementar → revisión de errores → auditoría.
  - Skills necesarias instaladas (preferir `skills.sh` de Vercel: UI/UX, React, diseño de interfaces).
  - Compatibilidad documentada con OpenCode (mismo `CLAUDE.md`/skills).
- **Cierre**: un ciclo de prueba ejecutado sobre una tarea trivial dejando rastro de las 3 fases.
- **Notas para sub-plan**: definir el formato de config por rol que permita el swap a OpenCode; estructura interna de `.agents/`.

### Fase 3 — Internacionalización (i18n) base

- **Objetivo**: sistema bilingüe ES/EN con detección automática por navegador (sin selector) y **cero texto hardcodeado** en toda la app.
- **Dependencias**: F1.
- **Entregables**:
  - Diccionarios **tipados** en `src/i18n` (`es.ts`, `en.ts`, `types.ts` con interfaz `Translations`, `index.ts` con `getDictionary(locale)`), replicando y mejorando el patrón de `azanolabs-web`.
  - Util de **detección server-side** (`getLocale`) que lee `accept-language` (patrón `getLangFromRequest` de AzanoRivers): si el primer tag empieza por `es` (cualquier variante: `es-ES`, `es-419`, `es-MX`, etc.) → `es`; en cualquier otro caso (incluida ausencia de header) → `en`.
  - Mecanismo para entregar el locale y el diccionario a las **islas React hidratadas** (props desde el servidor), de modo que ningún componente acceda a strings sueltos.
  - Estructura inicial de claves (namespaces: `home`, `form`, `warnings`, `loader`, `results`, `errors`, `emails`).
- **Cierre**: una página demo renderiza textos desde el diccionario según el idioma del navegador; cambiar el idioma por defecto del navegador alterna ES/EN; búsqueda de strings hardcodeados da cero resultados.
- **Notas para sub-plan**: **decidido: diccionarios TS tipados** (no content collections). Definir tipado estricto de claves y fallback de claves faltantes.

### Fase 4 — Sistema de diseño (design tokens + tema)

- **Objetivo**: portar la línea gráfica de `azanolabs-web` a Astro/Tailwind 4 como base visual reutilizable.
- **Dependencias**: F1.
- **Entregables**:
  - `globals.css` con `:root` vars + `@theme` (colores neón, fondo `#041528`, fuentes, grid).
  - Override de breakpoints a la spec de Modus Ratio: **`sm:270 / md:360 / lg:440 / xl:600`** (decidido). Al portar componentes de azanolabs-web (pensados para `xl:1280`) revisar y reajustar su comportamiento en el nuevo `xl:600`.
  - Utilidades portadas: `.bg-az-grid`, glows neón, scrollbar neón.
  - Archivo de constantes (colores/fuentes/medidas en rem) y carga de fuentes (Orbitron, Audiowide, signature).
  - `Layout`/template base que replica la estructura de una **página interna** de `azanolabs-web`.
- **Cierre**: una página demo muestra el fondo blueprint, tipografías y un texto con glow neón idénticos a la referencia.
- **Notas para sub-plan**: inventariar exactamente qué tokens/utilidades de `azanolabs-web/app/globals.css` se copian.

### Fase 5 — Sistema de transiciones VHS / cyber

- **Objetivo**: mecanismo reutilizable de transición (distorsión + líneas granuladas) para todo cambio de componente/estado.
- **Dependencias**: F4.
- **Entregables**: componente/utilidad de transición (estilo `PageTransitionWrapper` + feature `cyber_transitions` de `azanolabs-web`), API para envolver vistas y disparar transición entre estados.
- **Cierre**: demo que alterna dos vistas con transición VHS, sin aparición seca por opacidad.
- **Notas para sub-plan**: definir contrato de uso (in/out, duración, reduce-motion para accesibilidad e iPhone).

### Fase 6 — Librería de componentes atómicos base

- **Objetivo**: átomos y moléculas reutilizables que necesita el Home y los Resultados.
- **Dependencias**: F4, F5, F3 (todo texto desde diccionario).
- **Entregables**: Badge/Advertencia (variantes por color/tipo), Button, Input/Dropzone, selector de estilo, slider de altura (1.30m–2.10m, optimizado desktop+mobile), selector color de piel, selector de contextura (superior/inferior), Card y **Skeleton** (placeholders animados con la estética neón, base para los estados server-driven). Todos con su `.css`, su barrel y sus textos vía i18n.
- **Cierre**: catálogo/demo que renderiza cada componente en sus estados (default/hover/focus/disabled) sin estilos inline y sin texto hardcodeado.
- **Notas para sub-plan**: definir props, tokens de color por variante de advertencia, accesibilidad de los selectores, claves i18n de cada componente.

### Fase 7 — UI Home (estática, sin lógica de negocio)

- **Objetivo**: armar el Home completo con componentes de F6.
- **Dependencias**: F6.
- **Entregables**:
  - Estructura de interna + título "Modus Ratio" + subtítulo "Puntea mi Outfit", formulario tipo "navegador" (dropzone, selector de estilo, altura, color de piel, contextura), advertencia inicial de privacidad. Todos los textos desde el diccionario.
  - **Checkbox de género (opcional)**: en lugar de un selector (mala UX), un **check** marcado claramente como "(opcional)". Al activarlo, **autoriza a la IA a deducir el género/cuerpo desde la imagen** para mayor precisión. Junto al check, una **nota** que aclare que la IA lo deduce no para "catalogarte" sino para entender mejor los cuerpos y dar resultados más precisos, con el mensaje: *"El género se vuelve irrelevante cuando queremos ser libres de amar."*
  - Maquetado responsive en los 4 breakpoints.
- **Cierre**: Home navegable y responsive en ES y EN; el formulario captura valores en estado local (aún sin envío); el check de género refleja su estado y nota. El formulario se entrega por SSR y se **hidrata** con la directiva mínima adecuada.
- **Notas para sub-plan**: layout exacto del "navegador", claves i18n de los textos/advertencias/nota de género, decidir directiva de hidratación por componente (`client:idle`/`client:visible`).

### Fase 8 — Estado global (Zustand) + persistencia localStorage

- **Objetivo**: gestionar parámetros del usuario, persistirlos y controlar el límite de uso por hora.
- **Dependencias**: F7.
- **Entregables**:
  - Store Zustand con parámetros (estilo, altura, piel, contextura) + estado de fase (idle/uploading/analyzing/results/error). Persistencia en `localStorage` que se actualiza al cambiar y se rehidrata al cargar.
  - **Límite de uso (ventana deslizante estilo Reddit)**: registro en `localStorage` de los timestamps de cada análisis; en cada intento se **podan** los timestamps de más de 1 hora y se cuenta el resto. Si se alcanza el tope (**25/hora**) se bloquea la subida y se expone `remaining` y el `resetAt` (cuándo el más antiguo sale de la ventana) para el mensaje inline. Tope en constante (`25`) para ajustarlo fácil.
- **Cierre**: recargar la página conserva los parámetros; tras 25 análisis dentro de la hora el botón de subida queda bloqueado con el tiempo de espera correcto, y se rehabilita al expirar la ventana.
- **Notas para sub-plan**: forma del store, claves de `localStorage`, manejo de versión de esquema y formato del registro de timestamps.

### Fase 9 — Páginas de error (404 / 500 / 429)

- **Objetivo**: páginas de error con la línea gráfica de AzanoLabs (o mejor), listas antes de cablear el rate limit.
- **Dependencias**: F4 (design system), F3 (i18n), F6 (componentes como Badge/Card).
- **Entregables**:
  - `404.astro` (ruta inexistente) y `500.astro` (error de servidor) con la estética blueprint/neón.
  - `429.astro` (**solo seguridad**): mensaje intuitivo de que se alcanzó el máximo de procesamiento por seguridad y hay que esperar un poco; tono tranquilizador, no alarmante. Portar/mejorar `429.astro` y `404.astro` de `00_AzanoRivers` y `not-found.tsx` de `azanolabs-web`.
  - Todos los textos vía i18n (ES/EN). Rutas excluidas del propio rate limit (como en AzanoRivers).
- **Cierre**: las tres páginas se renderizan con la línea gráfica correcta en ES y EN; `/429` comunica claramente la espera.
- **Notas para sub-plan**: copys exactos de cada página, ilustración/efecto, y diferenciar visualmente el 429 de seguridad del bloqueo inline por límite de uso (F11/F17).

### Fase 10 — Backend base: entorno, seguridad, locale y estructura de API

- **Objetivo**: cimientos del backend serverless en Astro: env vars, rate limit, límite de uso por IP, detección de locale y convención de endpoints.
- **Dependencias**: F1, F9 (página `/429` ya diseñada). Integra la detección de F3.
- **Entregables**:
  - `.env` con todas las variables (Redis, OpenAI, Resend reutilizados de AzanoRivers; R2, OpenCode/Minimax nuevas) leídas vía Vite, **solo en servidor**.
  - `middleware.ts` con rate limit Redis **portado de `00_AzanoRivers`** (incr/ttl/expire + `:banned` + rewrite a `/429`) y fijado del locale detectado en `Astro.locals.language`.
  - **Misma instancia Redis de AzanoRivers** (mismas credenciales) pero con **prefijo de claves propio** (`modusratio:ip:<IP>:count` / `:banned`) para no colisionar conteos entre apps.
  - Umbrales: copiar los generales de AzanoRivers, pero los **endpoints de IA (subida/GPT/Minimax) con límite mucho más estricto** por su costo real (tokens + R2). Afinar valores en este sub-plan.
  - **Espejo servidor del límite de uso (~25/hora por IP)** en Redis (clave `modusratio:usage:<IP>` con expiración por ventana). A diferencia del 429 de seguridad, exceder este límite devuelve una **respuesta de API específica** (p.ej. 429 con `code: USAGE_LIMIT` + `retryAfter`) que la UI muestra **inline**, no la página `/429`.
  - Cliente Redis (`utils/redisClient.ts`) adaptado.
  - **Resend** (`utils/sendResendEmail.ts` con `sendEmailAlert`) portado, misma API key; remitente **`modusratio@azanorivers.com`** para distinguir alertas. Conectado a incidencias (IP baneada, fallos de IA/R2/Redis). Textos del email vía i18n.
  - Convención de rutas API con nombres claros y concisos.
- **Cierre**: un endpoint dummy queda limitado tras N peticiones desde la misma IP (con prefijo propio) y muestra `/429`; superar ~25 análisis/hora devuelve el error de uso inline (no `/429`); al banear una IP llega el email de alerta vía Resend desde el alias; `Astro.locals.language` refleja el navegador.
- **Notas para sub-plan**: valores exactos de umbral general vs IA vs uso/hora, rutas excluidas, formato del payload de `USAGE_LIMIT` y local-part definitivo del alias.

### Fase 11 — Subida directa de imagen a Cloudflare R2

- **Objetivo**: subir la imagen del cliente a R2 sin pasar por Vercel y obtener URL pública, respetando el límite de uso.
- **Dependencias**: F10 (endpoint de presign + seguridad + límite de uso), F7 (dropzone), F8 (chequeo de uso en `localStorage`).
- **Entregables**: **bucket R2 nuevo dedicado** para Modus Ratio (con su política de CORS y de acceso público acotada), endpoint que genera URL prefirmada (presigned PUT), subida directa navegador → R2, generación de URL pública del objeto. Antes de pedir el presign, la UI **verifica el límite de uso (F8)** y el servidor lo **revalida** (F10) para que no sea evadible.
- **Cierre**: una imagen seleccionada en el Home llega a R2 y se obtiene su URL pública, verificando en Network que los bytes no pasan por Vercel; si se superó el límite, no se sube y se muestra el mensaje inline.
- **Validaciones**: formatos **jpg / png / webp / heic**, máximo **10MB** (HEIC contemplado para fotos de iPhone), validadas en cliente y al firmar en servidor.
- **Notas para sub-plan**: nombrado/namespacing del objeto, manejo de HEIC en el procesamiento posterior, mensajes de error de formato/tamaño vía i18n.

### Fase 12 — Pipeline IA 1: análisis de imagen (GPT-4o-mini)

- **Objetivo**: extraer datos del outfit desde la URL pública.
- **Dependencias**: F11.
- **Entregables**: endpoint que recibe la URL, llama a GPT-4o-mini (vision) con contexto mínimo (prendas, colores, proporciones de color, proporciones de la persona, calidad de imagen) y retorna un `.md` optimizado para agentes (en inglés, bajo consumo de tokens). **Solo si el usuario activó el check de género (F7)**, el modelo deduce además la presentación de cuerpo/género para afinar proporciones; si no, se omite. Fallos disparan alerta Resend.
- **Cierre**: dada una URL, el endpoint devuelve el `.md` estructurado y consistente.
- **Notas para sub-plan**: redacción del prompt/contexto, manejo de imagen de baja calidad (advertencias).

### Fase 13 — Pipeline IA 2: ranking (Minimax M3 vía OpenCode)

- **Objetivo**: convertir el `.md` + parámetros del usuario en un JSON de resultados válido.
- **Dependencias**: F12, F8 (parámetros del usuario).
- **Entregables**:
  - **Corpus de reglas de vestimenta** redactado en esta fase: lo creo yo a partir de **investigación actual a 2026** (docs, blogs, webs, foros y comunidades especializadas en estilo: alternativo, común, famosos, influencers, etc.), **optimizado para IA** (detallado pero no excesivamente amplio, datos confiables y vigentes). Cubre 60/30/10, armonía de color, proporciones por altura/contextura/piel y la **definición de cada uno de los 8 estilos** (urbano, alternativo, casual, semiformal, formal, formal-urbano, formal-alternativo, oldmoney). **El usuario revisa y audita** el documento antes de usarlo.
  - Esquema/ejemplo de JSON enviado al modelo, endpoint que valida y normaliza el JSON retornado. Usa la deducción de género **solo si está disponible** (check de F7). Fallos disparan alerta Resend.
  - **Escala del ratio**: cada dimensión devuelve **puntaje 0–100** + estado de **semáforo** (verde/amarillo/rojo) por umbrales, más un **ratio global**.
- **Cierre**: dado un `.md` + parámetros, retorna un JSON que valida contra el esquema (0–100 + semáforo + global) y la lógica de Astro puede consumir.
- **Notas para sub-plan**: redactar primero el corpus (con fuentes 2026) y obtener tu visto bueno; definir el **JSON schema** de resultados (barras 0–100, umbrales de semáforo, advertencias) que también consume la Fase 16. El JSON transporta claves/identificadores neutrales y la UI traduce con i18n (no texto del modelo en pantalla salvo lo justificado).

### Fase 14 — Limpieza de imagen en R2

- **Objetivo**: borrar el objeto subido tras entregar resultados.
- **Dependencias**: F11, F13.
- **Entregables**: proceso que elimina específicamente la imagen de la URL generada (no todo el bucket) tras los resultados.
- **Cierre**: tras un análisis completo, el objeto ya no existe en R2.
- **Notas para sub-plan**: momento exacto del borrado y manejo de fallos (no romper la UX).

### Fase 15 — Loader energético

- **Objetivo**: loader estilizado para la fase de análisis (rayos de colores, energía, temblor creciente hacia el final).
- **Dependencias**: F5 (transiciones), F8 (estado de fase `analyzing`).
- **Entregables**: componente loader con animación de carga suave que tiembla más al acercarse al final. Textos (si los hay) vía i18n.
- **Cierre**: el loader aparece en estado `analyzing` con la animación descrita y respeta `reduce-motion`.
- **Notas para sub-plan**: técnica de animación (CSS/canvas), perfilado de rendimiento mobile.

### Fase 16 — UI de Resultados

- **Objetivo**: renderizar el JSON de F13 de forma gamificada.
- **Dependencias**: F13 (schema JSON), F8.
- **Entregables**: barras de estadística **con puntaje 0–100** (equilibrio de color, armonía, proporciones...) coloreadas por semáforo, **ratio global**, card de la imagen con semáforo (verde check / amarillo advertencia / rojo prohibido), badges de advertencia, advertencia de "el estilo es personal", botón de re-análisis. Todos los textos vía i18n.
- **Cierre**: dado un JSON de ejemplo, la UI lo pinta completa y responsiva en ES y EN; mientras el servidor procesa, se muestran los **skeletons** (de F6) en lugar de cada bloque.
- **Notas para sub-plan**: mapeo JSON → componentes, claves i18n de advertencias, correspondencia skeleton ↔ bloque real.

### Fase 17 — Orquestación del flujo completo

- **Objetivo**: encadenar todo el ciclo con transiciones congruentes.
- **Dependencias**: F7, F11–F14, F15, F16, F5.
- **Entregables**: flujo `input → (upload) → loader/skeleton → resultados → re-análisis`, sustituyendo input/loader por resultados, con transición VHS en cada cambio. La espera de cada respuesta del servidor (IA-1, IA-2) se cubre con **skeletons hidratados** que se reemplazan al resolver. Manejo de errores diferenciado: imagen mala / fallo de red, **bloqueo por límite de uso** (mensaje inline "alcanzaste el máximo por ahora, espera X" con cuenta regresiva), y **rate limit de seguridad** (página `/429`). Fallos de servidor disparan alerta Resend.
- **Cierre**: recorrido end-to-end real funcionando, incluyendo re-análisis con parámetros persistidos, skeletons durante el procesamiento y el mensaje de límite de uso cuando corresponde.
- **Notas para sub-plan**: máquina de estados, estados de error y reintentos, distinción visual uso-vs-seguridad, qué fallos disparan email de alerta.

### Fase 18 — Compatibilidad Apple / iPhone

- **Objetivo**: corregir lo que indica `context-iphone-bugs.md`.
- **Dependencias**: UI completa (F17).
- **Entregables**: revisión y fixes de visualización en Safari/iOS según la guía.
- **Cierre**: checklist de `context-iphone-bugs.md` verificado.
- **Notas para sub-plan**: leer y desglosar `context-iphone-bugs.md` en checklist accionable.

### Fase 19 — Hardening, despliegue (Vercel + subdominio) y QA responsive

- **Objetivo**: dejar la app desplegada y validada.
- **Dependencias**: F17, F18.
- **Entregables**: variables de entorno en Vercel, deploy, subdominio **`modus.azanolabs.com`** configurado, QA en los 4 breakpoints y en ambos idiomas, verificación final de que la imagen nunca cruza Vercel, de que el borrado en R2 ocurre, de que las 3 páginas de error responden y de que el límite de uso bloquea correctamente.
- **Cierre**: app en producción en `modus.azanolabs.com`, smoke test end-to-end OK.
- **Notas para sub-plan**: configuración de dominio, secrets en Vercel, monitoreo.

---

## 6. Decisiones

### 6.1 Resueltas (confirmadas con el usuario)

| # | Tema | Decisión |
|---|---|---|
| 1 | Breakpoint `xl` | **`xl:600`** (seguir spec). Al portar componentes de azanolabs-web (`xl:1280`) reajustar su comportamiento. |
| 2 | i18n | **Diccionarios TS tipados** (no content collections). |
| 3 | Modelos del Harness | **Sonnet 4.6** en los 3 roles, config **swap-ready** para cambiar a OpenCode por rol. |
| 4 | Carpetas de agentes | **`.agents/`** en la raíz del repo, fuera de `src/`. |
| 5 | Redis | **Misma instancia/credenciales de AzanoRivers + prefijo propio** (`modusratio:ip:...`) para no colisionar conteos. |
| 6 | Bucket R2 | **Bucket nuevo dedicado** con CORS y acceso público acotados. |
| 7 | Remitente Resend | **`modusratio@azanorivers.com`** (mismo dominio verificado, misma API key). |
| 8 | Umbrales rate limit | **Copiar AzanoRivers** para lo general + **límite estricto en endpoints de IA** (costo de tokens + R2). |
| 9 | Páginas de error | **404 / 500 / 429** con línea gráfica de AzanoLabs (o mejor). El **429 solo para seguridad** (alto volumen), con mensaje de espera intuitivo. |
| 10 | Límite de uso | **25 imágenes/hora**, ventana deslizante estilo Reddit en `localStorage` + **espejo en servidor (Redis por IP)**. Bloqueo mostrado **inline**, distinto de la página `/429`. |
| 11 | Género | **Check opcional** (no selector). Si se activa, la IA **deduce** el cuerpo/género desde la imagen para precisión, con nota: *"El género se vuelve irrelevante cuando queremos ser libres de amar."* |
| 12 | Corpus de reglas | **Lo redacto yo** con investigación a 2026 (fuentes especializadas), optimizado para IA, con definición de los 8 estilos. **El usuario audita** antes de usarlo. |
| 13 | Escala del ratio | **0–100 por barra + semáforo** (verde/amarillo/rojo) + ratio global. |
| 14 | OpenCode / Minimax M3 | **API key ya disponible** (el usuario la tiene). F0 solo confirma SDK/cliente e integración. |
| 15 | Cloudflare R2 | **Cuenta lista**; se crea **bucket nuevo dedicado** + tokens + CORS. |
| 16 | OpenAI key | **Reutilizar `OPENAI_API_KEY` de AzanoRivers** (consumo compartido en la misma cuenta). |
| 17 | Subdominio | **`modus.azanolabs.com`**. |
| 18 | Formatos de imagen | **jpg / png / webp / heic**, máximo **10MB** (incluye HEIC de iPhone). |

### 6.2 A resolver por investigación en F0 (no requieren al usuario)

- **Versión real de Astro** (spec dice ">7"): fijar la última estable real e integraciones compatibles.
- **OpenCode + Minimax M3**: la API key ya está; confirmar SDK/cliente, endpoint y forma de invocación del modelo (no es bloqueante).
- **Técnica de hidratación/skeleton** en Astro 7 (server islands / streaming / fetch desde isla) y propagación del locale SSR a las islas React.

### 6.3 Detalles menores

**Ninguno pendiente.** Todos los puntos abiertos quedaron resueltos en §6.1. Lo único que se define dentro de su propio sub-plan (con tu revisión) es contenido de detalle: la definición fina de cada uno de los 8 estilos (dentro del corpus de F13) y el set exacto de barras/dimensiones + JSON schema (F13/F16).

---

## 7. Convención de sub-planes

- Cada fase de este documento genera un sub-plan propio en `features/` con nombre `DDMMYYYY-fNN-<slug>.md` (ej.: `30062026-f04-design-system.md`).
- Cada sub-plan detalla: tareas atómicas, archivos a crear/editar, criterios de aceptación, riesgos y la asignación al ciclo del Harness (orquestar → implementar → revisar → auditar).
- Un sub-plan no se ejecuta hasta que su fase prerequisito esté **cerrada** según su Definition of Done.

---

## 8. Próximo paso sugerido

Todas las decisiones están tomadas (§6.1) y no quedan bloqueantes. El siguiente paso es el sub-plan de la **Fase 0 (investigación)** para fijar la versión real de Astro, las mejores prácticas de Astro 7 (SSR, hidratación/skeletons, `astro:assets`), confirmar el cliente de OpenCode/Minimax M3 y dejar listo el setup de credenciales (R2 nuevo, reuso de OpenAI/Redis/Resend). Tras tu visto bueno, arranco con él.
