-- ============================================================================
-- M.I STOCK — ESQUEMA SQL UNIFICADO E IDEMPOTENTE (PostgreSQL 15+ / Supabase)
-- ============================================================================
-- Seguro para ejecutar tanto en bases nuevas como en bases ya activas:
-- - NO elimina usuarios, productos, ventas ni datos existentes.
-- - Crea extensiones, tipos ENUM, tablas, columnas faltantes, índices,
--   funciones RPC, triggers automáticos (stock, anulación y auditoría)
--   y políticas Row Level Security (RLS) en una sola ejecución.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONES
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 2. TIPOS ENUM PERSONALIZADOS (Creación idempotente sin borrar datos)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'user_rol'
  ) THEN
    CREATE TYPE public.user_rol AS ENUM ('admin', 'vendedor', 'no_rol');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'tipo_movimiento'
  ) THEN
    CREATE TYPE public.tipo_movimiento AS ENUM ('compra', 'venta', 'ajuste', 'devolucion');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'unidad_medida'
  ) THEN
    CREATE TYPE public.unidad_medida AS ENUM ('unidad', 'kg', 'gramo', 'litro', 'metro', 'paquete');
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- 3. DEFINICIÓN Y EVOLUCIÓN DE TABLAS
-- ----------------------------------------------------------------------------

-- 3.1. USUARIO (Staff vinculado a Supabase Auth)
CREATE TABLE IF NOT EXISTS public.usuario (
  id_usuario uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text,
  email text NOT NULL,
  rol public.user_rol NOT NULL DEFAULT 'no_rol'::public.user_rol,
  telefono text,
  activo boolean NOT NULL DEFAULT true,
  creado_el timestamptz NOT NULL DEFAULT now(),
  actualizado_el timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;

-- 3.2. CATEGORÍAS (Taxonomía comercial del inventario)
CREATE TABLE IF NOT EXISTS public.categorias (
  id_categoria uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  creado_el timestamptz NOT NULL DEFAULT now(),
  actualizado_el timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;

-- 3.3. PRODUCTOS (Catálogo maestro con categoría obligatoria y doble precio)
CREATE TABLE IF NOT EXISTS public.productos (
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
  activo boolean NOT NULL DEFAULT true,
  creado_el timestamptz NOT NULL DEFAULT now(),
  actualizado_el timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS precio_costo numeric(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS unidad_medida public.unidad_medida NOT NULL DEFAULT 'unidad'::public.unidad_medida;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS oferta boolean NOT NULL DEFAULT false;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;

-- 3.4. MOVIMIENTOS DE STOCK (Libro mayor inmutable de existencias)
CREATE TABLE IF NOT EXISTS public.movimientos_stock (
  id_movimiento uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_producto uuid NOT NULL REFERENCES public.productos(id_producto) ON DELETE CASCADE,
  id_usuario uuid REFERENCES public.usuario(id_usuario) ON DELETE SET NULL,
  cantidad integer NOT NULL, -- Positivo (+) ingresos, negativo (-) salidas/ventas
  tipo public.tipo_movimiento NOT NULL,
  motivo text,
  creado_el timestamptz NOT NULL DEFAULT now()
);

-- 3.5. SESIONES DE CAJA (Historial de aperturas y cierres por usuario)
CREATE TABLE IF NOT EXISTS public.sesiones_caja (
  id_sesion uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_turno text,
  id_usuario uuid NOT NULL REFERENCES public.usuario(id_usuario) ON DELETE RESTRICT,
  id_usuario_cierre uuid REFERENCES public.usuario(id_usuario) ON DELETE SET NULL,
  numero_caja integer NOT NULL DEFAULT 1 CHECK (numero_caja > 0),
  fondo_inicial numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (fondo_inicial >= 0),
  efectivo_esperado numeric(10,2),
  efectivo_real numeric(10,2),
  diferencia numeric(10,2),
  total_recaudado numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (total_recaudado >= 0),
  cantidad_tickets integer NOT NULL DEFAULT 0 CHECK (cantidad_tickets >= 0),
  estado text NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  observaciones_apertura text,
  observaciones_cierre text,
  abierta_el timestamptz NOT NULL DEFAULT now(),
  cerrada_el timestamptz
);

-- 3.6. VENTAS (Cabecera de operación POS vinculada al usuario y turno de caja)
CREATE TABLE IF NOT EXISTS public.ventas (
  id_venta uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid REFERENCES public.usuario(id_usuario) ON DELETE SET NULL,
  id_sesion_caja uuid REFERENCES public.sesiones_caja(id_sesion) ON DELETE SET NULL,
  total numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  estado text NOT NULL DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
  creado_el timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS id_sesion_caja uuid REFERENCES public.sesiones_caja(id_sesion) ON DELETE SET NULL;

-- 3.7. DETALLE DE VENTAS (Renglones con snapshot de precio unitario)
CREATE TABLE IF NOT EXISTS public.detalle_ventas (
  id_detalle uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_venta uuid NOT NULL REFERENCES public.ventas(id_venta) ON DELETE CASCADE,
  id_producto uuid NOT NULL REFERENCES public.productos(id_producto) ON DELETE RESTRICT,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario >= 0)
);

-- 3.8. PAGOS (Soporte de cobro único o dividido)
CREATE TABLE IF NOT EXISTS public.pagos (
  id_pago uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_venta uuid NOT NULL REFERENCES public.ventas(id_venta) ON DELETE CASCADE,
  metodo character varying(50) NOT NULL,
  total numeric(10,2) NOT NULL CHECK (total > 0),
  creado_el timestamptz NOT NULL DEFAULT now()
);

-- 3.9. CONFIGURACIÓN DEL NEGOCIO (Fila única sincronizada entre terminales)
CREATE TABLE IF NOT EXISTS public.configuracion_negocio (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  actualizado_el timestamptz NOT NULL DEFAULT now()
);

-- 3.10. AUDITORÍA CENTRALIZADA (Bitácora inmutable append-only)
CREATE TABLE IF NOT EXISTS public.auditoria_eventos (
  id_evento uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid REFERENCES public.usuario(id_usuario) ON DELETE SET NULL,
  rol_usuario public.user_rol,
  modulo text NOT NULL CHECK (modulo IN ('auth', 'inventario', 'caja', 'ventas', 'usuarios')),
  accion text NOT NULL CHECK (accion IN (
    'login',
    'logout',
    'producto_alta',
    'producto_modificacion',
    'producto_baja',
    'producto_reactivacion',
    'stock_ajuste',
    'caja_apertura',
    'caja_cierre',
    'venta_creada',
    'venta_anulada'
  )),
  entidad text,
  entidad_id uuid,
  resumen text NOT NULL,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  creado_el timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. ÍNDICES DE RENDIMIENTO
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos(id_categoria);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON public.movimientos_stock(id_producto);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario ON public.movimientos_stock(id_usuario);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_usuario ON public.sesiones_caja(id_usuario);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_usuario_cierre ON public.sesiones_caja(id_usuario_cierre);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_abierta_el ON public.sesiones_caja(abierta_el DESC);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_estado ON public.sesiones_caja(estado, abierta_el DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON public.ventas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas(creado_el DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_sesion_caja ON public.ventas(id_sesion_caja);
CREATE INDEX IF NOT EXISTS idx_pagos_venta ON public.pagos(id_venta);
CREATE INDEX IF NOT EXISTS idx_detalle_venta ON public.detalle_ventas(id_venta);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_producto ON public.detalle_ventas(id_producto);
CREATE INDEX IF NOT EXISTS idx_auditoria_creado_el ON public.auditoria_eventos(creado_el DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_modulo_fecha ON public.auditoria_eventos(modulo, creado_el DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_fecha ON public.auditoria_eventos(id_usuario, creado_el DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON public.auditoria_eventos(entidad, entidad_id);

-- ----------------------------------------------------------------------------
-- 5. FUNCIONES AUXILIARES, RPCs Y TRIGGERS DE NEGOCIO
-- ----------------------------------------------------------------------------

-- 5.1. Verificar si el usuario autenticado es administrador activo (sin recursión RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuario
    WHERE id_usuario = auth.uid()
      AND rol = 'admin'::public.user_rol
      AND COALESCE(activo, true) = true
  );
$$;

-- 5.2. Sincronizar perfil en public.usuario al crear usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- 5.3. Actualizar stock_actual automáticamente al insertar un movimiento de stock
CREATE OR REPLACE FUNCTION public.actualizar_stock_producto()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- 5.4. Descontar stock automáticamente por cada renglón de venta registrado
CREATE OR REPLACE FUNCTION public.registrar_movimiento_por_venta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_usuario_id uuid;
BEGIN
  SELECT id_usuario INTO v_usuario_id FROM public.ventas WHERE id_venta = NEW.id_venta;

  INSERT INTO public.movimientos_stock (id_producto, id_usuario, cantidad, tipo, motivo)
  VALUES (
    NEW.id_producto,
    v_usuario_id,
    -NEW.cantidad,
    'venta'::public.tipo_movimiento,
    'Venta automática en ticket ' || NEW.id_venta::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_venta_movimiento_stock ON public.detalle_ventas;
CREATE TRIGGER tr_venta_movimiento_stock
  AFTER INSERT ON public.detalle_ventas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_movimiento_por_venta();

-- 5.5. Reintegrar stock automáticamente al anular una venta activa (estado -> 'cancelada')
CREATE OR REPLACE FUNCTION public.reintegrar_stock_por_cancelacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- 5.6. RPC administrativa: alta real de colaboradores en auth.users + public.usuario
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

-- 5.7. RPC administrativa: actualización segura de contraseña en auth.users
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
-- 6. MOTOR DE AUDITORÍA AUTOMÁTICA (Triggers SECURITY DEFINER)
-- ----------------------------------------------------------------------------

-- 6.1. Función interna de registro (solo invocada por triggers)
CREATE OR REPLACE FUNCTION public.registrar_evento_auditoria(
  p_id_usuario uuid,
  p_modulo text,
  p_accion text,
  p_entidad text,
  p_entidad_id uuid,
  p_resumen text,
  p_datos_anteriores jsonb DEFAULT NULL,
  p_datos_nuevos jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := COALESCE(p_id_usuario, auth.uid());
  v_rol public.user_rol;
BEGIN
  IF v_actor IS NOT NULL THEN
    SELECT u.rol INTO v_rol FROM public.usuario u WHERE u.id_usuario = v_actor;
  END IF;

  INSERT INTO public.auditoria_eventos (
    id_usuario, rol_usuario, modulo, accion, entidad, entidad_id, resumen, datos_anteriores, datos_nuevos
  ) VALUES (
    v_actor, v_rol, p_modulo, p_accion, p_entidad, p_entidad_id, p_resumen, p_datos_anteriores, p_datos_nuevos
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.registrar_evento_auditoria(uuid, text, text, text, uuid, text, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;

-- 6.2. Auditoría de productos (alta, modificación, baja lógica y reactivación)
CREATE OR REPLACE FUNCTION public.auditar_cambios_producto()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.registrar_evento_auditoria(
      v_actor,
      'inventario',
      'producto_alta',
      'productos',
      NEW.id_producto,
      'Alta de producto "' || NEW.nombre || '" (SKU: ' || COALESCE(NEW.sku, 'S/N') || ', stock inicial: ' || NEW.stock_actual::text || ')',
      NULL,
      jsonb_build_object(
        'nombre', NEW.nombre,
        'sku', NEW.sku,
        'id_categoria', NEW.id_categoria,
        'precio_costo', NEW.precio_costo,
        'precio_venta', NEW.precio_venta,
        'stock_actual', NEW.stock_actual,
        'stock_minimo', NEW.stock_minimo,
        'activo', NEW.activo
      )
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.activo IS TRUE AND NEW.activo IS FALSE THEN
      PERFORM public.registrar_evento_auditoria(
        v_actor,
        'inventario',
        'producto_baja',
        'productos',
        NEW.id_producto,
        'Baja lógica de producto "' || NEW.nombre || '" (SKU: ' || COALESCE(NEW.sku, 'S/N') || ')',
        jsonb_build_object('activo', OLD.activo, 'stock_actual', OLD.stock_actual),
        jsonb_build_object('activo', NEW.activo, 'stock_actual', NEW.stock_actual)
      );
    ELSIF OLD.activo IS FALSE AND NEW.activo IS TRUE THEN
      PERFORM public.registrar_evento_auditoria(
        v_actor,
        'inventario',
        'producto_reactivacion',
        'productos',
        NEW.id_producto,
        'Reactivación de producto "' || NEW.nombre || '" (SKU: ' || COALESCE(NEW.sku, 'S/N') || ')',
        jsonb_build_object('activo', OLD.activo),
        jsonb_build_object('activo', NEW.activo)
      );
    END IF;

    IF OLD.nombre IS DISTINCT FROM NEW.nombre
      OR OLD.sku IS DISTINCT FROM NEW.sku
      OR OLD.id_categoria IS DISTINCT FROM NEW.id_categoria
      OR OLD.precio_costo IS DISTINCT FROM NEW.precio_costo
      OR OLD.precio_venta IS DISTINCT FROM NEW.precio_venta
      OR OLD.stock_minimo IS DISTINCT FROM NEW.stock_minimo
      OR OLD.unidad_medida IS DISTINCT FROM NEW.unidad_medida
      OR OLD.oferta IS DISTINCT FROM NEW.oferta
    THEN
      PERFORM public.registrar_evento_auditoria(
        v_actor,
        'inventario',
        'producto_modificacion',
        'productos',
        NEW.id_producto,
        'Modificación de producto "' || NEW.nombre || '" (SKU: ' || COALESCE(NEW.sku, 'S/N') || ')',
        jsonb_build_object(
          'nombre', OLD.nombre,
          'sku', OLD.sku,
          'id_categoria', OLD.id_categoria,
          'precio_costo', OLD.precio_costo,
          'precio_venta', OLD.precio_venta,
          'stock_minimo', OLD.stock_minimo,
          'unidad_medida', OLD.unidad_medida,
          'oferta', OLD.oferta
        ),
        jsonb_build_object(
          'nombre', NEW.nombre,
          'sku', NEW.sku,
          'id_categoria', NEW.id_categoria,
          'precio_costo', NEW.precio_costo,
          'precio_venta', NEW.precio_venta,
          'stock_minimo', NEW.stock_minimo,
          'unidad_medida', NEW.unidad_medida,
          'oferta', NEW.oferta
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auditar_productos ON public.productos;
CREATE TRIGGER tr_auditar_productos
  AFTER INSERT OR UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.auditar_cambios_producto();

-- 6.3. Auditoría de reposiciones y ajustes manuales de stock
CREATE OR REPLACE FUNCTION public.auditar_movimiento_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nombre_prod text;
  v_sku_prod text;
  v_signo text;
BEGIN
  IF NEW.tipo NOT IN ('compra'::public.tipo_movimiento, 'ajuste'::public.tipo_movimiento) THEN
    RETURN NEW;
  END IF;

  SELECT p.nombre, p.sku INTO v_nombre_prod, v_sku_prod
  FROM public.productos p
  WHERE p.id_producto = NEW.id_producto;

  v_signo := CASE WHEN NEW.cantidad >= 0 THEN '+' || NEW.cantidad::text ELSE NEW.cantidad::text END;

  PERFORM public.registrar_evento_auditoria(
    COALESCE(NEW.id_usuario, auth.uid()),
    'inventario',
    'stock_ajuste',
    'productos',
    NEW.id_producto,
    'Ajuste de stock (' || NEW.tipo::text || ') en "' || COALESCE(v_nombre_prod, 'Producto') || '": ' || v_signo || ' un.',
    NULL,
    jsonb_build_object(
      'sku', v_sku_prod,
      'tipo', NEW.tipo::text,
      'cantidad', NEW.cantidad,
      'motivo', NEW.motivo
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auditar_movimientos_stock ON public.movimientos_stock;
CREATE TRIGGER tr_auditar_movimientos_stock
  AFTER INSERT ON public.movimientos_stock
  FOR EACH ROW EXECUTE FUNCTION public.auditar_movimiento_stock();

-- 6.4. Auditoría de aperturas y cierres de sesiones de caja
CREATE OR REPLACE FUNCTION public.auditar_sesiones_caja()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.registrar_evento_auditoria(
      NEW.id_usuario,
      'caja',
      'caja_apertura',
      'sesiones_caja',
      NEW.id_sesion,
      'Apertura de Caja N° ' || NEW.numero_caja::text || ' (' || COALESCE(NEW.codigo_turno, 'Sin turno') || ') · Fondo inicial: $' || NEW.fondo_inicial::text,
      NULL,
      jsonb_build_object(
        'codigo_turno', NEW.codigo_turno,
        'numero_caja', NEW.numero_caja,
        'fondo_inicial', NEW.fondo_inicial,
        'observaciones_apertura', NEW.observaciones_apertura
      )
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.estado <> 'cerrada' AND NEW.estado = 'cerrada' THEN
    PERFORM public.registrar_evento_auditoria(
      COALESCE(NEW.id_usuario_cierre, auth.uid(), NEW.id_usuario),
      'caja',
      'caja_cierre',
      'sesiones_caja',
      NEW.id_sesion,
      'Cierre de Caja N° ' || NEW.numero_caja::text || ' (' || COALESCE(NEW.codigo_turno, 'Sin turno') || ') · Recaudado: $' || NEW.total_recaudado::text || ' · Diferencia: $' || COALESCE(NEW.diferencia, 0)::text,
      jsonb_build_object(
        'estado', OLD.estado,
        'fondo_inicial', OLD.fondo_inicial
      ),
      jsonb_build_object(
        'estado', NEW.estado,
        'efectivo_esperado', NEW.efectivo_esperado,
        'efectivo_real', NEW.efectivo_real,
        'diferencia', NEW.diferencia,
        'total_recaudado', NEW.total_recaudado,
        'cantidad_tickets', NEW.cantidad_tickets,
        'observaciones_cierre', NEW.observaciones_cierre
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auditar_sesiones_caja ON public.sesiones_caja;
CREATE TRIGGER tr_auditar_sesiones_caja
  AFTER INSERT OR UPDATE OF estado ON public.sesiones_caja
  FOR EACH ROW EXECUTE FUNCTION public.auditar_sesiones_caja();

-- 6.5. Auditoría de ventas creadas y anuladas
CREATE OR REPLACE FUNCTION public.auditar_ventas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.registrar_evento_auditoria(
      COALESCE(NEW.id_usuario, auth.uid()),
      'ventas',
      'venta_creada',
      'ventas',
      NEW.id_venta,
      'Venta registrada #' || upper(left(NEW.id_venta::text, 8)) || ' · Total: $' || NEW.total::text,
      NULL,
      jsonb_build_object(
        'total', NEW.total,
        'estado', NEW.estado,
        'id_sesion_caja', NEW.id_sesion_caja
      )
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.estado <> 'cancelada' AND NEW.estado = 'cancelada' THEN
    PERFORM public.registrar_evento_auditoria(
      COALESCE(auth.uid(), NEW.id_usuario),
      'ventas',
      'venta_anulada',
      'ventas',
      NEW.id_venta,
      'Venta anulada #' || upper(left(NEW.id_venta::text, 8)) || ' · Monto revertido: $' || NEW.total::text,
      jsonb_build_object('estado', OLD.estado, 'total', OLD.total),
      jsonb_build_object('estado', NEW.estado, 'total', NEW.total)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auditar_ventas ON public.ventas;
CREATE TRIGGER tr_auditar_ventas
  AFTER INSERT OR UPDATE OF estado ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.auditar_ventas();

-- ----------------------------------------------------------------------------
-- 7. ACTIVACIÓN DE ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_negocio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_eventos ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 8. POLÍTICAS RLS (Idempotentes y optimizadas con subqueries escalares)
-- ----------------------------------------------------------------------------

-- 8.1. Categorías y Productos
DROP POLICY IF EXISTS "Staff ve categorías" ON public.categorias;
CREATE POLICY "Staff ve categorías" ON public.categorias
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Solo admin gestiona categorías" ON public.categorias;
CREATE POLICY "Solo admin gestiona categorías" ON public.categorias
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Staff ve productos" ON public.productos;
CREATE POLICY "Staff ve productos" ON public.productos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Solo admin gestiona productos" ON public.productos;
CREATE POLICY "Solo admin gestiona productos" ON public.productos
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 8.2. Usuarios
DROP POLICY IF EXISTS "Staff ve otros empleados" ON public.usuario;
CREATE POLICY "Staff ve otros empleados" ON public.usuario
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Solo admin inserta usuarios" ON public.usuario;
CREATE POLICY "Solo admin inserta usuarios" ON public.usuario
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Solo admin modifica usuarios" ON public.usuario;
CREATE POLICY "Solo admin modifica usuarios" ON public.usuario
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Solo admin elimina usuarios" ON public.usuario;
CREATE POLICY "Solo admin elimina usuarios" ON public.usuario
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- 8.3. Ventas, Detalles y Pagos
DROP POLICY IF EXISTS "Staff ve ventas" ON public.ventas;
CREATE POLICY "Staff ve ventas" ON public.ventas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff registra ventas" ON public.ventas;
CREATE POLICY "Staff registra ventas" ON public.ventas
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Staff anula ventas activas" ON public.ventas;
CREATE POLICY "Staff anula ventas activas" ON public.ventas
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND estado <> 'cancelada')
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND estado = 'cancelada');

DROP POLICY IF EXISTS "Staff ve detalles" ON public.detalle_ventas;
CREATE POLICY "Staff ve detalles" ON public.detalle_ventas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff registra detalles" ON public.detalle_ventas;
CREATE POLICY "Staff registra detalles" ON public.detalle_ventas
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Staff ve pagos" ON public.pagos;
CREATE POLICY "Staff ve pagos" ON public.pagos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff registra pagos" ON public.pagos;
CREATE POLICY "Staff registra pagos" ON public.pagos
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 8.4. Movimientos de stock (Ledger inmutable)
DROP POLICY IF EXISTS "Staff ve movimientos stock" ON public.movimientos_stock;
CREATE POLICY "Staff ve movimientos stock" ON public.movimientos_stock
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff registra movimientos stock" ON public.movimientos_stock;
CREATE POLICY "Staff registra movimientos stock" ON public.movimientos_stock
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 8.5. Configuración del negocio y estado compartido de caja
DROP POLICY IF EXISTS "Staff lee configuración" ON public.configuracion_negocio;
CREATE POLICY "Staff lee configuración" ON public.configuracion_negocio
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Solo admin modifica configuración" ON public.configuracion_negocio;
DROP POLICY IF EXISTS "Staff modifica configuración y sesión de caja" ON public.configuracion_negocio;
CREATE POLICY "Staff modifica configuración y sesión de caja" ON public.configuracion_negocio
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 8.6. Sesiones de caja
DROP POLICY IF EXISTS "Staff ve sesiones de caja" ON public.sesiones_caja;
CREATE POLICY "Staff ve sesiones de caja" ON public.sesiones_caja
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Staff abre su sesion de caja" ON public.sesiones_caja;
CREATE POLICY "Staff abre su sesion de caja" ON public.sesiones_caja
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id_usuario);

DROP POLICY IF EXISTS "Staff o admin cierra sesion abierta" ON public.sesiones_caja;
CREATE POLICY "Staff o admin cierra sesion abierta" ON public.sesiones_caja
  FOR UPDATE TO authenticated
  USING (
    estado = 'abierta'
    AND ((SELECT auth.uid()) = id_usuario OR (SELECT public.is_admin()))
  )
  WITH CHECK (
    estado = 'cerrada'
    AND (SELECT auth.uid()) IS NOT NULL
  );

-- 8.7. Auditoría centralizada (Append-only: lectura exclusiva admin, insert solo auth propio)
DROP POLICY IF EXISTS "Solo admin lee auditoria" ON public.auditoria_eventos;
CREATE POLICY "Solo admin lee auditoria" ON public.auditoria_eventos
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Usuario registra su propio login o logout" ON public.auditoria_eventos;
CREATE POLICY "Usuario registra su propio login o logout" ON public.auditoria_eventos
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = id_usuario
    AND modulo = 'auth'
    AND accion IN ('login', 'logout')
  );

COMMIT;
