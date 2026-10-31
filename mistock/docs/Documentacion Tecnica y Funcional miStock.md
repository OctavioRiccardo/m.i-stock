# Documentación Técnica y Funcional del Sistema: miStock

**Proyecto:** miStock — Sistema de Gestión de Inventario, Punto de Venta (POS) y Catálogo Comercial  
**Nivel de Documentación:** Manual Técnico y Funcional de Referencia  
**Arquitectura:** Patrón Modelo-Vista-Controlador (MVC) en Next.js 16 + React 19 + Supabase PostgreSQL  
**Versión:** 1.0 (Producción / Auditada)  
**Fecha:** Octubre 2026  

---

## 1. Introducción y Alcance del Sistema

**miStock** es una plataforma integral de software orientada a la gestión comercial, control patrimonial de inventario y facturación ágil en mostrador para comercios minoristas, locales de atención al público y cadenas de distribución.

### 1.1. Objetivos Principales
1. **Agilidad Operativa en Mostrador:** Reducir los tiempos de espera del cliente mediante una terminal de cobro táctil con soporte para lectores de código de barras, búsquedas en tiempo real, cobros con múltiples medios de pago y emisión instantánea de comprobantes térmicos.
2. **Integridad y Fiabilidad Contable:** Garantizar que cada movimiento de stock o ingreso de dinero esté respaldado por un registro inmutable en base de datos mediante un patrón de libro mayor (*ledger*), impidiendo inconsistencias de stock o fugas de recaudación.
3. **Control Patrimonial en Tiempo Real:** Proveer herramientas visuales y analíticas para auditar la valuación del inventario a precio de costo y venta, alertas de abastecimiento crítico y rotación de artículos.
4. **Seguridad y Control de Acceso (RBAC):** Asegurar que cada empleado acceda exclusivamente a las funciones permitidas para su rol laboral mediante políticas a nivel de fila (Row Level Security) en el motor de base de datos y guardianes de navegación en la interfaz.

---

## 2. Arquitectura de Software y Patrón de Diseño (MVC)

El sistema adopta el patrón **Modelo-Vista-Controlador (MVC)**, adaptado a la arquitectura moderna de componentes reactivos en **Next.js 16 (App Router)** y **React 19**:

```
                              ┌───────────────────────────────────┐
                              │     Ruta Next.js (page.tsx)       │
                              │     Ensamblador de Dependencias   │
                              └─────────────────┬─────────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
        ┌──────────────────────────────┐                  ┌──────────────────────────────┐
        │   CONTROLADOR (Hook React)   │                  │     VISTA (Componente UI)    │
        │      src/controllers/        │ ───────────────► │          src/views/          │
        │                              │   controller     │                              │
        │ - Estado reactivo (useState) │                  │ - 100% Declarativa           │
        │ - Lógica de negocio          │                  │ - Sin acceso a Base de Datos │
        │ - Orquestación de servicios  │                  │ - Renderiza datos y eventos  │
        └──────────────┬───────────────┘                  └──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │       MODELOS Y TIPOS        │
        │         src/models/          │
        │                              │
        │ - Modelos de Dominio         │
        │ - ViewModels y Formularios   │
        │ - Funciones puras de cálculo │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │     SERVICIOS Y PERSISTENCIA │
        │        src/services/         │
        │                              │
        │ - inventarioService (Store)  │
        │ - configuracionService       │
        │ - supabaseService (Postgres) │
        └──────────────────────────────┘
```

### 2.1. Capa de Modelos (`src/models/`)
Se estructura en dos niveles con responsabilidades bien diferenciadas:
* **Modelos de Dominio (`src/models/modelos_dominio/`):** Representan las entidades nucleares del negocio (`Producto`, `Categoria`, `Venta`, `DetalleVenta`, `Pago`, `MovimientoStock`, `Usuario`). Incluyen las interfaces crudas de base de datos (`*Row` en `snake_case`), las entidades de TypeScript (en `camelCase`), DTOs de mutación y funciones de mapeo (*mappers*: `toProducto`, `toCategoria`, `toVenta`, `toUsuario`).
* **Modelos de Vista / ViewModels (`src/models/modelos_vista/`):** Modelan el estado que requiere cada pantalla (`dashboardModel`, `cargaProductoModel`, `cierreCajaModel`, `configuracionModel`, `authModel`) y albergan **funciones puras de cálculo matemático** testeadas unitariamente (cálculo de subtotales, cálculo de vuelto, desglose de arqueo de caja y sugerencias de billetes).

### 2.2. Capa de Controladores (`src/controllers/`)
Cada pantalla posee un *Custom Hook* que encapsula el ciclo de vida, la reactividad y las reglas comerciales:
* `useLoginController` y `useLogoutController`: Gestión de autenticación oficial con Supabase Auth y purga de sesiones locales.
* `usePermisosController`: Guardián de permisos y autorización por rol en tiempo real.
* `useAdminDashboardController`: Sincronización de ventas, ventanas temporales, variaciones porcentuales y generación de series para gráficos.
* `useAdminInventarioController`: Catálogo centralizado, altas con cálculo de rentabilidad, semáforo de 4 estados, edición y bajas lógicas.
* `useAdminInventarioGlobalController`: Auditoría financiera patrimonial a costo y venta, y distribución por rubros.
* `useAdminUsuariosController`: Nómina de colaboradores, asignación de roles, altas con contraseñas encriptadas y toggle de estados activos/inactivos.
* `useAdminConfiguracionController`: Parámetros fiscales, coherencia tributaria del ticket térmico, métodos de pago y exportaciones CSV.
* `useUserDashboardController`: Terminal POS integral (caja mono-caja, turnos, armado de carrito, cobro, anulación y arqueo Z).

### 2.3. Capa de Vistas (`src/views/`)
Componentes 100% declarativos. No ejecutan consultas a la base de datos ni calculan fórmulas matemáticas; reciben el objeto `controller` inyectado como propiedad desde la ruta correspondiente (`page.tsx`).

### 2.4. Capa de Servicios y Almacenes Reactivos (`src/services/`)
* **`inventarioService`:** Almacén reactivo de catálogo e inventario gobernado por `useSyncExternalStore` de React 19, sincronizado de forma bidireccional con Supabase PostgreSQL.
* **`configuracionService`:** Almacén reactivo para datos de empresa, medios de cobro y parámetros operativos.
* **`supabaseService`:** Adaptador de persistencia remota hacia PostgreSQL mediante el cliente oficial de Supabase.

---

## 3. Modelo de Datos y Persistencia Relacional (PostgreSQL)

La persistencia del sistema está implementada sobre **PostgreSQL 15+** en la nube de Supabase.

### 3.1. Entidades Nucleares

| Tabla | Clave Primaria | Claves Foráneas | Propósito en el Negocio |
| :--- | :--- | :--- | :--- |
| `public.usuario` | `id_usuario (UUID)` | `auth.users(id)` | Extiende las cuentas de Supabase Auth almacenando nombre, email, teléfono, rol (`admin`, `vendedor`, `no_rol`) y estado de actividad (`activo`). |
| `public.categorias` | `id_categoria (UUID)` | Ninguna | Clasificación taxonómica de los artículos. El campo `nombre` es `UNIQUE`. Admite baja lógica (`activo`). |
| `public.productos` | `id_producto (UUID)` | `id_categoria (NOT NULL)` | Catálogo comercial de artículos. Almacena `sku (UNIQUE)`, nombre, descripción, `precio_costo`, `precio_venta`, `stock_actual`, `stock_minimo`, `unidad_medida` y `activo`. |
| `public.movimientos_stock` | `id_movimiento (UUID)` | `id_producto`, `id_usuario` | **Libro Mayor (*Ledger*) Inmutable.** Registra variaciones físicas (+ para entradas, - para salidas), tipo (`compra`, `venta`, `ajuste`, `devolucion`), motivo y marca temporal. |
| `public.ventas` | `id_venta (UUID)` | `id_usuario` | Cabecera del comprobante comercial emitido en caja. Contiene el total facturado, estado (`completada`, `cancelada`, `pendiente`) y fecha. |
| `public.detalle_ventas` | `id_detalle (UUID)` | `id_venta`, `id_producto` | Renglones del ticket vendido. Almacena `cantidad` y `precio_unitario`. Posee regla `ON DELETE RESTRICT` sobre `id_producto` para preservar la historia contable. |
| `public.pagos` | `id_pago (UUID)` | `id_venta` | Métodos de cobro asociados a la venta (`efectivo`, `tarjeta_debito`, `tarjeta_credito`, `transferencia`, `mercado_pago`). Permite pagos divididos (*split payments*). |
| `public.configuracion_negocio` | `id_config (INT)` | Ninguna | Almacena los parámetros comerciales, identidad fiscal y configuraciones del POS en formato JSONB con respaldo multi-dispositivo. |

### 3.2. Automatizaciones y Triggers Transaccionales (Motor SQL)

1. **Deducción Atómica de Stock por Venta (`tr_venta_movimiento_stock`):**
   * Disparador: `AFTER INSERT ON public.detalle_ventas`.
   * Acción: Genera automáticamente una fila en `public.movimientos_stock` con `tipo = 'venta'` y `cantidad = -NEW.cantidad`.
   * Cascada: La inserción en `movimientos_stock` activa `tr_actualizar_stock`, que aplica `stock_actual = stock_actual + NEW.cantidad` en `public.productos`. Si el saldo resultante viola la restricción `CHECK (stock_actual >= 0)`, la transacción se revierte por completo.
2. **Reintegro Automático de Existencias por Anulación (`tr_cancelar_venta_reintegrar_stock`):**
   * Disparador: `AFTER UPDATE OF estado ON public.ventas`.
   * Acción: Cuando el estado transiciona a `'cancelada'`, la función `reintegrar_stock_por_cancelacion()` recorre los renglones de `detalle_ventas` y genera movimientos de devolución (`tipo = 'devolucion'`, `cantidad = +cantidad`), restituyendo atómicamente el stock físico al inventario.
3. **Aprovisionamiento Automático de Perfil (`handle_new_user`):**
   * Disparador: `AFTER INSERT ON auth.users`.
   * Acción: Genera el registro correspondiente en `public.usuario` con rol de contención `'no_rol'`, previniendo escaladas no autorizadas de privilegios.

### 3.3. Políticas de Seguridad a Nivel de Fila (Row Level Security - RLS)
Todas las tablas tienen RLS habilitado:
* **Lectura (`SELECT`):** Todo el personal autenticado (`authenticated`) puede consultar el catálogo de categorías, productos, ventas y movimientos para la operatoria diaria.
* **Modificación de Catálogo (`INSERT`, `UPDATE`, `DELETE`):** Reservada exclusivamente al administrador mediante la función de validación `((SELECT public.is_admin()))`.
* **Anulación de Ventas (`UPDATE` en `ventas`):** Habilitada al personal del turno mediante la política `"Staff anula ventas activas"` restringida a columnas de estado.
* **Inmutabilidad Contable (*Append-Only*):** Las tablas `movimientos_stock`, `detalle_ventas` y `pagos` carecen deliberadamente de políticas de actualización o borrado: ningún usuario puede alterar o destruir registros contables ya emitidos.

---

## 4. Módulos Funcionales del Sistema

### 4.1. Módulo Terminal de Punto de Venta (POS Mostrador — `/dashboard`)

Diseñado para trabajo táctil y de alta rotación en el mostrador de atención. Se subdivide en cuatro submódulos operativos y cinco modales transaccionales:

#### Submódulos de Mostrador:
1. **Terminal de Cobro (`ModuloTerminalCobro`):**
   * **Buscador y Lector Óptico:** Permite escanear códigos de barras o buscar por nombre. Con el parámetro `modoEscanerRapido` activado, al coincidir el código exacto o presionar `Enter` se añade automáticamente el producto al carrito.
   * **Carrito / Ticket Activo:** Lista de artículos en memoria con controles de incremento y decremento con validación de stock disponible, cálculo de subtotales y totalizador general.
   * **Filtro por Categorías:** Selector dinámico con conteo de artículos para navegar rápidamente por familias de productos.
2. **Catálogo General de Productos (`ModuloCatalogoProductos`):**
   * Vista de consulta visual con mini-KPIs de existencias en tiempo real y alternador entre cuadrícula táctil y tabla compacta.
   * Permite añadir productos al carrito directamente desde la galería.
3. **Consultor de Precios y Disponibilidad (`ModuloConsultorPrecios`):**
   * Módulo independiente para responder consultas de clientes en mostrador sobre precios unitarios o disponibilidad en salón **sin tocar ni alterar el carrito que se está armando en la caja**.
   * Si el cliente confirma la compra, ofrece un botón para sumar el artículo directamente al ticket activo.
4. **Historial de Tickets del Día (`ModuloHistorialTickets`):**
   * Auditoría de todas las ventas emitidas en la jornada laboral con búsqueda por número de comprobante (`VNT-XXXX`), filtrado por medio de cobro y acceso a reimpresión o anulación.

#### Modales Transaccionales de Caja:
1. **Apertura de Caja (`ModalAperturaCaja`):**
   * La terminal inicia en estado de **Caja Cerrada**, bloqueando la carga de productos al carrito y el cobro hasta que el cajero declare el fondo inicial de cambio en efectivo.
   * Genera un identificador único de turno (`idTurno = TRN-XXXXXX`) y registra la marca temporal de inicio.
2. **Modal de Cobro Multi-Método (`ModalCobroTicket`):**
   * Canales de pago soportados: Efectivo, Tarjeta de Débito, Tarjeta de Crédito, Transferencia Bancaria y Mercado Pago Point.
   * **Calculadora de Vuelto:** En cobros en efectivo, calcula el vuelto en tiempo real y ofrece 6 botones de pago rápido con denominaciones estándar de billetes.
   * **Integración Mercado Pago Point Smart:** Se comunica vía API Cloud con las terminales físicas de cobro, transmitiendo el importe a la pantalla del posnet y confirmando la venta únicamente al recibir la aprobación de la transacción.
3. **Visor y Emisión de Ticket Térmico (`ModalDetalleVenta`):**
   * Renderiza el comprobante listo para imprimir en formato térmico de 80mm o 58mm.
   * Congela los precios unitarios de cada artículo al momento de la emisión (*snapshot* contable).
   * **Anulación:** Incluye la acción de cancelar el comprobante, que revierte el estado a `'cancelada'` y activa el reintegro de existencias físicas por trigger.
4. **Arqueo y Cierre de Caja — Reporte Z (`ModalArqueoCaja` y `ModalReporteCierreTicket`):**
   * Presenta el resumen acumulado de ventas del turno desglosado por canal de cobro y formula el efectivo teórico esperado:
     $$\text{Efectivo Esperado} = \text{Fondo Inicial} + \text{Ventas en Efectivo del Turno}$$
   * Solicita el conteo físico de billetes y monedas en gaveta, impidiendo números negativos o desbordes, y calcula la diferencia de caja:
     $$\Delta = \text{Efectivo Real Contado} - \text{Efectivo Esperado}$$
   * Clasifica el resultado en **Caja Exacta** ($|\Delta| < 0.001$), **Sobrante** ($\Delta > 0$) o **Faltante** ($\Delta < 0$).
   * Emite el Comprobante de Cierre Z térmico con campos para firma de recepción del cajero y del supervisor.

---

### 4.2. Módulo de Gestión de Inventario y Catálogo (`/admingestioninven`)

Consola centralizada para la administración de mercaderías y diagnóstico de abastecimiento:

1. **Alta de Producto con Calculadora de Rentabilidad:**
   * Formulario con validación de categoría obligatoria, unicidad de código SKU, costo y precio de venta.
   * Previsualización dinámica de ganancia unitaria y margen porcentual:
     $$\text{Margen \%} = \left(\frac{\text{Precio Venta} - \text{Precio Costo}}{\text{Precio Costo}}\right) \times 100$$
   * Alerta preventiva visible si el precio de venta es igual o inferior al costo de adquisición (`alertarMargenNegativo`).
2. **Semáforo Unificado de Salud de Stock (4 Niveles Mutuamente Excluyentes):**
   * **Sin Existencias / Agotados:** $\text{stockActual} = 0$.
   * **Stock Crítico:** $0 < \text{stockActual} \le \text{stockMinimo}$.
   * **Bajas Unidades:** $\text{stockMinimo} < \text{stockActual} \le \text{stockMinimo} \times 1.5$.
   * **Stock Óptimo:** $\text{stockActual} > \text{stockMinimo} \times 1.5$.
   * *(La suma de los cuatro rangos equivale con exactitud al total de productos activos en el catálogo).*
3. **Mantenimiento del Catálogo y Bajas Lógicas:**
   * Edición ágil de precios, costos, categoría y umbrales de stock mínimo.
   * Baja lógica (*soft-delete*): Los artículos desactivados se ocultan del mostrador de ventas pero permanecen en la base de datos para no quebrar comprobantes pasados, permitiendo su reactivación con un clic.

---

### 4.3. Módulo de Valuación Patrimonial e Inventario Global (`/admininventarioglobal`)

Herramienta ejecutiva para auditar el capital inmovilizado en el depósito:

* **Valuación Financiera Consolidada:**
  * **Valor al Costo:** $\sum (\text{stockActual} \times \text{precioCosto})$ (inversión neta en mercadería).
  * **Valor a Precio de Venta:** $\sum (\text{stockActual} \times \text{precioVenta})$ (retorno bruto potencial).
  * **Margen Global Estimado:** Diferencia porcentual global entre la valuación a costo y venta.
* **Exploración Taxonómica por Categorías:** Píldoras con conteo de unidades físicas y valuación individual por rubro.
* **Navegación Profunda (*Deep Linking*):** La acción *"Gestionar"* en cualquier fila redirige a la consola de inventario prefiltrando automáticamente el SKU correspondiente.

---

### 4.4. Módulo de Tablero Ejecutivo y Métricas Comerciales (`/admin`)

Panel analítico para monitorear el rendimiento comercial del negocio en tiempo real:

1. **Selector Global Unificado de Período:**
   * Gobierna toda la pantalla bajo cuatro ventanas temporales: `Hoy`, `Esta Semana`, `Este Mes` o `Últimos 30 días`.
2. **Tarjetas KPI con Variación Porcentual Real:**
   * Recaudación del Período, Ticket Promedio, Operaciones Realizadas y Unidades Despachadas.
   * Cada indicador compara la ventana activa contra la ventana anterior equivalente ($\Delta\%$), reflejando el crecimiento o retracción real.
3. **Series Gráficas Interactivas (Recharts):**
   * **Curva Comparativa de Recaudación:** Superpone la facturación del período actual contra el período precedente.
   * **Distribución de Métodos de Pago:** Gráfico de anillo (*donut chart*) con porcentaje e importe recaudado por canal de cobro.
4. **Ranking de Rotación con Costo de Reposición:**
   * Tablas de artículos más vendidos y menos vendidos, cruzadas con los costos de reposición y stock mínimo para detectar capital inmovilizado y necesidades urgentes de compra.

---

### 4.5. Módulo de Administración de Personal y Seguridad (RBAC — `/adminusuarios`)

Administra las credenciales, roles y autorizaciones de los empleados:

1. **Escala de Roles:**
   * `'admin'`: Acceso irrestricto a métricas, inventario, usuarios, configuración y punto de venta.
   * `'vendedor'`: Acceso exclusivo al mostrador y terminal de cobro (`/dashboard`). Si intenta ingresar a rutas de administración, un modal de seguridad bloquea la pantalla y lo redirige.
   * `'no_rol'`: Rol de seguridad asignado por defecto a nuevas cuentas hasta que un administrador les conceda permisos.
2. **Herencia Funcional:** El rol `admin` hereda por diseño las facultades de `vendedor`, permitiendo al dueño o encargado atender la caja sin duplicar usuarios ni perfiles en la base de datos.
3. **Gestión Criptográfica de Contraseñas:** Las altas y cambios de contraseñas se canalizan por procedimientos almacenados en Supabase (`crear_colaborador_admin` y `actualizar_password_colaborador_admin`), encriptando las credenciales con bcrypt y descartándolas de cualquier almacenamiento local en el navegador.
4. **Protección de Cuenta Maestra:** El sistema valida e impide revocar permisos o eliminar al último administrador activo, garantizando la continuidad operativa.

---

### 4.6. Módulo de Configuración y Portabilidad de Datos (`/adminconfiguracion`)

Gobierna las reglas operativas de la organización a través de cinco pestañas con guardado reactivo automático:

1. **Negocio e Identidad:** Razón social, nombre de fantasía, CUIT, condición frente al IVA y moneda comercial.
2. **Punto de Venta (POS):** Habilitación/deshabilitación de métodos de pago (garantizando un mínimo de 1 medio activo), política de venta sin stock, sonido acústico de confirmación y modo escáner rápido.
3. **Régimen y Validez Legal del Ticket Térmico:**
   * **Modo No Fiscal (Ley Nacional 11.683 - Art. 40):** Comprobante interno que imprime de forma destacada `*** DOCUMENTO NO VÁLIDO COMO FACTURA ***` sin discriminar IVA ficticio.
   * **Modo Fiscal Formal (RG AFIP/ARCA 4892):** Emite Factura B con desglose de Subtotal Neto + IVA (21%) para Responsables Inscriptos, o Factura C para Monotributistas.
4. **Métricas:** Configuración del período por defecto, día de inicio de semana (`lunes` o `domingo`), día de corte mensual y comparativa con el período anterior.
5. **Portabilidad y Respaldos (Exportación CSV):**
   * Generador de reportes en formato CSV según la norma **RFC 4180**.
   * Incorpora encabezado **UTF-8 BOM (`\uFEFF`)**, lo que permite la apertura inmediata en Microsoft Excel en español y Google Sheets sin rotura de acentos ni desalineación de columnas.

---

## 5. Reglas de Negocio Comerciales y Políticas del Sistema

1. **Taxonomía Estricta:** Ningún producto puede crearse ni existir sin una categoría asociada (`id_categoria NOT NULL REFERENCES categorias ON DELETE RESTRICT`).
2. **Unicidad de Identificadores:** Prohibida la existencia de códigos de barras o SKU duplicados en el catálogo (`sku UNIQUE`).
3. **Snapshot de Precios en Ventas:** Los comprobantes históricos nunca modifican sus importes si el administrador ajusta los precios del catálogo con posterioridad.
4. **Deducción Única de Inventario:** El frontend delega la deducción de existencias al trigger del motor relacional, eliminando cualquier riesgo de doble descuento de stock.
5. **Reintegro Atómico por Anulación:** Las anulaciones en caja devuelven la mercadería física al inventario y descuentan la recaudación automáticamente mediante trigger SQL.
6. **Apertura Previa Obligatoria de Caja:** Ningún vendedor puede armar carritos ni registrar ventas si la sesión de caja no ha sido formalmente abierta con su fondo inicial declarado.
7. **Disponibilidad Mínima de Medios de Pago:** El sistema bloquea el apagado simultáneo de todos los canales de pago, garantizando al menos una vía de cobro operativa.
8. **Techos Numéricos de Integridad:**
   * Precios y valores monetarios: tope de \$99.999.999,99 (compatible con `numeric(10,2)`).
   * Existencias físicas: enteros no negativos en el rango $0 \dots 1.000.000$.
   * Contraseñas de acceso: longitud obligatoria de 6 a 72 caracteres.
   * Identificación tributaria: CUIT argentino de 11 dígitos numéricos exactos formateado a `XX-XXXXXXXX-X`.

---

## 6. Stack Tecnológico y Dependencias del Proyecto

* **Frontend y Framework:**
  * **Next.js 16.3.4 (App Router con Turbopack):** Enrutamiento por carpetas, renderizado del lado del servidor (RSC) y optimización en compilación.
  * **React 19:** Hooks nativos (`useState`, `useMemo`, `useEffect`, `useSyncExternalStore`).
  * **TypeScript 5 (Strict Mode):** Tipado estático en el 100% de los modelos, controladores y vistas.
  * **Tailwind CSS v4:** Motor de estilos utilitarios de alto rendimiento.
  * **Radix UI (`shadcn/ui`):** Primitivas accesibles para diálogos, selectores, menús y tablas.
  * **Phosphor Icons (`@phosphor-icons/react`):** Sistema iconográfico unificado (`regular`, `duotone`, `fill`).
  * **Motion (`motion/react`) y AutoAnimate:** Micro-interacciones y transiciones fluidas de interfaz.
  * **Recharts (`shadcn/ui Charts`):** Gráficos vectoriales SVG dinámicos (Área, Barras y Donut).
* **Backend y Persistencia:**
  * **PostgreSQL 15+ (Supabase Cloud):** Motor relacional con integridad referencial ACID.
  * **Supabase Auth:** Autenticación con tokens JWT cifrados con bcrypt.
  * **PL/pgSQL:** Triggers en cascada para gestión de stock y funciones RPC de administración.
* **Pruebas y Calidad de Código:**
  * **Vitest:** Motor de pruebas unitarias sobre modelos matemáticos y librerías de validación.

---

## 7. Anexo: Entornos Desplegados y Cuentas de Acceso

Para fines de evaluación, auditoría y pruebas funcionales independientes, el sistema se encuentra configurado en dos entornos aislados:

### 7.1. Entornos en la Nube
* **Entorno 1 — Evaluación Académica:**
  * Rama de despliegue: `profesores-test` (Vercel)
  * Base de Datos: Instancia independiente en Supabase para control docente.
* **Entorno 2 — Validación Comercial del Cliente:**
  * Rama de despliegue: `cliente-test` (Vercel)
  * Base de Datos: Instancia independiente en Supabase para pruebas de cliente.

### 7.2. Nómina de Cuentas de Referencia
* **`carlos@test.mistock`:** Rol Administrador (acceso total a todas las consolas).
* **`walter@test.mistock`:** Rol Administrador (acceso total a todas las consolas).
* **`vendedor@mistock.test` (Contraseña: `test123`):** Rol Vendedor POS (acceso acotado a la terminal `/dashboard`).
* **`nahuel@test.mistock`:** Rol de prueba para el cliente en su entorno independiente.
