-- ============================================================================
-- PARCHE IDEMPOTENTE PARA BASES DE DATOS SUPABASE YA CREADAS (M.I STOCK)
-- No borra usuarios ni datos existentes. Agrega:
-- 1. Columnas `telefono` y `activo` en `public.usuario`.
-- 2. Tabla `public.configuracion_negocio` para persistir Configuración en BD.
-- 3. Política RLS de anulación en `public.ventas` + Trigger de reintegro de stock.
-- 4. Función RPC `public.crear_colaborador_admin` para altas reales desde /adminusuarios.
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Extender `public.usuario` sin perder usuarios existentes
ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;

-- 2. Tabla de configuración sincronizada del comercio
CREATE TABLE IF NOT EXISTS public.configuracion_negocio (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  actualizado_el timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracion_negocio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff lee configuración" ON public.configuracion_negocio;
CREATE POLICY "Staff lee configuración" ON public.configuracion_negocio
  FOR SELECT TO authenticated USING (true);

-- 3. Actualizar `is_admin()` considerando `activo`
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

DROP POLICY IF EXISTS "Solo admin modifica configuración" ON public.configuracion_negocio;
CREATE POLICY "Solo admin modifica configuración" ON public.configuracion_negocio
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 4. Permitir anulación controlada de ventas y reintegro automático de stock
DROP POLICY IF EXISTS "Staff anula ventas activas" ON public.ventas;
CREATE POLICY "Staff anula ventas activas" ON public.ventas
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND estado <> 'cancelada')
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND estado = 'cancelada');

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

-- 5. Función RPC protegida para crear colaboradores desde /adminusuarios
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

-- 6. Función RPC protegida para actualizar la contraseña de un colaborador en auth.users
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

COMMIT;
