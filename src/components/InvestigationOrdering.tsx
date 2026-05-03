
// ABOUTME: Investigation ordering component with AI-powered recommendations and cost-benefit analysis
// ABOUTME: Provides intelligent investigation selection with clinical rationale and safety checks

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Beaker, 
  Scan, 
  Heart, 
  Wind, 
  AlertTriangle, 
  DollarSign,
  Brain,
  CheckCircle2,
  Info,
  TrendingUp,
  Shield
} from 'lucide-react';
import { useInvestigationRecommendations } from '@/hooks/useInvestigationRecommendations';
import { InvestigationIntelligenceService } from '@/services/investigationIntelligenceService';
import { DifferentialDiagnosis, Answer, ReviewOfSystems, InvestigationRecommendation } from '@/types/medical';
import { InvestigationIntelligence } from '@/types/investigation-intelligence';

type EnrichedInvestigation = InvestigationRecommendation & {
  intelligence: InvestigationIntelligence;
};

interface InvestigationOrderingProps {
  chiefComplaint: string;
  differentialDiagnoses: DifferentialDiagnosis[];
  answers: Record<string, Answer>;
  rosData: ReviewOfSystems;
  onSubmit: (selectedInvestigations: string[], notes: string) => void;
  onBack: () => void;
}

export function InvestigationOrdering({
  chiefComplaint,
  differentialDiagnoses,
  answers,
  rosData,
  onSubmit,
  onBack
}: InvestigationOrderingProps) {
  const [selectedInvestigations, setSelectedInvestigations] = useState<string[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [investigationIntelligence, setInvestigationIntelligence] = useState<EnrichedInvestigation[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    recommendations,
    redFlags,
    guidelines,
    loading: aiLoading,
    error: aiError
  } = useInvestigationRecommendations(chiefComplaint, differentialDiagnoses, answers, rosData);

  const generateInvestigationIntelligence = useCallback(async () => {
    try {
      setLoading(true);
      
      const intelligenceData = await Promise.all(
        recommendations.map(async (rec) => {
          const intelligence = InvestigationIntelligenceService.generateInvestigationIntelligence(
            rec.investigation.id,
            chiefComplaint,
            { answers, rosData }
          );
          return { ...rec, intelligence };
        })
      );
      
      setInvestigationIntelligence(intelligenceData);
    } catch (error) {
      console.error('Failed to generate investigation intelligence:', error);
    } finally {
      setLoading(false);
    }
  }, [recommendations, chiefComplaint, answers, rosData]);

  useEffect(() => {
    generateInvestigationIntelligence();
  }, [generateInvestigationIntelligence]);

  const getInvestigationIcon = (type: string) => {
    switch (type) {
      case 'laboratory': return <Beaker className="h-4 w-4" />;
      case 'imaging': return <Scan className="h-4 w-4" />;
      case 'cardiac': return <Heart className="h-4 w-4" />;
      case 'pulmonary': return <Wind className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getCostColor = (category: string) => {
    switch (category) {
      case 'very-low': return 'text-green-600';
      case 'low': return 'text-green-500';
      case 'moderate': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'very-high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strongly-recommended': return 'bg-green-100 text-green-800 border-green-200';
      case 'recommended': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'consider': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not-recommended': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'contraindicated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleInvestigationToggle = (investigationId: string) => {
    setSelectedInvestigations(prev => 
      prev.includes(investigationId)
        ? prev.filter(id => id !== investigationId)
        : [...prev, investigationId]
    );
  };

  const handleSubmit = () => {
    onSubmit(selectedInvestigations, clinicalNotes);
  };

  if (aiLoading || loading) {
    return (
      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="flex items-center justify-center py-12">
            <Brain className="h-8 w-8 animate-pulse text-teal-600 mr-4" />
            <div>
              <p className="text-lg">Generating Investigation Intelligence...</p>
              <p className="text-sm text-gray-600">AI is analyzing clinical data and generating smart recommendations</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Brain className="h-6 w-6 text-teal-600" />
            <span>Intelligent Investigation Ordering</span>
          </CardTitle>
          <p className="text-gray-600">
            Chief Complaint: <span className="font-medium">{chiefComplaint}</span>
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* AI Error Alert */}
          {aiError && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="font-medium text-yellow-800 mb-2">AI Service Unavailable</div>
                <p className="text-sm">{aiError}</p>
                <p className="text-sm mt-1">Using fallback recommendations based on clinical protocols.</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Red Flags Alert */}
          {redFlags.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="font-medium text-red-800 mb-2">Clinical Red Flags Detected:</div>
                {redFlags.map((flag, index) => (
                  <div key={index} className="mb-2">
                    <span className="font-medium">{flag.condition}</span>
                    <Badge className="ml-2 bg-red-100 text-red-800">
                      {flag.severity.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Investigation Recommendations */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-teal-600 mr-2" />
              Smart Investigation Recommendations
            </h3>
            
            <div className="grid gap-4">
              {investigationIntelligence.map((item) => (
                <Card key={item.investigation.id} className="border-l-4 border-l-teal-500">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        checked={selectedInvestigations.includes(item.investigation.id)}
                        onCheckedChange={() => handleInvestigationToggle(item.investigation.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {getInvestigationIcon(item.investigation.type)}
                          <h4 className="font-medium text-lg">{item.investigation.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            Priority {item.priority}
                          </Badge>
                          <Badge className={`text-xs border ${getRecommendationColor(item.intelligence.overallRecommendation.recommendation)}`}>
                            {item.intelligence.overallRecommendation.recommendation.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        {/* Cost-Benefit Analysis */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <DollarSign className={`h-4 w-4 ${getCostColor(item.intelligence.costBenefit.costCategory)}`} />
                              <span className="text-sm font-medium">Cost Analysis</span>
                            </div>
                            <p className="text-sm">${item.intelligence.costBenefit.estimatedCost}</p>
                            <p className="text-xs text-gray-600">{item.intelligence.costBenefit.costCategory} cost</p>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Diagnostic Yield</span>
                            </div>
                            <Progress value={item.intelligence.costBenefit.diagnosticYield} className="h-2 mb-1" />
                            <p className="text-xs text-gray-600">{item.intelligence.costBenefit.diagnosticYield}% likelihood</p>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Brain className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium">Clinical Benefit</span>
                            </div>
                            <Progress value={item.intelligence.costBenefit.clinicalBenefit * 10} className="h-2 mb-1" />
                            <p className="text-xs text-gray-600">{item.intelligence.costBenefit.clinicalBenefit}/10 score</p>
                          </div>
                        </div>

                        {/* Clinical Rationale */}
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-teal-700">Clinical Rationale:</span>
                            <p className="text-sm">{item.clinicalRationale}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">Cost-Benefit Justification:</span>
                            <p className="text-sm text-gray-600">{item.intelligence.costBenefit.justification}</p>
                          </div>
                        </div>

                        {/* Contraindications & Warnings */}
                        {item.intelligence.contraindications.riskAssessment !== 'low' && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <Shield className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">Safety Assessment</span>
                              <Badge variant="outline" className="text-xs">
                                {item.intelligence.contraindications.riskAssessment} risk
                              </Badge>
                            </div>
                            {item.intelligence.contraindications.warnings.map((warning, idx) => (
                              <p key={idx} className="text-sm text-yellow-700">• {warning.description}</p>
                            ))}
                            {item.intelligence.contraindications.alternativeRecommendations.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs font-medium">Alternatives: </span>
                                {item.intelligence.contraindications.alternativeRecommendations.map((alt, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs mr-1">
                                    {alt}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Clinical Guidelines */}
          {guidelines.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Info className="h-5 w-5 text-blue-600 mr-2" />
                Evidence-Based Guidelines
              </h3>
              
              <div className="space-y-3">
                {guidelines.map((guideline, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{guideline.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          Level {guideline.evidenceLevel}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Source: {guideline.source}</p>
                      <p className="text-sm">{guideline.recommendation}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Clinical Notes */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Additional Clinical Notes</h3>
            <Textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Add any additional clinical reasoning, special considerations, or notes about the investigation plan..."
              className="min-h-[100px]"
            />
          </div>

          {/* Summary */}
          <Card className="bg-teal-50 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                <span className="font-medium">Investigation Summary</span>
              </div>
              <p className="text-sm text-teal-700">
                {selectedInvestigations.length} investigation(s) selected for {chiefComplaint}
              </p>
              {selectedInvestigations.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm font-medium">Selected:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedInvestigations.map(id => {
                      const item = investigationIntelligence.find(i => i.investigation.id === id);
                      return item ? (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {item.investigation.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={onBack}>
              Back to Clinical Summary
            </Button>
            
            <Button 
              onClick={handleSubmit}
              className="bg-teal-600 hover:bg-teal-700"
              disabled={selectedInvestigations.length === 0}
            >
              Submit Investigation Orders
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
