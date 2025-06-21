
// ABOUTME: AI-powered question generation service
// ABOUTME: Handles intelligent question generation based on chief complaints and previous answers

import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/medical';
import { FallbackDataService } from '../fallback/FallbackDataService';

export class QuestionGeneratorService {
  static async generateQuestions(
    chiefComplaint: string,
    previousAnswers?: Record<string, any>
  ): Promise<Question[]> {
    try {
      console.log(`QuestionGeneratorService: Generating questions for: "${chiefComplaint}"`);
      
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'generate-questions',
          chiefComplaint,
          previousAnswers
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!data?.questions) {
        console.error('Invalid response from AI service:', data);
        throw new Error('Invalid response from AI service');
      }

      console.log(`QuestionGeneratorService: Successfully generated ${data.questions.length} AI questions`);
      return data.questions;

    } catch (error) {
      console.error('Error generating AI questions:', error);
      console.log('QuestionGeneratorService: Falling back to predefined questions');
      
      return FallbackDataService.getFallbackQuestions(chiefComplaint);
    }
  }
}
