
// ABOUTME: AI-powered differential diagnosis generation service
// ABOUTME: Analyzes symptoms and generates ranked differential diagnoses with clinical reasoning

import { supabase } from '@/integrations/supabase/client';
import { DifferentialDiagnosis } from '@/types/medical';
import { FallbackDataService } from '../fallback/FallbackDataService';

export class DifferentialDiagnosisService {
  private static async makeRequestWithTimeout(
    chiefComplaint: string,
    answers: Record<string, any>,
    rosData?: Record<string, any>,
    timeoutMs: number = 15000
  ): Promise<any> {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout - AI service taking too long')), timeoutMs)
    );

    const requestPromise = supabase.functions.invoke('ai-assistant', {
      body: {
        action: 'generate-differential',
        chiefComplaint,
        answers,
        rosData
      }
    });

    return Promise.race([requestPromise, timeoutPromise]);
  }

  static async generateDifferentialDiagnosis(
    chiefComplaint: string,
    answers: Record<string, any>,
    rosData?: Record<string, any>
  ): Promise<DifferentialDiagnosis[]> {
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`DifferentialDiagnosisService: Attempt ${attempt + 1}/${maxRetries} - Generating differential diagnosis for: ${chiefComplaint}`);
        
        const { data, error } = await this.makeRequestWithTimeout(
          chiefComplaint,
          answers,
          rosData,
          15000 + (attempt * 5000) // Increase timeout on retries
        ) as any;

        if (error) {
          lastError = error;
          console.warn(`AI service error on attempt ${attempt + 1}: ${error.message}`);
          
          if (error.message?.includes('timeout') && attempt < maxRetries - 1) {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw error;
        }

        if (!data?.differentials) {
          throw new Error('Invalid response from AI service');
        }

        console.log(`DifferentialDiagnosisService: AI generated ${data.differentials.length} differential diagnoses on attempt ${attempt + 1}`);
        return data.differentials;

      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries - 1) {
          console.error('All retry attempts exhausted, using fallback differentials:', error);
          break;
        }
        
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Fallback after all retries
    console.log('DifferentialDiagnosisService: Falling back to mock differentials after failed retries');
    return FallbackDataService.getFallbackDifferentials(chiefComplaint);
  }
}
