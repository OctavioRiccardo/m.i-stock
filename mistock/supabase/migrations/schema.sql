-- =========================================================================
-- MIGRACIÓN DE ESQUEMA COMPLETO v2 PARA MISTOCK
-- Agrega: MovimientoStock, Cliente (dni, email, etc.), Pago y relaciones de Venta
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. TABLA: cliente (Información de Clientes)
-- -------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.cliente
  ADD COLUMN IF NOT EXISTS "dni" TEXT,
  ADD COLUMN IF NOT EXISTS "telefono" TEXT,
  ADD COLUMN IF NOT EXISTS "direccion" TEXT;

-- Índice para búsquedas rápidas por DNI
CREATE INDEX IF NOT EXISTS idx_cliente_dni ON public.cliente ("dni");


-- -------------------------------------------------------------------------
-- 2. TABLA: Pago (Información de pagos asociados a ventas)
-- -------------------------------------------------------------------------
ALTER TABLE IF EXISTS public."Pago"
  ADD COLUMN IF NOT EXISTS "venta_id" BIGINT,
  ADD COLUMN IF NOT EXISTS "monto" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "metodo_pago" TEXT NOT NULL DEFAULT 'Efectivo',
  ADD COLUMN IF NOT EXISTS "estado" TEXT NOT NULL DEFAULT 'COMPLETADO';

-- Relación Foránea: Pago -> Venta
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_pago_venta'
  ) THEN
    ALTER TABLE public."Pago" 
      ADD CONSTRAINT fk_pago_venta 
      FOREIGN KEY ("venta_id") 
      REFERENCES public."Venta"("id") 
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pago_venta ON public."Pago" ("venta_id");


-- -------------------------------------------------------------------------
-- 3. ACTUALIZACIÓN EN TABLA Venta (Asociar Cliente)
-- -------------------------------------------------------------------------
ALTER TABLE IF EXISTS public."Venta"
  ADD COLUMN IF NOT EXISTS "cliente_id" BIGINT;

-- Relación Foránea: Venta -> cliente
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_venta_cliente'
  ) THEN
    ALTER TABLE public."Venta" 
      ADD CONSTRAINT fk_venta_cliente 
      FOREIGN KEY ("cliente_id") 
      REFERENCES public.cliente("id") 
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_venta_cliente ON public."Venta" ("cliente_id");


-- -------------------------------------------------------------------------
-- 4. NUEVA TABLA: MovimientoStock (Registro de Altas, Bajas y Ajustes)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."MovimientoStock" (
  "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "producto_id" BIGINT NOT NULL,
  "tipo" TEXT NOT NULL CHECK ("tipo" IN ('ALTA', 'BAJA', 'AJUSTE', 'VENTA')),
  "cantidad" INT NOT NULL,
  "motivo" TEXT,
  "usuario_id" BIGINT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_movimiento_producto FOREIGN KEY ("producto_id") REFERENCES public."Producto"("id") ON DELETE CASCADE,
  CONSTRAINT fk_movimiento_usuario FOREIGN KEY ("usuario_id") REFERENCES public."Usuario"("id") ON DELETE SET NULL
);

-- Habilitar RLS en MovimientoStock
ALTER TABLE public."MovimientoStock" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movimientos_select_policy" ON public."MovimientoStock"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "movimientos_insert_policy" ON public."MovimientoStock"
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Índices de rendimiento para historial de stock
CREATE INDEX IF NOT EXISTS idx_movimiento_producto ON public."MovimientoStock" ("producto_id");
CREATE INDEX IF NOT EXISTS idx_movimiento_fecha ON public."MovimientoStock" ("created_at");
