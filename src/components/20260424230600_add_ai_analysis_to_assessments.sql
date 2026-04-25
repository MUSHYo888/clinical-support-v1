-- Add ai_analysis JSONB column to assessments table
ALTER TABLE public.assessments 
ADD COLUMN ai_analysis JSONB DEFAULT '{}'::jsonb;