// ABOUTME: AI-powered specialty recommendation service for medical referrals
// ABOUTME: Analyzes clinical data to suggest appropriate medical specialties with confidence scores

import { DifferentialDiagnosis, Answer, ReviewOfSystems } from '@/types/medical';

interface SpecialtyRecommendation {
  specialty: string;
  reason: string;
  confidence: number;
  keyIndicators: string[];
}

interface SpecialtyMapping {
  keywords: string[];
  symptoms: string[];
  conditions: string[];
  priority: number;
}

export class SpecialtyRecommendationService {
  private static specialtyMappings: Record<string, SpecialtyMapping> = {
    'Cardiology': {
      keywords: ['chest pain', 'heart', 'cardiac', 'arrhythmia', 'palpitations', 'dyspnea', 'edema'],
      symptoms: ['chest pain', 'shortness of breath', 'palpitations', 'dizziness', 'syncope', 'fatigue'],
      conditions: ['myocardial infarction', 'heart failure', 'atrial fibrillation', 'coronary artery disease', 'hypertension'],
      priority: 9
    },
    'Neurology': {
      keywords: ['headache', 'seizure', 'stroke', 'neurological', 'weakness', 'numbness', 'memory'],
      symptoms: ['headache', 'weakness', 'numbness', 'confusion', 'memory loss', 'vision changes'],
      conditions: ['stroke', 'seizure', 'migraine', 'multiple sclerosis', 'parkinson', 'dementia'],
      priority: 9
    },
    'Gastroenterology': {
      keywords: ['abdominal pain', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'gi', 'liver'],
      symptoms: ['abdominal pain', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'weight loss'],
      conditions: ['inflammatory bowel', 'peptic ulcer', 'hepatitis', 'cirrhosis', 'pancreatitis'],
      priority: 7
    },
    'Endocrinology': {
      keywords: ['diabetes', 'thyroid', 'hormone', 'glucose', 'weight', 'metabolic', 'insulin'],
      symptoms: ['weight loss', 'weight gain', 'fatigue', 'excessive thirst', 'frequent urination'],
      conditions: ['diabetes', 'hyperthyroidism', 'hypothyroidism', 'cushing', 'addison'],
      priority: 6
    },
    'Rheumatology': {
      keywords: ['joint pain', 'arthritis', 'lupus', 'rheumatoid', 'autoimmune', 'inflammation'],
      symptoms: ['joint pain', 'joint swelling', 'morning stiffness', 'rash', 'fever'],
      conditions: ['rheumatoid arthritis', 'lupus', 'fibromyalgia', 'gout', 'osteoarthritis'],
      priority: 6
    },
    'Psychiatry': {
      keywords: ['depression', 'anxiety', 'mood', 'psychiatric', 'mental health', 'suicidal'],
      symptoms: ['depression', 'anxiety', 'mood changes', 'sleep disturbance', 'panic attacks'],
      conditions: ['major depression', 'anxiety disorder', 'bipolar', 'schizophrenia', 'ptsd'],
      priority: 8
    },
    'Orthopedics': {
      keywords: ['fracture', 'bone', 'joint', 'back pain', 'knee', 'shoulder', 'hip'],
      symptoms: ['bone pain', 'joint pain', 'back pain', 'limited mobility', 'swelling'],
      conditions: ['fracture', 'osteoarthritis', 'herniated disc', 'torn ligament', 'tendonitis'],
      priority: 5
    },
    'Dermatology': {
      keywords: ['rash', 'skin', 'lesion', 'mole', 'eczema', 'psoriasis', 'dermatitis'],
      symptoms: ['rash', 'itching', 'skin changes', 'lesions', 'hair loss'],
      conditions: ['eczema', 'psoriasis', 'melanoma', 'dermatitis', 'acne'],
      priority: 4
    },
    'Oncology': {
      keywords: ['cancer', 'tumor', 'mass', 'malignancy', 'chemotherapy', 'oncology'],
      symptoms: ['unexplained weight loss', 'fatigue', 'persistent pain', 'lumps'],
      conditions: ['cancer', 'tumor', 'malignancy', 'metastasis', 'lymphoma'],
      priority: 10
    },
    'Emergency Medicine': {
      keywords: ['emergency', 'acute', 'severe', 'critical', 'urgent', 'life-threatening'],
      symptoms: ['severe pain', 'difficulty breathing', 'chest pain', 'loss of consciousness'],
      conditions: ['myocardial infarction', 'stroke', 'sepsis', 'trauma', 'overdose'],
      priority: 10
    }
  };

  static async getSpecialtyRecommendations(
    chiefComplaint: string,
    differentials: DifferentialDiagnosis[],
    answers: Record<string, Answer>,
    rosData: ReviewOfSystems
  ): Promise<SpecialtyRecommendation[]> {
    
    const recommendations: SpecialtyRecommendation[] = [];
    
    // Combine all text data for analysis
    const clinicalText = [
      chiefComplaint,
      Object.values(answers).map(a => `${a.value} ${a.notes || ''}`).join(' '),
      Object.values(rosData).map(ros => 
        [...(ros.positive || []), ...(ros.negative || []), ros.notes || ''].join(' ')
      ).join(' '),
      differentials.map(d => d.condition).join(' ')
    ].join(' ').toLowerCase();

    // Analyze each specialty
    for (const [specialty, mapping] of Object.entries(this.specialtyMappings)) {
      const score = this.calculateSpecialtyScore(clinicalText, differentials, mapping);
      
      if (score.confidence > 0.2) { // Only include if there's reasonable confidence
        const reason = this.generateReason(score.matches, differentials, specialty);
        
        recommendations.push({
          specialty,
          reason,
          confidence: score.confidence,
          keyIndicators: score.matches
        });
      }
    }

    // Sort by confidence score and priority
    recommendations.sort((a, b) => {
      const aPriority = this.specialtyMappings[a.specialty]?.priority || 0;
      const bPriority = this.specialtyMappings[b.specialty]?.priority || 0;
      
      // First sort by confidence, then by priority
      if (Math.abs(a.confidence - b.confidence) < 0.1) {
        return bPriority - aPriority;
      }
      return b.confidence - a.confidence;
    });

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  private static calculateSpecialtyScore(
    clinicalText: string,
    differentials: DifferentialDiagnosis[],
    mapping: SpecialtyMapping
  ): { confidence: number; matches: string[] } {
    let score = 0;
    let maxScore = 0;
    const matches: string[] = [];

    // Check keywords (weight: 2)
    mapping.keywords.forEach(keyword => {
      maxScore += 2;
      if (clinicalText.includes(keyword.toLowerCase())) {
        score += 2;
        matches.push(`Keyword: ${keyword}`);
      }
    });

    // Check symptoms (weight: 1.5)
    mapping.symptoms.forEach(symptom => {
      maxScore += 1.5;
      if (clinicalText.includes(symptom.toLowerCase())) {
        score += 1.5;
        matches.push(`Symptom: ${symptom}`);
      }
    });

    // Check differential diagnoses (weight: 3)
    mapping.conditions.forEach(condition => {
      maxScore += 3;
      const conditionMatches = differentials.some(diff => 
        diff.condition.toLowerCase().includes(condition.toLowerCase()) ||
        condition.toLowerCase().includes(diff.condition.toLowerCase())
      );
      if (conditionMatches) {
        score += 3;
        matches.push(`Condition match: ${condition}`);
      }
    });

    // Check for high-probability differentials in specialty area
    differentials.forEach(diff => {
      if (diff.probability > 70) {
        maxScore += 2;
        const specialtyMatch = mapping.conditions.some(condition =>
          diff.condition.toLowerCase().includes(condition.toLowerCase()) ||
          condition.toLowerCase().includes(diff.condition.toLowerCase())
        );
        if (specialtyMatch) {
          score += 2;
          matches.push(`High probability differential: ${diff.condition}`);
        }
      }
    });

    const confidence = maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
    
    return { confidence, matches };
  }

  private static generateReason(
    matches: string[],
    differentials: DifferentialDiagnosis[],
    specialty: string
  ): string {
    if (matches.length === 0) {
      return `General ${specialty.toLowerCase()} consultation may be beneficial`;
    }

    const reasonParts: string[] = [];

    // Add differential-based reasons
    const conditionMatches = matches.filter(m => m.startsWith('Condition match') || m.startsWith('High probability'));
    if (conditionMatches.length > 0) {
      reasonParts.push('Differential diagnoses suggest specialized evaluation');
    }

    // Add symptom-based reasons
    const symptomMatches = matches.filter(m => m.startsWith('Symptom'));
    if (symptomMatches.length > 0) {
      reasonParts.push('Clinical presentation indicates specialty consultation');
    }

    // Add keyword-based reasons
    const keywordMatches = matches.filter(m => m.startsWith('Keyword'));
    if (keywordMatches.length > 0) {
      reasonParts.push('Clinical features align with specialty expertise');
    }

    // Add specialty-specific reasoning
    const specialtyReasons = this.getSpecialtySpecificReason(specialty, differentials);
    if (specialtyReasons) {
      reasonParts.push(specialtyReasons);
    }

    return reasonParts.join('. ') || `Consultation recommended based on clinical presentation`;
  }

  private static getSpecialtySpecificReason(specialty: string, differentials: DifferentialDiagnosis[]): string {
    const highProbDifferentials = differentials.filter(d => d.probability > 60);
    
    switch (specialty) {
      case 'Cardiology':
        if (highProbDifferentials.some(d => d.condition.toLowerCase().includes('cardiac') || d.condition.toLowerCase().includes('heart'))) {
          return 'Cardiac evaluation and risk stratification needed';
        }
        return 'Cardiovascular assessment recommended';
        
      case 'Neurology':
        if (highProbDifferentials.some(d => d.condition.toLowerCase().includes('neurological') || d.condition.toLowerCase().includes('stroke'))) {
          return 'Neurological examination and diagnostic workup indicated';
        }
        return 'Specialized neurological evaluation needed';
        
      case 'Emergency Medicine':
        return 'Urgent evaluation required for acute presentation';
        
      case 'Oncology':
        return 'Further evaluation for potential malignancy indicated';
        
      default:
        return '';
    }
  }

  static getUrgencyRecommendation(
    specialty: string,
    differentials: DifferentialDiagnosis[],
    answers: Record<string, Answer>
  ): 'routine' | 'urgent' | 'stat' {
    
    // Check for emergency conditions
    const emergencyConditions = [
      'myocardial infarction', 'stroke', 'sepsis', 'pulmonary embolism',
      'acute abdomen', 'meningitis', 'anaphylaxis'
    ];
    
    const hasEmergencyCondition = differentials.some(diff =>
      emergencyConditions.some(emergency =>
        diff.condition.toLowerCase().includes(emergency) && diff.probability > 30
      )
    );
    
    if (hasEmergencyCondition) {
      return 'stat';
    }

    // Check for urgent conditions
    const urgentConditions = [
      'cancer', 'tumor', 'malignancy', 'acute', 'severe', 'unstable'
    ];
    
    const hasUrgentCondition = differentials.some(diff =>
      urgentConditions.some(urgent =>
        diff.condition.toLowerCase().includes(urgent) && diff.probability > 40
      )
    );
    
    if (hasUrgentCondition) {
      return 'urgent';
    }

    // Check answers for red flags
    const answerText = Object.values(answers).map(a => `${a.value} ${a.notes || ''}`).join(' ').toLowerCase();
    const redFlags = ['severe', 'worsening', 'progressive', 'acute', 'sudden'];
    
    if (redFlags.some(flag => answerText.includes(flag))) {
      return 'urgent';
    }

    return 'routine';
  }
}