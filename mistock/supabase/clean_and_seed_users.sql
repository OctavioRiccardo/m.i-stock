-- ============================================================================
-- SCRIPT DE LIMPIEZA Y REINICIO DE CUENTAS EN SUPABASE (miStock)
-- ============================================================================
-- Propósito:
-- 1. Eliminar sesiones, identidades y usuarios previos en Supabase Auth y public.usuario.
-- 2. Crear 2 nuevas cuentas limpias con contraseñas encriptadas en bcrypt (pgcrypto):
--    - admin@admin.com (password: admin123) -> Rol: 'admin' (Acceso total /admin)
--    - user@user.com   (password: user123)  -> Rol: 'vendedor' (Caja y POS /dashboard)
-- ============================================================================

-- Asegurar disponibilidad de extensiones criptográficas
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Asegurar que el search_path incluya extensions, public y auth
SET search_path = public, auth, extensions;

DO $$
DECLARE
  v_admin_id uuid := gen_random_uuid();
  v_user_id  uuid := gen_random_uuid();
BEGIN
  -- --------------------------------------------------------------------------
  -- 1. LIMPIEZA DE CUENTAS PREVIAS
  -- --------------------------------------------------------------------------
  -- Eliminar tokens de refresco y sesiones activas
  DELETE FROM auth.refresh_tokens;
  DELETE FROM auth.sessions;

  -- Eliminar identidades vinculadas
  DELETE FROM auth.identities;

  -- Eliminar perfiles en la tabla pública de la app
  DELETE FROM public.usuario;

  -- Eliminar usuarios raíz de Supabase Auth
  DELETE FROM auth.users;

  -- --------------------------------------------------------------------------
  -- 2. CREACIÓN DE CUENTA ADMINISTRADOR: admin@admin.com / admin123
  -- --------------------------------------------------------------------------
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_admin_id,
    'authenticated',
    'authenticated',
    'admin@admin.com',
    extensions.crypt('admin123', extensions.gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Administrador General", "name": "Administrador"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    false
  );

  -- Identidad de auth para admin@admin.com (Requerido por Supabase GoTrue para login)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_admin_id::text,
    v_admin_id,
    format('{"sub":"%s","email":"%s"}', v_admin_id, 'admin@admin.com')::jsonb,
    'email',
    v_admin_id::text,
    now(),
    now(),
    now()
  );

  -- --------------------------------------------------------------------------
  -- 3. CREACIÓN DE CUENTA VENDEDOR / POS: user@user.com / user123
  -- --------------------------------------------------------------------------
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'user@user.com',
    extensions.crypt('user123', extensions.gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Operador Mostrador", "name": "Usuario POS"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    false
  );

  -- Identidad de auth para user@user.com
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id::text,
    v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id, 'user@user.com')::jsonb,
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  -- --------------------------------------------------------------------------
  -- 4. REGISTRO EN public.usuario CON SUS ROLES COMERCIALES
  -- --------------------------------------------------------------------------
  INSERT INTO public.usuario (id_usuario, email, nombre, rol, creado_el, actualizado_el)
  VALUES 
    (v_admin_id, 'admin@admin.com', 'Administrador General', 'admin'::public.user_rol, now(), now()),
    (v_user_id, 'user@user.com', 'Operador Mostrador', 'vendedor'::public.user_rol, now(), now())
  ON CONFLICT (id_usuario) DO UPDATE
  SET 
    email = EXCLUDED.email,
    nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol,
    actualizado_el = now();

END $$;

-- ----------------------------------------------------------------------------
-- 5. VERIFICACIÓN FINAL (Comprueba los usuarios y roles registrados)
-- ----------------------------------------------------------------------------
SELECT 
  u.id_usuario,
  u.email,
  u.nombre,
  u.rol,
  au.encrypted_password IS NOT NULL AS tiene_password,
  au.email_confirmed_at IS NOT NULL AS email_confirmado,
  i.id AS id_identidad
FROM public.usuario u
JOIN auth.users au ON au.id = u.id_usuario
LEFT JOIN auth.identities i ON i.user_id = u.id_usuario;
