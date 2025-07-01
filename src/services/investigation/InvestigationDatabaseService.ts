
// ABOUTME: Enhanced investigation database service with comprehensive clinical data
// ABOUTME: Provides cost analysis, contraindication data, and evidence-based investigation protocols

export class InvestigationDatabaseService {
  static getCostDatabase(): Record<string, any> {
    return {
      'ecg': { 
        cost: 50, 
        category: 'very-low', 
        diagnosticYield: 85,
        clinicalBenefit: 9,
        turnaroundTime: '5 minutes'
      },
      'troponin': { 
        cost: 120, 
        category: 'low', 
        diagnosticYield: 75,
        clinicalBenefit: 8,
        turnaroundTime: '1 hour'
      },
      'fbc': { 
        cost: 30, 
        category: 'very-low', 
        diagnosticYield: 60,
        clinicalBenefit: 6,
        turnaroundTime: '2 hours'
      },
      'tft': { 
        cost: 80, 
        category: 'low', 
        diagnosticYield: 70,
        clinicalBenefit: 7,
        turnaroundTime: '4 hours'
      },
      'chest-xray': { 
        cost: 150, 
        category: 'low', 
        diagnosticYield: 65,
        clinicalBenefit: 7,
        turnaroundTime: '30 minutes'
      },
      'ct-chest': { 
        cost: 800, 
        category: 'high', 
        diagnosticYield: 90,
        clinicalBenefit: 9,
        turnaroundTime: '2 hours'
      },
      'mri-brain': { 
        cost: 1200, 
        category: 'very-high', 
        diagnosticYield: 95,
        clinicalBenefit: 9,
        turnaroundTime: '4 hours'
      },
      'echo': { 
        cost: 300, 
        category: 'moderate', 
        diagnosticYield: 80,
        clinicalBenefit: 8,
        turnaroundTime: '1 hour'
      },
      'bnp': {
        cost: 150,
        category: 'low',
        diagnosticYield: 78,
        clinicalBenefit: 7,
        turnaroundTime: '2 hours'
      },
      'crp': {
        cost: 25,
        category: 'very-low',
        diagnosticYield: 55,
        clinicalBenefit: 5,
        turnaroundTime: '1 hour'
      },
      'lipid-profile': {
        cost: 60,
        category: 'very-low',
        diagnosticYield: 70,
        clinicalBenefit: 6,
        turnaroundTime: '4 hours'
      },
      'hba1c': {
        cost: 40,
        category: 'very-low',
        diagnosticYield: 85,
        clinicalBenefit: 8,
        turnaroundTime: '2 hours'
      }
    };
  }

  static getContraindicationDatabase(): Record<string, any> {
    return {
      'ct-contrast': {
        absolute: [
          'Severe renal impairment (eGFR <30)', 
          'Previous severe contrast reaction',
          'Severe thyrotoxicosis'
        ],
        relative: [
          'Mild renal impairment', 
          'Diabetes with metformin', 
          'Pregnancy',
          'Multiple myeloma',
          'Dehydration'
        ],
        warnings: [
          { 
            category: 'renal', 
            description: 'Risk of contrast-induced nephropathy', 
            riskLevel: 'moderate',
            monitoring: ['Creatinine before and after', 'Adequate hydration']
          },
          { 
            category: 'allergy', 
            description: 'Risk of allergic reaction', 
            riskLevel: 'low',
            monitoring: ['Emergency medications available', 'Patient observation']
          }
        ]
      },
      'mri': {
        absolute: [
          'Pacemaker (non-MRI compatible)', 
          'Cochlear implants', 
          'Metallic foreign bodies in eyes',
          'Aneurysm clips (ferromagnetic)',
          'Insulin pumps'
        ],
        relative: [
          'Claustrophobia', 
          'Pregnancy (first trimester)',
          'Metallic implants',
          'Tattoos with metallic ink'
        ],
        warnings: [
          { 
            category: 'safety', 
            description: 'Metallic objects may cause injury or artifacts', 
            riskLevel: 'high',
            monitoring: ['Pre-scan metal screening', 'Patient questionnaire']
          }
        ]
      },
      'exercise-stress-test': {
        absolute: [
          'Unstable angina', 
          'Recent MI (<48 hours)', 
          'Severe aortic stenosis',
          'Uncontrolled arrhythmias',
          'Acute myocarditis'
        ],
        relative: [
          'Uncontrolled hypertension', 
          'Severe heart failure',
          'Left main coronary stenosis',
          'Hypertrophic cardiomyopathy'
        ],
        warnings: [
          { 
            category: 'cardiac', 
            description: 'Risk of cardiac events during stress', 
            riskLevel: 'moderate',
            monitoring: ['Continuous ECG', 'Emergency resuscitation available']
          }
        ]
      },
      'nuclear-medicine': {
        absolute: [
          'Pregnancy',
          'Breastfeeding (certain isotopes)'
        ],
        relative: [
          'Recent nuclear medicine study',
          'Claustrophobia'
        ],
        warnings: [
          {
            category: 'radiation',
            description: 'Radiation exposure',
            riskLevel: 'low',
            monitoring: ['Pregnancy test if applicable', 'Breastfeeding cessation advice']
          }
        ]
      }
    };
  }

  static getAlternativesDatabase(): Record<string, string[]> {
    return {
      'ct-chest': ['Chest X-ray', 'MRI chest', 'Ultrasound', 'Nuclear medicine scan'],
      'mri-brain': ['CT brain', 'Ultrasound (if applicable)', 'Nuclear medicine scan'],
      'stress-test': ['Echocardiogram', 'CT coronary angiography', 'Nuclear stress test'],
      'ct-contrast': ['CT without contrast', 'MRI', 'Ultrasound'],
      'mri': ['CT scan', 'Ultrasound', 'X-ray'],
      'nuclear-medicine': ['CT scan', 'MRI', 'Ultrasound'],
      'angiography': ['CT angiography', 'MR angiography', 'Doppler ultrasound']
    };
  }

  static getEvidenceBasedProtocols(): Record<string, any> {
    return {
      'chest-pain': {
        name: 'Chest Pain Investigation Protocol',
        evidenceLevel: 'A',
        source: 'AHA/ACC 2021 Guidelines',
        investigations: [
          { name: 'ECG', timing: 'immediate', priority: 1 },
          { name: 'Troponin', timing: 'immediate', priority: 1 },
          { name: 'Chest X-ray', timing: 'within-30min', priority: 2 },
          { name: 'Echocardiogram', timing: 'within-24h', priority: 3 }
        ]
      },
      'fatigue': {
        name: 'Fatigue Investigation Protocol',
        evidenceLevel: 'B',
        source: 'NICE Clinical Guidelines',
        investigations: [
          { name: 'FBC', timing: 'routine', priority: 1 },
          { name: 'TFT', timing: 'routine', priority: 1 },
          { name: 'HbA1c', timing: 'routine', priority: 2 },
          { name: 'Lipid profile', timing: 'routine', priority: 3 }
        ]
      },
      'shortness-of-breath': {
        name: 'Dyspnea Investigation Protocol',
        evidenceLevel: 'A',
        source: 'ESC Heart Failure Guidelines',
        investigations: [
          { name: 'BNP', timing: 'urgent', priority: 1 },
          { name: 'Chest X-ray', timing: 'urgent', priority: 1 },
          { name: 'ECG', timing: 'immediate', priority: 1 },
          { name: 'Echocardiogram', timing: 'within-24h', priority: 2 }
        ]
      }
    };
  }

  static getInvestigationCategories(): Record<string, string[]> {
    return {
      'laboratory': [
        'fbc', 'troponin', 'tft', 'bnp', 'crp', 'lipid-profile', 'hba1c'
      ],
      'imaging': [
        'chest-xray', 'ct-chest', 'mri-brain'
      ],
      'cardiac': [
        'ecg', 'echo', 'exercise-stress-test'
      ],
      'pulmonary': [
        'chest-xray', 'ct-chest'
      ]
    };
  }
}
