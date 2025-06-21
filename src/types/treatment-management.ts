
// ABOUTME: Type definitions for treatment and management recommendations system
// ABOUTME: Includes medication suggestions, treatment pathways, drug interactions, and discharge planning

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  brandName?: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'iv' | 'im' | 'topical' | 'inhaled' | 'sublingual' | 'rectal';
  duration: string;
  indication: string;
  category: 'antibiotic' | 'analgesic' | 'antihypertensive' | 'anticoagulant' | 'bronchodilator' | 'other';
  cost: 'low' | 'moderate' | 'high' | 'very-high';
  sideEffects: string[];
  contraindications: string[];
  monitoring: string[];
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  mechanism: string;
  clinicalEffect: string;
  management: string;
  alternatives?: string[];
}

export interface TreatmentPathway {
  pathwayId: string;
  condition: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  guidelineSource: string;
  firstLineTherapy: {
    medications: Medication[];
    nonPharmacological: string[];
    duration: string;
    monitoringRequired: string[];
    successCriteria: string[];
  };
  secondLineTherapy?: {
    medications: Medication[];
    nonPharmacological: string[];
    duration: string;
    escalationCriteria: string[];
  };
  specialistReferral?: {
    criteria: string[];
    urgency: 'routine' | 'urgent' | 'immediate';
    specialty: string;
  };
}

export interface DischargeInstruction {
  category: 'medication' | 'activity' | 'diet' | 'follow-up' | 'warning-signs' | 'lifestyle';
  instruction: string;
  importance: 'critical' | 'important' | 'routine';
  timeframe?: string;
}

export interface DischargePlan {
  planId: string;
  patientId: string;
  condition: string;
  dischargeReadiness: {
    clinicalStability: boolean;
    painControlled: boolean;
    ableToEat: boolean;
    mobilizing: boolean;
    socialSupport: boolean;
    followUpArranged: boolean;
  };
  medications: {
    continuing: Medication[];
    newPrescriptions: Medication[];
    discontinued: string[];
    changes: string[];
  };
  instructions: DischargeInstruction[];
  followUp: {
    primaryCare: {
      timeframe: string;
      purpose: string;
      urgency: 'routine' | 'urgent';
    };
    specialist?: {
      specialty: string;
      timeframe: string;
      purpose: string;
      urgency: 'routine' | 'urgent';
    };
    investigations?: string[];
  };
  warningSigns: string[];
  emergencyContact: string;
  estimatedRecoveryTime: string;
}

export interface MedicationSuggestion {
  medication: Medication;
  rationale: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  contraindicated: boolean;
  interactions: DrugInteraction[];
  alternatives: Medication[];
  monitoring: {
    parameters: string[];
    frequency: string;
    duration: string;
  };
}

export interface TreatmentRecommendation {
  condition: string;
  severity: string;
  medicationSuggestions: MedicationSuggestion[];
  treatmentPathway: TreatmentPathway;
  nonPharmacological: string[];
  lifestyle: string[];
  prognosis: {
    shortTerm: string;
    longTerm: string;
    factors: string[];
  };
  complications: {
    potential: string[];
    prevention: string[];
    monitoring: string[];
  };
}
