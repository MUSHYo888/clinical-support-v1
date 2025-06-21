
// ABOUTME: Main AI service orchestrator for clinical AI features
// ABOUTME: Coordinates specialized AI services and provides unified interface

import { Question, DifferentialDiagnosis } from '@/types/medical';
import { AdvancedClinicalSupport } from '@/types/clinical-scores';
import { ClinicalScoringService } from '@/services/clinicalScoringService';
import { QuestionGeneratorService } from './ai/QuestionGeneratorService';
import { DifferentialDiagnosisService } from './ai/DifferentialDiagnosisService';
import { ClinicalSupportService } from './ai/ClinicalSupportService';

export class AIService {
  static async generateQuestions(
    chiefComplaint: string, 
    previousAnswers?: Record<string, any>
  ): Promise<Question[]> {
    return QuestionGeneratorService.generateQuestions(chiefComplaint, previousAnswers);
  }

  static async generateDifferentialDiagnosis(
    chiefComplaint: string,
    answers: Record<string, any>,
    rosData?: Record<string, any>
  ): Promise<DifferentialDiagnosis[]> {
    return DifferentialDiagnosisService.generateDifferentialDiagnosis(chiefComplaint, answers, rosData);
  }

  static async generateClinicalDecisionSupport(
    chiefComplaint: string,
    differentialDiagnoses: any[],
    answers: Record<string, any>,
    rosData?: Record<string, any>
  ): Promise<any> {
    return ClinicalSupportService.generateClinicalDecisionSupport(
      chiefComplaint, 
      differentialDiagnoses, 
      answers, 
      rosData
    );
  }

  static async generateAdvancedClinicalSupport(
    chiefComplaint: string,
    answers: Record<string, any>,
    rosData: Record<string, any>,
    vitalSigns?: any,
    demographics?: any
  ): Promise<AdvancedClinicalSupport> {
    try {
      console.log(`AIService: Generating advanced clinical support for: ${chiefComplaint}`);
      
      const age = demographics?.age || 50;
      const vitals = vitalSigns || {
        systolicBP: 120,
        diastolicBP: 80,
        heartRate: 80,
        respiratoryRate: 16,
        temperature: 37,
        oxygenSaturation: 98
      };

      const severityScores = this.calculateRelevantScores(chiefComplaint, answers, vitals, age);
      
      const riskAssessment = ClinicalScoringService.assessOverallRisk(
        age,
        vitals,
        this.extractComorbidities(rosData),
        Object.values(answers).map(a => String(a.value))
      );

      const clinicalAlerts = this.generateClinicalAlerts(chiefComplaint, answers, vitals, severityScores);

      const triageRecommendation = ClinicalScoringService.generateTriageRecommendation(
        riskAssessment.overallRisk,
        severityScores,
        clinicalAlerts
      );

      return {
        severityScores,
        riskAssessment,
        triageRecommendation,
        clinicalAlerts
      };

    } catch (error) {
      console.error('Error generating advanced clinical support:', error);
      return this.getFallbackAdvancedSupport(chiefComplaint);
    }
  }

  private static calculateRelevantScores(
    chiefComplaint: string,
    answers: Record<string, any>,
    vitals: any,
    age: number
  ) {
    const scores = [];
    const complaint = chiefComplaint.toLowerCase();

    if (complaint.includes('fever') || complaint.includes('infection') || complaint.includes('sepsis')) {
      const qsofa = ClinicalScoringService.calculateQSOFA(
        vitals.systolicBP,
        vitals.respiratoryRate,
        15
      );
      scores.push(qsofa);
    }

    if (complaint.includes('cough') || complaint.includes('pneumonia') || complaint.includes('chest')) {
      const curb65 = ClinicalScoringService.calculateCURB65(
        false,
        5,
        vitals.respiratoryRate,
        vitals.systolicBP,
        vitals.diastolicBP,
        age
      );
      scores.push(curb65);
    }

    if (complaint.includes('chest pain') || complaint.includes('shortness of breath') || complaint.includes('breathless')) {
      const wellsPE = ClinicalScoringService.calculateWellsPE(
        true,
        true,
        vitals.heartRate,
        false,
        false,
        false,
        false
      );
      scores.push(wellsPE);
    }

    return scores;
  }

  private static extractComorbidities(rosData: Record<string, any>): string[] {
    const comorbidities: string[] = [];
    
    Object.entries(rosData).forEach(([system, data]: [string, any]) => {
      if (data.positive && Array.isArray(data.positive)) {
        comorbidities.push(...data.positive);
      }
    });

    return comorbidities;
  }

  private static generateClinicalAlerts(
    chiefComplaint: string,
    answers: Record<string, any>,
    vitals: any,
    severityScores: any[]
  ) {
    const alerts = [];

    if (vitals.systolicBP < 90) {
      alerts.push({
        id: 'hypotension',
        type: 'critical',
        title: 'Critical Hypotension',
        message: 'Systolic BP < 90 mmHg indicates hemodynamic compromise',
        triggeredBy: ['vital signs'],
        actions: ['IV access', 'Fluid resuscitation', 'Urgent physician review']
      });
    }

    if (vitals.heartRate > 120) {
      alerts.push({
        id: 'tachycardia',
        type: 'warning',
        title: 'Significant Tachycardia',
        message: 'Heart rate > 120 bpm may indicate stress response or pathology',
        triggeredBy: ['vital signs'],
        actions: ['ECG', 'Continuous monitoring', 'Assess for underlying cause']
      });
    }

    if (vitals.oxygenSaturation < 92) {
      alerts.push({
        id: 'hypoxia',
        type: 'critical',
        title: 'Severe Hypoxia',
        message: 'Oxygen saturation < 92% requires immediate intervention',
        triggeredBy: ['vital signs'],
        actions: ['High-flow oxygen', 'ABG analysis', 'Consider ventilatory support']
      });
    }

    severityScores.forEach(score => {
      if (score.riskLevel === 'high' || score.riskLevel === 'critical') {
        alerts.push({
          id: `score-${score.id}`,
          type: score.riskLevel === 'critical' ? 'critical' : 'warning',
          title: `High ${score.name}`,
          message: `${score.interpretation}`,
          triggeredBy: [score.name],
          actions: score.recommendations
        });
      }
    });

    return alerts;
  }

  private static getFallbackAdvancedSupport(chiefComplaint: string): AdvancedClinicalSupport {
    return {
      severityScores: [],
      riskAssessment: {
        overallRisk: 'moderate',
        riskScore: 3,
        maxRiskScore: 10,
        riskFactors: [
          {
            factor: 'Presenting complaint requires evaluation',
            present: true,
            weight: 3,
            description: 'Patient requires clinical assessment'
          }
        ],
        recommendations: [
          'Clinical assessment required',
          'Monitor vital signs',
          'Consider basic investigations'
        ]
      },
      triageRecommendation: {
        priority: 'urgent',
        timeframe: 'Within 30 minutes',
        location: 'emergency',
        reasoning: 'Standard triage for presenting complaint',
        immediateActions: ['Basic observations', 'Nursing assessment']
      },
      clinicalAlerts: []
    };
  }
}
