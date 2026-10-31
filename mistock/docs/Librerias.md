# 📦 Catálogo de Librerías y Dependencias: M.I Stock

**Proyecto:** M.I Stock — Sistema de Gestión de Inventario, Punto de Venta (POS) y Catálogo Comercial  
**Capa de Arquitectura:** Dependencias de Terceros y Componentes UI  
**Archivo Fuente:** `package.json`  
**Tags:** #librerias #dependencies #npm #recharts #shadcn #radix #motion #supabase #mistock

---

##  1. Visión General de Dependencias

Todas las librerías incorporadas en **M.I Stock** fueron seleccionadas bajo criterios de **rendimiento, accesibilidad (WAI-ARIA), cero bloqueo de hilo principal y compatibilidad con React 19 y Next.js 16 (App Router / Turbopack)**.

---

##  2. Visualización Gráfica y Analítica (`shadcn/ui Charts` + `Recharts`)

* **Paquetes:** `recharts (^3.10.1)`, `@phosphor-icons/react (^2.1.10)`.
* **Componente Base en Código:** `src/components/ui/chart.tsx` (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`).
* **Tokens CSS:** `--chart-1` a `--chart-5` configurados en `:root` y `@theme inline` en `src/app/globals.css`.
* **Rol y Justificación Técnica:**
  - **shadcn/ui Charts** es un wrapper tipado y ultraliviano sobre el motor vectorial SVG de **Recharts**. No instala un runtime pesado adicional y mantiene el 100% de los componentes dentro del namespace unificado `@/components/ui/`.
  - Durante la auditoría de arquitectura se eliminaron los antiguos wrappers duplicados de `src/components/tremor/`, `src/lib/chartUtils.ts` y `src/hooks/useOnWindowResize.ts`, consolidando toda la capa gráfica bajo `src/components/ui/chart.tsx`.
  - **Gráficos Implementados en `AdminDashboardView.tsx`:**
    1. **`AreaChart` (Evolución de Recaudación):** Gráfico de área dual con gradientes personalizados SVG (`#2A7A78` período actual y `#94A3B8` período anterior), grilla horizontal sutil, tooltips interactivos con formato monetario y leyenda nativa.
    2. **`PieChart` / Donut (Distribución de Métodos de Pago):** Dona con radio interior de 48px y exterior de 75px, centrada en su tarjeta, con desglose en pesos y porcentajes por canal de cobro.
    3. **`BarChart` (Rotación de Artículos Más y Menos Vendidos):** Gráfico de barras con bordes redondeados superiores (`radius={[4, 4, 0, 0]}`), formato dinámico de miles `$Xk` y colores condicionales esmeralda (`#2A7A78`) y ámbar (`#F59E0B`).
    4. **`BarChart` (Ritmo de Facturación en Detalle de Ventas):** Muestra el pulso horario/diario o semanal de la facturación en el panel inferior de auditoría de comprobantes.

---

##  3. Animaciones y Micro-Interacciones

### 3.1. Motion (`motion/react` v13)
* **Rol en el Proyecto:**
  - Sistema declarativo de animaciones para React.
  - Utilizado en transiciones de entrada de paneles, modales de confirmación con `AnimatePresence`, desvanecimiento de alertas y el indicador deslizante (*sliding pill indicator*) entre pestañas (`layoutId="rotacionTabIndicator"`).
  - Incluye soporte nativo para respetar las preferencias de accesibilidad del sistema operativo (`<MotionConfig reducedMotion="user">`).

### 3.2. FormKit AutoAnimate (`@formkit/auto-animate`)
* **Hook en Código:** `useAutoAnimate()`
* **Rol en el Proyecto:**
  - Animación automática sin configuración para elementos del DOM que se insertan, eliminan o reordenan.
  - Aplicado directamente en las etiquetas `TableBody` de las tablas de inventario, usuarios, rotación de productos y transacciones recientes. Cuando el usuario filtra por categoría, busca por texto o cambia de página, las filas realizan una transición suave de 200ms.

---

##  4. Primitivas de Componentes Accesibles (Radix UI)

El sistema utiliza las primitivas *headless* de **Radix UI** dentro de `src/components/ui/`, estilizadas con Tailwind CSS v4:

| Paquete Radix | Rol en la Interfaz de M.I Stock |
| :--- | :--- |
| **`@radix-ui/react-dialog`** | Modales accesibles con bloqueo de scroll, captura de foco y cierre con tecla Escape (`ModalCobroTicket`, `ModalArqueoCaja`, `ModalAccesoRestringido`, etc.). |
| **`@radix-ui/react-dropdown-menu`** | Menús contextuales y selectores de acciones rápidas. |
| **`@radix-ui/react-popover`** | Ventanas flotantes de información contextual y filtros. |
| **`@radix-ui/react-select`** | Componente `<Select>` accesible que reemplaza a los selectores nativos en filtros de categoría, nivel de stock, métodos de pago y ordenamiento. |
| **`@radix-ui/react-label`** | Etiquetas de formulario accesibles vinculadas por `htmlFor` a los inputs. |
| **`@radix-ui/react-tooltip`** | Tooltips informativos sobre indicadores y botones de acción. |
| **`@radix-ui/react-slot`** | Patrón polimórfico `asChild` para componer botones y enlaces sin añadir nodos `div` extra al DOM. |

---

##  5. Estilos, Iconografía y Clases Dinámicas

| Paquete | Rol y Justificación Técnica |
| :--- | :--- |
| **`tailwindcss` (`^4.0.0`)** | Motor de estilos CSS-first de cuarta generación con variables de tema `@theme inline` en `src/app/globals.css`. |
| **`@phosphor-icons/react` (`^2.1.10`)** | **Sistema de Iconografía Vectorial Oficial y Exclusivo.** Utilizado en todas las vistas del proyecto con pesos semánticos tipados: `duotone` (indicadores y tarjetas analíticas), `fill` (estados activos), `bold` (acciones primarias) y `regular`. |
| **`class-variance-authority` (CVA)** | Gestión tipada de variantes de componentes (`buttonVariants`, `badgeVariants`). |
| **`clsx` + `tailwind-merge`** | Función utilitaria `cn()` (`src/lib/utils.ts`) que concatena condicionalmente clases de Tailwind y resuelve colisiones de especificidad. |

---

##  6. Backend, Persistencia y Autenticación en la Nube (Supabase)

| Paquete | Rol y Justificación Técnica |
| :--- | :--- |
| **`@supabase/supabase-js`** | SDK oficial para ejecutar consultas CRUD tipadas sobre PostgreSQL (`categorias`, `productos`, `ventas`, `detalle_venta`, `movimientos_stock`, `perfiles`) y autenticar usuarios. |
| **`@supabase/ssr`** | Paquete especializado para Next.js App Router. Gestiona tokens JWT en cookies seguras `HttpOnly`, sincronizando la sesión entre el Middleware (`src/proxy.ts` + `src/lib/supabase/middleware.ts`), los Server Components y el cliente (`src/lib/supabase/client.ts`). |

---

##  7. Pasarela de Pagos & Integración Fintech (Mercado Pago Point API)

El sistema integra la **Point Integration API (Cloud)** de Mercado Pago mediante `src/services/mercadopago/pointService.ts` y los Route Handlers en `src/app/api/mercadopago/`:

| Módulo / Recurso | Tipo / Endpoint | Rol y Justificación Técnica |
| :--- | :--- | :--- |
| **Point Integration API** | `https://api.mercadopago.com/point/integration-api/...` | Comunicación servidor a servidor para listar terminales Point (`/devices`), fijar modo operativo (`PDV`) y crear o cancelar intenciones de cobro (`/payment-intents`). |
| **Webhooks en Tiempo Real** | `/api/mercadopago/webhook` | Receptor asíncrono de notificaciones push con verificación criptográfica **HMAC-SHA256** (`verifyWebhookSignature`). |
| **Servicio de Dominio** | `src/services/mercadopago/pointService.ts` | Capa de servicio desacoplada con cabeceras de idempotencia (`X-Idempotency-Key` con `crypto.randomUUID()`) y tipado fuerte de estados (`OPEN`, `ON_TERMINAL`, `PROCESSING`, `PROCESSED`, `ABANDONED`, `CANCELLED`, `ERROR`). |

---

##  8. Entorno de Pruebas Unitarias y Calidad de Código (`Vitest`)

Para verificar las fórmulas matemáticas de los Modelos de Dominio, Modelos de Vista y reglas de validación sin depender de conexión de red, el proyecto cuenta con **46 pruebas unitarias automatizadas** en `src/__tests__/`:

| Paquete | Rol y Justificación Técnica |
| :--- | :--- |
| **`vitest` (`^5.0.5`)** | Test runner nativo para ESM y TypeScript, compatible con Node 20/22/24 y despliegues CI/CD en Vercel. |
| **`@testing-library/react` + `jsdom`** | Emulación de DOM y Web APIs en Node.js. |

###  Cobertura de Suites Unitarias (`src/__tests__/`)
1. **`src/__tests__/models/productoModel.test.ts` (11 tests):** Mapeadores `toProducto` / `toCategoria`, cálculo de margen porcentual, semáforo de salud de stock y déficit de unidades.
2. **`src/__tests__/models/cierreCaja.test.ts` (14 tests):** Efectivo esperado (`calcularEfectivoEsperado`), diferencia de caja (`calcularDiferenciaCaja`), estado del balance (`determinarEstadoBalance`) y consolidación de totales (`calcularTotalesCierre`).
3. **`src/__tests__/pos/calculoVentaPos.test.ts` (13 tests):** Subtotal por renglón (`calcularSubtotalRenglon`), totales de carrito (`calcularTotalesCarrito`), cálculo de vuelto (`calcularVueltoPOS`) y sugerencias de billetes (`generarSugerenciasBilletes`).
4. **`src/__tests__/lib/validaciones.test.ts` (8 tests):** Límites `MAX_PRECIO_DB` y `MAX_STOCK_DB`, normalización de texto, emails comerciales/test, teléfono, CUIT argentino, SKU alfanumérico, código ISO de moneda y acotación entera.

---

##  Enlaces Relacionados
- [[Modelos]] — Entidades de dominio, ViewModels y funciones puras testeadas con Vitest.
- [[Controladores]] — Hooks controladores MVC y servicios reactivos.
- [[Vistas]] — Componentes visuales que consumen Radix UI, Recharts, Motion y Phosphor Icons.
- [[Rutas del Sistema]] — App Router de Next.js y endpoints de Mercado Pago Point.
