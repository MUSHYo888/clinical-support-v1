
// ABOUTME: AI-powered differential diagnosis generation service
// ABOUTME: Analyzes symptoms and generates ranked differential diagnoses with retry logic

import { supabase } from '@/integrations/supabase/client';
import { DifferentialDiagnosis } from '@/types/medical';
import { FallbackDataService } from '../fallback/FallbackDataService';
import { withRetry } from '@/utils/withRetry';

export class DifferentialDiagnosisService {
  static async generateDifferentialDiagnosis(
    chiefComplaint: string,
    answers: Record<string, any>,
    rosData?: Record<string, any>
  ): Promise<DifferentialDiagnosis[]> {
    try {
      const result = await withRetry(async () => {
        
        const { data, error } = await supabase.functions.invoke('differential-diagnosis', {
          body: {
            chiefComplaint,
            answers,
            rosData
          }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        if (!data?.differentialDiagnoses) throw new Error('Invalid response from AI service');

        return data.differentialDiagnoses;
      }, 3, 1000);

      return result;
    } catch (error) {
      console.error('All retry attempts exhausted, using fallback differentials:', error);
      return FallbackDataService.getFallbackDifferentials(chiefComplaint);
    }
  }
}
