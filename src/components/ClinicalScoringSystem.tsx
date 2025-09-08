// ABOUTME: Clinical scoring systems component for calculating severity scores and risk assessments
// ABOUTME: Provides interactive calculators for QSOFA, CURB-65, Wells scores with real-time clinical insights

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Activity,
  Heart,
  Thermometer,
  Brain,
  Target,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { ClinicalScoringService } from '@/services/clinicalScoringService';
import { SeverityScore, RiskAssessment, TriageRecommendation } from '@/types/clinical-scores';

interface ClinicalScoringSystemProps {
  chiefComplaint: string;
  patientData?: any;
}

export function ClinicalScoringSystem({ chiefComplaint, patientData }: ClinicalScoringSystemProps) {
  // QSOFA Score State
  const [qsofaData, setQsofaData] = useState({
    systolicBP: '',
    respiratoryRate: '',
    glasgowComaScale: '15'
  });

  // CURB-65 Score State  
  const [curb65Data, setCurb65Data] = useState({
    confusion: false,
    urea: '',
    respiratoryRate: '',
    systolicBP: '',
    diastolicBP: '',
    age: ''
  });

  // Wells Score State
  const [wellsData, setWellsData] = useState({
    clinicalSigns: false,
    alternativeDiagnosis: false,
    heartRate: '',
    immobilization: false,
    previousPE: false,
    hemoptysis: false,
    malignancy: false
  });

  // Calculated Scores
  const [qsofaScore, setQsofaScore] = useState<SeverityScore | null>(null);
  const [curb65Score, setCurb65Score] = useState<SeverityScore | null>(null);
  const [wellsScore, setWellsScore] = useState<SeverityScore | null>(null);
  const [overallRisk, setOverallRisk] = useState<RiskAssessment | null>(null);
  const [triageRecommendation, setTriageRecommendation] = useState<TriageRecommendation | null>(null);

  // Calculate QSOFA Score
  const calculateQSOFA = () => {
    const systolic = parseInt(qsofaData.systolicBP);
    const respiratory = parseInt(qsofaData.respiratoryRate);
    const gcs = parseInt(qsofaData.glasgowComaScale);

    if (isNaN(systolic) || isNaN(respiratory) || isNaN(gcs)) return;

    const score = ClinicalScoringService.calculateQSOFA(systolic, respiratory, gcs);
    setQsofaScore(score);
  };

  // Calculate CURB-65 Score
  const calculateCURB65 = () => {
    const urea = parseFloat(curb65Data.urea);
    const respiratory = parseInt(curb65Data.respiratoryRate);
    const systolic = parseInt(curb65Data.systolicBP);
    const diastolic = parseInt(curb65Data.diastolicBP);
    const age = parseInt(curb65Data.age);

    if (isNaN(urea) || isNaN(respiratory) || isNaN(systolic) || isNaN(diastolic) || isNaN(age)) return;

    const score = ClinicalScoringService.calculateCURB65(
      curb65Data.confusion, urea, respiratory, systolic, diastolic, age
    );
    setCurb65Score(score);
  };

  // Calculate Wells Score
  const calculateWells = () => {
    const heartRate = parseInt(wellsData.heartRate);
    if (isNaN(heartRate)) return;

    const score = ClinicalScoringService.calculateWellsPE(
      wellsData.clinicalSigns,
      wellsData.alternativeDiagnosis,
      heartRate,
      wellsData.immobilization,
      wellsData.previousPE,
      wellsData.hemoptysis,
      wellsData.malignancy
    );
    setWellsScore(score);
  };

  // Calculate Overall Risk Assessment
  const calculateOverallRisk = () => {
    if (!patientData) return;

    const age = parseInt(curb65Data.age) || patientData.age || 0;
    const vitalSigns = {
      systolicBP: parseInt(qsofaData.systolicBP) || 120,
      respiratoryRate: parseInt(qsofaData.respiratoryRate) || 16,
      heartRate: parseInt(wellsData.heartRate) || 80
    };

    const risk = ClinicalScoringService.assessOverallRisk(
      age,
      vitalSigns,
      patientData.comorbidities || [],
      [chiefComplaint]
    );
    setOverallRisk(risk);

    // Generate triage recommendation
    const scores = [qsofaScore, curb65Score, wellsScore].filter(Boolean) as SeverityScore[];
    if (scores.length > 0) {
      const triage = ClinicalScoringService.generateTriageRecommendation(
        risk.overallRisk,
        scores,
        []
      );
      setTriageRecommendation(triage);
    }
  };

  // Auto-calculate when data changes
  useEffect(() => {
    calculateQSOFA();
  }, [qsofaData]);

  useEffect(() => {
    calculateCURB65();
  }, [curb65Data]);

  useEffect(() => {
    calculateWells();
  }, [wellsData]);

  useEffect(() => {
    if (qsofaScore || curb65Score || wellsScore) {
      calculateOverallRisk();
    }
  }, [qsofaScore, curb65Score, wellsScore, patientData]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-success text-success-foreground';
      case 'moderate': return 'bg-warning text-warning-foreground';
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'critical': return 'bg-destructive text-destructive-foreground animate-pulse';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'routine': return 'bg-success text-success-foreground';
      case 'urgent': return 'bg-warning text-warning-foreground';
      case 'emergency': return 'bg-destructive text-destructive-foreground';
      case 'resuscitation': return 'bg-destructive text-destructive-foreground animate-pulse';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Calculator className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-semibold">Clinical Scoring Systems</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QSOFA Score Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>qSOFA Score</span>
              <Badge variant="outline">Sepsis Screening</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="systolic-bp">Systolic BP (mmHg)</Label>
                <Input
                  id="systolic-bp"
                  type="number"
                  placeholder="120"
                  value={qsofaData.systolicBP}
                  onChange={(e) => setQsofaData(prev => ({...prev, systolicBP: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="respiratory-rate">Respiratory Rate</Label>
                <Input
                  id="respiratory-rate"
                  type="number"
                  placeholder="16"
                  value={qsofaData.respiratoryRate}
                  onChange={(e) => setQsofaData(prev => ({...prev, respiratoryRate: e.target.value}))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="gcs">Glasgow Coma Scale</Label>
              <Input
                id="gcs"
                type="number"
                min="3"
                max="15"
                placeholder="15"
                value={qsofaData.glasgowComaScale}
                onChange={(e) => setQsofaData(prev => ({...prev, glasgowComaScale: e.target.value}))}
              />
            </div>
            
            {qsofaScore && (
              <Alert className={`border-2 ${qsofaScore.riskLevel === 'high' ? 'border-destructive' : 'border-success'}`}>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Score: {qsofaScore.score}/{qsofaScore.maxScore}</span>
                    <Badge className={getRiskLevelColor(qsofaScore.riskLevel)}>
                      {qsofaScore.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{qsofaScore.interpretation}</p>
                  <ul className="text-xs space-y-1">
                    {qsofaScore.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* CURB-65 Score Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5 text-primary" />
              <span>CURB-65 Score</span>
              <Badge variant="outline">Pneumonia Severity</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confusion"
                checked={curb65Data.confusion}
                onCheckedChange={(checked) => setCurb65Data(prev => ({...prev, confusion: !!checked}))}
              />
              <Label htmlFor="confusion">Confusion present</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="urea">Urea (mmol/L)</Label>
                <Input
                  id="urea"
                  type="number"
                  placeholder="7.0"
                  step="0.1"
                  value={curb65Data.urea}
                  onChange={(e) => setCurb65Data(prev => ({...prev, urea: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="curb-rr">Respiratory Rate</Label>
                <Input
                  id="curb-rr"
                  type="number"
                  placeholder="16"
                  value={curb65Data.respiratoryRate}
                  onChange={(e) => setCurb65Data(prev => ({...prev, respiratoryRate: e.target.value}))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="curb-systolic">Systolic BP</Label>
                <Input
                  id="curb-systolic"
                  type="number"
                  placeholder="120"
                  value={curb65Data.systolicBP}
                  onChange={(e) => setCurb65Data(prev => ({...prev, systolicBP: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="curb-diastolic">Diastolic BP</Label>
                <Input
                  id="curb-diastolic"
                  type="number"
                  placeholder="80"
                  value={curb65Data.diastolicBP}
                  onChange={(e) => setCurb65Data(prev => ({...prev, diastolicBP: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="curb-age">Age (years)</Label>
                <Input
                  id="curb-age"
                  type="number"
                  placeholder="65"
                  value={curb65Data.age}
                  onChange={(e) => setCurb65Data(prev => ({...prev, age: e.target.value}))}
                />
              </div>
            </div>

            {curb65Score && (
              <Alert className={`border-2 ${curb65Score.riskLevel === 'high' ? 'border-destructive' : 'border-success'}`}>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Score: {curb65Score.score}/{curb65Score.maxScore}</span>
                    <Badge className={getRiskLevelColor(curb65Score.riskLevel)}>
                      {curb65Score.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{curb65Score.interpretation}</p>
                  <ul className="text-xs space-y-1">
                    {curb65Score.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Wells Score Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-primary" />
              <span>Wells Score</span>
              <Badge variant="outline">PE Probability</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clinical-signs"
                  checked={wellsData.clinicalSigns}
                  onCheckedChange={(checked) => setWellsData(prev => ({...prev, clinicalSigns: !!checked}))}
                />
                <Label htmlFor="clinical-signs">Clinical signs of DVT</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alternative-diagnosis"
                  checked={wellsData.alternativeDiagnosis}
                  onCheckedChange={(checked) => setWellsData(prev => ({...prev, alternativeDiagnosis: !!checked}))}
                />
                <Label htmlFor="alternative-diagnosis">Alternative diagnosis less likely</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="immobilization"
                  checked={wellsData.immobilization}
                  onCheckedChange={(checked) => setWellsData(prev => ({...prev, immobilization: !!checked}))}
                />
                <Label htmlFor="immobilization">Immobilization/surgery (≥3 days)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="previous-pe"
                  checked={wellsData.previousPE}
                  onCheckedChange={(checked) => setWellsData(prev => ({...prev, previousPE: !!checked}))}
                />
                <Label htmlFor="previous-pe">Previous PE/DVT</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hemoptysis"
                  checked={wellsData.hemoptysis}
                  onCheckedChange={(checked) => setWellsData(prev => ({...prev, hemoptysis: !!checked}))}
                />
                <Label htmlFor="hemoptysis">Hemoptysis</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="malignancy"
                  checked={wellsData.malignancy}
                  onCheckedChange={(checked) => setWellsData(prev => ({...prev, malignancy: !!checked}))}
                />
                <Label htmlFor="malignancy">Active malignancy</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="wells-hr">Heart Rate (bpm)</Label>
              <Input
                id="wells-hr"
                type="number"
                placeholder="80"
                value={wellsData.heartRate}
                onChange={(e) => setWellsData(prev => ({...prev, heartRate: e.target.value}))}
              />
            </div>

            {wellsScore && (
              <Alert className={`border-2 ${wellsScore.riskLevel === 'high' ? 'border-destructive' : 'border-success'}`}>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Score: {wellsScore.score}</span>
                    <Badge className={getRiskLevelColor(wellsScore.riskLevel)}>
                      {wellsScore.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{wellsScore.interpretation}</p>
                  <ul className="text-xs space-y-1">
                    {wellsScore.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Overall Risk Assessment */}
        {overallRisk && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Overall Risk Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Risk Level:</span>
                <Badge className={getRiskLevelColor(overallRisk.overallRisk)}>
                  {overallRisk.overallRisk.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Risk Score:</span>
                <span>{overallRisk.riskScore}/{overallRisk.maxRiskScore}</span>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Risk Factors:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {overallRisk.riskFactors.map((factor, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm">
                      {factor.present ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                      <span className={factor.present ? 'text-destructive' : 'text-muted-foreground'}>
                        {factor.factor}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Clinical Recommendations:</h4>
                <ul className="space-y-1">
                  {overallRisk.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {triageRecommendation && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span>Triage Recommendation:</span>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Priority:</span>
                        <Badge className={getPriorityColor(triageRecommendation.priority)}>
                          {triageRecommendation.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Timeframe:</span>
                        <span className="text-sm">{triageRecommendation.timeframe}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Location:</span>
                        <span className="text-sm">{triageRecommendation.location}</span>
                      </div>
                      <div>
                        <span className="font-medium">Reasoning:</span>
                        <p className="text-sm text-muted-foreground mt-1">{triageRecommendation.reasoning}</p>
                      </div>
                      {triageRecommendation.immediateActions.length > 0 && (
                        <div>
                          <span className="font-medium">Immediate Actions:</span>
                          <ul className="text-sm mt-1 space-y-1">
                            {triageRecommendation.immediateActions.map((action, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <AlertTriangle className="h-3 w-3 mt-0.5 text-warning flex-shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}