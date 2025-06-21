
// ABOUTME: Cost-benefit analysis service for clinical investigations
// ABOUTME: Calculates clinical benefit, diagnostic yield, and cost-effectiveness ratios

import { CostBenefitAnalysis } from '@/types/investigation-intelligence';
import { InvestigationDatabaseService } from './InvestigationDatabaseService';

export class CostBenefitAnalyzer {
  static analyzeCostBenefit(
    investigationId: string,
    patientData: any,
    clinicalContext: any
  ): CostBenefitAnalysis {
    const costDatabase = InvestigationDatabaseService.getCostDatabase();
    const costData = costDatabase[investigationId] || { cost: 200, category: 'moderate', diagnosticYield: 70 };
    
    const clinicalBenefit = this.calculateClinicalBenefit(investigationId, patientData, clinicalContext);
    const diagnosticYield = this.calculateDiagnosticYield(investigationId, patientData);
    
    return {
      investigationId,
      estimatedCost: costData.cost,
      currency: 'USD',
      costCategory: costData.category,
      clinicalBenefit,
      diagnosticYield,
      costEffectivenessRatio: costData.cost / diagnosticYield,
      alternativesAvailable: this.hasAlternatives(investigationId),
      justification: this.generateCostJustification(investigationId, clinicalBenefit, diagnosticYield)
    };
  }

  private static calculateClinicalBenefit(investigationId: string, patientData: any, context: any): number {
    const benefitScores: Record<string, number> = {
      'ecg': 9, 'troponin': 8, 'fbc': 6, 'tft': 7, 'chest-xray': 7, 'ct-chest': 9, 'mri-brain': 9
    };
    return benefitScores[investigationId] || 6;
  }

  private static calculateDiagnosticYield(investigationId: string, patientData: any): number {
    const diagnosticYieldScores: Record<string, number> = {
      'ecg': 85, 'troponin': 75, 'fbc': 60, 'tft': 70, 'chest-xray': 65, 'ct-chest': 90
    };
    return diagnosticYieldScores[investigationId] || 70;
  }

  private static hasAlternatives(investigationId: string): boolean {
    const alternatives = InvestigationDatabaseService.getAlternativesDatabase();
    return Boolean(alternatives[investigationId]);
  }

  private static generateCostJustification(id: string, benefit: number, diagnosticYield: number): string {
    if (benefit >= 8 && diagnosticYield >= 80) return 'High clinical benefit with excellent diagnostic yield justifies cost';
    if (benefit >= 6 && diagnosticYield >= 60) return 'Moderate benefit-cost ratio, clinically justified';
    return 'Consider alternatives due to lower cost-effectiveness ratio';
  }
}
