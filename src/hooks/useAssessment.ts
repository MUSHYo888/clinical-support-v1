
// ABOUTME: React Query hook for assessment workflow management
// ABOUTME: Handles assessment creation, updates, and data persistence
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AssessmentService } from '@/services/assessmentService';
import { Question, Answer } from '@/types/medical';
import { toast } from 'sonner';

export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, chiefComplaint }: { patientId: string; chiefComplaint: string }) =>
      AssessmentService.createAssessment(patientId, chiefComplaint),
    onSuccess: () => {
      toast.success('Assessment started');
    },
    onError: (error) => {
      console.error('Failed to create assessment:', error);
      toast.error('Failed to start assessment');
    },
  });
}

export function useUpdateAssessmentStep() {
  return useMutation({
    mutationFn: ({ assessmentId, step }: { assessmentId: string; step: number }) =>
      AssessmentService.updateAssessmentStep(assessmentId, step),
    onError: (error) => {
      console.error('Failed to update assessment step:', error);
    },
  });
}

export function useSaveQuestions() {
  return useMutation({
    mutationFn: ({ assessmentId, questions }: { assessmentId: string; questions: Question[] }) =>
      AssessmentService.saveQuestions(assessmentId, questions),
    onError: (error) => {
      console.error('Failed to save questions:', error);
      toast.error('Failed to save questions');
    },
  });
}

export function useSaveAnswer() {
  return useMutation({
    mutationFn: ({ assessmentId, questionId, answer }: { assessmentId: string; questionId: string; answer: Answer }) =>
      AssessmentService.saveAnswer(assessmentId, questionId, answer),
    onError: (error) => {
      console.error('Failed to save answer:', error);
    },
  });
}

export function useSaveROS() {
  return useMutation({
    mutationFn: ({ assessmentId, systemName, rosData }: { 
      assessmentId: string; 
      systemName: string; 
      rosData: { positive: string[]; negative: string[]; notes?: string } 
    }) => AssessmentService.saveReviewOfSystems(assessmentId, systemName, rosData),
    onError: (error) => {
      console.error('Failed to save ROS data:', error);
      toast.error('Failed to save review of systems');
    },
  });
}

export function useCompleteAssessment() {
  return useMutation({
    mutationFn: (assessmentId: string) => AssessmentService.completeAssessment(assessmentId),
    onSuccess: () => {
      toast.success('Assessment completed successfully');
    },
    onError: (error) => {
      console.error('Failed to complete assessment:', error);
      toast.error('Failed to complete assessment');
    },
  });
}
