<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Reglas del Proyecto miStock (Aplicación Next.js)

Este directorio contiene la aplicación web principal de **miStock**. Todas las tareas deben cumplir además con las directivas globales definidas en [../AGENTS.md](../AGENTS.md):

1. **Arquitectura MVC en `src/`:**
   * `src/models/`: `modelos_dominio/` (tablas PostgreSQL) y `modelos_vista/` (DTOs, formularios y KPIs).
   * `src/services/`: Stores reactivos (`useSyncExternalStore`), `supabaseService.ts` y `mercadopago/`.
   * `src/controllers/`: Hooks desacoplados (`adminControllers/`, `userControllers/`, `authController.ts`, `permisosController.ts`).
   * `src/views/`: UI declarativa que consume únicamente `controller` usando **Phosphor Icons** (`@phosphor-icons/react`).
   * `src/app/`: Ensambladores `page.tsx`, layouts RBAC y Route Handlers privados (`api/mercadopago/`).
   * `src/proxy.ts`: Guardia SSR de Next.js 16 para sesiones Supabase (no usar `middleware.ts`).

2. **Comandos de Verificación (`mistock/`):**
   * Tipado estricto: `npx tsc --noEmit`
   * Tests unitarios: `npm test` (`vitest run`)
   * Build de producción: `npm run build`

3. **Documentación y Skills:**
   * Skills activas en `../.agents/skills/`: `obsidian-docs`, `supabase` y `supabase-postgres-best-practices`.
   * Mantener sincronizadas `docs/*.md` y la bóveda de Obsidian según la skill `obsidian-docs`.
