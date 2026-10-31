# Guía de Entrega y Pruebas del Sistema: miStock

**Proyecto:** miStock — Sistema de Gestión de Inventario, Punto de Venta (POS) y Catálogo Comercial  
**Destinatarios:** Equipo Docente Evaluador y Cliente  
**Arquitectura:** Modelo-Vista-Controlador (MVC) en Next.js 16 + React 19 + Supabase PostgreSQL  
**Fecha:** Octubre 2026  

---

## 1. Información de los Entornos Desplegados

El sistema se encuentra desplegado de forma independiente en Vercel, conectado a bases de datos aisladas en Supabase para garantizar la autonomía en las pruebas de cada grupo:

* **Entorno 1 — Evaluación Académica (Profesores):**
  * **Rama:** `profesores-test`
  * **URL de Acceso:** `[Ingresar URL de Vercel - Profesores]`
  * **Base de Datos:** Instancia independiente en Supabase para evaluación académica.
* **Entorno 2 — Pruebas del Cliente (Demostración):**
  * **Rama:** `cliente-test`
  * **URL de Acceso:** `[Ingresar URL de Vercel - Cliente]`
  * **Base de Datos:** Instancia independiente en Supabase para validación comercial.

---

## 2. Credenciales y Cuentas de Acceso

Todas las cuentas están creadas formalmente en **Supabase Auth** con contraseñas encriptadas mediante bcrypt y roles estrictamente tipados en PostgreSQL bajo un esquema de Control de Acceso Basado en Roles (RBAC).

| Usuario / Rol | Correo Electrónico | Contraseña | Perfil y Permisos de Acceso |
| :--- | :--- | :--- | :--- |
| **Administrador 1 (Profesor)** | `carlos@test.mistock` | `[Clave asignada]` | Acceso total: Métricas, Gestión de Inventario, Valuación Global, Usuarios, Configuración y Terminal POS. |
| **Administrador 2 (Profesor)** | `walter@test.mistock` | `[Clave asignada]` | Acceso total: Métricas, Gestión de Inventario, Valuación Global, Usuarios, Configuración y Terminal POS. |
| **Vendedor / Operador POS** | `vendedor@mistock.test` | `test123` | Acceso acotado exclusivamente a la Terminal de Punto de Venta (`/dashboard`). Tiene bloqueado el acceso a paneles financieros. |
| **Cliente (Pruebas)** | `nahuel@test.mistock` | `[Clave asignada]` | Cuenta para pruebas del cliente en el entorno de demostración independiente. |

> **Nota de Seguridad:** Un usuario con rol `vendedor` que intente ingresar a cualquier sección de administración (`/admin`, `/admininventario`, `/adminusuarios`, `/adminconfiguracion`) es interceptado por un modal explicativo de seguridad y redirigido a su área de trabajo operativa.

---

## 3. Guía Paso a Paso de Casos de Uso a Evaluar

### 3.1. Operativa en Punto de Venta (POS) — Rol Vendedor o Administrador

1. **Apertura Obligatoria de Turno de Caja:**
   * Al ingresar a `/dashboard`, la caja inicia cerrada para evitar emisión de comprobantes huérfanos.
   * Hacer clic en `[ Abrir Caja ]` en la barra superior, ingresar el fondo inicial de cambio en efectivo (o utilizar los atajos rápidos) y confirmar la apertura. Se genera automáticamente un código de turno único (`TRN-XXXXXX`).
2. **Armado del Ticket y Búsqueda de Artículos:**
   * Utilizar el buscador superior escribiendo el nombre o código SKU del producto (o simulando un lector de código de barras con la tecla `Enter`).
   * Alternar entre la vista de cuadrícula táctil y tabla compacta.
   * Ajustar cantidades con los controles `+` y `-` (el sistema valida en tiempo real las existencias físicas en stock).
3. **Consultor de Precios y Disponibilidad (Pestaña "Consultor"):**
   * Consultar precios unitarios y existencias físicas en tiempo real para atender preguntas de clientes sin alterar el carrito o ticket que se encuentra en curso en la caja.
4. **Cobro Multi-Método:**
   * Presionar `[ Cobrar Ticket ]`.
   * En **Efectivo**, ingresar el monto recibido o utilizar los botones de sugerencia rápida de billetes para visualizar el vuelto calculado en tiempo real.
   * El sistema soporta también cobros con Débito, Crédito, Transferencia bancaria y terminales Mercado Pago Point.
5. **Emisión de Comprobante Térmico:**
   * Al confirmar la venta, se genera el comprobante con precios unitarios congelados (*snapshot* contable) y se descuenta el stock físico de forma atómica en PostgreSQL.
   * Visualizar e imprimir el ticket térmico de 80mm conforme a la normativa configurada.
6. **Historial del Día y Anulación de Ventas:**
   * En la pestaña *"Historial del Día"*, auditar los tickets emitidos durante el turno.
   * Probar la anulación de un ticket: el sistema solicita confirmación, cambia el estado a `'cancelada'` en Supabase y ejecuta un trigger en base de datos que reintegra automáticamente el stock físico y descuenta la recaudación del turno.
7. **Arqueo y Cierre de Caja (Reporte Z):**
   * Hacer clic en `[ Arqueo y Cierre ]`.
   * El sistema presenta el resumen de ventas desglosado por medio de pago y el efectivo esperado ($\text{Fondo Inicial} + \text{Ventas en Efectivo}$).
   * Ingresar el conteo físico de gaveta: el sistema valida que no sea negativo y clasifica al instante si la caja está *Exacta*, con *Sobrante* o con *Faltante*.
   * Confirmar el cierre para emitir el Comprobante de Cierre Z listo para imprimir.

---

### 3.2. Gestión de Inventario y Catálogo — Rol Administrador

1. **Alta de Producto con Validación en Tiempo Real:**
   * En `/admingestioninven`, ingresar a `[ + Nuevo Producto ]`.
   * Cargar nombre, categoría obligatoria, código SKU único, precio de costo y precio de venta.
   * Comprobar la advertencia visual de margen negativo si el precio de venta es inferior o igual al costo.
2. **Diagnóstico y Semáforo de Salud de Stock:**
   * En la consola de inventario, evaluar las 4 tarjetas de stock mutuamente excluyentes:
     * **Sin Existencias:** Stock igual a 0.
     * **Stock Crítico:** Existencias menores o iguales al stock mínimo configurado.
     * **Bajas Unidades:** Existencias próximas al umbral mínimo ($\le 1.5 \times \text{stock mínimo}$).
     * **Stock Óptimo:** Existencias saludables.
   * Hacer clic sobre cada tarjeta para filtrar instantáneamente el catálogo.
3. **Baja Lógica y Reactivación:**
   * Dar de baja un artículo: el producto pasa a estado inactivo sin eliminarse de la base de datos para no corromper el historial de ventas pasadas.
   * Filtrar por *"Dados de Baja"* y reactivar el producto en un clic.

---

### 3.3. Valuación Financiera e Inventario Global — Rol Administrador

1. **Auditoría Patrimonial:**
   * En `/admininventarioglobal`, consultar el valor total de la mercadería inmovilizada a precio de costo frente al valor proyectado a precio de venta con su margen estimado.
2. **Exploración por Familias y Enlace Profundo:**
   * Seleccionar distintas categorías para ver métricas específicas de cada rubro.
   * Hacer clic en el botón `[ Gestionar ]` de cualquier producto para navegar directamente a su ficha de edición con búsqueda prefiltrada.

---

### 3.4. Métricas Comerciales y Tablero Ejecutivo — Rol Administrador

1. **Selector Global Unificado de Período:**
   * En `/admin`, cambiar entre `Hoy`, `Esta Semana`, `Este Mes` y `Últimos 30d`.
   * Verificar cómo todas las tarjetas, series gráficas y tablas se sincronizan bajo el mismo rango temporal.
2. **Indicadores Clave (KPIs):**
   * Evaluar los 4 KPIs principales: Recaudación, Ticket Promedio, Operaciones Realizadas y Unidades Vendidas, con insignias de variación porcentual real ($\Delta\%$) calculadas contra el período anterior homólogo.
3. **Visualización Gráfica Interactiva:**
   * Curva de evolución de ventas comparativa (Período Actual vs. Período Anterior).
   * Gráfico de distribución de ingresos por medio de pago (Donut chart).
4. **Rotación de Productos y Capital Inmovilizado:**
   * Alternar entre los artículos más vendidos y menos vendidos, evaluando unidades despachadas y capital inmovilizado a costo de reposición.

---

### 3.5. Administración de Usuarios y Configuración del Comercio — Rol Administrador

1. **Nómina de Colaboradores y Roles (`/adminusuarios`):**
   * Crear un nuevo colaborador ingresando nombre, email, teléfono, rol y contraseña temporal. La cuenta se aprovisiona directamente en Supabase Auth.
   * Modificar el rol en línea mediante el selector rápido (`admin`, `vendedor`, `no_rol`).
   * Probar la desactivación preventiva de un usuario (`activo: false`) para verificar el bloqueo de inicio de sesión.
   * Comprobar la regla de protección de cuenta maestra: el sistema impide eliminar o suspender al único administrador activo.
2. **Parametrización del Negocio (`/adminconfiguracion`):**
   * Configurar identidad comercial, moneda y habilitación/deshabilitación de medios de pago.
   * Evaluar la previsualización del ticket térmico en vivo con alternador de régimen legal: comprobante interno según Ley Nacional 11.683 (`*** DOCUMENTO NO VÁLIDO COMO FACTURA ***`) o comprobante fiscal formal según AFIP (Factura B o Factura C según condición frente al IVA).
3. **Exportación de Datos Auditable:**
   * En la pestaña *"Respaldos"*, descargar el Catálogo Completo y el Historial de Ventas en formato CSV estándar RFC 4180 con encabezado UTF-8 BOM, garantizando su apertura directa y correcta en Microsoft Excel y Google Sheets.

---

## 4. Ficha Técnica y Resumen Arquitectónico

* **Frontend:**
  * **Framework:** Next.js 16.3.4 (App Router con Turbopack)
  * **Librería UI:** React 19 + TypeScript en modo estricto
  * **Estilos:** Tailwind CSS v4
  * **Componentes y Accesibilidad:** Radix UI (`shadcn/ui`)
  * **Gráficos:** Recharts (`shadcn/ui Charts`)
  * **Iconografía:** Phosphor Icons (`@phosphor-icons/react`)
  * **Animaciones:** Motion (`motion/react`) y AutoAnimate
* **Backend y Persistencia:**
  * **Base de Datos:** PostgreSQL 15+ administrada en Supabase Cloud
  * **Seguridad:** Row Level Security (RLS) en todas las tablas con políticas basadas en roles (RBAC)
  * **Integridad Transaccional:** Triggers relacionales para libro mayor (*ledger*) de movimientos de inventario y descuento/reintegro automático de existencias físicas
  * **Procedimientos Almacenados:** Funciones RPC con `SECURITY DEFINER` para gestión segura de credenciales y roles
* **Patrón de Diseño:**
  * **MVC Estricto:** Modelos de Dominio y ViewModels en `src/models/`, Controladores desacoplados basados en Hooks en `src/controllers/` y Vistas declarativas en `src/views/`.
