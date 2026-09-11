-- ============================================================================
-- SISTEMA DE GESTIÓN DE STOCK Y VENTAS (USO INTERNO / LOCAL / POS)
-- Esquema completo para Supabase (PostgreSQL)
-- ============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 2. LIMPIEZA DE TABLAS PREVIAS (Por si necesitas reiniciar desde cero)
-- ----------------------------------------------------------------------------
/* DROP TABLE IF EXISTS public.pagos CASCADE;
DROP TABLE IF EXISTS public.detalle_ventas CASCADE;
DROP TABLE IF EXISTS public.ventas CASCADE;
DROP TABLE IF EXISTS public.movimientos_stock CASCADE;
DROP TABLE IF EXISTS public.productos CASCADE;
DROP TABLE IF EXISTS public.categorias CASCADE;
DROP TABLE IF EXISTS public.usuario CASCADE; */

-- ----------------------------------------------------------------------------
-- 3. TIPOS ENUM PERSONALIZADOS
-- ----------------------------------------------------------------------------
DROP TYPE IF EXISTS public.user_rol CASCADE;
CREATE TYPE public.user_rol AS ENUM ('admin', 'vendedor', 'no_rol');

DROP TYPE IF EXISTS public.tipo_movimiento CASCADE;
CREATE TYPE public.tipo_movimiento AS ENUM ('compra', 'venta', 'ajuste', 'devolucion');

-- ----------------------------------------------------------------------------
-- 4. DEFINICIÓN DE TABLAS
-- ----------------------------------------------------------------------------

-- 4.1. USUARIO (Empleados / Staff vinculados a Supabase Auth / Google)
CREATE TABLE public.usuario (
  id_usuario uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text,
  email text NOT NULL,
  rol public.user_rol NOT NULL DEFAULT 'no_rol'::public.user_rol,
  creado_el timestamptz NOT NULL DEFAULT now(),
  actualizado_el timestamptz NOT NULL DEFAULT now()
);

-- 4.2. CATEGORÍAS
CREATE TABLE public.categorias (
  id_categoria uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  creado_el timestamptz NOT NULL DEFAULT now()
);

-- 4.3. PRODUCTOS
CREATE TABLE public.productos (
  id_producto uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_categoria uuid REFERENCES public.categorias(id_categoria) ON DELETE SET NULL,
  nombre text NOT NULL,
  sku text UNIQUE,
  stock_actual integer NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo integer NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
  precio numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (precio >= 0),
  oferta boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true, -- Para borrado lógico (soft delete)
  creado_el timestamptz NOT NULL DEFAULT now(),
  actualizado_el timestamptz NOT NULL DEFAULT now()
);

-- 4.4. MOVIMIENTOS DE STOCK (Historial y trazabilidad de inventario)
CREATE TABLE public.movimientos_stock (
  id_movimiento uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_producto uuid NOT NULL REFERENCES public.productos(id_producto) ON DELETE CASCADE,
  id_usuario uuid REFERENCES public.usuario(id_usuario) ON DELETE SET NULL,
  cantidad integer NOT NULL, -- Positivo (+) para ingresos, negativo (-) para salidas/ventas
  tipo public.tipo_movimiento NOT NULL,
  motivo text,
  creado_el timestamptz NOT NULL DEFAULT now()
);

-- 4.5. VENTAS (Cabecera de la operación)
CREATE TABLE public.ventas (
  id_venta uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid REFERENCES public.usuario(id_usuario) ON DELETE SET NULL, -- Empleado que cobra
  total numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  estado text NOT NULL DEFAULT 'completada', -- 'pendiente', 'completada', 'cancelada'
  creado_el timestamptz NOT NULL DEFAULT now()
);

-- 4.6. DETALLE DE VENTAS (Renglones de cada ticket/venta)
CREATE TABLE public.detalle_ventas (
  id_detalle uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_venta uuid NOT NULL REFERENCES public.ventas(id_venta) ON DELETE CASCADE,
  id_producto uuid NOT NULL REFERENCES public.productos(id_producto) ON DELETE RESTRICT,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario >= 0) -- Precio congelado al vender
);

-- 4.7. PAGOS (Permite un solo pago o pagos divididos)
CREATE TABLE public.pagos (
  id_pago uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_venta uuid NOT NULL REFERENCES public.ventas(id_venta) ON DELETE CASCADE,
  metodo character varying(50) NOT NULL, -- 'efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', etc.
  total numeric(10,2) NOT NULL CHECK (total > 0),
  creado_el timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. ÍNDICES DE RENDIMIENTO
-- ----------------------------------------------------------------------------
CREATE INDEX idx_productos_categoria ON public.productos(id_categoria);
CREATE INDEX idx_movimientos_producto ON public.movimientos_stock(id_producto);
CREATE INDEX idx_movimientos_usuario ON public.movimientos_stock(id_usuario);
CREATE INDEX idx_ventas_usuario ON public.ventas(id_usuario);
CREATE INDEX idx_ventas_fecha ON public.ventas(creado_el DESC);
CREATE INDEX idx_pagos_venta ON public.pagos(id_venta);
CREATE INDEX idx_detalle_venta ON public.detalle_ventas(id_venta);

-- ----------------------------------------------------------------------------
-- 6. TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ----------------------------------------------------------------------------

-- Sincronizar nuevo usuario al registrarse por Google o Email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Actualizar automáticamente stock_actual en productos cuando se inserta un movimiento
CREATE OR REPLACE FUNCTION public.actualizar_stock_producto()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.productos
  SET stock_actual = stock_actual + NEW.cantidad,
      actualizado_el = now()
  WHERE id_producto = NEW.id_producto;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_actualizar_stock ON public.movimientos_stock;
CREATE TRIGGER tr_actualizar_stock
  AFTER INSERT ON public.movimientos_stock
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_stock_producto();

-- Verificar si el usuario autenticado tiene rol de admin sin disparar recursión en RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuario
    WHERE id_usuario = auth.uid() AND rol = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 7. ACTIVACIÓN DE ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 8. POLÍTICAS DE SEGURIDAD (USO INTERNO / LOCAL)
-- ----------------------------------------------------------------------------

-- 8.1. Categorías y Productos
CREATE POLICY "Staff ve categorías" ON public.categorias 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo admin gestiona categorías" ON public.categorias 
  FOR ALL TO authenticated 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Staff ve productos" ON public.productos 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo admin gestiona productos" ON public.productos 
  FOR ALL TO authenticated 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8.2. Usuarios (Sin recursión infinita)
CREATE POLICY "Staff ve otros empleados" ON public.usuario 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo admin inserta usuarios" ON public.usuario 
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_admin());

CREATE POLICY "Solo admin modifica usuarios" ON public.usuario 
  FOR UPDATE TO authenticated 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Solo admin elimina usuarios" ON public.usuario 
  FOR DELETE TO authenticated 
  USING (public.is_admin());

-- 8.3. Ventas, Detalles y Pagos
CREATE POLICY "Staff ve ventas" ON public.ventas 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff registra ventas" ON public.ventas 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff ve detalles" ON public.detalle_ventas 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff registra detalles" ON public.detalle_ventas 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff ve pagos" ON public.pagos 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff registra pagos" ON public.pagos 
  FOR INSERT TO authenticated WITH CHECK (true);

-- 8.4. Movimientos de stock
CREATE POLICY "Staff ve movimientos stock" ON public.movimientos_stock 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff registra movimientos stock" ON public.movimientos_stock 
  FOR INSERT TO authenticated WITH CHECK (true);

  