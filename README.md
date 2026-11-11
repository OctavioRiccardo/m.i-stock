# m.i Stock - Sistema de Gestion de Inventario y Punto de Venta

Proyecto desarrollado para la Practica Tecnica Supervisada (PTS) de la Tecnicatura Universitaria en Web (TUW), Facultad de Ciencias Fisico Matematicas y Naturales, Universidad Nacional de San Luis (UNSL).

## Descripcion General

m.i Stock es una aplicacion web pensada para la administracion diaria de un comercio minorista. Permite gestionar el catalogo de productos, controlar el stock con alertas de reposicion, registrar ventas en mostrador (Punto de Venta), realizar la apertura y el arqueo de caja, y consultar metricas de facturacion.

El sistema cuenta con dos roles de usuario:
- **Administrador:** Acceso a las metricas del negocio, alta y edicion de productos y categorias, control de stock critico, gestion de usuarios, configuracion del comercio y acceso opcional a la caja.
- **Vendedor (Operador POS):** Acceso exclusivo a la terminal de Punto de Venta para abrir y cerrar caja, cobrar tickets en efectivo o medios digitales, emitir comprobantes de 80mm y consultar precios o stock disponible.

## Tecnologias Utilizadas

- **Frontend y Backend Web:** Next.js (App Router), React y TypeScript.
- **Interfaz de Usuario:** Mantine UI, CSS Modules y Recharts.
- **Base de Datos y Autenticacion:** Supabase (PostgreSQL, GoTrue Auth y politicas Row Level Security).
- **Integracion de Pagos:** API REST de Mercado Pago Point para terminales fisicas.

## Estructura del Proyecto

El codigo fuente de la aplicacion se encuentra dentro de la carpeta `mistock/` y esta organizado bajo el patron Modelo-Vista-Controlador (MVC):

- `mistock/src/models/`: Modelos de dominio (entidades de la base de datos) y modelos de vista (interfaces para las pantallas y formularios).
- `mistock/src/controllers/`: Controladores implementados mediante hooks de React que concentran la logica de negocio y las validaciones.
- `mistock/src/views/`: Componentes visuales de cada pantalla, separados para Administrador y Vendedor.
- `mistock/src/services/`: Conector centralizado con Supabase, estado de sesion e integracion con Mercado Pago.
- `mistock/src/app/`: Rutas del sistema y endpoints internos de la API.
- `mistock/supabase/migrations/`: Scripts SQL con la estructura de tablas, restricciones, funciones y triggers automaticos de descuento y reintegro de stock.
- `mistock/docs/`: Documentacion tecnica del sistema.

## Requisitos e Instalacion Local

1. Tener instalado **Node.js** (version 20 o superior) y **npm**.
2. Ingresar a la carpeta de la aplicacion e instalar las dependencias:

```bash
cd mistock
npm install
```

3. Copiar el archivo `.env.example` como `.env.local` dentro de `mistock/` y completar las variables de conexion a Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica_supabase
```

4. En el editor SQL de Supabase, ejecutar los archivos ubicados en `mistock/supabase/migrations/` en el siguiente orden:
   - `schema.sql`
   - `patch_integridad_y_anulacion.sql`
   - `seed_profesores_datos_prueba.sql` (opcional, para cargar datos iniciales de prueba)

5. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicacion quedara disponible en `http://localhost:3000`.

## Comandos Disponibles

Dentro del directorio `mistock/`:

- `npm run dev`: Inicia el servidor local de desarrollo.
- `npm run build`: Genera la compilacion de produccion.
- `npm run start`: Ejecuta la version compilada de produccion.
- `npx tsc --noEmit`: Verifica los tipos de TypeScript sin generar archivos.
- `npm run test`: Ejecuta las pruebas unitarias con Vitest.
