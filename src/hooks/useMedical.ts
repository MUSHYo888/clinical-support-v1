import { useContext } from 'react';
import { MedicalContext } from '@/context/MedicalContext';

export function useMedical() {
  const context = useContext(MedicalContext);
  if (context === undefined) {
    throw new Error('useMedical must be used within a MedicalProvider');
  }
  return context;
}