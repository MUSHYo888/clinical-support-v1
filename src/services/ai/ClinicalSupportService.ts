
// ABOUTME: AI-powered clinical decision support service
// ABOUTME: Generates investigation recommendations, red flags, and clinical guidelines with retry logic

import { supabase } from '@/integrations/supabase/client';
import { withRetry } from '@/utils/withRetry';
import { DifferentialDiagnosis, Answer, ReviewOfSystems, ClinicalDecisionSupport } from '@/types/medical';

export class ClinicalSupportService {
  static async generateClinicalDecisionSupport(
    chiefComplaint: string,
    differentialDiagnoses: DifferentialDiagnosis[],
    answers: Record<string, Answer>,
    rosData?: ReviewOfSystems
  ): Promise<ClinicalDecisionSupport> {
    try {
      const result = await withRetry(async () => {
        
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: {
            action: 'generate-clinical-support',
            chiefComplaint,
            differentialDiagnoses,
            answers,
            rosData
          }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        if (!data?.clinicalSupport) throw new Error('Invalid response from AI service');

        return data.clinicalSupport as ClinicalDecisionSupport;
      }, 3, 1000);

      return result;
    } catch (error) {
      console.error('All retry attempts exhausted. Throwing error to trigger local clinical fallback protocols:', error);
      throw error;
    }
  }
}
