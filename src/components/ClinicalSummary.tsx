
// ABOUTME: Clinical summary component displaying AI-generated differential diagnoses
// ABOUTME: Shows assessment results, differential diagnoses with probabilities and clinical reasoning
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, AlertTriangle, Activity } from 'lucide-react';
import { AIService } from '@/services/aiService';
import { DifferentialDiagnosis } from '@/types/medical';
import { useMedical } from '@/context/MedicalContext';
import { useCompleteAssessment } from '@/hooks/useAssessment';
import { toast } from 'sonner';
import { AdvancedClinicalSupport } from './AdvancedClinicalSupport';
import { AssessmentDataSummary } from './clinical/AssessmentDataSummary';
import { DifferentialDiagnosisList } from './clinical/DifferentialDiagnosisList';
import { MedicalHistorySummary } from './clinical/MedicalHistorySummary';
import { ClinicalActionsPanel } from './clinical/ClinicalActionsPanel';

interface ClinicalSummaryProps {
  chiefComplaint: string;
  onComplete: () => void;
  onBack: () => void;
}

export function ClinicalSummary({ chiefComplaint, onComplete, onBack }: ClinicalSummaryProps) {
  const { state } = useMedical();
  const [differentials, setDifferentials] = useState<DifferentialDiagnosis[]>([]);
  const [advancedSupport, setAdvancedSupport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvestigations, setShowInvestigations] = useState(false);
  
  const completeAssessmentMutation = useCompleteAssessment();

  useEffect(() => {
    generateDifferentials();
    generateAdvancedSupport();
  }, []);

  const generateDifferentials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Generating differential diagnosis with data:', {
        chiefComplaint,
        answers: state.answers,
        rosData: state.rosData
      });

      const differentialDiagnoses = await AIService.generateDifferentialDiagnosis(
        chiefComplaint,
        state.answers,
        state.rosData
      );

      setDifferentials(differentialDiagnoses);
    } catch (err) {
      console.error('Error generating differentials:', err);
      setError('Failed to generate differential diagnosis. Using clinical reasoning based on available data.');
    } finally {
      setLoading(false);
    }
  };

  const generateAdvancedSupport = async () => {
    try {
      console.log('Generating advanced clinical decision support');
      
      const support = await AIService.generateAdvancedClinicalSupport(
        chiefComplaint,
        state.answers,
        state.rosData,
        state.peData?.vitalSigns,
        { age: 45 }
      );
      
      setAdvancedSupport(support);
    } catch (error) {
      console.error('Error generating advanced support:', error);
    }
  };

  const handleCompleteAssessment = async () => {
    if (state.currentAssessment) {
      try {
        await completeAssessmentMutation.mutateAsync(state.currentAssessment.id);
        onComplete();
      } catch (error) {
        console.error('Failed to complete assessment:', error);
        toast.error('Failed to complete assessment');
      }
    } else {
      onComplete();
    }
  };

  const handleProceedToInvestigations = () => {
    setShowInvestigations(true);
  };

  const handleInvestigationsSubmit = (selectedInvestigations: string[], notes: string) => {
    console.log('Investigation orders:', selectedInvestigations, notes);
    handleCompleteAssessment();
  };

  const handleInvestigationsBack = () => {
    setShowInvestigations(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
            <p className="text-lg">Generating Clinical Assessment...</p>
            <p className="text-sm text-gray-600">AI is analyzing symptoms and generating differential diagnoses</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showInvestigations) {
    const InvestigationOrdering = React.lazy(() => 
      import('./InvestigationOrdering').then(module => ({ default: module.InvestigationOrdering }))
    );
    
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <InvestigationOrdering
          chiefComplaint={chiefComplaint}
          differentialDiagnoses={differentials}
          answers={state.answers}
          rosData={state.rosData}
          onSubmit={handleInvestigationsSubmit}
          onBack={handleInvestigationsBack}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Brain className="h-6 w-6 text-teal-600" />
            <span>Clinical Assessment Summary</span>
          </CardTitle>
          <p className="text-gray-600">
            Chief Complaint: <span className="font-medium">{chiefComplaint}</span>
          </p>
          {error && (
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Advanced Clinical Decision Support */}
          {advancedSupport && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Activity className="h-5 w-5 text-purple-600 mr-2" />
                Advanced Clinical Decision Support
              </h3>
              <AdvancedClinicalSupport clinicalSupport={advancedSupport} />
            </div>
          )}

          {/* Assessment Data Summary */}
          <AssessmentDataSummary
            answersCount={Object.keys(state.answers).length}
            rosCount={Object.keys(state.rosData).length}
            pmhComplete={Boolean(state.pmhData)}
            differentialsCount={differentials.length}
          />

          {/* Medical History Summary */}
          <MedicalHistorySummary
            pmhData={state.pmhData}
            peData={state.peData}
          />

          {/* Differential Diagnoses */}
          <DifferentialDiagnosisList differentials={differentials} />

          {/* Action Buttons */}
          <ClinicalActionsPanel
            onBack={onBack}
            onRegenerate={generateDifferentials}
            onProceedToInvestigations={handleProceedToInvestigations}
            onCompleteAssessment={handleCompleteAssessment}
            loading={loading}
            completing={completeAssessmentMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
