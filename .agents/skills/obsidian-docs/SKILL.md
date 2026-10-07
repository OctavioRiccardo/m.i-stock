---
name: obsidian-docs
description: "Protocolo obligatorio para sincronizar y mantener actualizada la documentacion tecnica del proyecto miStock en la boveda de Obsidian (B:\\Programas\\Obsidian\\Trabajo Final m.i Stock\\Trabajo Final mi stock). Usar siempre que se creen o modifiquen controladores, modelos, vistas, librerias, metricas, rutas o reglas de negocio."
metadata:
  author: miStock Team
  version: "1.0.0"
---

# 📚 Sincronización de Documentación en Bóveda de Obsidian

## 📌 Ubicación de la Bóveda
Todas las notas técnicas del proyecto residen de forma centralizada en:
`B:\Programas\Obsidian\Trabajo Final m.i Stock\Trabajo Final mi stock`

---

## 🗂️ Mapa de Notas y Responsabilidades

Cada cambio en el código fuente de `mistock/src/` debe reflejarse en su nota correspondiente dentro de la bóveda:

| Archivo en Obsidian | Ámbito y Contenido | Código Fuente Relacionado |
| :--- | :--- | :--- |
| **`Librerias.md`** | Catálogo de paquetes npm, versiones, justificaciones técnicas, componentes de UI, librerías de gráficos y sistema de iconos. | `package.json`, `@phosphor-icons/react`, `recharts`, `motion/react`, `@formkit/auto-animate`. |
| **`Metricas y Calculo de KPIs.md`** | Fórmulas matemáticas, KPIs ejecutivos, parametrización de períodos, comparativas de variación y ventanas de tiempo (Time Windows). | `src/controllers/adminControllers/dashboardController.ts`, `src/views/admin/AdminDashboardView.tsx`, `configuracionModel.ts`. |
| **`Modelos.md`** | Arquitectura de dos capas: Modelos de Dominio vs Modelos de Vista (ViewModels), interfaces TypeScript, DTOs y enumerados. | `src/models/modelos_dominio/`, `src/models/modelos_vista/`. |
| **`Controladores.md`** | Controladores MVC de cliente (Hooks React), responsabilidades, estados reactivos, métodos de negocio y desacoplamiento de la UI. | `src/controllers/adminControllers/`, `src/controllers/userControllers/`. |
| **`Vistas.md`** | Especificaciones de pantallas de Administrador y Operador (POS), maquetación, micro-interacciones, componentes shadcn/ui y tickets. | `src/views/admin/`, `src/views/user/`. |
| **`Reglas de Negocio miStock.md`** | Lógica comercial, flujo de venta en mostrador, políticas de inventario, stock crítico, medios de cobro y tickets. | `src/services/`, configuración general del negocio. |
| **`Rutas del Sistema.md`** | Mapeo de rutas de Next.js App Router, control de acceso por roles (Admin vs User) y redirecciones canónicas. | `src/app/`, middleware de autenticación. |
| **`Stack de Tecnologias.md`** | Pila tecnológica, versiones principales (Next.js 16, React 19, Supabase, Tailwind CSS v4, Turbopack). | Arquitectura general del repositorio. |

---

## 🔄 Protocolo de Actualización Obligatorio (Paso a Paso)

Cada vez que se complete una funcionalidad, refactorización o corrección:

1. **Identificar los archivos impactados:**
   Revisar el `git diff` o los cambios realizados en `mistock/src/`.
2. **Localizar la(s) nota(s) en la bóveda:**
   Acceder a `B:\Programas\Obsidian\Trabajo Final m.i Stock\Trabajo Final mi stock\[Nota].md`.
3. **Mantener el estilo y la calidad técnica:**
   - Conservar formato Markdown de Obsidian (callouts `> [!NOTE]`, `> [!TIP]`, fórmulas LaTeX `$$...$$`, bloques de código con resaltado de sintaxis).
   - Documentar la razón técnica (*el porqué*), no solo el fragmento de código.
   - Reflejar las nuevas interfaces, tipos y parámetros agregados.
4. **Verificación cruzada:**
   Comprobar que no existan discrepancias entre las interfaces del código (`src/models/`, `src/controllers/`) y las documentadas en la bóveda.
