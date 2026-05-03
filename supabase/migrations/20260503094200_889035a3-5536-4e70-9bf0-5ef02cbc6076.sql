DROP POLICY IF EXISTS "Healthcare providers can modify PMH for their patients" ON public.past_medical_history;
DROP POLICY IF EXISTS "Healthcare providers can view PMH for their patients" ON public.past_medical_history;
DROP POLICY IF EXISTS "Healthcare providers can modify PE for their patients" ON public.physical_examination;
DROP POLICY IF EXISTS "Healthcare providers can view PE for their patients" ON public.physical_examination;

CREATE POLICY "Users can view own pmh" ON public.past_medical_history FOR SELECT TO authenticated USING (public.user_can_access_assessment(assessment_id));
CREATE POLICY "Users can insert own pmh" ON public.past_medical_history FOR INSERT TO authenticated WITH CHECK (public.user_can_access_assessment(assessment_id));
CREATE POLICY "Users can update own pmh" ON public.past_medical_history FOR UPDATE TO authenticated USING (public.user_can_access_assessment(assessment_id)) WITH CHECK (public.user_can_access_assessment(assessment_id));
CREATE POLICY "Users can delete own pmh" ON public.past_medical_history FOR DELETE TO authenticated USING (public.user_can_access_assessment(assessment_id));

CREATE POLICY "Users can view own pe" ON public.physical_examination FOR SELECT TO authenticated USING (public.user_can_access_assessment(assessment_id));
CREATE POLICY "Users can insert own pe" ON public.physical_examination FOR INSERT TO authenticated WITH CHECK (public.user_can_access_assessment(assessment_id));
CREATE POLICY "Users can update own pe" ON public.physical_examination FOR UPDATE TO authenticated USING (public.user_can_access_assessment(assessment_id)) WITH CHECK (public.user_can_access_assessment(assessment_id));
CREATE POLICY "Users can delete own pe" ON public.physical_examination FOR DELETE TO authenticated USING (public.user_can_access_assessment(assessment_id));