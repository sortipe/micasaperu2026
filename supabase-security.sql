-- =====================================================
-- SEGURIDAD: Hardening de Supabase para Mi Casa Perú
-- Ejecutar en SQL Editor de Supabase Dashboard
-- No requiere tablas específicas (salta las que no existan)
-- =====================================================

-- 0. Helper: verificar si usuario es admin (debe crearse primero)
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND "role" IN ('ADMIN', 'ADMINISTRADOR')
  );
$$;

-- 1. RLS: Habilitar solo en tablas que existen
DO $d$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'properties', 'profiles', 'inquiries', 'transactions',
    'payment_methods', 'complaints', 'settings', 'locations',
    'packages', 'legal_documents', 'consent_logs', 'data_requests'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    END IF;
  END LOOP;
END;
$d$;

-- 2. Properties policies
DO $d$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties') THEN
    DROP POLICY IF EXISTS "Properties select anon" ON public.properties;
    CREATE POLICY "Properties select anon" ON public.properties
      FOR SELECT TO anon
      USING ("status" <> 'DRAFT');

    DROP POLICY IF EXISTS "Properties select auth" ON public.properties;
    CREATE POLICY "Properties select auth" ON public.properties
      FOR SELECT TO authenticated
      USING (true);

    DROP POLICY IF EXISTS "Properties insert" ON public.properties;
    CREATE POLICY "Properties insert" ON public.properties
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = "agentId");

    DROP POLICY IF EXISTS "Properties update" ON public.properties;
    CREATE POLICY "Properties update" ON public.properties
      FOR UPDATE TO authenticated
      USING (auth.uid() = "agentId" OR is_admin(auth.uid()));

    DROP POLICY IF EXISTS "Properties delete" ON public.properties;
    CREATE POLICY "Properties delete" ON public.properties
      FOR DELETE TO authenticated
      USING (auth.uid() = "agentId" OR is_admin(auth.uid()));
  END IF;
END;
$d$;

-- 3. Función paginada anti-scraping (max 100 registros)
CREATE OR REPLACE FUNCTION public.get_properties_paginated(
  page_size int DEFAULT 50,
  page_number int DEFAULT 1
)
RETURNS SETOF public.properties
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $f$
  SELECT * FROM public.properties
  WHERE "status" <> 'DRAFT'
  ORDER BY "publishedAt" DESC NULLS LAST
  LIMIT LEAST(page_size, 100)
  OFFSET (page_number - 1) * page_size;
$f$;

-- 4. Profiles policies
DO $d$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP POLICY IF EXISTS "Profiles select anon" ON public.profiles;
    CREATE POLICY "Profiles select anon" ON public.profiles
      FOR SELECT TO anon
      USING (false);

    DROP POLICY IF EXISTS "Profiles select auth" ON public.profiles;
    CREATE POLICY "Profiles select auth" ON public.profiles
      FOR SELECT TO authenticated
      USING (auth.uid() = id OR is_admin(auth.uid()));

    DROP POLICY IF EXISTS "Profiles insert" ON public.profiles;
    CREATE POLICY "Profiles insert" ON public.profiles
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = id);

    DROP POLICY IF EXISTS "Profiles update" ON public.profiles;
    CREATE POLICY "Profiles update" ON public.profiles
      FOR UPDATE TO authenticated
      USING (auth.uid() = id OR is_admin(auth.uid()));
  END IF;
END;
$d$;

-- 5. Vista pública de perfiles (solo nombre, avatar, fecha)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
  SELECT id, name, avatar, created_at
  FROM public.profiles;

-- 6. Inquiries: rate limiting (máx 5 por email por hora) + sanitización
CREATE OR REPLACE FUNCTION public.check_inquiry_rate_limit(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $f$
DECLARE
  recent_count int;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.inquiries
  WHERE "senderEmail" = p_email
    AND "date" > now() - interval '1 hour';
  RETURN recent_count < 5;
END;
$f$;

CREATE OR REPLACE FUNCTION public.validate_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $f$
BEGIN
  IF NOT check_inquiry_rate_limit(NEW."senderEmail") THEN
    RAISE EXCEPTION 'Demasiadas solicitudes. Intenta de nuevo en 1 hora.'
      USING HINT = 'Rate limit excedido para este email.';
  END IF;

  NEW."message" := regexp_replace(NEW."message", '<[^>]+>', '', 'g');
  NEW."senderName" := regexp_replace(NEW."senderName", '<[^>]+>', '', 'g');

  IF NEW."senderDni" IS NOT NULL AND length(NEW."senderDni") > 0
     AND NEW."senderDni" !~ '^\d{8}$' THEN
    RAISE EXCEPTION 'DNI inválido.'
      USING HINT = 'El DNI debe tener exactamente 8 dígitos.';
  END IF;

  RETURN NEW;
END;
$f$;

DO $d$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inquiries') THEN
    DROP TRIGGER IF EXISTS validate_inquiry_trigger ON public.inquiries;
    CREATE TRIGGER validate_inquiry_trigger
      BEFORE INSERT ON public.inquiries
      FOR EACH ROW
      EXECUTE FUNCTION public.validate_inquiry();
  END IF;
END;
$d$;

-- 7. Settings: lectura pública, modificación solo por admin
DO $d$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'settings') THEN
    DROP POLICY IF EXISTS "Settings select" ON public.settings;
    CREATE POLICY "Settings select" ON public.settings
      FOR SELECT TO public
      USING (true);

    DROP POLICY IF EXISTS "Settings insert" ON public.settings;
    CREATE POLICY "Settings insert" ON public.settings
      FOR INSERT TO authenticated
      WITH CHECK (is_admin(auth.uid()));

    DROP POLICY IF EXISTS "Settings update" ON public.settings;
    CREATE POLICY "Settings update" ON public.settings
      FOR UPDATE TO authenticated
      USING (is_admin(auth.uid()));
  END IF;
END;
$d$;

-- 8. Transactions: cada usuario ve solo las suyas (admin ve todas)
DO $d$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    DROP POLICY IF EXISTS "Transactions select" ON public.transactions;
    CREATE POLICY "Transactions select" ON public.transactions
      FOR SELECT TO authenticated
      USING (auth.uid() = "userId" OR is_admin(auth.uid()));
  END IF;
END;
$d$;

-- 9. Complaints policies
DO $d$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaints') THEN
    DROP POLICY IF EXISTS "Complaints insert" ON public.complaints;
    CREATE POLICY "Complaints insert" ON public.complaints
      FOR INSERT TO anon
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Complaints select" ON public.complaints;
    CREATE POLICY "Complaints select" ON public.complaints
      FOR SELECT TO authenticated
      USING (is_admin(auth.uid()));
  END IF;
END;
$d$;

-- 10. Complaints: rate limiting (máx 3 por email por hora) + sanitización
CREATE OR REPLACE FUNCTION public.check_complaint_rate_limit(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $f$
DECLARE
  recent_count int;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.complaints
  WHERE "claimantEmail" = p_email
    AND "date" > now() - interval '1 hour';
  RETURN recent_count < 3;
END;
$f$;

CREATE OR REPLACE FUNCTION public.validate_complaint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $f$
BEGIN
  IF NOT check_complaint_rate_limit(NEW."claimantEmail") THEN
    RAISE EXCEPTION 'Demasiadas solicitudes. Intenta de nuevo en 1 hora.'
      USING HINT = 'Rate limit excedido para este email.';
  END IF;

  NEW."detail" := regexp_replace(NEW."detail", '<[^>]+>', '', 'g');
  NEW."request" := regexp_replace(NEW."request", '<[^>]+>', '', 'g');
  NEW."claimantName" := regexp_replace(NEW."claimantName", '<[^>]+>', '', 'g');

  IF NEW."claimantDocNumber" IS NOT NULL AND length(NEW."claimantDocNumber") > 0
     AND NEW."claimantDocType" = 'DNI' AND NEW."claimantDocNumber" !~ '^\d{8}$' THEN
    RAISE EXCEPTION 'DNI inválido.'
      USING HINT = 'El DNI debe tener exactamente 8 dígitos.';
  END IF;

  RETURN NEW;
END;
$f$;

DO $d$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaints') THEN
    DROP TRIGGER IF EXISTS validate_complaint_trigger ON public.complaints;
    CREATE TRIGGER validate_complaint_trigger
      BEFORE INSERT ON public.complaints
      FOR EACH ROW
      EXECUTE FUNCTION public.validate_complaint();
  END IF;
END;
$d$;
