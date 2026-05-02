
// ABOUTME: Enhanced investigation service with AI-powered recommendations and clinical intelligence
// ABOUTME: Integrates cost-benefit analysis, contraindication checking, and evidence-based protocols

import { InvestigationDatabaseService } from './InvestigationDatabaseService';
import { CostBenefitAnalyzer } from './CostBenefitAnalyzer';
import { ContraindicationChecker } from './ContraindicationChecker';
import { InvestigationRecommendation } from '@/types/investigation-intelligence';

export class EnhancedInvestigationService {
  static generateSmartRecommendations(
    chiefComplaint: string,
    patientData: any
  ): any[] {
    const protocols = InvestigationDatabaseService.getEvidenceBasedProtocols();
    const complaint = chiefComplaint.toLowerCase();
    
    // Find matching protocol
    let relevantProtocol = null;
    if (complaint.includes('chest pain') || complaint.includes('chest')) {
      relevantProtocol = protocols['chest-pain'];
    } else if (complaint.includes('fatigue') || complaint.includes('tired')) {
      relevantProtocol = protocols['fatigue'];
    } else if (complaint.includes('shortness') || complaint.includes('breathless')) {
      relevantProtocol = protocols['shortness-of-breath'];
    }

    if (!relevantProtocol) {
      return this.getDefaultRecommendations(chiefComplaint);
    }

    // Generate recommendations based on protocol
    return relevantProtocol.investigations.map((inv: any) => {
      const investigation = {
        id: inv.name.toLowerCase().replace(/\s+/g, '-'),
        name: inv.name,
        type: this.getInvestigationType(inv.name),
        category: this.getInvestigationCategory(inv.name),
        indication: this.getInvestigationIndication(inv.name, chiefComplaint),
        urgency: this.mapTimingToUrgency(inv.timing),
        cost: this.getCostCategory(inv.name),
        rationale: this.getInvestigationRationale(inv.name, chiefComplaint)
      };

      return {
        investigation,
        priority: inv.priority,
        clinicalRationale: this.generateClinicalRationale(investigation, chiefComplaint),
        contraindications: this.getContraindications(investigation.id),
        intelligence: this.generateInvestigationIntelligence(
          investigation.id,
          patientData
        )
      };
    });
  }

  private static getDefaultRecommendations(chiefComplaint: string): any[] {
    const defaultInvestigations = [
      {
        id: 'fbc',
        name: 'Full Blood Count',
        type: 'laboratory',
        category: 'Hematology',
        indication: 'Screen for anemia, infection, hematological disorders',
        urgency: 'routine',
        cost: 'low',
        rationale: 'Basic screening investigation for most presentations'
      },
      {
        id: 'crp',
        name: 'C-Reactive Protein',
        type: 'laboratory', 
        category: 'Inflammatory Markers',
        indication: 'Detect inflammation or infection',
        urgency: 'routine',
        cost: 'low',
        rationale: 'Non-specific marker of inflammation'
      }
    ];

    return defaultInvestigations.map((inv, index) => ({
      investigation: inv,
      priority: index + 1,
      clinicalRationale: this.generateClinicalRationale(inv, chiefComplaint),
      contraindications: [],
      intelligence: this.generateInvestigationIntelligence(
        inv.id,
        {}
      )
    }));
  }

  private static getInvestigationType(name: string): string {
    const labTests = ['FBC', 'Troponin', 'TFT', 'BNP', 'CRP', 'HbA1c'];
    const imaging = ['X-ray', 'CT', 'MRI'];
    const cardiac = ['ECG', 'Echo'];

    if (labTests.some(test => name.includes(test))) return 'laboratory';
    if (imaging.some(img => name.includes(img))) return 'imaging';
    if (cardiac.some(card => name.includes(card))) return 'cardiac';
    return 'other';
  }

  private static getInvestigationCategory(name: string): string {
    const categories: Record<string, string> = {
      'FBC': 'Hematology',
      'Troponin': 'Cardiac Markers',
      'TFT': 'Endocrine',
      'BNP': 'Cardiac Markers',
      'CRP': 'Inflammatory Markers',
      'ECG': 'Cardiac',
      'Echo': 'Cardiac Imaging',
      'X-ray': 'Basic Imaging',
      'CT': 'Advanced Imaging',
      'MRI': 'Advanced Imaging'
    };

    for (const [key, category] of Object.entries(categories)) {
      if (name.includes(key)) return category;
    }
    return 'General';
  }

  private static getInvestigationIndication(name: string, chiefComplaint: string): string {
    const indications: Record<string, string> = {
      'FBC': 'Screen for anemia, infection, hematological disorders',
      'Troponin': 'Detect myocardial injury',
      'TFT': 'Rule out thyroid dysfunction',
      'BNP': 'Assess for heart failure',
      'CRP': 'Detect inflammation or infection',
      'ECG': 'Evaluate cardiac rhythm and conduction',
      'Echo': 'Assess cardiac structure and function',
      'Chest X-ray': 'Evaluate chest pathology'
    };

    for (const [key, indication] of Object.entries(indications)) {
      if (name.includes(key)) return indication;
    }
    return `Investigate ${chiefComplaint}`;
  }

  private static mapTimingToUrgency(timing: string): 'routine' | 'urgent' | 'stat' {
    switch (timing) {
      case 'immediate': return 'stat';
      case 'urgent':
      case 'within-30min':
      case 'within-24h': return 'urgent';
      default: return 'routine';
    }
  }

  private static getCostCategory(name: string): string {
    const costDb = InvestigationDatabaseService.getCostDatabase();
    const id = name.toLowerCase().replace(/\s+/g, '-');
    return costDb[id]?.category || 'moderate';
  }

  private static getInvestigationRationale(name: string, chiefComplaint: string): string {
    const rationales: Record<string, string> = {
      'FBC': 'Essential screening test to identify anemia, infection, or blood disorders',
      'Troponin': 'Gold standard biomarker for myocardial injury detection',
      'TFT': 'Thyroid disorders are common causes of fatigue and metabolic symptoms',
      'BNP': 'Highly sensitive and specific marker for heart failure',
      'CRP': 'Non-specific but useful marker of systemic inflammation',
      'ECG': 'First-line investigation for cardiac symptoms',
      'Echo': 'Non-invasive assessment of cardiac structure and function'
    };

    for (const [key, rationale] of Object.entries(rationales)) {
      if (name.includes(key)) return rationale;
    }
    return `Relevant investigation for ${chiefComplaint}`;
  }

  private static generateClinicalRationale(investigation: any, chiefComplaint: string): string {
    return `${investigation.rationale} - particularly relevant for ${chiefComplaint} presentation`;
  }

  private static getContraindications(investigationId: string): string[] {
    const contraDb = InvestigationDatabaseService.getContraindicationDatabase();
    const contraData = contraDb[investigationId];
    
    if (!contraData) return [];
    
    return [
      ...(contraData.absolute || []),
      ...(contraData.relative || [])
    ];
  }

  private static generateInvestigationIntelligence(
    investigationId: string,
    patientData: any
  ): any {
    const costBenefit = CostBenefitAnalyzer.analyzeCostBenefit(investigationId);

    const contraindications = ContraindicationChecker.checkContraindications(
      investigationId,
      patientData
    );

    const overallRecommendation: InvestigationRecommendation = {
      recommendation: this.determineRecommendation(costBenefit, contraindications),
      strength: this.calculateRecommendationStrength(costBenefit, contraindications),
      rationale: [
        `Clinical benefit: ${costBenefit.clinicalBenefit}/10`,
        `Diagnostic yield: ${costBenefit.diagnosticYield}%`,
        costBenefit.justification
      ],
      conditions: [],
      alternatives: contraindications.alternativeRecommendations
    };

    return {
      costBenefit,
      contraindications,
      overallRecommendation
    };
  }

  private static determineRecommendation(
    costBenefit: any,
    contraindications: any
  ): 'strongly-recommended' | 'recommended' | 'consider' | 'not-recommended' | 'contraindicated' {
    if (contraindications.riskAssessment === 'contraindicated') {
      return 'contraindicated';
    }
    
    if (costBenefit.clinicalBenefit >= 8 && costBenefit.diagnosticYield >= 80) {
      return 'strongly-recommended';
    }
    
    if (costBenefit.clinicalBenefit >= 6 && costBenefit.diagnosticYield >= 60) {
      return 'recommended';
    }
    
    if (costBenefit.clinicalBenefit >= 4) {
      return 'consider';
    }
    
    return 'not-recommended';
  }

  private static calculateRecommendationStrength(costBenefit: any, contraindications: any): number {
    let strength = costBenefit.clinicalBenefit;
    
    // Adjust for contraindications
    if (contraindications.riskAssessment === 'high') {
      strength -= 3;
    } else if (contraindications.riskAssessment === 'moderate') {
      strength -= 1;
    }
    
    return Math.max(1, Math.min(10, strength));
  }
}
