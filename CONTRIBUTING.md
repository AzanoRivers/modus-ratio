**Español** · [English](./CONTRIBUTING.en.md)

# Contributing: Modus Ratio

Para una explicación del proyecto (qué hace, cómo maneja las imágenes, privacidad, límites de uso), ver el [README](./README.md). Esta guía es sobre cómo trabajar en el código.

## Setup inicial

Requisitos: Node.js ≥ 22.12 y pnpm.

```powershell
# Instalar dependencias
pnpm install

# Copiar variables de entorno y completar con las credenciales reales
Copy-Item .env.example .env
```

Ver el README para la lista completa de variables de entorno y para qué sirve cada una. Nunca commitear `.env` (ya está en `.gitignore`).

## Comandos de desarrollo

```powershell
pnpm dev             # servidor de desarrollo en http://localhost:4321
pnpm exec astro check   # verificación de tipos: usar SIEMPRE esto, no tsc directo
```

> **`pnpm build` en Windows local**: falla con `EPERM: operation not permitted, symlink` porque `@astrojs/vercel` intenta crear symlinks al empaquetar la función serverless, y eso requiere Developer Mode activo en Windows (o permisos de administrador). No es necesario para desarrollar: usar `pnpm exec astro check` para verificar tipos. El build real corre en Vercel (Linux) sin este problema.

## Convenciones de commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<alcance>): <descripción corta>
```

**Tipos:** `feat`, `fix`, `style` (solo CSS, sin lógica), `refactor`, `chore`, `docs`

**Alcances comunes:** `atoms`, `molecules`, `organisms` (componentes por nivel) · `api` · `i18n` · `r2`, `redis`, `openai` (integraciones externas)

```
feat(molecules): add StyleSelector punk/gotico/geek options
fix(api): handle R2 upload timeout error
style(organisms): update ResultsPanel spacing
```

## Convenciones de código

- **Diseño atómico**: cada componente vive en su propia carpeta con `Componente.tsx` + `Componente.css` + `index.ts` (barrel). Sin CSS Modules: las clases son globales por convención del proyecto.
- **Sin estilos inline**: nada de `style={{...}}` salvo CSS custom properties calculadas en runtime (ej. `style={{'--score': score}}`). Todo lo demás va al `.css` del componente.
- **i18n obligatorio**: ningún texto de interfaz se hardcodea. Todo sale de `src/i18n/{es,en}.ts` (tipados desde `src/i18n/types.ts`) y se recibe vía prop `t`.
- **Imports directos para módulos server-only**: los componentes que se hidratan en el cliente NUNCA deben importar el barrel `@/lib` completo (`import { X } from '@/lib'`), porque ese barrel re-exporta módulos que leen variables de entorno al cargar (`env.ts`, clientes de R2/Redis/OpenAI) y eso rompe la hidratación buscando secretos que no existen en el navegador. Importar siempre desde el archivo puntual (`@/lib/analysisTypes`, `@/lib/ensureJpeg`, etc.).
- **Llamadas a OpenAI/OpenCode con `timeout`**: si agregás un `timeout` a una llamada de `openai.chat.completions.create(...)`, va SIEMPRE acompañado de `maxRetries: 0`. El SDK reintenta 2 veces por defecto, así que un timeout sin esto se multiplica hasta por 3 en el peor caso.
- **Comentarios**: solo cuando explican un porqué no obvio (una restricción, un bug evitado, una decisión de diseño). No comentar lo que el código ya dice con nombres claros.

## Antes de abrir un PR

1. `pnpm exec astro check` sin errores.
2. Probar el flujo manualmente en el navegador (formulario → subida → análisis → resultados), especialmente si tocaste `FlowController`, el pipeline de IA, o el manejo de imágenes.
3. Si tocaste el prompt de scoring (`src/lib/prompts/minimaxM3.ts`) o el modelo usado, medir latencia real antes de mergear: el pipeline completo debe mantenerse bajo el límite de 60s de la función serverless en Vercel (`maxDuration` en `astro.config.mjs`).
