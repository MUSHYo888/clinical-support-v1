// ABOUTME: Enhanced investigation intelligence service with AI integration
// ABOUTME: Provides comprehensive investigation analysis using enhanced database and AI services

import { 
  CostBenefitAnalysis, 
  EvidenceBasedPathway, 
  ContraindicationCheck, 
  FollowUpAlgorithm,
  InvestigationIntelligence,
  InvestigationRecommendation
} from '@/types/investigation-intelligence';
import { InvestigationDatabaseService } from './investigation/InvestigationDatabaseService';
import { CostBenefitAnalyzer } from './investigation/CostBenefitAnalyzer';
import { ContraindicationChecker } from './investigation/ContraindicationChecker';

export class InvestigationIntelligenceService {
  
  static analyzeCostBenefit(
    investigationId: string
  ): CostBenefitAnalysis {
    return CostBenefitAnalyzer.analyzeCostBenefit(investigationId);
  }

  static getEvidenceBasedPathway(
    chiefComplaint: string
  ): EvidenceBasedPathway {
    const protocols = InvestigationDatabaseService.getEvidenceBasedProtocols();
    const complaint = chiefComplaint.toLowerCase();
    
    // Find matching protocol
    if (complaint.includes('chest pain') || complaint.includes('chest')) {
      return this.createPathwayFromProtocol(protocols['chest-pain'], 'chest-pain');
    } else if (complaint.includes('fatigue') || complaint.includes('tired')) {
      return this.createPathwayFromProtocol(protocols['fatigue'], 'fatigue');
    } else if (complaint.includes('shortness') || complaint.includes('breathless')) {
      return this.createPathwayFromProtocol(protocols['shortness-of-breath'], 'shortness-of-breath');
    }
    
    // Default pathway
    return this.getDefaultPathway(chiefComplaint);
  }

  static checkContraindications(
    investigationId: string,
    patientData: any,
    medicalHistory: string[] = []
  ): ContraindicationCheck {
    return ContraindicationChecker.checkContraindications(
      investigationId,
      patientData,
      medicalHistory
    );
  }

  static generateFollowUpAlgorithm(investigationId: string): FollowUpAlgorithm {
    const algorithms: Record<string, FollowUpAlgorithm> = {
      'troponin': {
        algorithmId: 'troponin-followup',
        investigationId: 'troponin',
        resultCategories: [
          {
            category: 'normal',
            criteria: ['<0.04 ng/mL'],
            followUpAction: {
              action: 'routine-follow-up',
              timeframe: '24-48 hours',
              provider: 'primary-care',
              instructions: ['Monitor symptoms', 'Return if chest pain worsens']
            },
            timeframe: '24-48 hours'
          },
          {
            category: 'abnormal-mild',
            criteria: ['0.04-0.1 ng/mL'],
            followUpAction: {
              action: 'urgent-follow-up',
              timeframe: '6-12 hours',
              provider: 'specialist',
              instructions: ['Cardiology consultation', 'Serial troponins', 'ECG monitoring']
            },
            timeframe: '6-12 hours',
            repeatInvestigation: {
              timing: '6-12 hours',
              indication: 'Monitor trend',
              frequency: 'Every 6 hours x 3',
              stoppingCriteria: ['Stable or declining levels', 'Clinical improvement']
            }
          },
          {
            category: 'critical',
            criteria: ['>0.1 ng/mL'],
            followUpAction: {
              action: 'immediate-referral',
              timeframe: 'Immediate',
              provider: 'emergency',
              instructions: ['Emergency cardiology', 'Consider PCI', 'Intensive monitoring']
            },
            timeframe: 'Immediate'
          }
        ],
        defaultFollowUp: {
          action: 'routine-follow-up',
          timeframe: '24 hours',
          provider: 'primary-care',
          instructions: ['Clinical assessment', 'Symptom review']
        },
        urgentFollowUp: {
          action: 'urgent-follow-up',
          timeframe: '6 hours',
          provider: 'specialist',
          instructions: ['Specialist assessment', 'Additional investigations']
        },
        routineFollowUp: {
          action: 'routine-follow-up',
          timeframe: '1-2 weeks',
          provider: 'primary-care',
          instructions: ['General follow-up', 'Symptom monitoring']
        }
      }
    };

    return algorithms[investigationId] || this.getDefaultFollowUpAlgorithm(investigationId);
  }

  static generateInvestigationIntelligence(
    investigationId: string,
    chiefComplaint: string,
    patientData: any
  ): InvestigationIntelligence {
    const costBenefit = this.analyzeCostBenefit(investigationId);
    const pathway = this.getEvidenceBasedPathway(chiefComplaint);
    const contraindications = this.checkContraindications(investigationId, patientData);
    const followUp = this.generateFollowUpAlgorithm(investigationId);
    
    const overallRecommendation = this.generateOverallRecommendation(
      costBenefit,
      contraindications
    );

    return {
      costBenefit,
      pathway,
      contraindications,
      followUp,
      overallRecommendation
    };
  }

  // Helper methods
  private static createPathwayFromProtocol(protocol: any, pathwayId: string): EvidenceBasedPathway {
    return {
      pathwayId,
      name: protocol.name,
      condition: pathwayId.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      evidenceLevel: protocol.evidenceLevel,
      guidelineSource: protocol.source,
      steps: protocol.investigations.map((inv: any, index: number) => ({
        stepNumber: index + 1,
        investigationType: this.getInvestigationType(inv.name),
        investigationName: inv.name,
        timing: inv.timing,
        prerequisites: index > 0 ? [protocol.investigations[index - 1].name] : [],
        expectedOutcomes: this.getExpectedOutcomes(inv.name),
        nextStepCriteria: this.getNextStepCriteria(inv.name)
      })),
      decisionPoints: [
        {
          pointId: `${pathwayId}-decision-1`,
          condition: 'Initial investigation results',
          ifPositive: 'Proceed with urgent pathway',
          ifNegative: 'Continue with routine investigations',
          ifInconclusive: 'Repeat or consider alternative investigations',
          clinicalAction: 'Clinical correlation required'
        }
      ],
      estimatedTimeframe: this.estimateTimeframe(protocol.investigations),
      successRate: 85
    };
  }

  private static getDefaultPathway(chiefComplaint: string): EvidenceBasedPathway {
    return {
      pathwayId: 'general-pathway',
      name: 'General Investigation Pathway',
      condition: chiefComplaint,
      evidenceLevel: 'C',
      guidelineSource: 'Clinical Best Practice',
      steps: [
        {
          stepNumber: 1,
          investigationType: 'laboratory',
          investigationName: 'Basic Blood Tests',
          timing: 'routine',
          prerequisites: [],
          expectedOutcomes: ['Screen for common abnormalities'],
          nextStepCriteria: 'Based on clinical presentation'
        }
      ],
      decisionPoints: [],
      estimatedTimeframe: '1-2 days',
      successRate: 70
    };
  }

  private static getInvestigationType(name: string): string {
    if (name.includes('X-ray') || name.includes('CT') || name.includes('MRI')) return 'imaging';
    if (name.includes('ECG') || name.includes('Echo')) return 'cardiac';
    return 'laboratory';
  }

  private static getExpectedOutcomes(investigationName: string): string[] {
    const outcomes: Record<string, string[]> = {
      'FBC': ['Rule out anemia', 'Detect infection', 'Screen for blood disorders'],
      'Troponin': ['Detect myocardial injury', 'Rule out MI'],
      'ECG': ['Assess rhythm', 'Detect ischemia', 'Rule out arrhythmias'],
      'TFT': ['Rule out thyroid dysfunction'],
      'BNP': ['Assess for heart failure']
    };
    
    for (const [key, outcome] of Object.entries(outcomes)) {
      if (investigationName.includes(key)) return outcome;
    }
    return ['Investigate clinical presentation'];
  }

  private static getNextStepCriteria(investigationName: string): string {
    return `Based on ${investigationName} results and clinical correlation`;
  }

  private static estimateTimeframe(investigations: any[]): string {
    const urgentCount = investigations.filter(inv => inv.timing === 'immediate' || inv.timing === 'urgent').length;
    if (urgentCount > 0) return '2-6 hours for urgent investigations';
    return '1-2 days for routine investigations';
  }

  private static getDefaultFollowUpAlgorithm(investigationId: string): FollowUpAlgorithm {
    return {
      algorithmId: `${investigationId}-default`,
      investigationId,
      resultCategories: [
        {
          category: 'normal',
          criteria: ['Within normal limits'],
          followUpAction: {
            action: 'routine-follow-up',
            timeframe: '1-2 weeks',
            provider: 'primary-care',
            instructions: ['Clinical review', 'Symptom monitoring']
          },
          timeframe: '1-2 weeks'
        }
      ],
      defaultFollowUp: {
        action: 'routine-follow-up',
        timeframe: '1-2 weeks',
        provider: 'primary-care',
        instructions: ['Clinical assessment']
      },
      urgentFollowUp: {
        action: 'urgent-follow-up',
        timeframe: '24-48 hours',
        provider: 'specialist',
        instructions: ['Specialist review']
      },
      routineFollowUp: {
        action: 'routine-follow-up',
        timeframe: '1-2 weeks',
        provider: 'primary-care',
        instructions: ['General follow-up']
      }
    };
  }

  private static generateOverallRecommendation(
    costBenefit: CostBenefitAnalysis,
    contraindications: ContraindicationCheck
  ): InvestigationRecommendation {
    let recommendation: any = 'recommended';
    let strength = 7;

    // Adjust based on contraindications
    if (contraindications.riskAssessment === 'contraindicated') {
      recommendation = 'contraindicated';
      strength = 1;
    } else if (contraindications.riskAssessment === 'high') {
      recommendation = 'not-recommended';
      strength = 3;
    }

    // Adjust based on cost-benefit
    if (costBenefit.costEffectivenessRatio > 100 && costBenefit.clinicalBenefit < 6) {
      recommendation = 'consider';
      strength = Math.max(strength - 2, 1);
    }

    return {
      recommendation,
      strength,
      rationale: [
        `Clinical benefit score: ${costBenefit.clinicalBenefit}/10`,
        `Diagnostic yield: ${costBenefit.diagnosticYield}%`,
        `Cost-effectiveness ratio: ${costBenefit.costEffectivenessRatio.toFixed(2)}`
      ],
      conditions: [],
      alternatives: contraindications.alternativeRecommendations
    };
  }
}
