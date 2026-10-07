# Guía y Reglas para Agentes de IA: miStock

## 📌 Directiva Primordial: Sincronización de Documentación en Obsidian
Cada vez que se complete una característica, refactorización, cambio de modelo, ajuste de controlador, vista o cambio de dependencias en el proyecto, **es obligatorio mantener sincronizada la documentación técnica en la bóveda de Obsidian**.

* **Ruta de la Bóveda:** `B:\Programas\Obsidian\Trabajo Final m.i Stock\Trabajo Final mi stock`
* **Skill Asociada:** `obsidian-docs` (`.agents/skills/obsidian-docs/SKILL.md`)
* **Archivos Clave a Actualizar:**
  - `Librerias.md`: Dependencias npm, sistema de iconos, visualización gráfica y animaciones.
  - `Metricas y Calculo de KPIs.md`: Definiciones, fórmulas y parametrización de períodos en configuración.
  - `Modelos.md`: Modelos de Dominio y Modelos de Vista (interfaces, DTOs y enumerados).
  - `Controladores.md`: Hooks controladores MVC, estados reactivos y lógica de negocio.
  - `Vistas.md`: Pantallas de Administrador y Operador POS, layout, tickets y componentes.
  - `Reglas de Negocio miStock.md`: Validaciones comerciales, inventario y medios de pago.

---

## 🏗️ Estándares de Arquitectura y Calidad
1. **Patrón MVC Estricto:**
   - Modelos en `src/models/` (Dominio vs Vista).
   - Controladores en `src/controllers/` (Hooks de React desacoplados de la UI).
   - Vistas en `src/views/` (Componentes que solo consumen el objeto `controller`).
2. **Sistema de Iconos:**
   - Utilizar exclusivamente **Phosphor Icons** (`@phosphor-icons/react`) con pesos coherentes (`regular`, `duotone`, `fill`).
3. **Verificación Previa a Commit:**
   - Ejecutar `npx tsc --noEmit` y `npm run build` en `mistock/` asegurando 0 errores de compilación antes de dar una tarea por finalizada.
