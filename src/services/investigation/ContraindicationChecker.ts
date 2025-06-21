
// ABOUTME: Contraindication checking service for clinical investigations
// ABOUTME: Evaluates patient safety and identifies contraindications for investigations

import { ContraindicationCheck, Contraindication, Warning, Precaution } from '@/types/investigation-intelligence';
import { InvestigationDatabaseService } from './InvestigationDatabaseService';

export class ContraindicationChecker {
  static checkContraindications(
    investigationId: string,
    patientData: any,
    medications: string[] = [],
    allergies: string[] = [],
    medicalHistory: string[] = []
  ): ContraindicationCheck {
    const contraindicationDatabase = InvestigationDatabaseService.getContraindicationDatabase();
    const contraData = contraindicationDatabase[investigationId] || { absolute: [], relative: [], warnings: [] };
    
    const detectedContraindications = this.detectContraindications(contraData, patientData, medicalHistory);
    const alternativesDb = InvestigationDatabaseService.getAlternativesDatabase();
    
    return {
      investigationId,
      contraindications: detectedContraindications.contraindications,
      warnings: detectedContraindications.warnings,
      precautions: detectedContraindications.precautions,
      riskAssessment: detectedContraindications.riskLevel,
      alternativeRecommendations: alternativesDb[investigationId] || []
    };
  }

  private static detectContraindications(contraData: any, patientData: any, history: string[]) {
    // Simplified contraindication detection logic
    const contraindications: Contraindication[] = [];
    const warnings: Warning[] = contraData.warnings || [];
    const precautions: Precaution[] = [];

    // Check absolute contraindications
    contraData.absolute?.forEach((condition: string) => {
      if (history.some(h => h.toLowerCase().includes(condition.toLowerCase()))) {
        contraindications.push({
          type: 'absolute',
          condition,
          reason: 'Medical history indicates absolute contraindication',
          severity: 'severe'
        });
      }
    });

    // Check relative contraindications
    contraData.relative?.forEach((condition: string) => {
      if (history.some(h => h.toLowerCase().includes(condition.toLowerCase()))) {
        contraindications.push({
          type: 'relative',
          condition,
          reason: 'Medical history indicates relative contraindication',
          severity: 'moderate'
        });
      }
    });

    const riskLevel = contraindications.some(c => c.type === 'absolute') ? 'contraindicated' :
                     contraindications.some(c => c.type === 'relative') ? 'high' : 'low';

    return {
      contraindications,
      warnings,
      precautions,
      riskLevel: riskLevel as 'low' | 'moderate' | 'high' | 'contraindicated'
    };
  }
}
