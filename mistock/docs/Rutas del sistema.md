# 🗺️ Mapa de Rutas del Sistema - miStock

#routes #nextjs #architecture #mistock #app-router #supabase

---

## 📌 Resumen de Rutas Activas

Este documento contiene la especificación completa y actualizada de las rutas configuradas en **miStock** (`Next.js 16` con App Router y Turbopack), detallando su propósito, layout asignado, vista, controlador asociado bajo la arquitectura **MVC**, enlaces de navegación y el middleware de sesión.

---

## 📋 Cuadro General de Rutas

| Ruta (URL) | Rol / Acceso | Layout Asignado | Vista (`View`) | Controlador (`Controller`) |
| :--- | :--- | :--- | :--- | :--- |
| **`/`** | Público / Todos | `RootLayout` | `LoginFormView.tsx` | `useLoginController` (`authController.ts`) |
| **`/login`** | Público / Todos | `AuthLayout` (`Footer`, sin Sidebar) | `LoginFormView.tsx` | `useLoginController` (`authController.ts`) |
| **`/logout`** | Autenticado | `AuthLayout` (`Footer`, sin Sidebar) | `LogoutView.tsx` | `useLogoutController` (`authController.ts`) |
| **`/dashboard`** | Empleado / Usuario | `UserLayout` (`UserSidebar` + `Footer`) | `UserDashboardView.tsx` | `useUserDashboardController.ts` |
| **`/admin`** | Administrador / Dueño | `AdminLayout` (`AdminSidebar` + `Footer`) | `AdminDashboardView.tsx` | `useAdminDashboardController.ts` |

---

## 🔍 Detalle por Ruta

### 1. Ruta Raíz: `/`
- **URL Local**: [http://localhost:3000/](http://localhost:3000/)
- **Archivo de Ruta**: `src/app/page.tsx`
- **Propósito**: Pantalla inicial del sistema. Actúa como punto de entrada mostrando el formulario de login.
- **Componentes**: Renderiza directamente `LoginFormView` con estilos base.

---

### 2. Ruta de Autenticación: `/login`
- **URL Local**: [http://localhost:3000/login](http://localhost:3000/login)
- **Archivo de Ruta**: `src/app/(auth)/login/page.tsx`
- **Layout**: `src/app/(auth)/layout.tsx` (Contenido centrado verticalmente, sin Sidebar, con `Footer`).
- **Vista**: `src/views/auth/LoginFormView.tsx`
- **Controlador**: `useLoginController` en `src/controllers/authController.ts`.
- **Funcionalidad**: Valida usuario y contraseña contra Supabase Auth (`signInWithPassword`), maneja recordatorio de sesión y redirige al dashboard.

---

### 3. Ruta de Cierre de Sesión: `/logout`
- **URL Local**: [http://localhost:3000/logout](http://localhost:3000/logout)
- **Archivo de Ruta**: `src/app/(auth)/logout/page.tsx`
- **Layout**: `src/app/(auth)/layout.tsx`
- **Vista**: `src/views/auth/LogoutView.tsx`
- **Controlador**: `useLogoutController` en `src/controllers/authController.ts`.
- **Funcionalidad**: Ejecuta `supabase.auth.signOut()`, invalida cookies de sesión de Supabase SSR y redirige al login tras completar la salida.

---

### 4. Panel de Operación de Usuario: `/dashboard`
- **URL Local**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Archivo de Ruta**: `src/app/(user)/dashboard/page.tsx`
- **Layout**: `src/app/(user)/layout.tsx` (Sidebar lateral `UserSidebar` con insignia *Panel Empleado* y pie de página `Footer`).
- **Vista**: `src/views/user/UserDashboardView.tsx`
- **Controlador**: `useUserDashboardController` en `src/controllers/userDashboardController.ts`.
- **Navegación del Sidebar (`UserSidebar.tsx`)**:
  - `Ventas y Operación` ➔ `/dashboard`
  - `Catálogo de Productos` ➔ `/dashboard#productos`
  - `Historial del Día` ➔ `/dashboard#historial`
  - `Resumen de Stock` ➔ `/dashboard#resumen`
  - `Cambiar de Rol` ➔ `/login`
  - `Cerrar Sesión` ➔ `/logout`
- **Funcionalidades**:
  - Buscador predictivo de productos por nombre o código de barra.
  - Carrito rápido / venta en 1-clic con decremento de stock.
  - Tabla de últimos movimientos del turno.

---

### 5. Panel Ejecutivo de Administrador: `/admin`
- **URL Local**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Archivo de Ruta**: `src/app/(admin)/admin/page.tsx`
- **Layout**: `src/app/(admin)/layout.tsx` (Sidebar lateral `AdminSidebar` con insignia *Panel Administrador* y pie de página `Footer`).
- **Vista**: `src/views/admin/AdminDashboardView.tsx`
- **Controlador**: `useAdminDashboardController` en `src/controllers/adminDashboardController.ts`.
- **Navegación del Sidebar (`AdminSidebar.tsx`)**:
  - `Métricas & KPIs` ➔ `/admin`
  - `Alertas de Stock Crítico` ➔ `/admin#alertas`
  - `Gestión de Usuarios` ➔ `/admin#usuarios`
  - `Inventario Global` ➔ `/admin#inventario`
  - `Configuración` ➔ `/admin#ajustes`
  - `Cambiar de Rol` ➔ `/login`
  - `Cerrar Sesión` ➔ `/logout`
- **Funcionalidades**:
  - Tarjetas de KPIs (Ingresos del mes, rotación de stock, artículos críticos).
  - Alertas prioritarias con reposición rápida de inventario.
  - Tabla de auditoría y gestión de usuarios.

---

## 🛡️ Interceptor y Middleware de Sesión

Next.js 16 intercepta las solicitudes a través de:
1. **`src/proxy.ts`**: Define la función `proxy(request: NextRequest)` y el `matcher` que excluye recursos estáticos (`_next`, imágenes, favicons).
2. **`src/lib/supabase/middleware.ts`**: Contiene la función `updateSession(request)`, la cual refresca tokens de autenticación mediante `@supabase/ssr` (`createServerClient`) y sincroniza las cookies entre Next.js y Supabase.

> [!IMPORTANT]
> **Variables de Entorno Requeridas (.env.local):**
> Para que el middleware y los controladores puedan autenticar contra Supabase, deben estar definidas:
> - `NEXT_PUBLIC_SUPABASE_URL`
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
> 
> Consulta `.env.example` en la raíz del proyecto para más detalles.

---

## 📂 Organización de Carpetas en `src/` (Route Groups y MVC)

```text
src/
├── app/
│   ├── layout.tsx             # RootLayout con MantineProvider y theme
│   ├── globals.css            # Reglas CSS globales y variables
│   ├── page.tsx               # Ruta raíz / (Punto de acceso)
│   ├── (auth)/                # Route Group: Autenticación
│   │   ├── layout.tsx         # Layout centrado con Footer (sin Sidebar)
│   │   ├── login/page.tsx     # Ruta /login
│   │   └── logout/page.tsx    # Ruta /logout
│   ├── (user)/                # Route Group: Panel de Empleado
│   │   ├── layout.tsx         # UserSidebar + Content + Footer
│   │   └── dashboard/page.tsx # Ruta /dashboard
│   └── (admin)/               # Route Group: Panel de Dueño/Admin
│       ├── layout.tsx         # AdminSidebar + Content + Footer
│       └── admin/page.tsx     # Ruta /admin
│
├── controllers/               # Controladores MVC (Custom Hooks)
│   ├── authController.ts      # useLoginController & useLogoutController
│   ├── userDashboardController.ts
│   └── adminDashboardController.ts
│
├── models/                    # Definición de tipos, modelos y esquemas
│   ├── authModel.ts           # Interfaces de credenciales y usuario
│   └── dashboardModel.ts      # Interfaces de productos, stock y KPIs
│
├── views/                     # Componentes visuales puros y estilos
│   ├── admin/
│   │   ├── AdminDashboardView.tsx & AdminDashboardView.module.css
│   │   ├── AdminSidebar.tsx & AdminSidebar.module.css
│   │   └── AdminNavbar.tsx & AdminNavbar.module.css
│   ├── auth/
│   │   ├── LoginFormView.tsx & LoginFormView.module.css
│   │   └── LogoutView.tsx & LogoutView.module.css
│   ├── user/
│   │   ├── UserDashboardView.tsx & UserDashboardView.module.css
│   │   ├── UserSidebar.tsx & UserSidebar.module.css
│   │   └── UserNavbar.tsx & UserNavbar.module.css
│   └── common/
│       └── Footer.tsx & Footer.module.css
│
├── lib/                       # Utilidades e integraciones de infraestructura
│   └── supabase/
│       ├── client.ts          # createBrowserClient para Vistas/Controladores
│       ├── server.ts          # createServerClient para Server Actions
│       └── middleware.ts      # updateSession para el proxy de Next.js
│
└── proxy.ts                   # Entry point para middleware/proxy en Next.js 16
```
