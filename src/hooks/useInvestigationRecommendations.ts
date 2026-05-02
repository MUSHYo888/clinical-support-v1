
// ABOUTME: Enhanced hook for investigation recommendations with fallback support
// ABOUTME: Provides AI-powered recommendations with graceful degradation to clinical protocols

import { useState, useEffect, useCallback, useRef } from 'react';
import { InvestigationRecommendation, RedFlag, ClinicalGuideline, DifferentialDiagnosis, Answer, ReviewOfSystems } from '@/types/medical';
import { AIService } from '@/services/aiService';
import { EnhancedInvestigationService } from '@/services/investigation/EnhancedInvestigationService';

interface UseInvestigationRecommendationsResult {
  recommendations: InvestigationRecommendation[];
  redFlags: RedFlag[];
  guidelines: ClinicalGuideline[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useInvestigationRecommendations(
  chiefComplaint: string,
  differentialDiagnoses: DifferentialDiagnosis[],
  answers: Record<string, Answer>,
  rosData: ReviewOfSystems
): UseInvestigationRecommendationsResult {
  const [recommendations, setRecommendations] = useState<InvestigationRecommendation[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [guidelines, setGuidelines] = useState<ClinicalGuideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use refs to avoid continuous re-renders from new object references
  const diffsRef = useRef(differentialDiagnoses);
  const answersRef = useRef(answers);
  const rosDataRef = useRef(rosData);

  useEffect(() => {
    diffsRef.current = differentialDiagnoses;
    answersRef.current = answers;
    rosDataRef.current = rosData;
  }, [differentialDiagnoses, answers, rosData]);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      // Try AI service first
      try {
        const clinicalSupport = await AIService.generateClinicalDecisionSupport(
          chiefComplaint,
          diffsRef.current,
          answersRef.current,
          rosDataRef.current
        );
        
        setRecommendations(clinicalSupport.investigations || []);
        setRedFlags(clinicalSupport.redFlags || []);
        setGuidelines(clinicalSupport.guidelines || []);
        
      } catch {
        
        // Fallback to enhanced investigation service
        const protocolRecommendations = EnhancedInvestigationService.generateSmartRecommendations(
          chiefComplaint,
          { answers: answersRef.current, rosData: rosDataRef.current }
        );
        
        setRecommendations(protocolRecommendations);
        setRedFlags(generateProtocolRedFlags(chiefComplaint));
        setGuidelines(generateProtocolGuidelines(chiefComplaint));
        
        setError('AI service temporarily unavailable. Using evidence-based clinical protocols.');
      }
    } catch (err) {
      console.error('Failed to generate any recommendations:', err);
      setError('Failed to generate investigation recommendations');
      
      // Final fallback - basic recommendations
      setRecommendations(getBasicRecommendations());
      setRedFlags([]);
      setGuidelines([]);
    } finally {
      setLoading(false);
    }
  }, [chiefComplaint]);

  useEffect(() => {
    if (chiefComplaint) {
      fetchRecommendations();
    }
  }, [chiefComplaint, fetchRecommendations]);

  return {
    recommendations,
    redFlags,
    guidelines,
    loading,
    error,
    refetch: fetchRecommendations
  };
}

// Helper functions for fallback recommendations
function generateProtocolRedFlags(chiefComplaint: string): RedFlag[] {
  const redFlags: RedFlag[] = [];
  const complaint = chiefComplaint.toLowerCase();
  
  if (complaint.includes('chest pain')) {
    redFlags.push({
      condition: 'Acute Coronary Syndrome Risk',
      severity: 'high',
      description: 'Chest pain requires urgent cardiac evaluation',
      immediateActions: ['ECG within 10 minutes', 'Troponin measurement', 'Cardiac monitoring']
    });
  }
  
  if (complaint.includes('shortness') || complaint.includes('breathless')) {
    redFlags.push({
      condition: 'Respiratory Distress',
      severity: 'high', 
      description: 'Shortness of breath may indicate serious cardiopulmonary pathology',
      immediateActions: ['Oxygen saturation monitoring', 'Chest X-ray', 'ABG if severe']
    });
  }
  
  return redFlags;
}

function generateProtocolGuidelines(chiefComplaint: string): ClinicalGuideline[] {
  const guidelines: ClinicalGuideline[] = [];
  const complaint = chiefComplaint.toLowerCase();
  
  if (complaint.includes('chest pain')) {
    guidelines.push({
      title: 'Chest Pain Evaluation',
      source: 'AHA/ACC 2021 Chest Pain Guidelines',
      recommendation: 'ECG within 10 minutes, troponin measurement, risk stratification using validated scores',
      evidenceLevel: 'A',
      applicableConditions: ['Chest Pain', 'Suspected ACS']
    });
  }
  
  if (complaint.includes('fatigue')) {
    guidelines.push({
      title: 'Fatigue Investigation',
      source: 'NICE Clinical Guidelines',
      recommendation: 'Initial investigations should include FBC, TFT, glucose, and inflammatory markers',
      evidenceLevel: 'B',
      applicableConditions: ['Fatigue', 'Tiredness']
    });
  }
  
  return guidelines;
}

function getBasicRecommendations(): InvestigationRecommendation[] {
  return [
    {
      investigation: {
        id: 'fbc',
        name: 'Full Blood Count',
        type: 'laboratory',
        category: 'Hematology',
        indication: 'Basic screening for anemia, infection, blood disorders',
        urgency: 'routine',
        cost: 'low',
        rationale: 'Essential screening investigation for most clinical presentations'
      },
      priority: 1,
      clinicalRationale: 'Comprehensive blood analysis to identify common abnormalities',
      contraindications: []
    }
  ];
}
