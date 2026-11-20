# Guía y Reglas para Agentes de IA: miStock

Este archivo define las reglas obligatorias de arquitectura, seguridad, calidad y documentación para cualquier agente que trabaje sobre el repositorio **miStock**.

---

## 1. Estructura del Repositorio y Entorno Next.js 16

* **Aplicación Principal (`mistock/`):** Todo el código fuente de Next.js 16.3.4 (App Router), React 19 y TypeScript 5 reside dentro de `mistock/src/`.
* **Reglas Nativas de Next.js:** Antes de modificar rutas, layouts, Route Handlers o `src/proxy.ts`, consultar [mistock/AGENTS.md](file:///b:/Programas/Github/m.i-stock/mistock/AGENTS.md), la documentación local instalada en `mistock/node_modules/next/dist/docs/` y las guías de versión en `proms/nextjs/`.
* **Convención Next.js 16:** La protección SSR de sesiones utiliza **`mistock/src/proxy.ts`** (no `middleware.ts` heredado).

---

## 2. Arquitectura MVC Estricta y Estándares de Código

1. **Separación por Capas en `mistock/src/`:**
   * **Modelos (`src/models/`):** Separación estricta entre `modelos_dominio/` (entidades fieles a PostgreSQL) y `modelos_vista/` (DTOs, estados efímeros, formularios y métricas calculadas).
   * **Servicios (`src/services/`):** Almacenes reactivos basados en `useSyncExternalStore` (`inventarioService.ts`, `configuracionService.ts`), cliente unificado `supabaseService.ts` y suite `mercadopago/` (`mpConfig`, `pointTypes`, `pointService`, `webhookHandler`).
   * **Controladores (`src/controllers/`):** *Custom Hooks* de React (`adminControllers/`, `userControllers/`, `authController.ts`, `permisosController.ts`) completamente desacoplados de la UI. Concentran estado reactivo, validaciones y reglas de negocio.
   * **Vistas (`src/views/`):** Componentes puramente declarativos que solo consumen el objeto `controller` recibido desde su ensamblador en `src/app/**/page.tsx`. Prohibido colocar queries directas a Supabase o lógica de negocio compleja en vistas.
   * **Validaciones (`src/lib/validaciones.ts`):** Reutilizar siempre los sanitizadores y límites centralizados (`MAX_PRECIO_DB`, `MAX_STOCK_DB`, `LIMITES_TEXTO`) compatibles con `numeric(10,2)` e `integer` de PostgreSQL.

2. **Sistema de Iconos y UI:**
   * Utilizar exclusivamente **Phosphor Icons** (`@phosphor-icons/react`) con pesos coherentes (`regular`, `duotone`, `fill`).
   * Respetar el sistema visual B2B del proyecto (paleta teal/slate `#2A7A78`, `#E8E6DF`, `#1C2424`) y componentes base en `src/components/ui/`.

---

## 3. Reglas de Seguridad, Base de Datos y Pagos

* **Secretos de Servidor:** Nunca exponer `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` ni llaves `service_role` con prefijo `NEXT_PUBLIC_`. Toda comunicación con Mercado Pago Point Smart debe pasar por `mistock/src/app/api/mercadopago/`.
* **Integridad Relacional y RLS (PostgreSQL 15):**
  * Todo producto debe pertenecer a una categoría activa (`NOT NULL`, `ON DELETE RESTRICT`).
  * Ninguna vista o controlador cliente debe intentar revertir o alterar historial contable manualmente si existe trigger en BD (`tr_venta_movimiento_stock`, `tr_cancelar_venta_reintegrar_stock`).
  * Toda nueva tabla o política SQL debe habilitar RLS y seguir la skill `supabase-postgres-best-practices` (usando `(SELECT auth.uid())` y `SET search_path = ''` en funciones `SECURITY DEFINER`).

---

## 4. Skills Definidas del Proyecto (`.agents/skills/`)

Consultar el `SKILL.md` correspondiente antes de intervenir en su dominio:

| Skill | Ruta | Cuándo Activarse |
| :--- | :--- | :--- |
| **`obsidian-docs`** | `.agents/skills/obsidian-docs/SKILL.md` | Obligatoria al crear/editar modelos, controladores, servicios, vistas, rutas, KPIs, reglas SQL o dependencias. |
| **`interface-design`** | `.agents/skills/interface-design/SKILL.md` | Diseño, rediseño, auditoría o refinamiento visual de vistas, dashboards, paneles admin, POS, jerarquía y tokens UI. |
| **`ux-writing`** | `.agents/skills/ux-writing/SKILL.md` | Redacción, claridad y auditoría de microcopy UI (botones, etiquetas, mensajes de error, estados vacíos, formularios, tono neutro y accesibilidad cognitiva). |
| **`web-design-guidelines`** | `.agents/skills/web-design-guidelines/SKILL.md` | Auditoría de semántica HTML, accesibilidad ARIA, foco/teclado, buenas prácticas de formularios y calidad UI en producción. |
| **`vitest`** | `.agents/skills/vitest/SKILL.md` | Creación, refactorización y depuración de pruebas unitarias y de integración con Vitest (`mistock/src/__tests__/`). |
| **`playwright-best-practices`** | `.agents/skills/playwright-best-practices/SKILL.md` | Pruebas End-to-End (E2E) en navegador con Playwright (flujos POS, caja, autenticación, accesibilidad y regresiones). |
| **`security-audit`** | `.agents/skills/security-audit/SKILL.md` | Auditoría de seguridad multifase sobre Route Handlers de Mercado Pago Point, webhooks, RBAC, `src/proxy.ts`, RLS y manejo de secretos. |
| **`supabase`** | `.agents/skills/supabase/SKILL.md` | Autenticación, SSR (`@supabase/ssr`), RLS, Supabase CLI, Realtime o troubleshooting de Postgres/HTTP. |
| **`supabase-postgres-best-practices`** | `.agents/skills/supabase-postgres-best-practices/SKILL.md` | Creación/alteración de tablas, migraciones SQL, triggers, índices, funciones y políticas RLS. |

---

## 5. Verificación Obligatoria y Sincronización Documental

1. **Verificación Técnica Previa a Finalizar (ejecutar dentro de `mistock/`):**
   * `npx tsc --noEmit` → **0 errores** de tipos.
   * `npm test` (`vitest run`) → tests unitarios en verde cuando aplique a lógica/modelos/validaciones.
   * `npm run build` → compilación de producción limpia con **0 errores**.
2. **Sincronización con Bóveda de Obsidian (`obsidian-docs`):**
   * **Ruta de la Bóveda:** `B:\Programas\Obsidian\Trabajo Final m.i Stock\Trabajo Final mi stock`
   * **Espejo en Repo:** `mistock/docs/`
   * **Notas Clave:** `Librerias.md`, `Metricas y Calculo de KPIs.md`, `Modelos.md`, `Controladores.md`, `Servicios.md`, `Vistas.md`, `Reglas de Negocio miStock.md`, `Rutas del Sistema.md` y `Chema de la Base de Datos.md` (`Base de datos.md`).
