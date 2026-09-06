# 🗺️ Mapa de Rutas del Sistema - miStock

#routes #nextjs #architecture #mistock #app-router

---

## 📌 Resumen de Rutas Activas

Este documento contiene la especificación de todas las rutas configuradas actualmente en **miStock**, detallando su propósito, layout asignado, vista y controlador asociado según la arquitectura **MVC**.

---

## 📋 Cuadro General de Rutas

| Ruta (URL) | Rol / Acceso | Layout | Vista (`View`) | Controlador (`Controller`) |
| :--- | :--- | :--- | :--- | :--- |
| **`/`** | Público / Todos | `AuthLayout` (Sin Navbar) | `LoginFormView.tsx` | `authController.ts` |
| **`/login`** | Público / Todos | `AuthLayout` (Sin Navbar) | `LoginFormView.tsx` | `authController.ts` |
| **`/logout`** | Autenticado | `AuthLayout` (Sin Navbar) | `LogoutView.tsx` | `authController.ts` |
| **`/dashboard`** | Empleado / Usuario | `UserLayout` (`UserNavbar`) | `UserDashboardView.tsx` | `userDashboardController.ts` |
| **`/admin`** | Administrador / Dueño | `AdminLayout` (`AdminNavbar`) | `AdminDashboardView.tsx` | `adminDashboardController.ts` |

---

## 🔍 Detalle por Ruta

### 1. Ruta Raíz: `/`
- **URL Local**: [http://localhost:3000/](http://localhost:3000/)
- **Archivo de Ruta**: `src/app/page.tsx`
- **Propósito**: Es la pantalla inicial del sistema. Todo usuario no autenticado entra directamente al **Login**.
- **Componentes**: Renderiza `LoginFormView` envuelto en `AuthLayout` (incluye **Footer** y no posee **Navbar**).

---

### 2. Ruta de Autenticación: `/login`
- **URL Local**: [http://localhost:3000/login](http://localhost:3000/login)
- **Archivo de Ruta**: `src/app/(auth)/login/page.tsx`
- **Propósito**: Acceso alternativo directo al inicio de sesión.
- **Controlador**: `useLoginController()` (valida credenciales con Supabase Auth).

---

### 3. Ruta de Cierre de Sesión: `/logout`
- **URL Local**: [http://localhost:3000/logout](http://localhost:3000/logout)
- **Archivo de Ruta**: `src/app/(auth)/logout/page.tsx`
- **Propósito**: Ejecuta la desautenticación en Supabase (`signOut`), borra cookies de sesión y redirige hacia `/`.
- **Vista**: `LogoutView.tsx` (Muestra indicador de carga y confirmación de salida).

---

### 4. Panel de Operación de Usuario: `/dashboard`
- **URL Local**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Archivo de Ruta**: `src/app/(user)/dashboard/page.tsx`
- **Propósito**: Interfaz optimizada para cajeros y empleados.
- **Funcionalidades**:
  - Consulta rápida de stock por nombre o código de barras.
  - Botón de venta rápida de 1-clic.
  - Historial de ventas del día.
- **Layout**: `UserLayout` (incluye `UserNavbar` con la insignia *Panel Empleado* y `Footer`).

---

### 5. Panel Ejecutivo de Administrador: `/admin`
- **URL Local**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Archivo de Ruta**: `src/app/(admin)/admin/page.tsx`
- **Propósito**: Interfaz ejecutiva para el dueño o gerente del negocio.
- **Funcionalidades**:
  - Métricas de ingresos mensuales y KPIs de negocio.
  - Tabla de alertas de stock crítico con botón de reposición.
  - Control de usuarios y roles del sistema.
- **Layout**: `AdminLayout` (incluye `AdminNavbar` con la insignia *Panel Administrador* y `Footer`).

---

## 📂 Organización de Carpetas en `src/app/` (Route Groups)

```text
src/app/
├── page.tsx               # Ruta raíz / (Login inicial)
├── globals.css            # Estilos globales simplificados
├── layout.tsx             # Root Layout (MantineProvider)
│
├── (auth)/                # Route Group: Páginas sin Navbar
│   ├── layout.tsx         # Contiene Footer
│   ├── login/
│   │   └── page.tsx       # Ruta /login
│   └── logout/
│       └── page.tsx       # Ruta /logout
│
├── (user)/                # Route Group: Panel de Usuario
│   ├── layout.tsx         # Contiene UserNavbar + Footer
│   └── dashboard/
│       └── page.tsx       # Ruta /dashboard
│
└── (admin)/               # Route Group: Panel de Administrador
    ├── layout.tsx         # Contiene AdminNavbar + Footer
    └── admin/
        └── page.tsx       # Ruta /admin
```
