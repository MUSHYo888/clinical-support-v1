
-- Fix overly permissive SELECT policies that bypass scoped access
DROP POLICY IF EXISTS "Enable access for authenticated users only" ON public.past_medical_history;
DROP POLICY IF EXISTS "Enable access for authenticated users only" ON public.physical_examination;

-- Fix patients table: remove public-role policies, restrict to authenticated owner
DROP POLICY IF EXISTS "Users can create own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can view own patients" ON public.patients;

CREATE POLICY "Users can create own patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (healthcare_provider_id = auth.uid());

CREATE POLICY "Users can view own patients"
ON public.patients
FOR SELECT
TO authenticated
USING (healthcare_provider_id = auth.uid());

-- Lock down SECURITY DEFINER function: only allow authenticated role (RLS still works via policy evaluation)
REVOKE EXECUTE ON FUNCTION public.user_can_access_assessment(uuid) FROM PUBLIC, anon;

-- Set immutable search_path on update_updated_at_column (already set, but ensure user_can_access_assessment too)
ALTER FUNCTION public.user_can_access_assessment(uuid) SET search_path = public;

-- Add user_roles infrastructure for proper admin checks
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
