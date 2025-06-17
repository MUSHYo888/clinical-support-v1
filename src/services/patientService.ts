
// ABOUTME: Service for patient CRUD operations with Supabase
// ABOUTME: Handles creating, reading, updating and deleting patient records
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types/medical';

export class PatientService {
  static async createPatient(patientData: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        patient_id: patientData.patientId,
        location: patientData.location
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating patient:', error);
      throw new Error('Failed to create patient');
    }

    return {
      id: data.id,
      name: data.name,
      age: data.age,
      gender: data.gender as 'male' | 'female' | 'other',
      patientId: data.patient_id,
      location: data.location || '',
      createdAt: data.created_at,
      lastAssessment: data.last_assessment
    };
  }

  static async getAllPatients(): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching patients:', error);
      throw new Error('Failed to fetch patients');
    }

    return data.map(patient => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender as 'male' | 'female' | 'other',
      patientId: patient.patient_id,
      location: patient.location || '',
      createdAt: patient.created_at,
      lastAssessment: patient.last_assessment
    }));
  }

  static async getPatientById(id: string): Promise<Patient | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching patient:', error);
      throw new Error('Failed to fetch patient');
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      age: data.age,
      gender: data.gender as 'male' | 'female' | 'other',
      patientId: data.patient_id,
      location: data.location || '',
      createdAt: data.created_at,
      lastAssessment: data.last_assessment
    };
  }

  static async updateLastAssessment(patientId: string): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .update({ last_assessment: new Date().toISOString() })
      .eq('id', patientId);

    if (error) {
      console.error('Error updating patient last assessment:', error);
      throw new Error('Failed to update patient');
    }
  }
}
