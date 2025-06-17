
// ABOUTME: Service for assessment workflow operations with Supabase
// ABOUTME: Manages assessment lifecycle, questions, answers, and ROS data
import { supabase } from '@/integrations/supabase/client';
import { Assessment, Question, Answer, ReviewOfSystems } from '@/types/medical';

export class AssessmentService {
  static async createAssessment(patientId: string, chiefComplaint: string): Promise<Assessment> {
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        patient_id: patientId,
        chief_complaint: chiefComplaint,
        status: 'in-progress',
        current_step: 1
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assessment:', error);
      throw new Error('Failed to create assessment');
    }

    return {
      id: data.id,
      patientId: data.patient_id,
      chiefComplaint: data.chief_complaint,
      status: data.status as 'in-progress' | 'completed' | 'draft',
      currentStep: data.current_step,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  static async updateAssessmentStep(assessmentId: string, step: number): Promise<void> {
    const { error } = await supabase
      .from('assessments')
      .update({ current_step: step })
      .eq('id', assessmentId);

    if (error) {
      console.error('Error updating assessment step:', error);
      throw new Error('Failed to update assessment step');
    }
  }

  static async completeAssessment(assessmentId: string): Promise<void> {
    const { error } = await supabase
      .from('assessments')
      .update({ status: 'completed' })
      .eq('id', assessmentId);

    if (error) {
      console.error('Error completing assessment:', error);
      throw new Error('Failed to complete assessment');
    }
  }

  static async saveQuestions(assessmentId: string, questions: Question[]): Promise<void> {
    const questionsData = questions.map((q, index) => ({
      assessment_id: assessmentId,
      question_text: q.text,
      question_type: q.type,
      options: q.options || null,
      category: q.category,
      required: q.required,
      order_index: index
    }));

    const { error } = await supabase
      .from('questions')
      .insert(questionsData);

    if (error) {
      console.error('Error saving questions:', error);
      throw new Error('Failed to save questions');
    }
  }

  static async saveAnswer(assessmentId: string, questionId: string, answer: Answer): Promise<void> {
    const { error } = await supabase
      .from('answers')
      .upsert({
        assessment_id: assessmentId,
        question_id: questionId,
        answer_value: answer.value,
        notes: answer.notes
      });

    if (error) {
      console.error('Error saving answer:', error);
      throw new Error('Failed to save answer');
    }
  }

  static async saveReviewOfSystems(assessmentId: string, systemName: string, rosData: { positive: string[]; negative: string[]; notes?: string }): Promise<void> {
    const { error } = await supabase
      .from('review_of_systems')
      .upsert({
        assessment_id: assessmentId,
        system_name: systemName,
        positive_symptoms: rosData.positive,
        negative_symptoms: rosData.negative,
        notes: rosData.notes
      });

    if (error) {
      console.error('Error saving ROS data:', error);
      throw new Error('Failed to save review of systems');
    }
  }

  static async getAssessmentQuestions(assessmentId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('order_index');

    if (error) {
      console.error('Error fetching questions:', error);
      throw new Error('Failed to fetch questions');
    }

    return data.map(q => ({
      id: q.id,
      text: q.question_text,
      type: q.question_type as 'multiple-choice' | 'yes-no' | 'text' | 'scale',
      options: q.options as string[] | undefined,
      category: q.category,
      required: q.required
    }));
  }

  static async getAssessmentAnswers(assessmentId: string): Promise<Record<string, Answer>> {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (error) {
      console.error('Error fetching answers:', error);
      throw new Error('Failed to fetch answers');
    }

    const answers: Record<string, Answer> = {};
    data.forEach(answer => {
      answers[answer.question_id] = {
        questionId: answer.question_id,
        value: answer.answer_value,
        notes: answer.notes
      };
    });

    return answers;
  }
}
