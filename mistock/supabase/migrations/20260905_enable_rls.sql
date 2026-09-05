-- ========================================================
-- SCRIPT DE ACTIVACIÓN Y CONFIGURACIÓN DE RLS PARA MISTOCK
-- Siguiendo las mejores prácticas de Supabase Postgres
-- ========================================================

-- --------------------------------------------------------
-- 1. TABLA: PROFILES (Perfiles de Usuarios)
-- --------------------------------------------------------
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Política de lectura: los usuarios autenticados pueden ver perfiles
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de modificación: un usuario solo modifica su propio perfil
CREATE POLICY "profiles_individual_policy"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);


-- --------------------------------------------------------
-- 2. TABLA: CATEGORIES (Categorías de Productos)
-- --------------------------------------------------------
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;

-- Lectura para todos los usuarios autenticados
CREATE POLICY "categories_select_policy"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Gestión para usuarios autenticados
CREATE POLICY "categories_manage_policy"
  ON public.categories
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);


-- --------------------------------------------------------
-- 3. TABLA: PRODUCTS (Inventario de Productos)
-- --------------------------------------------------------
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

-- Lectura para usuarios autenticados
CREATE POLICY "products_select_policy"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

-- Modificación/Creación para usuarios autenticados
CREATE POLICY "products_manage_policy"
  ON public.products
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);


-- --------------------------------------------------------
-- 4. TABLA: STOCK_MOVEMENTS (Historial de Entradas/Salidas)
-- --------------------------------------------------------
ALTER TABLE IF EXISTS public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Lectura para usuarios autenticados
CREATE POLICY "stock_movements_select_policy"
  ON public.stock_movements
  FOR SELECT
  TO authenticated
  USING (true);

-- Registro de movimientos por el usuario que realiza la acción
CREATE POLICY "stock_movements_insert_policy"
  ON public.stock_movements
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by);


-- --------------------------------------------------------
-- 5. ÍNDICES DE RENDIMIENTO PARA POLÍTICAS RLS
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products (created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON public.stock_movements (created_by);
