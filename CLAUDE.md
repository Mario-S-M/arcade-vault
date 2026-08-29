# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start dev server (Turbopack by default; pass `--webpack` to opt out)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint via flat config (`eslint.config.mjs`)
- `npx next typegen` — regenerate the typed route/layout/page prop types (under `.next/types`) without running a full build

No test runner is configured yet.

## Architecture

- App Router only, under `app/`. The repo currently holds just the `create-next-app` scaffold (`app/layout.tsx`, `app/page.tsx`) — no custom routes, components, or data layer yet.
- Styling: Tailwind CSS v4 via `@tailwindcss/postcss`, configured CSS-first through the `@theme inline` block in `app/globals.css` — there is no `tailwind.config.*` file.
- `app/layout.tsx` uses `LayoutProps<"/">`, Next.js 16's generated typed props for layouts and pages (backed by `.next/types`). Use the same pattern (`PageProps<"...">`, `LayoutProps<"...">`) for new routes instead of hand-writing prop types.
- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- Fonts load via `next/font/google` (Geist, Geist Mono) and are exposed as CSS variables that Tailwind's `@theme inline` block consumes.

## Project intent

Per `README.md`, Arcade Vault is meant to become an online multiplayer arcade platform where players compete on points. Development is intended to follow Spec Driven Design using the `/spec` and `/spec-impl` workflow from `Klerith/fernando-skills` — those skills/specs aren't installed in this repo yet.


## Skills
Usa siempre /fronted-design para diseñar la interfaz de usuarios