[Español](./README.md) · **English**

# Modus Ratio

![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-443E38)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?logo=cloudflare&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

Created and designed with ❤️ by [AzanoRivers](https://azanorivers.com)

AI-powered outfit analyzer for AzanoLabs. The user uploads a photo of their outfit, states the style they want to achieve (and optionally height, skin tone, body build and gender preference), and the app returns a per-dimension score, warnings, a highlight, and concrete recommendations, all personalized to the actual image.

## What it does

1. The user fills out a short form and uploads a photo.
2. The photo is uploaded directly from the browser to Cloudflare R2 (it never passes through the app's server).
3. A vision model (GPT-4o-mini) extracts a structured description of the outfit from the image's public URL (garments, colors, patterns, silhouette, etc.). If the image can't be analyzed (no person visible, not clothing, resolution too low, inappropriate content), it's rejected at this step with a specific reason.
4. A language model (glm-5.2, via the OpenCode proxy) scores the outfit across 5 dimensions (color harmony, style coherence, fit/silhouette, originality, fit with the chosen style), computes a weighted global score based on the declared target style, and writes a personalized review for every score, warning, highlight, and recommendation.
5. The image is deleted from R2 (see [Privacy and data handling](#privacy-and-data-handling)).
6. The user sees the results and can analyze another outfit.

## Stack

- **Framework**: Astro 7 (SSR, `output: 'server'`) + React 19 for interactive parts
- **Styling**: Tailwind CSS 4 (`@theme`, no `tailwind.config`) + atomic design (atoms/molecules/organisms/templates)
- **State**: Zustand (partial persistence in `localStorage`: only form preferences and usage timestamps, never images or results)
- **AI**: OpenAI `gpt-4o-mini` (visual description) + `glm-5.2` via [OpenCode](https://opencode.ai) (scoring and writing)
- **Image storage**: Cloudflare R2, uploaded directly from the client with presigned URLs
- **Rate limiting**: Redis
- **Alerts**: Resend (email to an internal recipient when something fails technically)
- **Deploy**: Vercel (`@astrojs/vercel`, serverless functions)

## Privacy and data handling

This is the most important thing to understand before touching the analysis pipeline:

- **The image never passes through the app's server.** The client requests a presigned URL (`POST /api/upload/presign`) and uploads the file directly to Cloudflare R2 via `PUT`. The presigned URL expires after 5 minutes.
- **The image is passed to GPT-4o-mini as a public URL** from the R2 bucket (not as base64), with the `detail: 'low'` parameter, which reduces the resolution at which OpenAI processes the image (lower cost and latency).
- **If the analysis completes (success or model rejection), the image is deleted from R2 immediately** when the request finishes.
- **If the analysis fails due to a technical error, the image is not deleted instantly**, but a cleanup sweep (`cleanupOrphanUploads`) runs after every failed attempt and after every successful analysis, deleting any object in `uploads/` older than 15 minutes. Worst case (the user closes the tab mid-process, or the analysis fails), the image doesn't live in R2 for more than ~15 minutes.
- **There is no database**: the image, the extracted description, and the analysis results are never stored anywhere beyond the user's browser session. Nothing is used to train models.
- **The only thing persisted on the client** (`localStorage`, via Zustand) is the form preferences (so the user doesn't have to re-enter them) and usage timestamps (to compute the user's own 25-analyses-per-hour limit).

## Security and usage limits

- **Usage limit**: 25 analyses per hour per IP.
- **Security ban**: an IP that repeatedly exceeds that limit within the same hour gets blocked for 24 hours.
- **Invalid-image abuse block**: 3 images rejected by the model (photos of objects, pets, etc. instead of outfits) within 10 minutes block new analyses from that IP for 15 minutes. This is independent of the 25/hour limit.

## Requirements

- Node.js ≥ 22.12
- pnpm
- Accounts/credentials for: Cloudflare R2, OpenAI, OpenCode, Redis, Resend (see environment variables below)

## Environment variables

Copy `.env.example` to `.env` and fill in the real values (never commit `.env`, it's already in `.gitignore`):

| Group | Variables | What for |
|---|---|---|
| Redis | `REDIS_URL`, `REDIS_PASSWORD`, `REDIS_USERNAME` | Rate limiting (usage limit, bans, blocks) |
| Cloudflare R2 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Temporary storage for uploaded photos |
| OpenAI | `OPENAI_API_KEY` | Visual description extraction of the outfit (GPT-4o-mini) |
| OpenCode | `OPENCODE_API_KEY` | Scoring and result writing (glm-5.2) |
| Resend | `RESEND_API_KEY` | Email alerts when something fails technically |
| App | `APP_URL` (optional, default `http://localhost:4321`) | Base URL of the app |

## Local development

```bash
pnpm install
cp .env.example .env   # then fill in real credentials
pnpm dev
```

Other commands:

```bash
pnpm build              # production build
pnpm preview            # serve the production build locally
pnpm exec astro check   # type checking (use this, not tsc directly)
```

## Project structure

```
src/
├── components/       # Atomic design: atoms, molecules, organisms, templates
├── i18n/             # Typed es/en dictionaries
├── layouts/          # Base Astro layouts
├── lib/              # Server logic: env, R2, AI, prompts, rate limit, validation
│   ├── client/       # Code that runs in the browser (direct upload to R2)
│   └── prompts/      # System prompts for GPT-4o-mini and glm-5.2
├── pages/            # Astro routes
│   └── api/          # Endpoints: presign, analyze
├── store/            # Global state (Zustand)
└── styles/           # Global CSS and Tailwind tokens
```

## Deploy

Deployed on Vercel with the `@astrojs/vercel` adapter, with `maxDuration: 60` explicitly configured (`astro.config.mjs`) because the AI pipeline (description + scoring) can take tens of seconds.
