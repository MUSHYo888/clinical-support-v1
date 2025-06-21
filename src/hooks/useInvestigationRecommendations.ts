
// ABOUTME: Custom hook for investigation recommendations and clinical decision support
// ABOUTME: Manages AI-powered investigation suggestions with loading states and error handling

import { useState, useEffect } from 'react';
import { InvestigationRecommendation, RedFlag, ClinicalGuideline } from '@/types/medical';
import { AIService } from '@/services/aiService';

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
  differentialDiagnoses: any[],
  answers: Record<string, any>,
  rosData: Record<string, any>
): UseInvestigationRecommendationsResult {
  const [recommendations, setRecommendations] = useState<InvestigationRecommendation[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [guidelines, setGuidelines] = useState<ClinicalGuideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching investigation recommendations for:', chiefComplaint);
      
      const clinicalSupport = await AIService.generateClinicalDecisionSupport(
        chiefComplaint,
        differentialDiagnoses,
        answers,
        rosData
      );
      
      setRecommendations(clinicalSupport.investigations || []);
      setRedFlags(clinicalSupport.redFlags || []);
      setGuidelines(clinicalSupport.guidelines || []);
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      setError('Failed to generate investigation recommendations');
      
      // Set fallback data
      setRecommendations([]);
      setRedFlags([]);
      setGuidelines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chiefComplaint && differentialDiagnoses.length > 0) {
      fetchRecommendations();
    }
  }, [chiefComplaint, differentialDiagnoses, answers, rosData]);

  return {
    recommendations,
    redFlags,
    guidelines,
    loading,
    error,
    refetch: fetchRecommendations
  };
}
