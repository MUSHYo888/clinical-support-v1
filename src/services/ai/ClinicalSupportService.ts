
// ABOUTME: AI-powered clinical decision support service
// ABOUTME: Generates investigation recommendations, red flags, and clinical guidelines

import { supabase } from '@/integrations/supabase/client';
import { FallbackDataService } from '../fallback/FallbackDataService';

export class ClinicalSupportService {
  private static async makeRequestWithTimeout(
    chiefComplaint: string,
    differentialDiagnoses: any[],
    answers: Record<string, any>,
    rosData?: Record<string, any>,
    timeoutMs: number = 15000
  ): Promise<any> {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout - AI service taking too long')), timeoutMs)
    );

    const requestPromise = supabase.functions.invoke('ai-assistant', {
      body: {
        action: 'generate-clinical-support',
        chiefComplaint,
        differentialDiagnoses,
        answers,
        rosData
      }
    });

    return Promise.race([requestPromise, timeoutPromise]);
  }

  static async generateClinicalDecisionSupport(
    chiefComplaint: string,
    differentialDiagnoses: any[],
    answers: Record<string, any>,
    rosData?: Record<string, any>
  ): Promise<any> {
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`ClinicalSupportService: Attempt ${attempt + 1}/${maxRetries} - Generating clinical decision support for: ${chiefComplaint}`);
        
        const { data, error } = await this.makeRequestWithTimeout(
          chiefComplaint,
          differentialDiagnoses,
          answers,
          rosData,
          15000 + (attempt * 5000) // Increase timeout on retries
        ) as any;

        if (error) {
          lastError = error;
          console.warn(`AI service error on attempt ${attempt + 1}: ${error.message}`);
          
          // Don't retry on certain errors
          if (error.message?.includes('timeout')) {
            // Wait before retry with exponential backoff
            if (attempt < maxRetries - 1) {
              const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
              console.log(`Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }
          throw error;
        }

        if (!data?.clinicalSupport) {
          console.warn('No clinical support data received');
          throw new Error('Invalid response from AI service');
        }

        console.log(`ClinicalSupportService: Successfully generated clinical decision support on attempt ${attempt + 1}`);
        return data.clinicalSupport;

      } catch (error) {
        lastError = error;
        
        // On last attempt, fall through to fallback
        if (attempt === maxRetries - 1) {
          console.warn('All retry attempts exhausted, using evidence-based protocols:', error);
          break;
        }
        
        // Wait before retry
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Fallback after all retries
    console.log('ClinicalSupportService: Using fallback clinical protocols after failed retries');
    
    return {
      investigations: FallbackDataService.getFallbackInvestigations(chiefComplaint),
      redFlags: FallbackDataService.getFallbackRedFlags(chiefComplaint),
      guidelines: FallbackDataService.getFallbackGuidelines(chiefComplaint),
      treatmentRecommendations: [],
      followUpRecommendations: [],
      _fallbackMode: true,
      _lastError: lastError?.message || 'AI service unavailable'
    };
  }
}
