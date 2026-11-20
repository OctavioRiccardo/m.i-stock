-- ============================================================================
-- PARCHE IDEMPOTENTE: AUDITORÍA CENTRALIZADA E HISTORIAL DE SESIONES DE CAJA
-- Compatible con PostgreSQL 15+ / Supabase (M.I Stock)
-- No borra datos existentes. Agrega:
-- 1. Tabla `public.sesiones_caja` para registrar aperturas y cierres por usuario.
-- 2. Columna opcional `id_sesion_caja` en `public.ventas` para vincular ventas al turno.
-- 3. Tabla `public.auditoria_eventos` (append-only) para inventario, caja, ventas y auth.
-- 4. Triggers automáticos (`SECURITY DEFINER`, `SET search_path = ''`) y políticas RLS.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. TABLA DE SESIONES DE CAJA (Historial de Aperturas y Cierres por Usuario)
-- ----------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_sesiones_caja_usuario ON public.sesiones_caja(id_usuario);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_usuario_cierre ON public.sesiones_caja(id_usuario_cierre);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_abierta_el ON public.sesiones_caja(abierta_el DESC);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_estado ON public.sesiones_caja(estado, abierta_el DESC);

-- ----------------------------------------------------------------------------
-- 2. VINCULAR VENTAS AL TURNO DE CAJA (Opcional y retrocompatible)
-- ----------------------------------------------------------------------------
ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS id_sesion_caja uuid REFERENCES public.sesiones_caja(id_sesion) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ventas_sesion_caja ON public.ventas(id_sesion_caja);

-- ----------------------------------------------------------------------------
-- 3. TABLA CENTRALIZADA DE AUDITORÍA (Append-Only Ledger)
-- ----------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_auditoria_creado_el ON public.auditoria_eventos(creado_el DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_modulo_fecha ON public.auditoria_eventos(modulo, creado_el DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_fecha ON public.auditoria_eventos(id_usuario, creado_el DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON public.auditoria_eventos(entidad, entidad_id);

-- ----------------------------------------------------------------------------
-- 4. FUNCIÓN INTERNA DE REGISTRO DE AUDITORÍA (Solo invocada por triggers)
-- ----------------------------------------------------------------------------
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
    SELECT u.rol INTO v_rol
    FROM public.usuario u
    WHERE u.id_usuario = v_actor;
  END IF;

  INSERT INTO public.auditoria_eventos (
    id_usuario,
    rol_usuario,
    modulo,
    accion,
    entidad,
    entidad_id,
    resumen,
    datos_anteriores,
    datos_nuevos
  ) VALUES (
    v_actor,
    v_rol,
    p_modulo,
    p_accion,
    p_entidad,
    p_entidad_id,
    p_resumen,
    p_datos_anteriores,
    p_datos_nuevos
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.registrar_evento_auditoria(uuid, text, text, text, uuid, text, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. TRIGGERS AUTOMÁTICOS DE AUDITORÍA
-- ----------------------------------------------------------------------------

-- 5.1. Productos: alta, modificación comercial, baja lógica y reactivación
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

-- 5.2. Movimientos manuales de stock (reposiciones / ajustes)
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
  -- Solo auditar ingresos/ajustes administrativos (las ventas y devoluciones se auditan en public.ventas)
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

-- 5.3. Sesiones de caja: apertura y cierre
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

-- 5.4. Ventas: creación y anulación
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
-- 6. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.sesiones_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_eventos ENABLE ROW LEVEL SECURITY;

-- Sesiones de caja
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

-- Auditoría (Append-Only: solo lectura admin, inserción directa solo auth propio, sin UPDATE ni DELETE)
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
