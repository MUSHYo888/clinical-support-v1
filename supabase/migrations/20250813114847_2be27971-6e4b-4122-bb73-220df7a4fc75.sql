-- CRITICAL SECURITY FIX: Implement proper RLS policies for all medical data tables
-- This fixes the massive security vulnerability where all patient data was publicly accessible

-- 1. Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on patients" ON public.patients;
DROP POLICY IF EXISTS "Allow all operations on assessments" ON public.assessments;
DROP POLICY IF EXISTS "Allow all operations on answers" ON public.answers;
DROP POLICY IF EXISTS "Allow all operations on questions" ON public.questions;
DROP POLICY IF EXISTS "Allow all operations on review_of_systems" ON public.review_of_systems;
DROP POLICY IF EXISTS "Allow all operations on clinical_reports" ON public.clinical_reports;
DROP POLICY IF EXISTS "Allow all operations on soap_notes" ON public.soap_notes;
DROP POLICY IF EXISTS "Allow all operations on referral_letters" ON public.referral_letters;
DROP POLICY IF EXISTS "Allow all operations on differential_diagnoses" ON public.differential_diagnoses;
DROP POLICY IF EXISTS "Allow all operations on progress_notes" ON public.progress_notes;
DROP POLICY IF EXISTS "Allow all operations on report_templates" ON public.report_templates;

-- 2. Create secure RLS policies that require authentication for all medical tables

-- PATIENTS TABLE - Only authenticated users can access patient data
CREATE POLICY "Authenticated users can view patients"
ON public.patients
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ASSESSMENTS TABLE - Only authenticated users can access assessments
CREATE POLICY "Authenticated users can view assessments"
ON public.assessments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create assessments"
ON public.assessments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update assessments"
ON public.assessments
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ANSWERS TABLE - Only authenticated users can access patient answers
CREATE POLICY "Authenticated users can view answers"
ON public.answers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create answers"
ON public.answers
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update answers"
ON public.answers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- QUESTIONS TABLE - Only authenticated users can access questions
CREATE POLICY "Authenticated users can view questions"
ON public.questions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create questions"
ON public.questions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- REVIEW OF SYSTEMS TABLE - Only authenticated users can access symptom data
CREATE POLICY "Authenticated users can view review_of_systems"
ON public.review_of_systems
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create review_of_systems"
ON public.review_of_systems
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update review_of_systems"
ON public.review_of_systems
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- CLINICAL REPORTS TABLE - Only authenticated users can access clinical reports
CREATE POLICY "Authenticated users can view clinical_reports"
ON public.clinical_reports
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create clinical_reports"
ON public.clinical_reports
FOR INSERT
TO authenticated
WITH CHECK (true);

-- SOAP NOTES TABLE - Only authenticated users can access SOAP notes
CREATE POLICY "Authenticated users can view soap_notes"
ON public.soap_notes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create soap_notes"
ON public.soap_notes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update soap_notes"
ON public.soap_notes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- REFERRAL LETTERS TABLE - Only authenticated users can access referral letters
CREATE POLICY "Authenticated users can view referral_letters"
ON public.referral_letters
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create referral_letters"
ON public.referral_letters
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update referral_letters"
ON public.referral_letters
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DIFFERENTIAL DIAGNOSES TABLE - Only authenticated users can access diagnoses
CREATE POLICY "Authenticated users can view differential_diagnoses"
ON public.differential_diagnoses
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create differential_diagnoses"
ON public.differential_diagnoses
FOR INSERT
TO authenticated
WITH CHECK (true);

-- PROGRESS NOTES TABLE - Only authenticated users can access progress notes
CREATE POLICY "Authenticated users can view progress_notes"
ON public.progress_notes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create progress_notes"
ON public.progress_notes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update progress_notes"
ON public.progress_notes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- REPORT TEMPLATES TABLE - Only authenticated users can access templates
CREATE POLICY "Authenticated users can view report_templates"
ON public.report_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create report_templates"
ON public.report_templates
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update report_templates"
ON public.report_templates
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);