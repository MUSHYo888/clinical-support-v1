// ABOUTME: Advanced AI-powered differential diagnosis engine component
// ABOUTME: Provides intelligent diagnostic reasoning with confidence scores and clinical recommendations

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Target,
  Clock,
  RefreshCw,
  Shield,
  Activity,
  Stethoscope
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useMedical } from '@/context/MedicalContext';
import { toast } from 'sonner';

interface DifferentialDiagnosis {
  condition: string;
  probability: number;
  explanation: string;
  keyFeatures: string[];
  conflictingFeatures?: string[];
  urgency: 'high' | 'moderate' | 'low';
  category: string;
  redFlags: string[];
  guidelineCitation?: string;
  statOrders?: string[];
}

interface ClinicalRecommendations {
  immediateActions: string[];
  investigationPriority: Array<{
    condition: string;
    recommendedTests: string[];
  }>;
  redFlagAlert: boolean;
  followUpRecommendations: string[];
}

interface RiskStratification {
  overallRisk: 'high' | 'moderate' | 'low';
  riskFactors: {
    highUrgencyConditions: number;
    redFlagConditions: number;
    diagnosticConfidence: number;
  };
  recommendations: string[];
}

interface DifferentialDiagnosisEngineProps {
  chiefComplaint: string;
  assessmentId?: string;
  onDiagnosisGenerated?: (diagnoses: DifferentialDiagnosis[]) => void;
}

export function DifferentialDiagnosisEngine({
  chiefComplaint,
  assessmentId,
  onDiagnosisGenerated
}: DifferentialDiagnosisEngineProps) {
  const { state } = useMedical();
  const [diagnoses, setDiagnoses] = useState<DifferentialDiagnosis[]>([]);
  const [recommendations, setRecommendations] = useState<ClinicalRecommendations | null>(null);
  const [riskStratification, setRiskStratification] = useState<RiskStratification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [selectedDiagnosisIndex, setSelectedDiagnosisIndex] = useState(0);

  const generateDifferentialDiagnosis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setHasAttempted(true);
      

      let data: {
        differentialDiagnoses?: DifferentialDiagnosis[];
        clinicalRecommendations?: ClinicalRecommendations;
        riskStratification?: RiskStratification;
      } | null = null;
      let currentRetries = 3;
      let currentDelay = 1000;
      let success = false;

      while (currentRetries >= 0 && !success) {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 30000)
          );

          const apiPromise = supabase.functions.invoke('differential-diagnosis', {
            body: {
              chiefComplaint,
              answers: state.answers,
              rosData: state.rosData,
              pmhData: state.pmhData,
              peData: state.peData,
              assessmentId
            }
          });

          const result = await Promise.race([apiPromise, timeoutPromise]) as {
            data: {
              differentialDiagnoses?: DifferentialDiagnosis[];
              clinicalRecommendations?: ClinicalRecommendations;
              riskStratification?: RiskStratification;
              error?: string;
            } | null;
            error: Error | null;
          };
          
          if (result.error) throw new Error(result.error.message);
          if (result.data?.error) throw new Error(result.data.error);

          data = result.data;
          success = true;
          
          // Write directly to Supabase to guarantee data persistence
          if (assessmentId && data?.differentialDiagnoses && data.differentialDiagnoses.length > 0) {
            try {
              await supabase.from('differential_diagnoses').delete().eq('assessment_id', assessmentId);
              const insertData = data.differentialDiagnoses.map((d: any) => ({
                assessment_id: assessmentId,
                condition_name: d.condition,
                probability: d.probability,
                explanation: d.explanation,
                key_features: d.keyFeatures || []
              }));
              await supabase.from('differential_diagnoses').insert(insertData);
            } catch (dbError) {
              console.error('Direct Supabase write failed:', dbError);
            }
          }
        } catch (err) {
          if (currentRetries === 0) throw err;
          console.warn(`Differential Diagnosis AI failed, retrying in ${currentDelay}ms... (${currentRetries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          currentDelay *= 2;
          currentRetries--;
        }
      }

      setDiagnoses(data?.differentialDiagnoses || []);
      setRecommendations(data?.clinicalRecommendations || null);
      setRiskStratification(data?.riskStratification || null);

      if (onDiagnosisGenerated) {
        onDiagnosisGenerated(data?.differentialDiagnoses || []);
      }

      toast.success(`Generated ${data?.differentialDiagnoses?.length || 0} differential diagnoses`);

    } catch (err) {
      console.error('Error generating differential diagnosis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate differential diagnosis';
      setError(errorMessage);
      
      // Circuit Breaker Fallback data
      const fallbackData = {
        differentialDiagnoses: [
          {
            condition: 'Standard Clinical Evaluation Required',
            probability: 100,
            explanation: 'AI diagnostic service is currently unavailable. Please rely on standard clinical reasoning and protocols based on the patient\'s presentation.',
            keyFeatures: ['Service offline'],
            urgency: 'moderate',
            category: 'General',
            redFlags: []
          }
        ],
        clinicalRecommendations: {
          immediateActions: ['Proceed with standard clinical evaluation'],
          investigationPriority: [],
          redFlagAlert: false,
          followUpRecommendations: ['Monitor patient condition']
        },
        riskStratification: {
          overallRisk: 'moderate',
          riskFactors: { diagnosticConfidence: 0, highUrgencyConditions: 0, redFlagConditions: 0 },
          recommendations: ['Perform comprehensive clinical assessment manually']
        }
      };

      setDiagnoses(fallbackData.differentialDiagnoses as DifferentialDiagnosis[]);
      setRecommendations(fallbackData.clinicalRecommendations);
      setRiskStratification(fallbackData.riskStratification as RiskStratification);

      if (errorMessage.includes('timeout')) {
        toast.error('AI service is taking longer than expected. You can retry or continue with clinical protocols.');
      } else {
        toast.error('AI service unavailable. Using evidence-based clinical protocols.');
      }
    } finally {
      setLoading(false);
    }
  }, [chiefComplaint, state.answers, state.rosData, state.pmhData, state.peData, assessmentId, onDiagnosisGenerated]);

  useEffect(() => {
    if (chiefComplaint && state.answers && Object.keys(state.answers).length > 0 && !hasAttempted) {
      generateDifferentialDiagnosis();
    }
  }, [chiefComplaint, hasAttempted, state.answers, generateDifferentialDiagnosis]);

  useEffect(() => {
    setSelectedDiagnosisIndex(0);
  }, [diagnoses]);

  const handleManualRetry = () => {
    setHasAttempted(false);
    setError(null);
    generateDifferentialDiagnosis();
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'bg-red-500';
    if (probability >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'moderate': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cardiovascular': return <Activity className="h-4 w-4 text-red-500" />;
      case 'respiratory': return <Target className="h-4 w-4 text-blue-500" />;
      case 'neurological': return <Brain className="h-4 w-4 text-purple-500" />;
      case 'infectious': return <Shield className="h-4 w-4 text-orange-500" />;
      default: return <Stethoscope className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-[95%] mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Brain className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Generating Differential Diagnosis</h3>
            <p className="text-muted-foreground mb-4">AI is analyzing clinical data and generating diagnostic possibilities...</p>
            <p className="text-sm text-muted-foreground">This usually takes 10-20 seconds</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[95%] mx-auto shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6">
        <div className="space-y-1">
          <CardTitle className="flex items-center space-x-2 text-xl sm:text-2xl">
            <Brain className="h-6 w-6 text-primary" />
            <span>AI-Powered Differential Diagnosis Engine</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Chief Complaint: <span className="font-medium text-foreground">{chiefComplaint}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleManualRetry} disabled={loading} className="h-8">
            <RefreshCw className="h-4 w-4 mr-2" /> Regenerate Analysis
          </Button>
          {diagnoses.length > 0 && (
            <Button variant="outline" size="sm" className="h-8">
              <FileText className="h-4 w-4 mr-2" /> Export Report
            </Button>
          )}
        </div>

        {/* Risk Stratification Alert */}
        {riskStratification && (
          <Alert className={`border-l-4 ${
            riskStratification.overallRisk === 'high' 
              ? 'border-l-red-500 bg-red-50' 
              : riskStratification.overallRisk === 'moderate'
              ? 'border-l-yellow-500 bg-yellow-50'
              : 'border-l-green-500 bg-green-50'
          }`}>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">
                Overall Risk: {riskStratification.overallRisk.toUpperCase()}
              </div>
              <div className="text-sm mt-1">
                Diagnostic Confidence: {riskStratification.riskFactors.diagnosticConfidence}% | 
                High-Risk Conditions: {riskStratification.riskFactors.highUrgencyConditions} | 
                Red Flags: {riskStratification.riskFactors.redFlagConditions}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="font-medium text-yellow-900 mb-2">AI Service Unavailable</div>
              <p className="text-sm text-yellow-800 mb-3">{error}</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleManualRetry}
                  className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry with AI
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setError(null)}
                >
                  Continue with Clinical Protocols
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
            {diagnoses.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No differential diagnoses generated yet</p>
                <Button onClick={generateDifferentialDiagnosis} className="mt-4">
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Diagnoses
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* MASTER LIST (LEFT COLUMN) */}
                <div className="col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {diagnoses.map((diagnosis, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedDiagnosisIndex(index)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all",
                        selectedDiagnosisIndex === index 
                          ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20" 
                          : "bg-card hover:bg-muted/50 border-border"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm line-clamp-2 pr-2">{diagnosis.condition}</span>
                        <span className={cn("font-bold text-sm", diagnosis.probability >= 70 ? 'text-red-600' : diagnosis.probability >= 50 ? 'text-amber-600' : 'text-green-600')}>
                          {diagnosis.probability}%
                        </span>
                      </div>
                      <Progress value={diagnosis.probability} className="h-1.5" />
                    </div>
                  ))}
                </div>

                {/* DETAIL VIEW (RIGHT COLUMN) */}
                <div className="col-span-1 md:col-span-2">
                  {diagnoses[selectedDiagnosisIndex] && (
                    <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                      {/* Detail Header */}
                      <div className={cn(
                        "p-5 border-b", 
                        (diagnoses[selectedDiagnosisIndex].probability >= 70 || diagnoses[selectedDiagnosisIndex].urgency === 'high' || diagnoses[selectedDiagnosisIndex].redFlags?.length > 0) 
                          ? 'border-t-4 border-t-destructive' 
                          : 'border-t-4 border-t-primary/30'
                      )}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="mt-1">
                              {getCategoryIcon(diagnoses[selectedDiagnosisIndex].category)}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-foreground">{diagnoses[selectedDiagnosisIndex].condition}</h3>
                              <div className="flex items-center space-x-2 mt-1.5">
                                <Badge variant="secondary" className="text-xs font-medium">{diagnoses[selectedDiagnosisIndex].category}</Badge>
                                <div className="flex items-center space-x-1 text-muted-foreground">
                                  {getUrgencyIcon(diagnoses[selectedDiagnosisIndex].urgency)}
                                  <span className="text-xs uppercase tracking-wider font-semibold">{diagnoses[selectedDiagnosisIndex].urgency}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-3xl font-black tracking-tighter", diagnoses[selectedDiagnosisIndex].probability >= 70 ? 'text-red-600' : diagnoses[selectedDiagnosisIndex].probability >= 50 ? 'text-amber-600' : 'text-green-600')}>
                              {diagnoses[selectedDiagnosisIndex].probability}%
                            </div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Confidence</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-6">
                        {/* Rationale */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Clinical Rationale</h4>
                          <p className="text-sm text-foreground leading-relaxed">{diagnoses[selectedDiagnosisIndex].explanation}</p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {diagnoses[selectedDiagnosisIndex].keyFeatures?.length > 0 && (
                            <div className="space-y-2 bg-green-50/50 dark:bg-green-900/10 p-4 rounded-lg border border-green-100 dark:border-green-900/30">
                              <h4 className="font-semibold flex items-center text-green-800 dark:text-green-400 text-sm">
                                <CheckCircle className="h-4 w-4 mr-2" /> Supporting Features
                              </h4>
                              <ul className="text-sm space-y-1.5">
                                {diagnoses[selectedDiagnosisIndex].keyFeatures.map((feature, i) => (
                                  <li key={i} className="flex items-start text-green-700 dark:text-green-300">
                                    <span className="mr-2 mt-0.5">•</span>
                                    <span className="leading-tight">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {diagnoses[selectedDiagnosisIndex].conflictingFeatures && diagnoses[selectedDiagnosisIndex].conflictingFeatures!.length > 0 && (
                            <div className="space-y-2 bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
                              <h4 className="font-semibold flex items-center text-amber-800 dark:text-amber-400 text-sm">
                                <AlertTriangle className="h-4 w-4 mr-2" /> Conflicting Features
                              </h4>
                              <ul className="text-sm space-y-1.5">
                                {diagnoses[selectedDiagnosisIndex].conflictingFeatures!.map((feature, i) => (
                                  <li key={i} className="flex items-start text-amber-700 dark:text-amber-300">
                                    <span className="mr-2 mt-0.5">•</span>
                                    <span className="leading-tight">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Red Flags */}
                        {diagnoses[selectedDiagnosisIndex].redFlags?.length > 0 && (
                          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <AlertDescription>
                              <div className="font-semibold text-red-800 dark:text-red-400 mb-1.5">Red Flags Identified:</div>
                              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                                {diagnoses[selectedDiagnosisIndex].redFlags.map((flag, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{flag}</span>
                                  </li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

      </CardContent>
    </Card>
  );
}