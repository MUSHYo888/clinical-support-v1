-- Create past_medical_history table
CREATE TABLE public.past_medical_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE UNIQUE,
  conditions JSONB NOT NULL DEFAULT '[]',
  surgeries JSONB NOT NULL DEFAULT '[]',
  medications JSONB NOT NULL DEFAULT '[]',
  allergies JSONB NOT NULL DEFAULT '[]',
  family_history TEXT,
  social_history TEXT,
  social_history_structured JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create physical_examination table
CREATE TABLE public.physical_examination (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE UNIQUE,
  vital_signs JSONB NOT NULL DEFAULT '{}',
  systems JSONB NOT NULL DEFAULT '{}',
  general_appearance TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.past_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_examination ENABLE ROW LEVEL SECURITY;

-- RLS Policies for PMH
CREATE POLICY "Users can manage own pmh" ON public.past_medical_history FOR ALL TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid())) WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));

-- RLS Policies for PE
CREATE POLICY "Users can manage own pe" ON public.physical_examination FOR ALL TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid())) WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));

-- Update triggers
CREATE TRIGGER update_pmh_updated_at BEFORE UPDATE ON public.past_medical_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pe_updated_at BEFORE UPDATE ON public.physical_examination FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();