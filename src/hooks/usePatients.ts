
// ABOUTME: React Query hook for patient data management
// ABOUTME: Provides CRUD operations for patients with caching and real-time updates
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PatientService } from '@/services/patientService';
import { Patient } from '@/types/medical';
import { toast } from 'sonner';

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: PatientService.getAllPatients,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => PatientService.getPatientById(id),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientData: Omit<Patient, 'id' | 'createdAt'>) =>
      PatientService.createPatient(patientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient created successfully');
    },
    onError: (error) => {
      console.error('Failed to create patient:', error);
      toast.error('Failed to create patient');
    },
  });
}

export function useUpdatePatientAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientId: string) => PatientService.updateLastAssessment(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: (error) => {
      console.error('Failed to update patient assessment:', error);
    },
  });
}
