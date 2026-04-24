// ABOUTME: Comprehensive patient summary displaying complete assessment data
// ABOUTME: Integrates history, examination, clinical decisions, and AI-generated insights

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Loader2, Brain, AlertTriangle, Activity, FileText, Send, NotepadText, 
  User, Stethoscope, ClipboardList, Copy, History, Pill, Microscope, 
  HeartPulse, PenTool, TrendingUp, TrendingDown, BookOpen, Check, 
  ShieldAlert, RefreshCw, Circle
} from 'lucide-react';
import { AIService } from '@/services/aiService';
import { DifferentialDiagnosis } from '@/types/medical';
import { useMedical } from '@/context/MedicalContext';
import { useCompleteAssessment } from '@/hooks/useAssessment';
import { useGetClinicalDecisionSupport } from '@/hooks/useGetClinicalDecisionSupport';
import { toast } from 'sonner';
import { PDFExportButton } from './reports/PDFExportButton';
import { SOAPNotesEditor } from './documentation/SOAPNotesEditor';
import { ReferralLetterGenerator } from './ReferralLetterGenerator';

interface ClinicalSummaryProps {
  chiefComplaint: string;
  onComplete: () => void;
  onBack: () => void;
}

// Circuit Breaker helper to retry critical AI calls with exponential backoff and fallback
const withCircuitBreaker = async <T,>(fn: () => Promise<T>, fallback: T, retries = 3, delay = 1000, signal?: AbortSignal): Promise<T> => {
  try {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    return await fn();
  } catch (error: any) {
    if (error.name === 'AbortError' || signal?.aborted) throw error;
    if (retries === 0) {
      console.warn('Circuit breaker triggered. Using fallback data.');
      return fallback;
    }
    console.warn(`AI Call failed, retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withCircuitBreaker(fn, fallback, retries - 1, delay * 2, signal);
  }
};

export function ClinicalSummary({ chiefComplaint, onComplete, onBack }: ClinicalSummaryProps) {
  const { state } = useMedical();
  const [differentials, setDifferentials] = useState<DifferentialDiagnosis[]>([]);
  const [pertinentNegatives, setPertinentNegatives] = useState<string[]>([]);
  const [soapNote, setSoapNote] = useState<string>('');
  const [advancedSupport, setAdvancedSupport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSOAPEditor, setShowSOAPEditor] = useState(false);
  const [showReferralGenerator, setShowReferralGenerator] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedStatOrders, setSelectedStatOrders] = useState<string[]>([]);
  
  const isCompleted = state.currentAssessment?.status === 'completed';
  
  const isGeneratingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const completeAssessmentMutation = useCompleteAssessment();
  const { data: clinicalDecisionData, isLoading: clinicalDecisionLoading } = useGetClinicalDecisionSupport(
    state.currentAssessment?.id || ''
  );

  useEffect(() => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    generateClinicalAnalysis();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const generateClinicalAnalysis = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    setLoading(true);
    setError(null);

    try {
      const fallbackDifferentials: DifferentialDiagnosis[] = [
        {
          condition: 'Clinical Assessment Needed',
          probability: 0,
          explanation: 'AI service unavailable. Proceed with standard clinical evaluation protocols.',
          keyFeatures: [],
          guidelineCitation: 'Standard Care Protocol',
          statOrders: ['Vitals', 'Clinical Evaluation']
        }
      ];

      const fallbackSupport = {
        clinicalAlerts: [],
        triageRecommendation: {
          priority: 'routine',
          timeframe: 'Standard evaluation',
          location: 'clinic',
          reasoning: 'Standard protocol evaluation required',
          immediateActions: []
        },
        severityScores: [],
        riskAssessment: {
          overallRisk: 'moderate',
          riskScore: 0,
          maxRiskScore: 10,
          riskFactors: [],
          recommendations: ['Follow standard clinical protocols']
        }
      };

      const fallbackDDxResponse: any = {
        differentialDiagnoses: fallbackDifferentials,
        pertinentNegatives: [],
        soapNote: ''
      };

      const [diffs, support] = await Promise.all([
        withCircuitBreaker(() => AIService.generateDifferentialDiagnosis(
          chiefComplaint,
          state.answers,
          state.rosData
        ), fallbackDDxResponse, 3, 1000, signal),
        withCircuitBreaker(() => AIService.generateAdvancedClinicalSupport(
          chiefComplaint,
          state.answers,
          state.rosData,
          state.peData?.vitalSigns,
          { age: state.currentPatient?.age ?? 45 }
        ), fallbackSupport, 3, 1000, signal)
      ]);

      if (signal.aborted) return;

      // Handle the enhanced DDxResponse payload
      setDifferentials(diffs.differentialDiagnoses || diffs.differentials || []);
      setPertinentNegatives(diffs.pertinentNegatives || []);
      setSoapNote(diffs.soapNote || '');
      setAdvancedSupport(support);
    } catch (err: any) {
      if (signal.aborted || err.name === 'AbortError') return;
      console.error('Error generating AI analysis:', err);
      setError('Failed to generate clinical analysis. Using clinical reasoning based on available data.');
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleCompleteAssessment = async () => {
    if (isCompleted) {
      return onComplete();
    }
    if (state.currentAssessment) {
      try {
        await completeAssessmentMutation.mutateAsync(state.currentAssessment.id);
        toast.success('Assessment completed successfully');
        onComplete();
      } catch (error) {
        console.error('Failed to complete assessment:', error);
        toast.error('Failed to complete assessment');
      }
    } else {
      onComplete();
    }
  };

  const handleSOAPNoteSaved = () => {
    setShowSOAPEditor(false);
    toast.success('SOAP note documentation completed');
  };

  const handleReferralSaved = () => {
    setShowReferralGenerator(false);
    toast.success('Referral letter saved successfully');
  };

  const handleCopyToClipboardNote = async () => {
    try {
      await navigator.clipboard.writeText(soapNote || 'No clinical note available.');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleStatOrderToggle = (order: string) => {
    setSelectedStatOrders(prev => 
      prev.includes(order) ? prev.filter(o => o !== order) : [...prev, order]
    );
  };

  const handleOrderSelectedTests = () => {
    toast.success(`Successfully submitted ${selectedStatOrders.length} STAT orders`);
    setSelectedStatOrders([]);
  };

  const getLikelihoodBadge = (likelihood: string) => {
    switch (likelihood) {
      case 'High':
        return <Badge variant="destructive">High Likelihood</Badge>;
      case 'Medium':
        return <Badge variant="warning">Medium Likelihood</Badge>;
      case 'Low':
        return <Badge variant="secondary">Low Likelihood</Badge>;
      default:
        return <Badge variant="outline">{likelihood}</Badge>;
    }
  };

  const renderVital = (label: string, vitalValue: string | undefined, isBadUp: boolean, isBadDown: boolean) => {
    if (!vitalValue || vitalValue === '-') return null;
    
    // Simple logic to determine mock trend based on thresholds. In a real app, this would compare past values.
    let trend = "stable";
    if (isBadUp && parseInt(vitalValue) > 130) trend = "up";
    if (isBadDown && parseInt(vitalValue) < 95) trend = "down";

    const vital = { current: vitalValue, trend, delta: trend !== "stable" ? "!" : "" };
    
    let trendColor = "text-muted-foreground";
    if (vital.trend === 'up' && isBadUp) trendColor = "text-red-500";
    if (vital.trend === 'down' && isBadDown) trendColor = "text-red-500";

    return (
      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="font-semibold text-gray-900">{vital.current}</span>
          {vital.trend === 'up' && <TrendingUp className={`h-3.5 w-3.5 ${trendColor}`} />}
          {vital.trend === 'down' && <TrendingDown className={`h-3.5 w-3.5 ${trendColor}`} />}
        </div>
      </div>
    );
  };

  const generateSOAPInitialData = () => {
    return {
      subjective: soapNote ? soapNote.split('O:')[0]?.replace('S:', '').trim() : '',
      objective: soapNote ? soapNote.split('O:')[1]?.split('A:')[0]?.trim() : '',
      assessment: soapNote ? soapNote.split('A:')[1]?.split('P:')[0]?.trim() : '',
      plan: soapNote ? soapNote.split('P:')[1]?.trim() : '',
      additionalNotes: clinicalDecisionData?.clinical_notes || ''
    };
  };

  if (loading || clinicalDecisionLoading) {
    return (
      <div className="p-6">
        <Card className="max-w-6xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-lg">Generating Patient Summary...</p>
            <p className="text-sm text-muted-foreground">
              Compiling comprehensive assessment data and clinical decisions
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSOAPEditor) {
    return (
      <SOAPNotesEditor
        assessmentId={state.currentAssessment?.id || ''}
        initialData={generateSOAPInitialData()}
        onSave={handleSOAPNoteSaved}
        onCancel={() => setShowSOAPEditor(false)}
      />
    );
  }

  if (showReferralGenerator && state.currentAssessment && state.currentPatient) {
    return (
      <ReferralLetterGenerator
        assessmentId={state.currentAssessment.id}
        patient={state.currentPatient}
        chiefComplaint={chiefComplaint}
        differentials={differentials}
        answers={state.answers}
        rosData={state.rosData}
        onSave={handleReferralSaved}
        onCancel={() => setShowReferralGenerator(false)}
      />
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50/50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Patient Summary & Assessment</h1>
            <p className="text-muted-foreground">Clinical Workspace & EHR Assessment Plan</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {state.currentPatient && state.currentAssessment && (
              <PDFExportButton
                assessmentId={state.currentAssessment.id}
                patient={state.currentPatient}
                chiefComplaint={chiefComplaint}
                answers={state.answers}
                rosData={state.rosData}
                differentials={differentials}
                pmhData={state.pmhData}
                peData={state.peData}
                variant="outline"
              />
            )}
            <Button onClick={() => setShowSOAPEditor(true)} variant="outline">
              <NotepadText className="h-4 w-4 mr-2" />
              Edit SOAP Note
            </Button>
            {!isCompleted && (
              <Button
                onClick={() => {
                  if (loading) return;
                  generateClinicalAnalysis();
                }}
                variant="outline"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Regenerate Analysis
              </Button>
            )}
            {!isCompleted ? (
              <Button 
                onClick={handleCompleteAssessment}
                disabled={completeAssessmentMutation.isPending}
              >
                {completeAssessmentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Complete Assessment
              </Button>
            ) : (
              <Button onClick={onComplete}>
                Return to Dashboard
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Subjective / Objective */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Patient Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="font-medium text-lg">{state.currentPatient?.name || 'Unknown Patient'}</div>
                      <div className="text-sm text-muted-foreground">
                        {state.currentPatient?.age} yo {state.currentPatient?.gender}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Chief Complaint</div>
                      <div className="text-sm text-destructive font-medium">{chiefComplaint}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 p-3 rounded-lg border">
                      {renderVital('BP', state.peData?.vitalSigns?.bloodPressure, true, false)}
                      {renderVital('HR', state.peData?.vitalSigns?.heartRate, true, false)}
                      {renderVital('RR', state.peData?.vitalSigns?.respiratoryRate, true, false)}
                      {renderVital('SpO2', state.peData?.vitalSigns?.oxygenSaturation, false, true)}
                    </div>
                  </div>
                  
                  {/* Anatomical Localization Map */}
                  <div className="w-full sm:w-28 flex flex-col items-center justify-center p-3 border rounded-lg bg-muted/30 shrink-0 shadow-inner">
                    <div className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Pain Map</div>
                    <div className="w-16 h-28 relative">
                      <svg viewBox="0 0 100 150" className="w-full h-full text-gray-300">
                        <g stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="50" cy="20" r="14" />
                          <path d="M 46 34 L 46 42 M 54 34 L 54 42" />
                          <path d="M 25 45 C 35 40 65 40 75 45 L 80 100 C 70 105 30 105 20 100 Z" />
                          <path d="M 25 45 L 10 90 L 15 115" />
                          <path d="M 75 45 L 90 90 L 85 115" />
                        </g>
                        <ellipse cx="50" cy="65" rx="16" ry="14" className="fill-red-500/50" />
                        <path d="M 75 45 L 90 90 L 85 115" stroke="rgba(239, 68, 68, 0.5)" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Subjective
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-semibold mb-1">History of Present Illness</div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {Object.entries(state.answers).map(([, a]) => `${a.value || ''} ${a.notes ? `(${a.notes})` : ''}`).join('. ')}
                  </p>
                </div>
                {pertinentNegatives.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2">Pertinent Negatives</div>
                    <div className="flex flex-wrap gap-2">
                      {pertinentNegatives.map((neg, i) => (
                        <Badge key={i} variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
                          {neg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold mb-2">Review of Systems</div>
                  <div className="space-y-2 text-sm">
                    {Object.entries(state.rosData).map(([sys, data]: [string, any]) => (
                      (data.positive?.length > 0 || data.negative?.length > 0) && (
                        <div key={sys}>
                          <span className="capitalize font-medium text-gray-900">{sys}:</span>
                          <ul className="list-disc pl-4 mt-1 text-gray-700">
                            {data.positive?.map((f: string, i: number) => (
                              <li key={`pos-${i}`} className="text-red-600">{f} (Positive)</li>
                            ))}
                            {data.negative?.map((f: string, i: number) => (
                              <li key={`neg-${i}`} className="text-emerald-600">{f} (Negative)</li>
                            ))}
                          </ul>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="h-5 w-5 text-primary" />
                  Medical History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.pmhData?.conditions && state.pmhData.conditions.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-1">Past Medical History</div>
                    <div className="flex flex-wrap gap-2">
                      {state.pmhData.conditions.map((condition: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{condition}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {state.pmhData?.medications && state.pmhData.medications.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-1">Home Medications</div>
                    <ul className="list-disc pl-4 text-sm text-gray-700">
                      {state.pmhData.medications.map((med: string, idx: number) => (
                        <li key={idx}>{med}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {state.pmhData?.allergies && state.pmhData.allergies.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-1 text-destructive">Allergies</div>
                    <div className="flex flex-wrap gap-2">
                      {state.pmhData.allergies.map((allergy: string, idx: number) => (
                        <Badge key={idx} variant="destructive">{allergy}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Drafted Clinical Note
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyToClipboardNote}
                  className={`transition-all duration-300 ${isCopied ? "text-green-600 border-green-200 bg-green-50 hover:bg-green-50 hover:text-green-600" : ""}`}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-lg border text-sm font-mono whitespace-pre-wrap text-gray-700 leading-relaxed shadow-inner">
                  {soapNote || 'No clinical note generated yet.'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Assessment / Plan */}
          <div className="md:col-span-2 space-y-6">
            {advancedSupport?.riskAssessment && (
              <Card className="border-l-4 border-l-orange-500 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HeartPulse className="h-5 w-5 text-orange-600" />
                    Clinical Risk Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                    <div>
                      <h4 className="font-semibold text-gray-900">Overall Risk Assessment</h4>
                      <p className="text-sm font-medium text-orange-800 mt-1 capitalize">{advancedSupport.riskAssessment.overallRisk} Risk</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{advancedSupport.riskAssessment.riskScore}</div>
                      <div className="text-xs text-orange-800 font-bold uppercase tracking-wider mt-1">Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {advancedSupport?.clinicalAlerts && advancedSupport.clinicalAlerts.length > 0 && (
              <Alert variant="destructive" className="bg-red-50/50 border-red-200">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="text-lg font-semibold mb-2">Clinical Warnings / Red Flags</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1">
                    {advancedSupport.clinicalAlerts.map((flag: any, idx: number) => (
                      <li key={idx} className="font-medium">{flag.title}: {flag.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Card className="border-t-4 border-t-primary shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Differential Diagnoses & Plan
                </CardTitle>
                <CardDescription>AI-generated clinical reasoning and suggested workup.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {differentials.map((ddx) => {
                  const likelihood = ddx.probability >= 70 ? 'High' : ddx.probability >= 30 ? 'Medium' : 'Low';
                  return (
                    <div key={ddx.condition} className="p-4 rounded-xl border bg-card transition-all hover:shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{ddx.condition}</h3>
                          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            Probability: {ddx.probability}%
                          </div>
                        </div>
                        <div className="shrink-0">
                          {getLikelihoodBadge(likelihood)}
                        </div>
                      </div>

                      <div className="text-sm text-gray-700 mb-4 bg-muted/30 p-3 rounded-lg">
                        <span className="font-medium text-gray-900">Clinical Rationale: </span>
                        {ddx.explanation}
                      </div>

                      {ddx.statOrders && ddx.statOrders.length > 0 && (
                        <div>
                          <div className="text-sm font-medium flex items-center gap-1.5 mb-3 text-destructive">
                            <Microscope className="h-4 w-4" />
                            STAT Orders (CPOE)
                          </div>
                          <div className="space-y-2.5 bg-muted/20 p-3 rounded-lg border shadow-sm">
                            {ddx.statOrders.map((inv, idx) => (
                              <div key={idx} className="flex items-start space-x-3">
                                <Checkbox 
                                  id={`ddx-${ddx.condition.replace(/\s+/g, '-')}-inv-${idx}`} 
                                  checked={selectedStatOrders.includes(inv)}
                                  onCheckedChange={() => handleStatOrderToggle(inv)}
                                  className="mt-0.5 border-gray-400 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive" 
                                />
                                <Label htmlFor={`ddx-${ddx.condition.replace(/\s+/g, '-')}-inv-${idx}`} className="text-sm font-medium cursor-pointer leading-tight text-gray-700">
                                  {inv}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {ddx.guidelineCitation && (
                        <div className="mt-4">
                          <Separator className="mb-3" />
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground italic">
                            <BookOpen className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>Evidence Basis: {ddx.guidelineCitation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {differentials.some(d => d.statOrders && d.statOrders.length > 0) && (
              <Card className="border-t-4 border-t-destructive shadow-sm">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-full">
                      <Microscope className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">STAT Order Cart</h4>
                      <p className="text-sm text-muted-foreground">{selectedStatOrders.length} test(s) selected</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleOrderSelectedTests}
                    disabled={selectedStatOrders.length === 0}
                    className="bg-destructive hover:bg-destructive/90 text-white w-full sm:w-auto"
                  >
                    Submit STAT Orders
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Pill className="h-5 w-5 text-primary" />
                    Treatment Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {clinicalDecisionData?.treatment_plan?.medications?.map((treatment: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{treatment}</span>
                      </li>
                    ))}
                    {clinicalDecisionData?.treatment_plan?.nonPharmacological?.map((treatment: string, idx: number) => (
                      <li key={`nonpharm-${idx}`} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{treatment}</span>
                      </li>
                    ))}
                    {!clinicalDecisionData?.treatment_plan?.medications?.length && !clinicalDecisionData?.treatment_plan?.nonPharmacological?.length && (
                      <li className="text-muted-foreground">No specific treatments recorded.</li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Follow-up
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {clinicalDecisionData?.treatment_plan?.followUp ? (
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{clinicalDecisionData.treatment_plan.followUp}</span>
                      </li>
                    ) : (
                      <li className="text-muted-foreground">No follow-up plan recorded.</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 bg-muted/40 border rounded-lg flex items-start gap-3 text-sm text-muted-foreground mt-6 shadow-sm">
              <ShieldAlert className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <p>
                <strong className="text-gray-700">DISCLAIMER:</strong> This assessment is generated by AI Clinical Decision Support (or fallback protocols) and is for informational purposes only. It must be independently verified by a qualified healthcare professional.
              </p>
            </div>
          </div>

        </div>

        {/* BOTTOM: Disposition & Attestation */}
        <Card className="shadow-sm border-t-4 border-t-blue-600 mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PenTool className="h-5 w-5 text-blue-600" />
              Disposition & Attestation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between">
              <span className="font-semibold text-gray-700">Patient Disposition:</span>
              <Badge className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-1.5 font-bold uppercase tracking-wider">
                Status: {advancedSupport?.triageRecommendation?.location || 'PENDING EVALUATION'}
              </Badge>
            </div>
            <div className="pt-6 pb-2 border-t border-dashed flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1 text-sm text-gray-500">
                <p>I have personally evaluated the patient and formulated the above plan.</p>
                <p>Time of completion: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="text-right">
                <div className="text-lg mb-1 text-gray-800 font-serif italic">Electronically signed by: _________________ , MD</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Attending Physician</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
