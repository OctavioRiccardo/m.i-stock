# SISTEMA miStock
## Documento Técnico Consolidado: Arquitectura del Software, Patrón MVC y Base de Datos Relacional

| Propiedad del Proyecto | Detalle |
| :--- | :--- |
| **Proyecto** | miStock — Sistema de Gestión de Inventario, Punto de Venta (POS) y Catálogo Comercial |
| **Destinatarios** | Equipo Docente / Evaluadores Académicos de Práctica Profesional Supervisada |
| **Fecha de Emisión** | Septiembre 2026 |
| **Stack Frontend** | Next.js 16.3 (App Router Turbopack) + React 19 + TypeScript + Tailwind CSS v4 + Radix UI |
| **Stack Backend** | Supabase BaaS + PostgreSQL 15+ con Row Level Security (RLS) + Supabase Auth (GoTrue JWT) |

---

# PARTE 1: ARQUITECTURA DEL SISTEMA Y PATRÓN MVC EN REACT

## 1.1. Adaptación del Patrón MVC en React / Next.js

En aplicaciones web modernas construidas con React y Next.js, el patrón clásico Modelo-Vista-Controlador (MVC) se adapta para convivir con el ciclo de vida de componentes, el renderizado reactivo y la inmutabilidad de estado.

En **miStock**, la arquitectura garantiza una separación estricta de responsabilidades en cuatro capas modulares:

```
+-----------------------------------------------------------------------------------+
|                     1. CAPA DE VISTAS (UI - Componentes React)                    |
|  - Admin: AdminDashboardView, AdminGestionInventario, AdminSidebar                |
|  - Ventas/Salón: UserDashboardView, UserSidebar                                   |
|  - Autenticación: LoginFormView, LogoutView                                       |
+-----------------------------------------------------------------------------------+
                                  ▲                │
         Render Reactivo (Props)  │                │  Eventos de Usuario / Submit
                                  │                ▼
+-----------------------------------------------------------------------------------+
|                 2. CAPA DE CONTROLADORES (Custom React Hooks)                     |
|  - adminControllers/dashboardController (Métricas consolidadas, KPIs, Alertas)    |
|  - adminControllers/inventarioController (Reglas de catálogo, SKU único, Bajas)   |
|  - userControllers/userDashboardController (Ventas salón, Descuento inmediato)    |
|  - authController (useLoginController, useLogoutController)                       |
+-----------------------------------------------------------------------------------+
                 ▲                                                 ▲
      Tipado /   │                                      Consultas  │ Sesiones /
      DTOs       │                                      Asíncronas │ Cookies HttpOnly
                 ▼                                                 ▼
+-------------------------------------------+   +-----------------------------------+
|          3. MODELOS (TypeScript)          |   |  4. BACKEND (Supabase / Postgres) |
|  - modelos_dominio/ (Entidades BD)        |   |  - PostgreSQL 15+ con RLS         |
|  - modelos_vista/ (Formularios, DTOs UI)  |   |  - Supabase Auth (JWT HttpOnly)   |
+-------------------------------------------+   +-----------------------------------+
```

## 1.2. División de Modelos: Dominio vs. Vista

Una de las decisiones arquitectónicas fundamentales del proyecto es la separación explícita de los modelos en dos subdirectorios dentro de `src/models/`:

### A. Modelos de Dominio (`src/models/modelos_dominio/`)
* **Propósito:** Representan la verdad del negocio y las entidades persistentes almacenadas en la base de datos relacional PostgreSQL.
* **Características:** Son completamente agnósticos a la interfaz de usuario. No contienen estados efímeros como `loading`, `isOpen` o mensajes de validación.
* **productoModel.ts:** Define `Producto`, `Categoria`, `UnidadMedida` y los DTOs `CrearProductoDTO` y `ActualizarProductoDTO`.
* **ventaModel.ts:** Modela la transacción comercial (`Venta`), métodos de pago (`MetodoPago`) y los renglones congelados (`DetalleVenta`).
* **inventarioModel.ts:** Modela la trazabilidad y auditoría física (`MovimientoStock`, `TipoMovimientoStock`, `AjusteInventario`).
* **userModel.ts:** Modela la entidad `Usuario`, roles comerciales (`admin`, `empleado`, `cajero`) y estados.

### B. Modelos de Vista (`src/models/modelos_vista/`)
* **Propósito:** Modelan el estado temporal, formularios y datos agregados requeridos por React para renderizar cada pantalla.
* **Justificación Técnica:** Los formularios necesitan soportar estados intermedios mientras el usuario escribe (strings vacíos antes de parsear números, mensajes de error específicos por campo, opciones para selects).
* **Estado Derivado:** Contienen cálculos al vuelo que no se persisten en base de datos (ganancia neta, margen porcentual de rentabilidad, bandera `esRentable`).
* **cargaProductoModel.ts:** `FormularioCargaProducto`, `valoresInicialesCargaProducto` y `CargaProductoViewState`.
* **dashboardModel.ts:** `AdminDashboardData`, métricas de facturación acumulada, KPIs y alertas de stock crítico.
* **authModel.ts:** `LoginFormValues` (email, password, rememberMe).

## 1.3. La Capa de Vistas
* **Principio de Diseño:** Las vistas no se comunican directamente con la base de datos ni contienen lógica de negocio pesada. Solo reciben datos procesados mediante props y emiten eventos hacia sus controladores.
* **Organización por Roles:** `views/admin/` (paneles de administración y catálogo), `views/user/` (punto de venta de salón), `views/auth/` (login y logout) y `views/comunes/` (footer y layouts).
* **Diseño Visual:** Construidas con el stack minimalista de Dub.co (Tailwind CSS v4 + Radix UI + Lucide Icons), garantizando alta velocidad de carga y accesibilidad WAI-ARIA.

## 1.4. La Capa de Controladores (Custom React Hooks)
Los controladores se implementan como Custom React Hooks (`use...Controller`). Centralizan toda la lógica de negocio, llamadas a APIs y mutaciones de estado reactivo, aplicando el Principio de Responsabilidad Única (SRP):
* **adminControllers/dashboardController.ts:** Gestiona métricas de facturación, cálculo de ventas diarias y resolución de alertas de reposición.
* **adminControllers/inventarioController.ts:** Gobierna la regla de negocio que exige categoría previa obligatoria para cada producto, valida unicidad de códigos SKU, filtra catálogo por categoría y administra bajas lógicas.
* **userControllers/userDashboardController.ts:** Maneja el punto de venta de mostrador, búsqueda rápida de productos y registro de tickets de venta.
* **authController.ts:** Gestiona de forma segura los flujos de inicio de sesión y cierre de sesión.

## 1.5. Flujo Técnico del Controlador de Autenticación (authController.ts)
El archivo `authController.ts` gobierna la seguridad perimetral de la aplicación mediante el siguiente ciclo de vida de autenticación:

```
PASO A PASO DEL FLUJO DE AUTENTICACIÓN (LOGIN SEGURO):
1. El usuario ingresa email y contraseña en LoginFormView.
2. Al presionar "Iniciar Sesión", la vista ejecuta handleSubmit(event).
3. useLoginController ejecuta validaciones síncronas en cliente (formato email regex y contraseña >= 6).
4. Si la validación pasa, invoca supabase.auth.signInWithPassword({ email, password }).
5. Supabase Auth (GoTrue) verifica las credenciales con bcrypt contra auth.users.
6. Si las credenciales fallan, retorna error 400 y el hook traduce el error a un mensaje legible en español.
7. Si son válidas, Supabase retorna la sesión activa con JWT y Refresh Token.
8. La librería @supabase/ssr sincroniza las cookies seguras HttpOnly en el navegador.
9. El controlador dispara router.push("/admin") y router.refresh().
10. El Middleware de Next.js valida el JWT en servidor y entrega la pantalla autorizada.
```

> **Controlador de Cierre de Sesión (useLogoutController):**  
> Ejecuta `supabase.auth.signOut()` para revocar la sesión activa en el servidor y limpiar las cookies seguras. Incorpora protección contra fugas de memoria (*memory leaks*) verificando si el componente sigue montado (`isMounted`) antes de mutar estados locales y redirigiendo hacia `/login`.

## 1.6. Stack Tecnológico y Librerías Utilizadas

### A. Tecnologías de Frontend (Interfaz y Lógica Cliente)

| Tecnología / Librería | Versión | Rol en el Proyecto y Justificación |
| :--- | :--- | :--- |
| **Next.js** | `16.3.4` | Framework principal. Utiliza App Router, Server Components y compilación ultra rápida con Turbopack. |
| **React & React-DOM** | `19.2.8` | Biblioteca base de UI. Aprovecha la concurrencia, renderizado reactivo y Hooks de última generación. |
| **TypeScript** | `^5.0.0` | Tipado estricto en tiempo de compilación, interfaces de dominio, DTOs y prevención de errores. |
| **Tailwind CSS** | `^4.0.0` | Motor de estilos de alto rendimiento basado en CSS nativo moderno. |
| **Radix UI** | `^1.1 / ^2.3` | Primitivas de componentes accesibles y sin estilos para modales, dropdowns y selects. |
| **Lucide React** | `^1.46.0` | Iconografía vectorial consistente, ligera y personalizable. |
| **Class Variance Authority (CVA)** | `^0.7.1` | Manejo declarativo de variantes y tamaños de componentes UI. |
| **clsx & tailwind-merge** | `^2.1 / ^3.7` | Función utilitaria cn() para resolver colisiones de especificidad de clases CSS. |

### B. Tecnologías de Backend, Autenticación y Base de Datos

| Tecnología / SDK | Versión | Rol en el Proyecto y Justificación |
| :--- | :--- | :--- |
| **Supabase (PostgreSQL)** | Cloud | Base de datos relacional PostgreSQL 15+ con integridad referencial y claves foráneas. |
| **@supabase/supabase-js** | `^2.115.0` | SDK oficial para consultas CRUD, llamadas a RPC y comunicación cliente-servidor. |
| **@supabase/ssr** | `^0.12.6` | Gestión de sesiones Next.js mediante cookies HttpOnly seguras validadas en Middleware. |
| **Supabase Auth (GoTrue)** | Integrado | Servicio de identidad con hashing bcrypt, emisión y renovación automática de tokens JWT. |
| **Row Level Security (RLS)** | Nativo | Políticas declarativas de seguridad a nivel de fila que aíslan datos según el rol del usuario. |

---

# PARTE 2: ANÁLISIS DEL ESQUEMA DE BASE DE DATOS (SUPABASE / POSTGRESQL)

## 2.1. Propósito y Arquitectura Relacional
El esquema SQL define la persistencia relacional en PostgreSQL 15+ para miStock. Cubre tres módulos funcionales integrados: Identidad de Usuarios (RBAC), Catálogo e Inventario Físico (Libro Mayor), y Facturación de Caja (Punto de Venta).

## 2.2. Matriz de Relaciones de la Base de Datos

| Tabla Origen | Card. | Tabla Destino | Clave Foránea | Regla Integridad | Propósito |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `auth.users` | 1:1 | `public.usuario` | `id_usuario` | `ON DELETE CASCADE` | Vincula cuenta de Supabase con perfil público del empleado |
| `public.usuario` | 1:N | `public.ventas` | `id_usuario` | `ON DELETE SET NULL` | Audita el cajero o vendedor que registró la venta |
| `public.usuario` | 1:N | `public.movimientos_stock` | `id_usuario` | `ON DELETE SET NULL` | Identifica al responsable del ajuste físico o ingreso de stock |
| `public.categorias` | 1:N | `public.productos` | `id_categoria` | `ON DELETE SET NULL` | Agrupa los productos bajo una familia comercial |
| `public.productos` | 1:N | `public.movimientos_stock` | `id_producto` | `ON DELETE CASCADE` | Historial auditado de ingresos, ventas y mermas |
| `public.productos` | 1:N | `public.detalle_ventas` | `id_producto` | `ON DELETE RESTRICT` | Protección legal: impide borrar productos con ventas registradas |
| `public.ventas` | 1:N | `public.detalle_ventas` | `id_venta` | `ON DELETE CASCADE` | Renglones e ítems incluidos en cada comprobante |
| `public.ventas` | 1:N | `public.pagos` | `id_venta` | `ON DELETE CASCADE` | Soporta pagos divididos (ej. efectivo + transferencia) |

## 2.3. Desglose Estructural de Tablas y Atributos

### A. Tipos ENUM Personalizados
* **public.user_rol:** Valores ("admin", "vendedor", "no_rol"). El valor por defecto "no_rol" previene la escalada de privilegios al registrarse por primera vez.
* **public.tipo_movimiento:** Valores ("compra", "venta", "ajuste", "devolucion"). Tipifica el motivo de alteración de inventario.

### B. Módulo de Usuarios: public.usuario
Almacena la información de los empleados vinculados a `auth.users`. Clave primaria `id_usuario` (UUID) con `ON DELETE CASCADE`. Incluye email, nombre, rol de usuario y marcas temporales `creado_el` y `actualizado_el` con zona horaria (`timestamptz`).

### C. Módulo de Catálogo: public.categorias y public.productos
* **public.categorias:** `id_categoria` (UUID, PK), `nombre` (TEXT, UNIQUE, NOT NULL). Garantiza unicidad taxonómica.
* **public.productos:** `id_producto` (UUID, PK), `id_categoria` (UUID, FK), `nombre` (TEXT), `sku` (TEXT, UNIQUE).
* **Restricción de Stock:** `stock_actual` (INTEGER) cuenta con `CHECK (stock_actual >= 0)` que impide a nivel motor existencias negativas.
* **Alertas de Reposición:** `stock_minimo` (INTEGER, Default: 5) define el umbral para disparar advertencias de stock crítico.
* **Borrado Lógico:** `activo` (BOOLEAN, Default: true) permite retirar productos del catálogo activo sin alterar el historial contable de ventas pasadas.

### D. Módulo de Inventario: public.movimientos_stock (Patrón Ledger)
Cada variación de stock se registra de forma inmutable en esta tabla con `id_producto`, `id_usuario`, `cantidad` (positiva para ingresos, negativa para ventas/mermas), `tipo` (ENUM) y `motivo` explicativo.

### E. Módulo de Ventas y Cobros: public.ventas, public.detalle_ventas y public.pagos
* **public.ventas:** Cabecera de la operación con `id_venta` (UUID, PK), `id_usuario` (FK cajero), `total` (CHECK total >= 0), `estado` ("completada", "pendiente", "cancelada").
* **public.detalle_ventas:** Renglones del ticket. Cuenta con `precio_unitario` congelado (Snapshot) para garantizar que futuros aumentos no alteren tickets pasados, y `ON DELETE RESTRICT` en `id_producto` para evitar borrados accidentales.
* **public.pagos:** Liquidación de la venta. Soporta pagos divididos (Split Payment) al permitir múltiples registros de cobro (efectivo, débito, transferencia) vinculados a la misma venta.

## 2.4. Automatizaciones en Base de Datos (Triggers y Funciones)

### A. Sincronización Automática de Usuarios (handle_new_user)
Disparado mediante `AFTER INSERT ON auth.users` con privilegios `SECURITY DEFINER` y `SET search_path = public`. Crea automáticamente la fila en `public.usuario` cuando el usuario inicia sesión por primera vez con Google o correo.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.usuario (id_usuario, email, nombre)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### B. Recálculo Automático de Stock (actualizar_stock_producto)
Disparado mediante `AFTER INSERT ON public.movimientos_stock`. Aplica de forma atómica la suma o resta sobre `productos.stock_actual`. Si la operación resulta en un valor negativo, la restricción `CHECK` aborta la transacción completa.

```sql
CREATE OR REPLACE FUNCTION public.actualizar_stock_producto()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.productos
  SET stock_actual = stock_actual + NEW.cantidad,
      actualizado_el = now()
  WHERE id_producto = NEW.id_producto;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tr_actualizar_stock AFTER INSERT ON public.movimientos_stock
FOR EACH ROW EXECUTE FUNCTION public.actualizar_stock_producto();
```

### C. Validación de Rol Admin sin Bucle RLS (is_admin)
Marcada como `SECURITY DEFINER` y `STABLE` para cachear su resultado en la consulta y evitar la recursión infinita cuando las políticas RLS de la tabla usuario consultan a la misma tabla.

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuario
    WHERE id_usuario = auth.uid() AND rol = 'admin'
  );
$$;
```

## 2.5. Estrategia de Seguridad: Row Level Security (RLS)

| Tabla | Operación | Roles Autorizados | Condición Declarada de la Política |
| :--- | :--- | :--- | :--- |
| **categorias** | SELECT | `authenticated` (Staff) | `USING (true)` — Todo el staff puede consultar el catálogo |
| **categorias** | INSERT/UPDATE/DELETE | `authenticated` (Solo Admin) | `USING (public.is_admin())` — Solo administradores modifican |
| **productos** | SELECT | `authenticated` (Staff) | `USING (true)` — Todo el personal consulta artículos |
| **productos** | INSERT/UPDATE/DELETE | `authenticated` (Solo Admin) | `USING (public.is_admin())` — Solo administradores editan |
| **usuario** | SELECT | `authenticated` (Staff) | `USING (true)` — Para visualizar cajeros y staff |
| **usuario** | INSERT/UPDATE/DELETE | `authenticated` (Solo Admin) | `USING (public.is_admin())` — Solo administradores gestionan roles |
| **ventas** | SELECT / INSERT | `authenticated` (Staff) | Todo el personal autenticado puede registrar comprobantes |
| **detalle_ventas** | SELECT / INSERT | `authenticated` (Staff) | Todo el personal autenticado puede cargar renglones |
| **pagos** | SELECT / INSERT | `authenticated` (Staff) | Todo el personal autenticado puede registrar pagos |
| **movimientos_stock** | SELECT / INSERT | `authenticated` (Staff) | Todo el staff registra ingresos o salidas |

> **Modelo de Apéndice Único (Append-Only):**  
> Nótese que para `ventas`, `detalle_ventas`, `pagos` y `movimientos_stock` **NO existen políticas de UPDATE ni DELETE**. Ningún usuario ni administrador puede modificar o borrar comprobantes ya emitidos, garantizando la inmutabilidad y valor probatorio en auditorías contables.

## 2.6. Índices de Rendimiento Implementados
* **idx_productos_categoria:** Sobre `productos(id_categoria)` para agilizar el filtrado por categoría comercial.
* **idx_movimientos_producto:** Sobre `movimientos_stock(id_producto)` para calcular rápidamente historiales de stock.
* **idx_movimientos_usuario:** Sobre `movimientos_stock(id_usuario)` para auditorías por operador.
* **idx_ventas_usuario:** Sobre `ventas(id_usuario)` para liquidación de caja diaria por cajero.
* **idx_ventas_fecha:** Sobre `ventas(creado_el DESC)` para paneles de control y reportes de facturación.
* **idx_pagos_venta:** Sobre `pagos(id_venta)` para consolidar medios de cobro por ticket.
* **idx_detalle_venta:** Sobre `detalle_ventas(id_venta)` para recuperar renglones al emitir o imprimir comprobantes.

## 2.7. Puntos Críticos y Recomendaciones de Mejora

### A. Alineación con Modelos Frontend (TypeScript)
* **Estructura de Precios:** En el frontend se maneja `precioCosto` y `precioVenta` para calcular margen de ganancia. En SQL solo existe `precio`. Se recomienda añadir `precio_costo numeric(10,2) NOT NULL DEFAULT 0.00` en `productos`.
* **Unidad de Medida:** El frontend permite seleccionar `unidad`, `kg`, `litro`, `gramo`, `metro`, `paquete`. Se recomienda crear el ENUM `unidad_medida` o columna `varchar(20) DEFAULT 'unidad'` en `productos`.
* **Descripción:** Se recomienda agregar `descripcion text` a `categorias` y `productos`.
* **Integridad de Categoría:** Si la regla de negocio es que un producto no puede existir sin categoría, cambiar `id_categoria` a `NOT NULL` con `ON DELETE RESTRICT` en lugar de `ON DELETE SET NULL`.

### B. Buenas Prácticas de PostgreSQL y Supabase
* **Índice Faltante:** Crear `CREATE INDEX idx_detalle_ventas_producto ON public.detalle_ventas(id_producto)` para optimizar consultas de qué tickets incluyen un producto dado y acelerar comprobaciones de `ON DELETE RESTRICT`.
* **Optimización de RLS:** Envolver las llamadas de políticas en subconsultas `USING ((SELECT public.is_admin()))` para que Postgres evalúe la función una sola vez por consulta en vez de ejecutarla por cada fila leída.
* **Seguridad en Funciones:** Añadir siempre `SET search_path = public` a la función `actualizar_stock_producto` para prevenir ataques de secuestro de ruta de búsqueda.
* **Automatización de Movimientos desde Ventas:** Crear una función transaccional o trigger en `detalle_ventas` para que al insertar una venta se genere automáticamente el movimiento de tipo "venta" en `movimientos_stock`.
