-- ============================================================================
-- SEED DE DATOS DE PRUEBA: RAMA PROFESORES-TEST (M.I STOCK)
-- ============================================================================

BEGIN;
SET LOCAL search_path TO public, auth, extensions;

-- 0. ASEGURAR COLUMNAS DE COMPATIBILIDAD EN TODAS LAS TABLAS
ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;
ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS stock_minimo integer NOT NULL DEFAULT 5;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;

-- 1. CREAR O ASEGURAR EL USUARIO "Vendedor 1"
DO $$
DECLARE
  v_email text := 'vendedor1@test.mistock';
  v_pass  text := 'Mistock2026!';
  v_nombre text := 'Vendedor 1';
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE lower(email) = lower(v_email);

  IF v_id IS NULL THEN
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
      crypt(v_pass, gen_salt('bf')),
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
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt(v_pass, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_id;
  END IF;

  INSERT INTO public.usuario (id_usuario, email, nombre, rol, activo)
  VALUES (v_id, v_email, v_nombre, 'vendedor'::public.user_rol, true)
  ON CONFLICT (id_usuario) DO UPDATE
    SET rol = 'vendedor'::public.user_rol,
        nombre = EXCLUDED.nombre,
        activo = true,
        actualizado_el = now();
END $$;

-- 2. INSERTAR CATEGORÍAS
INSERT INTO public.categorias (id_categoria, nombre, descripcion, activo)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Bebidas y Gaseosas', 'Gaseosas, aguas saborizadas y cervezas', true),
  ('a0000000-0000-0000-0000-000000000002', 'Snacks y Golosinas', 'Galletitas, alfajores, papas y confituras', true),
  ('a0000000-0000-0000-0000-000000000003', 'Almacén y Comestibles', 'Fideos, aceites, arroz y conservas', true),
  ('a0000000-0000-0000-0000-000000000004', 'Lácteos y Refrigerados', 'Leches, quesos, yogures y fiambres', true),
  ('a0000000-0000-0000-0000-000000000005', 'Limpieza y Bazar', 'Artículos para el hogar y cuidado personal', true)
ON CONFLICT (nombre) DO UPDATE
  SET descripcion = EXCLUDED.descripcion,
      activo = true;

-- 3. INSERTAR PRODUCTOS
INSERT INTO public.productos (
  id_producto, id_categoria, nombre, descripcion, sku,
  precio_costo, precio_venta, stock_actual, stock_minimo,
  unidad_medida, oferta, activo
)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Coca Cola 1.5L', 'Gaseosa sabor original botella 1.5 litros', 'BEB-001', 1200.00, 2200.00, 45, 10, 'unidad', false, true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Agua Mineral Villavicencio 2L', 'Agua pura de manantial sin gas', 'BEB-002', 600.00, 1100.00, 60, 15, 'unidad', false, true),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Cerveza Quilmes Clásica 1L', 'Cerveza rubia tradicional botella retornable', 'BEB-003', 1400.00, 2500.00, 40, 8, 'unidad', false, true),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Galletitas Chocolinas 250g', 'Galletitas de chocolate clásicas para chocotorta', 'SNA-001', 800.00, 1500.00, 35, 10, 'paquete', false, true),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Alfajor Havanna Chocolate Mixto', 'Alfajor relleno con abundante dulce de leche', 'SNA-002', 950.00, 1800.00, 30, 5, 'unidad', true, true),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'Papas Fritas Lay''s Clásicas 150g', 'Papas crujientes saladas paquete familiar', 'SNA-003', 1100.00, 2100.00, 28, 6, 'paquete', false, true),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'Fideos Tallarines Matarazzo 500g', 'Pasta seca al huevo calidad premium', 'ALM-001', 750.00, 1400.00, 50, 12, 'paquete', false, true),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'Aceite de Girasol Natura 900ml', 'Aceite refinado puro 100% girasol', 'ALM-002', 1300.00, 2400.00, 25, 5, 'unidad', false, true),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000004', 'Leche Entera La Serenísima 1L', 'Leche ultrapasteurizada en sachet con vitaminas', 'LAC-001', 850.00, 1450.00, 30, 8, 'litro', false, true),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000005', 'Detergente Magistral Limón 500ml', 'Ultra concentrado desengrasante rinde x5', 'LIM-002', 1200.00, 2300.00, 6, 8, 'unidad', false, true)
ON CONFLICT (sku) DO UPDATE
  SET nombre = EXCLUDED.nombre,
      precio_costo = EXCLUDED.precio_costo,
      precio_venta = EXCLUDED.precio_venta,
      stock_actual = EXCLUDED.stock_actual,
      stock_minimo = EXCLUDED.stock_minimo,
      activo = true;

-- 4. INSERTAR VENTAS DE PRUEBA ASOCIADAS A "Vendedor 1"
DO $$
DECLARE
  v_cajero_id uuid;
  v_v1 uuid := 'c0000000-0000-0000-0000-000000000001';
  v_v2 uuid := 'c0000000-0000-0000-0000-000000000002';
  v_v3 uuid := 'c0000000-0000-0000-0000-000000000003';
  v_v4 uuid := 'c0000000-0000-0000-0000-000000000004';
  v_v5 uuid := 'c0000000-0000-0000-0000-000000000005';
  v_v6 uuid := 'c0000000-0000-0000-0000-000000000006';
  v_v7 uuid := 'c0000000-0000-0000-0000-000000000007';
  v_v8 uuid := 'c0000000-0000-0000-0000-000000000008';
BEGIN
  SELECT id_usuario INTO v_cajero_id 
  FROM public.usuario 
  WHERE email = 'vendedor1@test.mistock';

  IF v_cajero_id IS NULL THEN
    SELECT id_usuario INTO v_cajero_id FROM public.usuario LIMIT 1;
  END IF;

  -- VENTA 1: Hoy (Hace 1 hora) -> Total $6.200,00 | Pago: Efectivo
  INSERT INTO public.ventas (id_venta, id_usuario, total, estado, creado_el)
  VALUES (v_v1, v_cajero_id, 6200.00, 'completada', now() - interval '1 hour')
  ON CONFLICT (id_venta) DO NOTHING;

  INSERT INTO public.detalle_ventas (id_venta, id_producto, cantidad, precio_unitario) VALUES
    (v_v1, 'b0000000-0000-0000-0000-000000000001', 2, 2200.00),
    (v_v1, 'b0000000-0000-0000-0000-000000000005', 1, 1800.00)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.pagos (id_venta, metodo, total, creado_el)
  VALUES (v_v1, 'efectivo', 6200.00, now() - interval '1 hour')
  ON CONFLICT DO NOTHING;

  -- VENTA 2: Hoy (Hace 3 horas) -> Total $5.100,00 | Pago: Mercado Pago
  INSERT INTO public.ventas (id_venta, id_usuario, total, estado, creado_el)
  VALUES (v_v2, v_cajero_id, 5100.00, 'completada', now() - interval '3 hours')
  ON CONFLICT (id_venta) DO NOTHING;

  INSERT INTO public.detalle_ventas (id_venta, id_producto, cantidad, precio_unitario) VALUES
    (v_v2, 'b0000000-0000-0000-0000-000000000004', 2, 1500.00),
    (v_v2, 'b0000000-0000-0000-0000-000000000006', 1, 2100.00)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.pagos (id_venta, metodo, total, creado_el)
  VALUES (v_v2, 'mercado_pago', 5100.00, now() - interval '3 hours')
  ON CONFLICT DO NOTHING;

  -- VENTA 3: Ayer -> Total $6.600,00 | Pago: Débito
  INSERT INTO public.ventas (id_venta, id_usuario, total, estado, creado_el)
  VALUES (v_v3, v_cajero_id, 6600.00, 'completada', now() - interval '1 day' + interval '2 hours')
  ON CONFLICT (id_venta) DO NOTHING;

  INSERT INTO public.detalle_ventas (id_venta, id_producto, cantidad, precio_unitario) VALUES
    (v_v3, 'b0000000-0000-0000-0000-000000000008', 1, 2400.00),
    (v_v3, 'b0000000-0000-0000-0000-000000000007', 3, 1400.00)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.pagos (id_venta, metodo, total, creado_el)
  VALUES (v_v3, 'tarjeta_debito', 6600.00, now() - interval '1 day' + interval '2 hours')
  ON CONFLICT DO NOTHING;

  -- VENTA 4: Hace 2 días -> Total $14.200,00 | Pago: Crédito
  INSERT INTO public.ventas (id_venta, id_usuario, total, estado, creado_el)
  VALUES (v_v4, v_cajero_id, 14200.00, 'completada', now() - interval '2 days' + interval '4 hours')
  ON CONFLICT (id_venta) DO NOTHING;

  INSERT INTO public.detalle_ventas (id_venta, id_producto, cantidad, precio_unitario) VALUES
    (v_v4, 'b0000000-0000-0000-0000-000000000003', 4, 2500.00),
    (v_v4, 'b0000000-0000-0000-0000-000000000006', 2, 2100.00)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.pagos (id_venta, metodo, total, creado_el)
  VALUES (v_v4, 'tarjeta_credito', 14200.00, now() - interval '2 days' + interval '4 hours')
  ON CONFLICT DO NOTHING;

  -- VENTA 5: Hace 4 días -> Total $7.350,00 | Pago: Transferencia
  INSERT INTO public.ventas (id_venta, id_usuario, total, estado, creado_el)
  VALUES (v_v5, v_cajero_id, 7350.00, 'completada', now() - interval '4 days' + interval '1 hour')
  ON CONFLICT (id_venta) DO NOTHING;

  INSERT INTO public.detalle_ventas (id_venta, id_producto, cantidad, precio_unitario) VALUES
    (v_v5, 'b0000000-0000-0000-0000-000000000009', 3, 1450.00),
    (v_v5, 'b0000000-0000-0000-0000-000000000004', 2, 1500.00)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.pagos (id_venta, metodo, total, creado_el)
  VALUES (v_v5, 'transferencia', 7350.00, now() - interval '4 days' + interval '1 hour')
  ON CONFLICT DO NOTHING;

  -- VENTA 6: Hace 6 días -> Total $15.200,00 | Pago Split: Efectivo + Débito
  INSERT INTO public.ventas (id_venta, id_usuario, total, estado, creado_el)
  VALUES (v_v6, v_cajero_id, 15200.00, 'completada', now() - interval '6 days' + interval '5 hours')
  ON CONFLICT (id_venta) DO NOTHING;

  INSERT INTO public.detalle_ventas (id_venta, id_producto, cantidad, precio_unitario) VALUES
    (v_v6, 'b0000000-0000-0000-0000-000000000001', 3, 2200.00),
    (v_v6, 'b0000000-0000-0000-0000-000000000003', 2, 2500.00),
    (v_v6, 'b0000000-0000-0000-0000-000000000005', 2, 1800.00)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.pagos (id_venta, metodo, total, creado_el) VALUES
    (v_v6, 'efectivo', 10000.00, now() - interval '6 days' + interval '5 hours'),
    (v_v6, 'tarjeta_debito', 5200.00, now() - interval '6 days' + interval '5 hours')
  ON CONFLICT DO NOTHING;

  -- VENTA 7: Hace 10 días -> Total $9.500,00 | Pago: Débito
  INSERT INTO public.ventas (id_venta, id_usuario, total, estado, creado_el)
  VALUES (v_v7, v_cajero_id, 9500.00, 'completada', now() - interval '10 days')
  ON CONFLICT (id_venta) DO NOTHING;

  INSERT INTO public.detalle_ventas (id_venta, id_producto, cantidad, precio_unitario) VALUES
    (v_v7, 'b0000000-0000-0000-0000-000000000002', 4, 1100.00),
    (v_v7, 'b0000000-0000-0000-0000-000000000007', 2, 1400.00),
    (v_v7, 'b0000000-0000-0000-0000-000000000010', 1, 2300.00)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.pagos (id_venta, metodo, total, creado_el)
  VALUES (v_v7, 'tarjeta_debito', 9500.00, now() - interval '10 days')
  ON CONFLICT DO NOTHING;

  -- VENTA 8: Hace 18 días -> Total $15.100,00 | Pago: Efectivo
  INSERT INTO public.ventas (id_venta, id_usuario, total, estado, creado_el)
  VALUES (v_v8, v_cajero_id, 15100.00, 'completada', now() - interval '18 days')
  ON CONFLICT (id_venta) DO NOTHING;

  INSERT INTO public.detalle_ventas (id_venta, id_producto, cantidad, precio_unitario) VALUES
    (v_v8, 'b0000000-0000-0000-0000-000000000001', 4, 2200.00),
    (v_v8, 'b0000000-0000-0000-0000-000000000006', 3, 2100.00)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.pagos (id_venta, metodo, total, creado_el)
  VALUES (v_v8, 'efectivo', 15100.00, now() - interval '18 days')
  ON CONFLICT DO NOTHING;

END $$;

COMMIT;
