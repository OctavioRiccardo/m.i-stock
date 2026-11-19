# miStock — Interface Design System

> Memoria viva de diseño para **miStock** (Sistema B2B de Gestión de Inventario y Punto de Venta / POS).
> Respetar siempre en conjunto con `AGENTS.md` (arquitectura MVC, Phosphor Icons y primitivos Radix UI).

---

## 1. Intención y Mundo del Producto

- **Quién opera miStock:**
  - **Cajero / Operador en mostrador:** de pie o sentado frente a clientes esperando, escaneando códigos de barras a velocidad, operando con teclado + mouse/táctil bajo presión en hora pico. Necesita legibilidad instantánea, cero fricción y objetivos táctiles cómodos.
  - **Administrador / Dueño de negocio:** revisando al inicio o cierre del día la recaudación, salud del stock, capital inmovilizado, rotación y arqueos de caja. Necesita jerarquía numérica inmediata, filtros claros y densidad ordenada sin ruido decorativo.
- **Sensación objetivo:** **Mostrador y Libro Mayor Moderno** (*Modern Merchant Ledger*). Cálido como el papel de recibo y la libreta de almacén (`#F8F7F2`), preciso como una registradora calibrada (`tabular-nums`, alineación estricta) y sereno como una herramienta de trabajo de uso diario (8+ horas sin fatiga visual).
- **Antipatrones que rechazamos explícitamente:**
  - Cuadrículas de 4 tarjetas KPI idénticas (*ícono en cajita + número + pill*) con hover flotante en tarjetas no interactivas.
  - Mezcla de grises fríos de Tailwind (`gray-50`, `gray-100`, `gray-200`) sobre un lienzo cálido (`#F8F7F2`).
  - Botones primarios en tonos ajenos (`emerald-600` / `emerald-700`) compitiendo con el verde petróleo de marca (`#2A7A78`).
  - Sidebars blancos con ítems activos en bloque sólido `#2A7A78` que compiten visualmente con el CTA principal de la pantalla.
  - Tipografía genérica del sistema sin `tabular-nums` en precios, SKUs ni totales.

---

## 2. Exploración de Dominio y Elemento Firma

- **Dominio:** Mostrador, ticket térmico de 80 mm, código de barras, estantería, libro de caja, arqueo Z, reposición, SKU.
- **Mundo de color:** Papel crema de ticket (`#F8F7F2`), cartón/borde de talonario (`#E8E6DF`), tinta carbón verdosa (`#1C2424`), sello verde petróleo (`#2A7A78`), menta lavada de resaltado (`#E2F1F0`), latón/ámbar de stock bajo (`#B45309` / `#FEF3C7`), lacre/rojo de cancelación (`#DC2626`).
- **Elementos Firma (Signature) de miStock:**
  1. **Tira de Ticket Térmico (POS):** La columna derecha del terminal de cobro se comporta como un comprobante vivo — cabecera con estado de caja, líneas de producto con SKU en monoespaciada, separador punteado de corte (`border-dashed`), total dominante en `tabular-nums` y botón único de cobro de alto contraste.
  2. **Jerarquía KPI Asimétrica (Admin):** En lugar de 4 cajas iguales, la métrica rectora del período (**Recaudación Total**) domina visualmente en tamaño/peso o banda principal, mientras las 3 métricas de soporte (Ventas, Ticket Promedio, Unidades) se subordinan en una tira compacta con delta claro.
  3. **Indicador de Salud de Stock en Tabla:** Barra o punto semántico calibrado junto a la cantidad en `tabular-nums` (óptimo / alerta de reposición / agotado) que permite escanear el inventario en menos de 2 segundos.
  4. **Marca unificada:** Un único emblema consistente para `miStock` en Login, AdminSidebar y UserSidebar (en lugar de cambiar entre `Package`, `ShieldCheck` y `UserCheck`).

---

## 3. Arquitectura de Tokens (Temperatura Cálida Unificada)

Todos los componentes deben consumir tokens semánticos (`bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `bg-primary`) en lugar de hexadecimales sueltos o escalas frías `gray-*`.

### Superficies y Elevación (una sola familia cálida)
| Nivel | Token | Valor | Uso |
| :--- | :--- | :--- | :--- |
| Canvas / Fondo base | `--background` / `--surface-ledger` | `#F8F7F2` | Fondo global de página, sidebar en escritorio, inputs en reposo |
| Superficie elevada 1 | `--card` / `--surface-counter` | `#FFFFFF` | Tarjetas principales, tablas, ticket POS, input en `:focus` |
| Superficie hundida / sutil | `--muted` / `--surface-recessed` | `#EFECE4` | Cabeceras de tabla sutiles, tracks de tabs segmentados, hover suave (reemplaza `gray-50`/`gray-100`) |
| Superficie flotante 2 | `--popover` | `#FFFFFF` | Dropdowns, popovers, selects, modales (con borde + sombra de 3 capas) |

### Tinta y Jerarquía de Texto (4 niveles obligatorios)
| Nivel | Token | Valor | Uso |
| :--- | :--- | :--- | :--- |
| 1. Primario | `--foreground` | `#1C2424` | Títulos, importes, nombres de productos, valores principales |
| 2. Secundario | `--foreground-secondary` | `#3F4D4D` | Subtítulos, contenido de tabla secundario, descripciones activas |
| 3. Terciario / Metadatos | `--muted-foreground` | `#657373` | Labels, encabezados de columna, timestamps, breadcrumbs |
| 4. Apagado / Placeholder | `--foreground-subtle` | `#8E9B9B` | Placeholders, estados vacíos, íconos inactivos, texto deshabilitado |

### Marca y Semántica (Regla 60 / 30 / 10)
- **Acento único de marca (~10% de pantalla):**
  - `--primary`: `#2A7A78` (CTA principal, foco, indicador activo)
  - `--primary-hover`: `#205E5D`
  - `--primary-active`: `#184847`
  - `--secondary` / `--accent`: `#E2F1F0` con texto `#1E5C5A` (estados activos en sidebar, chips de filtro activo, resaltados suaves)
- **Semánticos calibrados al fondo cálido:**
  - **Éxito / Caja abierta / Stock óptimo:** texto `#166534`, fondo `#ECFDF5`, borde `#A7F3D0` (nunca usar `bg-emerald-600` para botones que compitan con `#2A7A78`).
  - **Advertencia / Stock bajo:** texto `#92400E`, fondo `#FFFBEB`, borde `#FDE68A`.
  - **Destructivo / Cancelada / Sin stock:** texto `#B91C1C`, fondo `#FEF2F2`, borde `#FECACA`.
  - **Mercado Pago Point (integración externa):** `#009EE3` reservado exclusivamente a badges y gráficos del medio de pago Mercado Pago.
- **Bordes (sutiles y cálidos):**
  - Estándar: `rgba(28, 36, 36, 0.10)` / `#E8E6DF`
  - Suave (divisores internos de tabla/ticket): `rgba(28, 36, 36, 0.06)`
  - Énfasis / hover: `rgba(28, 36, 36, 0.18)`
  - Focus ring: `rgba(42, 122, 120, 0.25)` con borde `#2A7A78`

---

## 4. Tipografía y Escala Numérica

- **Familias recomendadas (vía `next/font/google` en `src/app/layout.tsx`):**
  - `--font-sans`: **`Plus Jakarta Sans`** (o `DM Sans`) — geométrica cálida, excelente legibilidad en paneles densos y encabezados con personalidad.
  - `--font-mono`: **`JetBrains Mono`** (o `IBM Plex Mono`) — exclusiva para códigos de barras, SKUs, números de ticket (`#000142`), precios alineados en tabla y montos de cierre Z.
- **Escala tipográfica (ratio ~1.25 sobre base 14px):**
  - `11px` / `500` / tracking `+0.06em` uppercase → Etiquetas de columna (`TableHead`), secciones de sidebar, micro-labels de KPI.
  - `12px` / `500` → Badges, paginación, textos de ayuda, timestamps.
  - `14px` / `400–600` (base) → Cuerpo, filas de tabla, inputs, botones. Tres niveles por peso/color: valor (`600` primario), etiqueta (`500` secundario), meta (`400` terciario).
  - `16px` / `600` (`tracking-[-0.01em]`) → Títulos de tarjetas y modales.
  - `22px–24px` / `700` (`tracking-[-0.02em]`, `text-wrap: balance`) → Encabezado de página (`H1`).
  - `28px–32px` / `700` (`tracking-[-0.03em]`, `tabular-nums`) → Métrica hero (Recaudación principal / Total a Cobrar en POS).
- **Regla obligatoria de números:** Todo precio, stock, contador, delta porcentual, reloj o columna numérica lleva `tabular-nums`.

---

## 5. Estrategia de Profundidad, Espaciado y Radios

- **Unidad base de espaciado:** `4px` (solo múltiplos: `4, 8, 12, 16, 20, 24, 32px`).
- **Densidad por contexto:**
  - **Admin (Analítico / Gestión):** `p-5` (20px) en cards principales, `gap-5` o `gap-6` entre bloques mayores, filas de tabla `py-2.5 px-4` (compactas y escaneables).
  - **POS Mostrador (Operativo rápido):** `p-4` (16px) en contenedores, controles táctiles mínimos de `h-9` (36px) a `h-11` (44px) en acciones frecuentes de caja y steppers.
- **Estrategia de profundidad única (Surface + Whisper Shadow):**
  - Cards sobre `#F8F7F2`: `bg-white` + `shadow-[0_0_0_1px_rgba(28,36,36,0.08),0_1px_2px_rgba(28,36,36,0.04)]` (sin sombras pesadas ni `hover:shadow` en cards estáticas).
  - Popovers / Selects / Dialogs: `bg-white` + `shadow-[0_0_0_1px_rgba(28,36,36,0.08),0_8px_24px_-4px_rgba(28,36,36,0.12)]`.
  - Inputs: superficie ligeramente hundida `bg-[#F8F7F2]/80` con borde `rgba(28,36,36,0.12)`, pasa a `bg-white` en `:focus-visible`.
- **Radios concéntricos (`outerRadius = innerRadius + padding`):**
  - Contenedores / Cards / Modales: `rounded-xl` (`12px`)
  - Controles internos (Botones, Inputs, Items de nav, Chips internos con `p-1`): `rounded-lg` (`8px`)
  - Sub-elementos compactos (Badges cuadrados, indicadores, botones `sm`): `rounded-md` (`6px`)
  - Pills de estado: `rounded-full`

---

## 6. Patrones de Componentes (Medidas Canónicas)

- **Sidebar (`AdminSidebar` / `UserSidebar`):**
  - Ancho: `248px` (`w-62`) o `256px` (`w-64`), **mismo fondo que el canvas (`bg-[#F8F7F2]`)** separado por un borde sutil `border-r border-border` (evita partir la pantalla en dos mundos).
  - Ítem activo: fondo tintado `bg-[#E2F1F0]` + texto `#1E5C5A` `font-semibold` + barra lateral de acento `3px` en `#2A7A78` (reserva el bloque sólido `#2A7A78` exclusivamente para el botón CTA principal de la vista).
- **Button (`src/components/ui/button.tsx`):**
  - Alturas: `sm: 32px (h-8)`, `default: 36px (h-9)`, `lg: 44px (h-11, ideal para Cobrar / Login)`.
  - Feedback táctil: `active:scale-[0.98]`, transición explícita `transition-[background-color,border-color,color,transform,box-shadow] duration-150` (nunca `transition-all`).
  - Usar siempre `variant="default"` (`#2A7A78`) para el CTA principal de cada vista (incluido **Abrir Caja** y **Cobrar Ticket**).
- **Input (`src/components/ui/input.tsx`):**
  - Altura `h-9` (36px) en formularios admin, `h-10` (40px) en buscador principal / escáner POS.
  - Fondo inset `#F8F7F2`/80 → `bg-white` en foco.
- **Table (`src/components/ui/table.tsx`):**
  - Cabecera en superficie sutil (`bg-[#EFECE4]/50`), `h-9`, texto `11px` uppercase `tracking-wider` `text-[#657373]`.
  - Filas con hover cálido (`hover:bg-[#F8F7F2]`, nunca `hover:bg-gray-50`).
  - Columnas numéricas siempre alineadas a la derecha (`text-right tabular-nums`).
- **POS Quantity Stepper (`ModuloTerminalCobro`):**
  - Botones `-` / `+` mínimo `h-8 w-8` (32px visible con área táctil cómoda, ideal `h-9 w-9` en touch) y contador en `font-mono tabular-nums`.
- **Phosphor Icons:**
  - Navegación inactiva / utilidades: `weight="regular"`.
  - Navegación activa / encabezados / estados: `weight="duotone"`.
  - Indicadores pequeños de estado / checks: `weight="fill"` o `weight="bold"`.

---

## 7. Movimiento y Micro-interacciones

- **Regla de oro POS:** Acciones repetidas decenas de veces por turno (escanear código, sumar ítem al carrito, cambiar cantidad, cambiar pestaña) deben sentirse **instantáneas** (`<= 120ms` o sin animación de desplazamiento).
- **Duraciones máximas:** Botones `120–150ms`, dropdowns/popovers `150–180ms`, modales/drawers `200–240ms`.
- **Curva estándar:** `cubic-bezier(0.23, 1, 0.32, 1)` (ease-out rápido).
- **Prohibiciones:** No usar `whileHover={{ y: -2 }}` en tarjetas KPI que no son clickeables; no animar propiedades de layout (`width`, `height`, `padding`); respetar siempre `<MotionConfig reducedMotion="user">`.

---

## 8. Auditoría Inicial y Hoja de Ruta de Refinamiento

Hallazgos detectados en la primera pasada sobre el código actual de `mistock/src/`:

| Prioridad | Área / Archivos | Drift detectado | Mejora objetivo |
| :--- | :--- | :--- | :--- |
| **P1** | `app/layout.tsx`, `app/globals.css` | Fuente de sistema genérica, sin `--font-mono`, `--muted: #F3F4F6` (gris frío) | Cargar `Plus Jakarta Sans` + `JetBrains Mono` con `next/font/google`; calentar `--muted` a `#EFECE4` y añadir tokens de texto 4 niveles y sombras canónicas. |
| **P2** | `components/ui/*` (`button`, `card`, `input`, `table`, `badge`, `dialog`) | Hex hardcodeados, `hover:bg-gray-50`, `transition-all`, inputs `bg-white` sobre cards `bg-white`, `Card` con sombra hover global | Migrar a tokens semánticos, inputs inset cálidos, filas de tabla cálidas, eliminar sombra hover en `Card` base, transiciones explícitas. |
| **P3** | `AdminSidebar.tsx`, `UserSidebar.tsx`, `LoginFormView.tsx` | Sidebar `bg-white` fragmenta el canvas; ítem activo teal sólido compite con CTAs; 3 íconos distintos de marca; badge `v1.0` en `gray-100` | Unificar fondo de sidebar con `#F8F7F2`, estado activo tintado (`#E2F1F0` + indicador lateral `#2A7A78`), unificar emblema de marca `miStock`. |
| **P4** | `AdminDashboardView.tsx` | 4 cards KPI idénticas con `whileHover` falso; falta `tabular-nums`; selector de período con sombras/bordes mixtos | Jerarquía KPI asimétrica (Recaudación protagonista + strip secundario), `tabular-nums` en todas las cifras y gráficos, limpieza de bordes/sombras. |
| **P5** | `UserDashboardView.tsx`, `ModuloTerminalCobro.tsx` | Botones `Abrir Caja` (`emerald-700`) y `Agregar` (`emerald-600`) rompen la marca; steppers de `28px` chicos para mostrador; header POS compite con el escáner/ticket | Unificar CTAs al `#2A7A78`, elevar el Ticket de Venta a elemento firma tipo comprobante térmico (`font-mono tabular-nums`, línea punteada), agrandar controles táctiles POS. |
