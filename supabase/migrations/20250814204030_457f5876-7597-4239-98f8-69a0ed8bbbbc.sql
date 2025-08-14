-- Add healthcare provider relationship to patients table (nullable for now)
ALTER TABLE public.patients 
ADD COLUMN healthcare_provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can create patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON public.patients;

-- Create secure RLS policies that only allow access to own patients
-- For existing patients without a healthcare_provider_id, they won't be visible until assigned
CREATE POLICY "Healthcare providers can view their own patients" 
ON public.patients 
FOR SELECT 
USING (healthcare_provider_id = auth.uid());

CREATE POLICY "Healthcare providers can create patients for themselves" 
ON public.patients 
FOR INSERT 
WITH CHECK (healthcare_provider_id = auth.uid());

CREATE POLICY "Healthcare providers can update their own patients" 
ON public.patients 
FOR UPDATE 
USING (healthcare_provider_id = auth.uid())
WITH CHECK (healthcare_provider_id = auth.uid());

-- Also secure related tables to ensure data integrity
DROP POLICY IF EXISTS "Authenticated users can view assessments" ON public.assessments;
DROP POLICY IF EXISTS "Authenticated users can create assessments" ON public.assessments;
DROP POLICY IF EXISTS "Authenticated users can update assessments" ON public.assessments;

-- Create secure assessment policies
CREATE POLICY "Healthcare providers can view assessments of their patients" 
ON public.assessments 
FOR SELECT 
USING (
  patient_id IN (
    SELECT id FROM public.patients 
    WHERE healthcare_provider_id = auth.uid()
  )
);

CREATE POLICY "Healthcare providers can create assessments for their patients" 
ON public.assessments 
FOR INSERT 
WITH CHECK (
  patient_id IN (
    SELECT id FROM public.patients 
    WHERE healthcare_provider_id = auth.uid()
  )
);

CREATE POLICY "Healthcare providers can update assessments of their patients" 
ON public.assessments 
FOR UPDATE 
USING (
  patient_id IN (
    SELECT id FROM public.patients 
    WHERE healthcare_provider_id = auth.uid()
  )
)
WITH CHECK (
  patient_id IN (
    SELECT id FROM public.patients 
    WHERE healthcare_provider_id = auth.uid()
  )
);