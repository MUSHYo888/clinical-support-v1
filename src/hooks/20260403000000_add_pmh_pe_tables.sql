-- Create Past Medical History table
CREATE TABLE public.past_medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  conditions jsonb DEFAULT '[]'::jsonb,
  surgeries jsonb DEFAULT '[]'::jsonb,
  medications jsonb DEFAULT '[]'::jsonb,
  allergies jsonb DEFAULT '[]'::jsonb,
  family_history text,
  social_history text,
  social_history_structured jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create Physical Examination table
CREATE TABLE public.physical_examination (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  vital_signs jsonb DEFAULT '{}'::jsonb,
  systems jsonb DEFAULT '{}'::jsonb,
  general_appearance text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add triggers for updated_at
CREATE TRIGGER update_pmh_updated_at
  BEFORE UPDATE ON public.past_medical_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pe_updated_at
  BEFORE UPDATE ON public.physical_examination
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.past_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_examination ENABLE ROW LEVEL SECURITY;

-- PMH RLS Policies
CREATE POLICY "Users can view own pmh" ON public.past_medical_history FOR SELECT TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own pmh" ON public.past_medical_history FOR INSERT TO authenticated WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own pmh" ON public.past_medical_history FOR UPDATE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own pmh" ON public.past_medical_history FOR DELETE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));

-- PE RLS Policies
CREATE POLICY "Users can view own pe" ON public.physical_examination FOR SELECT TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own pe" ON public.physical_examination FOR INSERT TO authenticated WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own pe" ON public.physical_examination FOR UPDATE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own pe" ON public.physical_examination FOR DELETE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));