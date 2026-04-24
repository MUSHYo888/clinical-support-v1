
// ABOUTME: AI-powered differential diagnosis generation service
// ABOUTME: Analyzes symptoms and generates ranked differential diagnoses with retry logic

import { supabase } from '@/integrations/supabase/client';
import { DDxResponse } from '@/types/medical';
import { FallbackDataService } from '../fallback/FallbackDataService';
import { withRetry } from '@/utils/withRetry';

export class DifferentialDiagnosisService {
  static async generateDifferentialDiagnosis(
    chiefComplaint: string,
    answers: Record<string, any>,
    rosData?: Record<string, any>
  ): Promise<DDxResponse> {
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
        if (!data?.differentialDiagnoses && !data?.differentials) throw new Error('Invalid response from AI service');

        return {
          differentialDiagnoses: data.differentialDiagnoses || data.differentials || [],
          pertinentNegatives: data.pertinentNegatives || [],
          soapNote: data.soapNote || ''
        };
      }, 3, 1000);

      return result;
    } catch (error) {
      console.error('All retry attempts exhausted, using fallback differentials:', error);
      return {
        differentialDiagnoses: FallbackDataService.getFallbackDifferentials(chiefComplaint),
        pertinentNegatives: [],
        soapNote: ''
      };
    }
  }
}
