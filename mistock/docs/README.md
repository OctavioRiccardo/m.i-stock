# 📚 Documentación Oficial del Sistema: miStock

Bienvenido a la carpeta de documentación técnica y funcional del proyecto **miStock**.  
Todos los documentos están sincronizados con la implementación en código del repositorio y con la bóveda de Obsidian (`B:\Programas\Obsidian\Trabajo Final m.i Stock\Trabajo Final mi stock`).

---

## 🗂️ Índice de Documentos

| Documento | Descripción y Alcance |
| :--- | :--- |
| 📖 [**Documentacion Tecnica y Funcional miStock.md**](./Documentacion%20Tecnica%20y%20Funcional%20miStock.md) | **Manual de Referencia Integral.** Especificación completa del sistema, arquitectura MVC, persistencia, módulos operativos y reglas comerciales para consulta general o Google Docs. |
| 🏛️ [**Modelos.md**](./Modelos.md) | **Capa "M" del MVC.** Arquitectura en dos niveles: Modelos de Dominio (`src/models/modelos_dominio/`), ViewModels (`src/models/modelos_vista/`), Mappers, DTOs y funciones puras de cálculo. |
| 🧠 [**Controladores.md**](./Controladores.md) | **Capa "C" del MVC.** Custom Hooks reactivos (`src/controllers/`), servicios reactivos (`useSyncExternalStore`), autenticación soberana en Supabase Auth y sincronización cloud-first. |
| 🖼️ [**Vistas.md**](./Vistas.md) | **Capa "V" del MVC.** Especificación declarativa de pantallas de Administrador y Operador POS (`src/views/`), modales transaccionales, micro-interacciones y validaciones de formularios. |
| 📜 [**Reglas de Negocio miStock.md**](./Reglas%20de%20Negocio%20miStock.md) | **Manual Normativo.** Integridad en profundidad, deducción única de stock en triggers SQL, arqueo de caja Z, facturación (Ley 11.683 vs AFIP) y control RBAC. |
| 🗄️ [**Base de datos.md**](./Base%20de%20datos.md) | **Persistencia Relacional.** Diagrama Entidad-Relación (ER), tablas PostgreSQL, triggers transaccionales, políticas Row Level Security (RLS) y RPCs seguras. |
| 📊 [**Metricas y Calculo de KPIs.md**](./Metricas%20y%20Calculo%20de%20KPIs.md) | **Analítica Comercial.** Fórmulas matemáticas de los 4 KPIs ejecutivos, comparativas de variación ($\Delta\%$) contra períodos anteriores y parametrización de ventanas de tiempo. |
| 🗺️ [**Rutas del sistema.md**](./Rutas%20del%20sistema.md) | **Navegación y Rutas.** Mapeo de rutas de Next.js App Router, control de acceso por roles (Admin vs Vendedor) y Route Handlers para Mercado Pago Point. |
| 📦 [**Librerias.md**](./Librerias.md) | **Ecosistema de Dependencias.** Catálogo npm, Radix UI (`shadcn/ui`), Recharts, Motion, Phosphor Icons y suites unitarias con Vitest. |
| 🏗️ [**Stack de Tecnologias.md**](./Stack%20de%20Tecnologias.md) | **Pila Tecnológica.** Next.js 16 (App Router, Turbopack), React 19, TypeScript estricto, Tailwind CSS v4 y Supabase PostgreSQL 15+. |
| 🚀 [**Guia de Entrega y Testing.md**](./Guia%20de%20Entrega%20y%20Testing.md) | **Instructivo de Despliegue.** Credenciales de acceso de prueba (`carlos@test.mistock`, `walter@test.mistock`, `vendedor@mistock.test`, `nahuel@test.mistock`) y casos de uso a evaluar en Vercel. |
