# 📈 Métricas y Fórmulas de Cálculo: miStock

**Proyecto:** miStock — Sistema de Gestión de Inventario, Punto de Venta (POS) y Catálogo Comercial  
**Capa de Arquitectura:** Analítica de Negocio y Finanzas  
**Ubicación en Código:** `src/controllers/adminControllers/dashboardController.ts` y `src/views/admin/AdminDashboardView.tsx`  
**Tags:** #metricas #kpis #finanzas #recaudacion #rotacion #calculo #estadisticas #recharts #shadcn #mistock

---

##  1. Filosofía del Panel de Métricas & KPIs

El módulo de **Métricas & KPIs** de **miStock** está diseñado bajo estándares corporativos **B2B**. Su objetivo es proporcionar al Administrador y a la Dirección del comercio una visión ejecutiva inmediata sobre:
1. **Salud Financiera:** Liquidez, facturación global y ticket promedio.
2. **Tendencia y Estacionalidad:** Comparación temporal período a período para evaluar si el negocio crece o se contrae.
3. **Distribución de Cobros:** Monitoreo del efectivo físico frente a dinero digital (Mercado Pago, tarjetas, transferencias).
4. **Rotación de Mercancías:** Identificación de artículos de alta demanda versus capital inmovilizado en góndolas o depósitos.

> [!NOTE] **Separación Funcional Estricta**
> Para mantener una interfaz limpia y libre de ruido:
> - El **Control y Auditoría de Usuarios** se gestiona en su propia vista dedicada: `/adminusuarios`.
> - Las **Alertas de Stock y Valuación Patrimonial** se auditan en su consola especializada: `/admininventarioglobal` (con semáforo de 4 estados y redirección canónica desde `/adminstockcritico`).
> - La pestaña `/admin` queda **100% focalizada en inteligencia de negocio y rendimiento económico**.

---

##  2. Las 4 Métricas Clave Superiores (Top KPIs)

Ubicadas en la fila principal del dashboard, se representan en tarjetas estructuradas verticalmente con una cifra numérica destacada y un badge porcentual sobrio directamente debajo del número.

```
┌───────────────────────────────┐
│ RECAUDACIÓN DEL MES           │ [Icono $]
│ $1.450.000                    │
│ [+12.5%]                      │
└───────────────────────────────┘
```

---

### 2.1. Recaudación del Mes
* **Definición:** Monto total bruto en pesos argentinos resultante de la totalidad de las ventas cobradas durante el mes fiscal activo.
* **Fórmula Matemática:**
  $$\text{Recaudación Mensual} = \sum_{i=1}^{N} \text{totalVenta}_i \quad \forall \, \text{venta}_i \in \text{Mes Actual}$$
* **Cálculo de la Variación Porcentual:**
  Compara la recaudación acumulada del mes en curso contra la del mes calendario inmediatamente anterior:
  $$\Delta\% = \left(\frac{\text{Recaudación Mes Actual} - \text{Recaudación Mes Anterior}}{\text{Recaudación Mes Anterior}}\right) \times 100$$
  - Si $\Delta\% > 0$: El badge adopta variante `success` (fondo verde suave, texto esmeralda: `+12.5%`).
  - Si $\Delta\% < 0$: El badge adopta variante `destructive` (fondo rojo suave: `-5.2%`).
* **Implementación en Código:**
  ```typescript
  // Sumatoria acumulada de tickets del período
  const monthlyRevenue = ventasMes.reduce((acc, venta) => acc + venta.total, 0);
  ```

---

### 2.2. Ticket Promedio Mensual
* **Definición:** Valor medio facturado por cada transacción completada en el local. Es un indicador clave de la capacidad de compra de los clientes y la efectividad de la venta cruzada (*cross-selling*).
* **Fórmula Matemática:**
  $$\text{Ticket Promedio} = \frac{\text{Recaudación Total del Mes}}{\text{Cantidad Total de Operaciones Concretadas}}$$
* **Ejemplo Práctico:**
  $$\text{Ticket Promedio} = \frac{\$1.450.000}{168 \text{ ventas}} = \$8.630,95 \approx \$8.630$$
* **Interpretación:** Un incremento en el ticket promedio significa que los clientes compran más productos por visita o eligen artículos de mayor valor unitario.

---

### 2.3. Operaciones Concretadas
* **Definición:** Volumen total de tickets de venta que finalizaron de manera exitosa y cobrada durante el mes.
* **Fórmula Matemática:**
  $$N = \text{Count}(\text{ventas}) \quad \text{donde estado} = \text{'completada'}$$
* **Exclusión de Integridad:** Se excluyen del conteo transacciones canceladas, pruebas de caja o ventas anuladas.

---

### 2.4. Unidades Despachadas
* **Definición:** Suma cuantitativa de todas las unidades físicas de productos que salieron del inventario a través de las ventas efectuadas en el mes.
* **Fórmula Matemática:**
  $$U = \sum_{j=1}^{M} \text{cantidad}_j \quad \forall \, \text{item}_j \in \text{detalle\_ventas del Mes}$$
* **Diferenciación con Operaciones:** Una sola operación (ticket) puede contener 10 unidades de diferentes artículos. Por ejemplo: 168 ventas representaron la salida física de 640 unidades en góndola.

---

##  3. Visualizaciones Analíticas de Segundo Nivel

---

### 3.1. Evolución Temporal de Recaudación (`AreaChart`)
* **Componente:** `AreaChart` de `shadcn/ui Charts (Recharts)` en `AdminDashboardView.tsx`.
* **Propósito:** Mostrar visualmente la curva de ingresos a lo largo del tiempo para detectar picos de demanda y estacionalidad, gobernada por el selector global de período.
* **Series Comparativas:**
  1. `Recaudación Actual`: Trazo principal (`#2A7A78`) que representa las ventas del período seleccionado.
  2. `Período Anterior`: Trazo de referencia punteado (`#94A3B8`) para contrastar contra la ventana temporal inmediatamente previa.
* **Granularidades Soportadas (4 Períodos):**
  - **Hoy (`diario`):** 6 franjas de 4 horas (`00-04h` a `20-24h`) comparadas contra la jornada de ayer.
  - **Esta Semana (`semanal`):** 7 días de la semana (respetando `inicioSemana: 'lunes' | 'domingo'`) comparados contra la semana anterior.
  - **Este Mes (`mensual`):** 4 semanas contables desde `diaCorteMensual` comparadas contra el mes contable previo.
  - **Últimos 30 Días (`ultimos_30_dias`):** 6 bloques de 5 días (`Días 1-5` a `Días 26-30`) comparados contra los 30 días anteriores.

---

### 3.2. Participación por Métodos de Pago (`DonutChart`)
* **Componente:** `PieChart` (Donut) de `shadcn/ui Charts (Recharts)`, centrado geométricamente con leyenda inferior sincronizada mediante `COLORES_METODOS`.
* **Propósito:** Monitorear la composición de la caja registradora en el período global activo para anticipar costos de comisiones y disponibilidad de efectivo.
* **Fórmula de Porcentaje de Participación:**
  Para cada método de pago $m \in \{\text{Efectivo}, \text{Tarjeta Débito/Crédito}, \text{Transferencia}, \text{Mercado Pago (Point)}\}$:
  $$\%_m = \left(\frac{\text{Monto Recaudado por Método } m}{\text{Recaudación Total del Período}}\right) \times 100$$
* **Identidad Cromática Semántica (`COLORES_METODOS`):**
  - **Efectivo (`#2A7A78`):** Liquidez física inmediata en mostrador, sin retenciones bancarias.
  - **Mercado Pago (Point) (`#009EE3`):** Cobros electrónicos mediante Smart POS (Point) y QR dinámico.
  - **Tarjeta Débito/Crédito (`#6366F1`):** Acreditación bancaria por lote Posnet.
  - **Transferencia (`#F59E0B`):** Pago digital directo a cuenta corriente del comercio.

---
 4. Panel de Rotación de Artículos y Salud de Stock

El panel de rotación resuelve una de las mayores problemáticas del comercio minorista: **saber qué productos generan dinero y qué productos tienen el dinero estancado** dentro del período analítico activo.

---

### 4.1. Filtros Dinámicos por Categoría
* Permite seleccionar mediante chips interactivos todas las categorías activas del catálogo (`[Todas]`, `[Almacén]`, `[Bebidas]`, etc.).
* Al hacer clic en una categoría:
  1. Se filtra instantáneamente el gráfico superior de barras (`Top 5`).
  2. Se filtra la tabla inferior de artículos.
  3. Se reinicia la paginación a la página 1 (`setPaginaRotacion(1)`).
  4. Se recalculan los totales del segmento (`Facturación segmento`, `Salidas` o `Capital a costo`).

---

### 4.2. Pestaña 1: Más Vendidos (Alta Rotación)
* **Gráfico de Top Facturación (`BarChart`):** Renderiza en color esmeralda (`#2A7A78`) los artículos que concentran la mayor recaudación del catálogo en el período activo.
* **Identificación del Principio de Pareto:** Los 5 productos líderes habitualmente concentran la mayor proporción de la facturación global.
* **Semáforo de Salud Comercial en Tabla (Umbral Real por Producto):**
  - **Demanda Óptima (`Badge success`):** El artículo tiene ventas en el período y stock por encima de su umbral de seguridad (`stockActual > stockMinimo`).
  - **Demanda Alta / Reponer Stock (`Badge warning`):** El artículo registra alta rotación pero cayó en zona crítica (`stockActual <= stockMinimo`), alertando al administrador para reponer antes del quiebre de stock (*stockout*).

---

### 4.3. Pestaña 2: Menos Vendidos (Baja Rotación / Capital Inmovilizado)
* **Gráfico de Menor Facturación (`BarChart`):** Renderiza en color ámbar (`#F59E0B`) los productos activos con menor nivel de salida comercial.
* **Cálculo Real de Capital Inmovilizado a Costo:**
  Mide con precisión contable el capital invertido en mercadería de baja rotación utilizando el `precioCosto` real de cada producto en el catálogo:
  $$\text{Capital Inmovilizado} = \sum_{p \in \text{segmento}} (\text{stockActual}_p \times \text{precioCosto}_p)$$
* **Diagnóstico de Salida:**
  - **Sin Salida Comercial (`Badge destructive`):** Productos activos con `0` unidades vendidas en el período seleccionado.
  - **Baja Rotación (`Badge warning`):** Artículos con salidas mínimas frente al resto del catálogo.
* **Decisiones de Negocio Derivadas:** El Administrador puede implementar promociones, combos cruzados o ajustes de compra para recuperar el capital de trabajo y liberar espacio físico en depósito.

---

##  5. Registro de Operaciones Comerciales

* **Sincronización con Período Global:** Lista todos los comprobantes emitidos dentro de `periodoMetricasActivo` sin duplicar las tarjetas KPI ni el gráfico de evolución superior.
* **Filtrado Multivariado y Resumen Compacto:** Permite buscar por comprobante/vendedor y filtrar por cajero, método de pago y estados reales (`Completada` | `Cancelada`). Únicamente cuando hay filtros activos despliega una barra compacta con el total recaudado filtrado, ticket promedio y unidades del subconjunto.
* **Tabla de Auditoría:** Detalla comprobante (`VNT-...`), fecha y hora exacta, cajero/terminal, medio de cobro, unidades, monto total y estado.

---

##  6. Métricas de Salud y Diagnóstico de Inventario (`AdminGestionInventario` e `Inventario Global`)

Implementadas de forma unificada en `useAdminInventarioController` (`inventarioController.ts`) y `useAdminInventarioGlobalController` (`inventarioGlobalController.ts`):

### 6.1. Niveles de Diagnóstico y Salud del Stock (4 Estados Mutuamente Excluyentes)
* **Sin Existencias / Agotado:**
  $$p \in \text{Agotado} \iff p.\text{activo} \land p.\text{stockActual} = 0$$
  - Producto quebrado comercialmente sin unidades disponibles para despacho.
* **Stock Crítico (Revisión Urgente):**
  $$p \in \text{Crítico} \iff p.\text{activo} \land 0 < p.\text{stockActual} \le p.\text{stockMinimo}$$
  - Indica la necesidad inmediata de emitir órdenes de compra o reponer unidades físicas.
* **Cálculo de Déficit de Reposición:**
  $$\text{Déficit}_p = \max(0, p.\text{stockMinimo} - p.\text{stockActual})$$
  - Guía al encargado de compras sobre cuántas unidades faltan para recuperar el umbral mínimo de seguridad.
* **Bajas Unidades (Alerta Preventiva):**
  $$p \in \text{Bajo} \iff p.\text{activo} \land p.\text{stockMinimo} < p.\text{stockActual} \le (p.\text{stockMinimo} \times 1.5)$$
  - Advierte que el producto se aproxima a su umbral crítico ante variaciones normales de demanda.
* **Stock Óptimo (Saludable):**
  $$p \in \text{Óptimo} \iff p.\text{activo} \land p.\text{stockActual} > (p.\text{stockMinimo} \times 1.5)$$
  - Existencias holgadas para atender la demanda corriente. La suma de los 4 niveles coincide exactamente con el 100% de los artículos activos del catálogo.

---

##  7. Parametrización Temporal y Protocolo de Cierre (Time Windows)

### 7.1. Principio Fundamental: Inmutabilidad y Cero Reseteo Físico
En **miStock**, las métricas financieras y operativas **nunca se resetean físicamente ni se sobreescriben a cero** en la base de datos al finalizar una semana o mes.
* Las métricas son **consultas agregadas calculadas sobre ventanas temporales dinámicas** (*Time Windows*):
  ```sql
  -- Recaudación de la ventana mensual:
  SELECT coalesce(SUM(total), 0) AS recaudacion
  FROM ventas
  WHERE created_at >= date_trunc('month', now())
    AND estado = 'completada';
  ```
* Al pasar de las 23:59:59 a las 00:00:00 del nuevo período, las métricas del nuevo ciclo inician naturalmente en `$0` sin intervención manual, mientras que todo el histórico permanece intacto para auditoría y comparación histórica.

### 7.2. Parametrización en Configuración del Sistema (`/adminconfiguracion`)
El administrador puede personalizar los criterios de cálculo desde la pestaña **"Métricas & Períodos"** (`configuracionModel.ts`):
1. **Período Base Predeterminado (`periodoPorDefecto`):**
   - `'diario'`: Monitoreo en vivo de la jornada actual y arqueo de caja.
   - `'semanal'`: Análisis de rotación de lunes a domingo.
   - `'mensual'`: Balance estándar del 1 al fin de mes calendario.
   - `'ultimos_30_dias'`: Ventana móvil deslizante de 30 días continuos (evita el impacto de caída a $0 el primer día de cada mes).
2. **Inicio de Semana Operativa (`inicioSemana`):**
   - Configurable entre `lunes` (estándar comercial) y `domingo`.
3. **Día de Corte Mensual (`diaCorteMensual`):**
   - Día del mes (1 a 28) en que se computa el inicio del ciclo fiscal.
4. **Comparativa Porcentual (`compararPeriodoAnterior`):**
   - Habilita o desactiva las insignias de tendencia comparativa (`+12.5%`, `-4.2%`) contra la ventana previa equivalente.

### 7.3. Selector Interactivo en la Cabecera de `/admin`
El panel de métricas se sincroniza reactivamente con esta configuración mediante `useConfiguracionData()`. En el encabezado superior, el Administrador dispone de un selector dinámico (`Hoy`, `Esta Semana`, `Este Mes`, `Últimos 30d`) con indicador de la preferencia base guardada, permitiendo alternar temporalmente la vista en tiempo real sin modificar su configuración persistida.

---

##  Enlaces Relacionados
- [[Controladores]] — `dashboardController.ts` e `inventarioController.ts`.
- [[Vistas]] — `AdminDashboardView.tsx` y `AdminGestionInventario.tsx`.
- [[Modelos]] — Tipos TypeScript en `dashboardModel.ts`, `productoModel.ts` y `configuracionModel.ts`.
- [[Librerias]] — Implementación de Phosphor Icons, Recharts y Radix UI.

