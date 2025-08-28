-- Create healthcare provider profiles table for user organization and specialty tracking
CREATE TABLE public.healthcare_provider_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT,
  organization_id UUID,
  role TEXT DEFAULT 'provider',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on healthcare provider profiles
ALTER TABLE public.healthcare_provider_profiles ENABLE ROW LEVEL SECURITY;

-- Add user association and sharing fields to report_templates
ALTER TABLE public.report_templates 
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN organization_id UUID,
ADD COLUMN shared BOOLEAN NOT NULL DEFAULT false;

-- Create security definer functions for template access control
CREATE OR REPLACE FUNCTION public.user_can_access_template(template_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM report_templates rt
    LEFT JOIN healthcare_provider_profiles hpp_creator ON rt.created_by = hpp_creator.user_id
    LEFT JOIN healthcare_provider_profiles hpp_user ON hpp_user.user_id = auth.uid()
    WHERE rt.id = template_uuid 
    AND (
      -- User created the template
      rt.created_by = auth.uid()
      -- Default template accessible to all
      OR rt.default_template = true
      -- Shared template within same organization
      OR (rt.shared = true AND rt.organization_id = hpp_user.organization_id AND rt.organization_id IS NOT NULL)
      -- Shared template within same specialty
      OR (rt.shared = true AND rt.specialty = hpp_user.specialty AND rt.specialty IS NOT NULL)
      -- User has admin role in organization
      OR (hpp_user.role = 'admin' AND rt.organization_id = hpp_user.organization_id AND rt.organization_id IS NOT NULL)
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_modify_template(template_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM report_templates rt
    LEFT JOIN healthcare_provider_profiles hpp ON hpp.user_id = auth.uid()
    WHERE rt.id = template_uuid 
    AND (
      -- User created the template (and it's not a default template)
      (rt.created_by = auth.uid() AND rt.default_template = false)
      -- User has admin role in organization and template belongs to organization
      OR (hpp.role = 'admin' AND rt.organization_id = hpp.organization_id AND rt.organization_id IS NOT NULL)
    )
  );
$$;

-- Create trigger to update timestamps
CREATE TRIGGER update_healthcare_provider_profiles_updated_at
BEFORE UPDATE ON public.healthcare_provider_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop existing permissive RLS policies on report_templates
DROP POLICY IF EXISTS "Authenticated users can view report_templates" ON public.report_templates;
DROP POLICY IF EXISTS "Authenticated users can create report_templates" ON public.report_templates;
DROP POLICY IF EXISTS "Authenticated users can update report_templates" ON public.report_templates;

-- Create new granular RLS policies for report_templates
CREATE POLICY "Users can view accessible report_templates" 
ON public.report_templates 
FOR SELECT 
TO authenticated
USING (public.user_can_access_template(id));

CREATE POLICY "Users can create their own report_templates" 
ON public.report_templates 
FOR INSERT 
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update modifiable report_templates" 
ON public.report_templates 
FOR UPDATE 
TO authenticated
USING (public.user_can_modify_template(id))
WITH CHECK (public.user_can_modify_template(id));

-- Create RLS policies for healthcare_provider_profiles
CREATE POLICY "Users can view their own profile" 
ON public.healthcare_provider_profiles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own profile" 
ON public.healthcare_provider_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.healthcare_provider_profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Migrate existing data: mark all current templates as default templates
-- and set created_by to null to indicate system templates
UPDATE public.report_templates 
SET default_template = true, 
    created_by = NULL,
    shared = false
WHERE default_template = false;

-- Create index for better performance
CREATE INDEX idx_report_templates_created_by ON public.report_templates(created_by);
CREATE INDEX idx_report_templates_organization_id ON public.report_templates(organization_id);
CREATE INDEX idx_report_templates_specialty ON public.report_templates(specialty);
CREATE INDEX idx_healthcare_provider_profiles_user_id ON public.healthcare_provider_profiles(user_id);
CREATE INDEX idx_healthcare_provider_profiles_organization_id ON public.healthcare_provider_profiles(organization_id);