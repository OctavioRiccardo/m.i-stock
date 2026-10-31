-- ============================================================================
-- SISTEMA DE GESTIÓN DE STOCK Y VENTAS (USO INTERNO / LOCAL / POS)
-- Esquema completo para Supabase (PostgreSQL 15+)
-- ============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 2. LIMPIEZA DE TABLAS PREVIAS (Por si necesitas reiniciar desde cero)
-- ----------------------------------------------------------------------------
/* DROP TABLE IF EXISTS public.configuracion_negocio CASCADE;
DROP TABLE IF EXISTS public.pagos CASCADE;
DROP TABLE IF EXISTS public.detalle_ventas CASCADE;
DROP TABLE IF EXISTS public.ventas CASCADE;
DROP TABLE IF EXISTS public.movimientos_stock CASCADE;
DROP TABLE IF EXISTS public.productos CASCADE;
DROP TABLE IF EXISTS public.categorias CASCADE;
DROP TABLE IF EXISTS public.usuario CASCADE;
DROP TYPE IF EXISTS public.unidad_medida CASCADE;
DROP TYPE IF EXISTS public.tipo_movimiento CASCADE;
DROP TYPE IF EXISTS public.user_rol CASCADE; */

-- ----------------------------------------------------------------------------
-- 3. TIPOS ENUM PERSONALIZADOS
-- ----------------------------------------------------------------------------
DROP TYPE IF EXISTS public.user_rol CASCADE;
CREATE TYPE public.user_rol AS ENUM ('admin', 'vendedor', 'no_rol');

DROP TYPE IF EXISTS public.tipo_movimiento CASCADE;
CREATE TYPE public.tipo_movimiento AS ENUM ('compra', 'venta', 'ajuste', 'devolucion');

DROP TYPE IF EXISTS public.unidad_medida CASCADE;
CREATE TYPE public.unidad_medida AS ENUM ('unidad', 'kg', 'gramo', 'litro', 'metro', 'paquete');

-- ----------------------------------------------------------------------------
-- 4. DEFINICIÓN DE TABLAS
-- ----------------------------------------------------------------------------

-- 4.1. USUARIO (Empleados / Staff vinculados a Supabase Auth / Google)
CREATE TABLE public.usuario (
  id_usuario uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text,
  email text NOT NULL,
  rol public.user_rol NOT NULL DEFAULT 'no_rol'::public.user_rol,
  telefono text,
  activo boolean NOT NULL DEFAULT true,
  creado_el timestamptz NOT NULL DEFAULT now(),
  actualizado_el timestamptz NOT NULL DEFAULT now()
);

-- 4.2. CATEGORÍAS (Taxonomía comercial del inventario)
CREATE TABLE public.categorias (
  id_categoria uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  activo boolean NOT NULL DEFAULT true, -- Control de baja lógica
  creado_el timestamptz NOT NULL DEFAULT now(),
  actualizado_el timestamptz NOT NULL DEFAULT now()
);

-- 4.3. PRODUCTOS (Catálogo comercial con categoría obligatoria y doble precio)
CREATE TABLE public.productos (
  id_producto uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_categoria uuid NOT NULL REFERENCES public.categorias(id_categoria) ON DELETE RESTRICT,
  nombre text NOT NULL,
  descripcion text,
  sku text UNIQUE,
  precio_costo numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (precio_costo >= 0),
  precio_venta numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (precio_venta >= 0),
  stock_actual integer NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo integer NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
  unidad_medida public.unidad_medida NOT NULL DEFAULT 'unidad'::public.unidad_medida,
  imagen_url text,
  oferta boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true, -- Borrado lógico (soft delete)
  creado_el timestamptz NOT NULL DEFAULT now(),
  actualizado_el timestamptz NOT NULL DEFAULT now()
);

-- 4.4. MOVIMIENTOS DE STOCK (Historial y trazabilidad de inventario - Patrón Ledger)
CREATE TABLE public.movimientos_stock (
  id_movimiento uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_producto uuid NOT NULL REFERENCES public.productos(id_producto) ON DELETE CASCADE,
  id_usuario uuid REFERENCES public.usuario(id_usuario) ON DELETE SET NULL,
  cantidad integer NOT NULL, -- Positivo (+) para ingresos, negativo (-) para salidas/ventas
  tipo public.tipo_movimiento NOT NULL,
  motivo text,
  creado_el timestamptz NOT NULL DEFAULT now()
);

-- 4.5. VENTAS (Cabecera de la operación de caja / POS)
CREATE TABLE public.ventas (
  id_venta uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid REFERENCES public.usuario(id_usuario) ON DELETE SET NULL, -- Empleado que cobra
  total numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  estado text NOT NULL DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
  creado_el timestamptz NOT NULL DEFAULT now()
);

-- 4.6. DETALLE DE VENTAS (Renglones de cada ticket/venta)
CREATE TABLE public.detalle_ventas (
  id_detalle uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_venta uuid NOT NULL REFERENCES public.ventas(id_venta) ON DELETE CASCADE,
  id_producto uuid NOT NULL REFERENCES public.productos(id_producto) ON DELETE RESTRICT,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario >= 0) -- Precio congelado al vender (Snapshot)
);

-- 4.7. PAGOS (Permite un solo pago o pagos divididos / Split Payment)
CREATE TABLE public.pagos (
  id_pago uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_venta uuid NOT NULL REFERENCES public.ventas(id_venta) ON DELETE CASCADE,
  metodo character varying(50) NOT NULL, -- 'efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', etc.
  total numeric(10,2) NOT NULL CHECK (total > 0),
  creado_el timestamptz NOT NULL DEFAULT now()
);

-- 4.8. CONFIGURACIÓN DEL NEGOCIO (Fila única sincronizada entre terminales)
CREATE TABLE IF NOT EXISTS public.configuracion_negocio (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  actualizado_el timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. ÍNDICES DE RENDIMIENTO (Claves Foráneas y Búsquedas Frecuentes)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_productos_categoria ON public.productos(id_categoria);
CREATE INDEX idx_movimientos_producto ON public.movimientos_stock(id_producto);
CREATE INDEX idx_movimientos_usuario ON public.movimientos_stock(id_usuario);
CREATE INDEX idx_ventas_usuario ON public.ventas(id_usuario);
CREATE INDEX idx_ventas_fecha ON public.ventas(creado_el DESC);
CREATE INDEX idx_pagos_venta ON public.pagos(id_venta);
CREATE INDEX idx_detalle_venta ON public.detalle_ventas(id_venta);
CREATE INDEX idx_detalle_ventas_producto ON public.detalle_ventas(id_producto); -- Optimización FK

-- ----------------------------------------------------------------------------
-- 6. TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ----------------------------------------------------------------------------

-- 6.1. Sincronizar nuevo usuario al registrarse por Google o Email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuario (id_usuario, email, nombre)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id_usuario) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6.2. Actualizar automáticamente stock_actual en productos cuando se inserta un movimiento
CREATE OR REPLACE FUNCTION public.actualizar_stock_producto()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.productos
  SET stock_actual = GREATEST(0, stock_actual + NEW.cantidad),
      actualizado_el = now()
  WHERE id_producto = NEW.id_producto;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_actualizar_stock ON public.movimientos_stock;
CREATE TRIGGER tr_actualizar_stock
  AFTER INSERT ON public.movimientos_stock
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_stock_producto();

-- 6.3. Automatización de salida de stock ante cada renglón de venta registrado en el POS
CREATE OR REPLACE FUNCTION public.registrar_movimiento_por_venta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id uuid;
BEGIN
  -- Obtener el usuario cajero desde la cabecera de la venta
  SELECT id_usuario INTO v_usuario_id FROM public.ventas WHERE id_venta = NEW.id_venta;

  -- Insertar el movimiento de auditoría (cantidad negativa para descontar stock)
  INSERT INTO public.movimientos_stock (id_producto, id_usuario, cantidad, tipo, motivo)
  VALUES (
    NEW.id_producto,
    v_usuario_id,
    -NEW.cantidad,
    'venta',
    'Venta automática en ticket ' || NEW.id_venta::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_venta_movimiento_stock ON public.detalle_ventas;
CREATE TRIGGER tr_venta_movimiento_stock
  AFTER INSERT ON public.detalle_ventas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_movimiento_por_venta();

-- 6.4. Reintegro automático de stock al anular una venta activa (estado -> 'cancelada')
CREATE OR REPLACE FUNCTION public.reintegrar_stock_por_cancelacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.estado <> 'cancelada' AND NEW.estado = 'cancelada' THEN
    INSERT INTO public.movimientos_stock (id_producto, id_usuario, cantidad, tipo, motivo)
    SELECT
      dv.id_producto,
      COALESCE(auth.uid(), NEW.id_usuario),
      dv.cantidad,
      'devolucion'::public.tipo_movimiento,
      'Reintegro por anulación de ticket ' || NEW.id_venta::text
    FROM public.detalle_ventas dv
    WHERE dv.id_venta = NEW.id_venta;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_cancelar_venta_reintegrar_stock ON public.ventas;
CREATE TRIGGER tr_cancelar_venta_reintegrar_stock
  AFTER UPDATE OF estado ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.reintegrar_stock_por_cancelacion();

-- 6.5. Verificar si el usuario autenticado tiene rol de admin activo sin disparar recursión en RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuario
    WHERE id_usuario = auth.uid()
      AND rol = 'admin'
      AND COALESCE(activo, true) = true
  );
$$;

-- 6.6. Alta administrativa segura de colaboradores en Supabase Auth + public.usuario
CREATE OR REPLACE FUNCTION public.crear_colaborador_admin(
  p_email text,
  p_password text,
  p_nombre text,
  p_rol public.user_rol DEFAULT 'vendedor',
  p_telefono text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_nombre text := trim(p_nombre);
  v_id uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Acceso denegado: solo un administrador activo puede registrar colaboradores.';
  END IF;

  IF v_email = '' OR position('@' IN v_email) < 2 THEN
    RAISE EXCEPTION 'El correo electrónico ingresado no es válido.';
  END IF;

  IF length(COALESCE(p_password, '')) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_email) THEN
    RAISE EXCEPTION 'Ya existe un usuario registrado con ese correo electrónico.';
  END IF;

  v_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new,
    email_change_token_current, recovery_token, reauthentication_token,
    phone_change, phone_change_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', v_nombre),
    now(),
    now(),
    '', '', '', '', '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_id,
    v_id::text,
    jsonb_build_object(
      'sub', v_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  );

  INSERT INTO public.usuario (id_usuario, email, nombre, rol, telefono, activo)
  VALUES (v_id, v_email, v_nombre, p_rol, NULLIF(trim(COALESCE(p_telefono, '')), ''), true)
  ON CONFLICT (id_usuario) DO UPDATE
    SET nombre = EXCLUDED.nombre,
        rol = EXCLUDED.rol,
        telefono = EXCLUDED.telefono,
        activo = true,
        actualizado_el = now();

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crear_colaborador_admin(text, text, text, public.user_rol, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_colaborador_admin(text, text, text, public.user_rol, text) TO authenticated;

-- 6.7. Actualización administrativa segura de contraseña en Supabase Auth
CREATE OR REPLACE FUNCTION public.actualizar_password_colaborador_admin(
  p_id_usuario uuid,
  p_nueva_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Acceso denegado: solo un administrador activo puede modificar contraseñas.';
  END IF;

  IF length(COALESCE(p_nueva_password, '')) < 6 OR length(p_nueva_password) > 72 THEN
    RAISE EXCEPTION 'La contraseña debe tener entre 6 y 72 caracteres.';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_nueva_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = p_id_usuario;

  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.actualizar_password_colaborador_admin(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.actualizar_password_colaborador_admin(uuid, text) TO authenticated;

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
ALTER TABLE public.configuracion_negocio ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 8. POLÍTICAS DE SEGURIDAD (USO INTERNO / LOCAL - OPTIMIZADAS CON SUBQUERY)
-- ----------------------------------------------------------------------------

-- 8.1. Categorías y Productos
CREATE POLICY "Staff ve categorías" ON public.categorias 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo admin gestiona categorías" ON public.categorias 
  FOR ALL TO authenticated 
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Staff ve productos" ON public.productos 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo admin gestiona productos" ON public.productos 
  FOR ALL TO authenticated 
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 8.2. Usuarios (Sin recursión infinita y subquery optimizada)
CREATE POLICY "Staff ve otros empleados" ON public.usuario 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo admin inserta usuarios" ON public.usuario 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Solo admin modifica usuarios" ON public.usuario 
  FOR UPDATE TO authenticated 
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Solo admin elimina usuarios" ON public.usuario 
  FOR DELETE TO authenticated 
  USING ((SELECT public.is_admin()));

-- 8.3. Ventas, Detalles y Pagos (Trazabilidad contable con anulación controlada)
CREATE POLICY "Staff ve ventas" ON public.ventas 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff registra ventas" ON public.ventas 
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Staff anula ventas activas" ON public.ventas
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND estado <> 'cancelada')
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND estado = 'cancelada');

CREATE POLICY "Staff ve detalles" ON public.detalle_ventas 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff registra detalles" ON public.detalle_ventas 
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Staff ve pagos" ON public.pagos 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff registra pagos" ON public.pagos 
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 8.4. Movimientos de stock (Historial inmutable / Ledger)
CREATE POLICY "Staff ve movimientos stock" ON public.movimientos_stock 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff registra movimientos stock" ON public.movimientos_stock 
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 8.5. Configuración del negocio
CREATE POLICY "Staff lee configuración" ON public.configuracion_negocio
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo admin modifica configuración" ON public.configuracion_negocio
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));
