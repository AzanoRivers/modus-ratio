[Español](./CONTRIBUTING.md) · **English**

# Contributing: Modus Ratio

For an explanation of the project (what it does, how it handles images, privacy, usage limits), see the [README](./README.en.md). This guide is about how to work on the code.

## Initial setup

Requirements: Node.js ≥ 22.12 and pnpm.

```powershell
# Install dependencies
pnpm install

# Copy environment variables and fill in the real credentials
Copy-Item .env.example .env
```

See the README for the full list of environment variables and what each one is for. Never commit `.env` (it's already in `.gitignore`).

## Development commands

```powershell
pnpm dev             # dev server at http://localhost:4321
pnpm exec astro check   # type checking: ALWAYS use this, not tsc directly
```

> **`pnpm build` on local Windows**: fails with `EPERM: operation not permitted, symlink` because `@astrojs/vercel` tries to create symlinks when packaging the serverless function, which requires Developer Mode enabled on Windows (or admin permissions). Not needed for development: use `pnpm exec astro check` for type checking. The real build runs on Vercel (Linux) without this issue.

## Commit conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

**Types:** `feat`, `fix`, `style` (CSS only, no logic), `refactor`, `chore`, `docs`

**Common scopes:** `atoms`, `molecules`, `organisms` (components by level) · `api` · `i18n` · `r2`, `redis`, `openai` (external integrations)

```
feat(molecules): add StyleSelector punk/gotico/geek options
fix(api): handle R2 upload timeout error
style(organisms): update ResultsPanel spacing
```

## Code conventions

- **Atomic design**: each component lives in its own folder with `Component.tsx` + `Component.css` + `index.ts` (barrel). No CSS Modules: classes are global by project convention.
- **No inline styles**: no `style={{...}}` except for CSS custom properties computed at runtime (e.g. `style={{'--score': score}}`). Everything else goes in the component's `.css` file.
- **i18n is mandatory**: no UI text is hardcoded. Everything comes from `src/i18n/{es,en}.ts` (typed from `src/i18n/types.ts`) and is received via the `t` prop.
- **Direct imports for server-only modules**: components that hydrate on the client must NEVER import the full `@/lib` barrel (`import { X } from '@/lib'`), because that barrel re-exports modules that read environment variables on load (`env.ts`, R2/Redis/OpenAI clients), which breaks hydration by looking for secrets that don't exist in the browser. Always import from the specific file (`@/lib/analysisTypes`, `@/lib/ensureJpeg`, etc.).
- **OpenAI/OpenCode calls with `timeout`**: if you add a `timeout` to an `openai.chat.completions.create(...)` call, it ALWAYS goes together with `maxRetries: 0`. The SDK retries twice by default, so a timeout without this gets multiplied by up to 3x in the worst case.
- **Comments**: only when they explain a non-obvious why (a constraint, a bug avoided, a design decision). Don't comment what the code already says with clear names.

## Before opening a PR

1. `pnpm exec astro check` with no errors.
2. Manually test the flow in the browser (form → upload → analysis → results), especially if you touched `FlowController`, the AI pipeline, or image handling.
3. If you touched the scoring prompt (`src/lib/prompts/minimaxM3.ts`) or the model used, measure real latency before merging: the full pipeline must stay under the 60s limit of the serverless function on Vercel (`maxDuration` in `astro.config.mjs`).
