
// ABOUTME: AI-powered differential diagnosis generation service
// ABOUTME: Analyzes symptoms and generates ranked differential diagnoses with clinical reasoning

import { supabase } from '@/integrations/supabase/client';
import { DifferentialDiagnosis } from '@/types/medical';
import { FallbackDataService } from '../fallback/FallbackDataService';

export class DifferentialDiagnosisService {
  static async generateDifferentialDiagnosis(
    chiefComplaint: string,
    answers: Record<string, any>,
    rosData?: Record<string, any>
  ): Promise<DifferentialDiagnosis[]> {
    try {
      console.log(`DifferentialDiagnosisService: Generating differential diagnosis for: ${chiefComplaint}`);
      
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'generate-differential',
          chiefComplaint,
          answers,
          rosData
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!data?.differentials) {
        throw new Error('Invalid response from AI service');
      }

      console.log(`DifferentialDiagnosisService: AI generated ${data.differentials.length} differential diagnoses`);
      return data.differentials;

    } catch (error) {
      console.error('Error generating AI differential diagnosis:', error);
      console.log('DifferentialDiagnosisService: Falling back to mock differentials');
      
      return FallbackDataService.getFallbackDifferentials(chiefComplaint);
    }
  }
}
