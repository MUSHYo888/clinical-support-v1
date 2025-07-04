
// ABOUTME: Centralized fallback data service for AI responses
// ABOUTME: Provides mock questions, diagnoses, and clinical support when AI fails

import { Question, DifferentialDiagnosis } from '@/types/medical';
import { InvestigationRecommendation, RedFlag, ClinicalGuideline } from '@/types/medical';

// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class FallbackDataService {
  static getFallbackQuestions(chiefComplaint: string): Question[] {
    const fallbackQuestions: Record<string, Question[]> = {
      'headache': [
        {
          id: generateUUID(),
          text: 'How did the headache begin?',
          type: 'multiple-choice',
          options: ['Suddenly', 'Gradually', 'After eating', 'After injury', 'Woke up with it'],
          category: 'onset',
          required: true
        },
        {
          id: generateUUID(),
          text: 'On a scale of 1-10, how severe is the pain?',
          type: 'scale',
          category: 'severity',
          required: true
        },
        {
          id: generateUUID(),
          text: 'Where is the headache located?',
          type: 'multiple-choice',
          options: ['Frontal', 'Temporal', 'Occipital', 'Whole head', 'One side'],
          category: 'location',
          required: true
        },
        {
          id: generateUUID(),
          text: 'How would you describe the pain?',
          type: 'multiple-choice',
          options: ['Throbbing', 'Sharp', 'Dull', 'Burning', 'Pressure'],
          category: 'quality',
          required: true
        }
      ],
      'fatigue': [
        {
          id: generateUUID(),
          text: 'When did the fatigue begin?',
          type: 'multiple-choice',
          options: ['Days ago', 'Weeks ago', 'Months ago', 'Gradually over time', 'Suddenly'],
          category: 'onset',
          required: true
        },
        {
          id: generateUUID(),
          text: 'On a scale of 1-10, how severe is the fatigue?',
          type: 'scale',
          category: 'severity',
          required: true
        },
        {
          id: generateUUID(),
          text: 'What is the pattern of your fatigue?',
          type: 'multiple-choice',
          options: ['Constant throughout the day', 'Worse in morning', 'Worse in evening', 'Comes and goes', 'After activities'],
          category: 'timing',
          required: true
        },
        {
          id: generateUUID(),
          text: 'How is your sleep quality?',
          type: 'multiple-choice',
          options: ['Good, restful sleep', 'Difficulty falling asleep', 'Frequent awakening', 'Early morning awakening', 'Unrefreshing sleep'],
          category: 'associated',
          required: true
        }
      ],
      'chest pain': [
        {
          id: generateUUID(),
          text: 'How did the chest pain begin?',
          type: 'multiple-choice',
          options: ['Suddenly', 'Gradually', 'During exercise', 'At rest', 'While eating'],
          category: 'onset',
          required: true
        },
        {
          id: generateUUID(),
          text: 'On a scale of 1-10, how severe is the pain?',
          type: 'scale',
          category: 'severity',
          required: true
        },
        {
          id: generateUUID(),
          text: 'Where exactly is the chest pain?',
          type: 'multiple-choice',
          options: ['Center of chest', 'Left side', 'Right side', 'Under breastbone', 'Whole chest'],
          category: 'location',
          required: true
        },
        {
          id: generateUUID(),
          text: 'How would you describe the pain?',
          type: 'multiple-choice',
          options: ['Sharp', 'Crushing', 'Burning', 'Stabbing', 'Pressure', 'Tight'],
          category: 'quality',
          required: true
        }
      ]
    };

    const complaint = chiefComplaint.toLowerCase();
    
    // Try exact match first
    let questions = fallbackQuestions[complaint];
    
    // If no exact match, try partial matches
    if (!questions) {
      const matchingKey = Object.keys(fallbackQuestions).find(key => 
        complaint.includes(key) || key.includes(complaint)
      );
      questions = matchingKey ? fallbackQuestions[matchingKey] : null;
    }
    
    // If still no match, use generic questions based on symptoms
    if (!questions) {
      if (complaint.includes('pain')) {
        questions = fallbackQuestions['chest pain'];
      } else if (complaint.includes('tired') || complaint.includes('weak')) {
        questions = fallbackQuestions['fatigue'];
      } else {
        questions = fallbackQuestions['fatigue']; // Default fallback
      }
    }
    
    return questions || [];
  }

  static getFallbackDifferentials(chiefComplaint: string): DifferentialDiagnosis[] {
    const mockDiagnoses: Record<string, DifferentialDiagnosis[]> = {
      'headache': [
        {
          condition: 'Tension-type headache',
          probability: 65,
          explanation: 'Most common type of headache, typically bilateral and pressing/tightening in quality',
          keyFeatures: ['Bilateral location', 'Pressure sensation', 'Gradual onset']
        },
        {
          condition: 'Migraine',
          probability: 25,
          explanation: 'Recurrent headache disorder with characteristic features',
          keyFeatures: ['Unilateral', 'Throbbing', 'Associated nausea']
        },
        {
          condition: 'Cluster headache',
          probability: 10,
          explanation: 'Severe unilateral headache with autonomic features',
          keyFeatures: ['Severe unilateral pain', 'Short duration', 'Autonomic symptoms']
        }
      ],
      'fatigue': [
        {
          condition: 'Viral syndrome',
          probability: 40,
          explanation: 'Common viral infection causing systemic fatigue',
          keyFeatures: ['Recent onset', 'Associated symptoms', 'Self-limiting']
        },
        {
          condition: 'Iron deficiency anemia',
          probability: 30,
          explanation: 'Common cause of chronic fatigue, especially in women',
          keyFeatures: ['Gradual onset', 'Exercise intolerance', 'Pale appearance']
        },
        {
          condition: 'Depression',
          probability: 20,
          explanation: 'Mood disorder commonly presenting with fatigue',
          keyFeatures: ['Mood changes', 'Sleep disturbance', 'Loss of interest']
        }
      ],
      'chest pain': [
        {
          condition: 'Musculoskeletal chest pain',
          probability: 50,
          explanation: 'Most common cause of chest pain in younger patients',
          keyFeatures: ['Reproducible with movement', 'Localized tenderness', 'Sharp quality']
        },
        {
          condition: 'Gastroesophageal reflux',
          probability: 30,
          explanation: 'Acid reflux causing chest discomfort',
          keyFeatures: ['Burning sensation', 'Related to meals', 'Responds to antacids']
        },
        {
          condition: 'Anxiety/panic disorder',
          probability: 20,
          explanation: 'Psychological cause of chest symptoms',
          keyFeatures: ['Associated anxiety', 'Palpitations', 'Shortness of breath']
        }
      ]
    };

    const complaint = chiefComplaint.toLowerCase();
    return mockDiagnoses[complaint] || mockDiagnoses['fatigue'];
  }

  static getFallbackInvestigations(chiefComplaint: string): InvestigationRecommendation[] {
    const mockInvestigations: Record<string, InvestigationRecommendation[]> = {
      'chest pain': [
        {
          investigation: {
            id: 'ecg',
            name: 'ECG',
            type: 'cardiac',
            category: 'Cardiac',
            indication: 'Rule out acute coronary syndrome',
            urgency: 'stat',
            cost: 'low',
            rationale: 'Essential for detecting acute ST changes or arrhythmias'
          },
          priority: 1,
          clinicalRationale: 'First-line investigation for chest pain to rule out MI'
        }
      ],
      'fatigue': [
        {
          investigation: {
            id: 'fbc',
            name: 'Full Blood Count',
            type: 'laboratory',
            category: 'Hematology',
            indication: 'Screen for anemia, infection',
            urgency: 'routine',
            cost: 'low',
            rationale: 'Common cause of fatigue is anemia'
          },
          priority: 1,
          clinicalRationale: 'Anemia is a common reversible cause of fatigue'
        }
      ]
    };

    const complaint = chiefComplaint.toLowerCase();
    return mockInvestigations[complaint] || mockInvestigations['fatigue'];
  }

  static getFallbackRedFlags(chiefComplaint: string): RedFlag[] {
    return [
      {
        condition: 'Severe symptoms requiring urgent assessment',
        severity: 'high',
        description: 'Patient requires immediate clinical evaluation',
        immediateActions: ['Urgent physician review', 'Vital signs monitoring']
      }
    ];
  }

  static getFallbackGuidelines(chiefComplaint: string): ClinicalGuideline[] {
    return [
      {
        title: 'Standard Clinical Assessment',
        source: 'Clinical Best Practice',
        recommendation: 'Comprehensive history and physical examination required',
        evidenceLevel: 'C',
        applicableConditions: [chiefComplaint]
      }
    ];
  }
}
