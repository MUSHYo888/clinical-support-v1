
// ABOUTME: Investigation database service providing cost and contraindication data
// ABOUTME: Centralized repository for investigation costs, benefits, and safety information

export class InvestigationDatabaseService {
  static getCostDatabase(): Record<string, any> {
    return {
      'ecg': { cost: 50, category: 'very-low', diagnosticYield: 85 },
      'troponin': { cost: 120, category: 'low', diagnosticYield: 75 },
      'fbc': { cost: 30, category: 'very-low', diagnosticYield: 60 },
      'tft': { cost: 80, category: 'low', diagnosticYield: 70 },
      'chest-xray': { cost: 150, category: 'low', diagnosticYield: 65 },
      'ct-chest': { cost: 800, category: 'high', diagnosticYield: 90 },
      'mri-brain': { cost: 1200, category: 'very-high', diagnosticYield: 95 },
      'echo': { cost: 300, category: 'moderate', diagnosticYield: 80 }
    };
  }

  static getContraindicationDatabase(): Record<string, any> {
    return {
      'ct-contrast': {
        absolute: ['Severe renal impairment (eGFR <30)', 'Previous severe contrast reaction'],
        relative: ['Mild renal impairment', 'Diabetes with metformin', 'Pregnancy'],
        warnings: [
          { category: 'renal', description: 'Risk of contrast-induced nephropathy', riskLevel: 'moderate' },
          { category: 'allergy', description: 'Risk of allergic reaction', riskLevel: 'low' }
        ]
      },
      'mri': {
        absolute: ['Pacemaker (non-MRI compatible)', 'Cochlear implants', 'Metallic foreign bodies in eyes'],
        relative: ['Claustrophobia', 'Pregnancy (first trimester)'],
        warnings: [
          { category: 'other', description: 'Metallic implants may cause artifacts', riskLevel: 'low' }
        ]
      },
      'exercise-stress-test': {
        absolute: ['Unstable angina', 'Recent MI (<48 hours)', 'Severe aortic stenosis'],
        relative: ['Uncontrolled hypertension', 'Severe heart failure'],
        warnings: [
          { category: 'cardiac', description: 'Risk of cardiac events during stress', riskLevel: 'moderate' }
        ]
      }
    };
  }

  static getAlternativesDatabase(): Record<string, string[]> {
    return {
      'ct-chest': ['Chest X-ray', 'MRI chest', 'Ultrasound'],
      'mri-brain': ['CT brain', 'Ultrasound (if applicable)'],
      'stress-test': ['Echocardiogram', 'CT coronary angiography']
    };
  }
}
