-- Add phase and clinical priority fields to questions table
ALTER TABLE public.questions 
ADD COLUMN phase integer DEFAULT 1 NOT NULL CHECK (phase IN (1, 2)),
ADD COLUMN clinical_priority integer DEFAULT 1 CHECK (clinical_priority >= 1 AND clinical_priority <= 5),
ADD COLUMN red_flag_indicator boolean DEFAULT false NOT NULL,
ADD COLUMN question_rationale text,
ADD COLUMN follow_up_trigger text;

-- Add index for efficient phase queries
CREATE INDEX idx_questions_phase ON public.questions(assessment_id, phase);

-- Add comment for documentation
COMMENT ON COLUMN public.questions.phase IS 'Phase 1: Template-based clinical questions, Phase 2: AI-generated adaptive questions';
COMMENT ON COLUMN public.questions.clinical_priority IS 'Clinical priority level 1-5, where 1 is highest priority';
COMMENT ON COLUMN public.questions.red_flag_indicator IS 'Indicates if this question screens for red flag symptoms';
COMMENT ON COLUMN public.questions.question_rationale IS 'Clinical rationale for why this question is important';
COMMENT ON COLUMN public.questions.follow_up_trigger IS 'Condition that triggered this question in Phase 2';

-- Create phase_answers table to track phase completion
CREATE TABLE public.phase_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid NOT NULL,
  phase integer NOT NULL CHECK (phase IN (1, 2)),
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  phase_summary jsonb,
  red_flags_identified jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for phase_answers
ALTER TABLE public.phase_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for phase_answers
CREATE POLICY "Healthcare providers can view phase_answers for their patients" 
ON public.phase_answers 
FOR SELECT 
USING (user_can_access_assessment(assessment_id));

CREATE POLICY "Healthcare providers can create phase_answers for their patients" 
ON public.phase_answers 
FOR INSERT 
WITH CHECK (user_can_access_assessment(assessment_id));

CREATE POLICY "Healthcare providers can update phase_answers for their patients" 
ON public.phase_answers 
FOR UPDATE 
USING (user_can_access_assessment(assessment_id))
WITH CHECK (user_can_access_assessment(assessment_id));