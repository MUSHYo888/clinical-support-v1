// ABOUTME: Template service for generating specialty-specific referral letters
// ABOUTME: Provides structured templates and content generation for professional medical referrals

import { Patient } from '@/types/medical';

interface ReferralTemplate {
  specialty: string;
  suggestedQuestions: string[];
  relevantHistoryTemplate: string;
  examinationTemplate: string;
  urgencyGuidelines: string;
  commonInvestigations: string[];
}

interface LetterGenerationData {
  specialty: string;
  patient: Patient;
  chiefComplaint: string;
  clinicalQuestion: string;
  relevantHistory: string;
  examinationFindings: string;
  investigationsCompleted: string;
  urgency: 'routine' | 'urgent' | 'stat';
}

export class ReferralLetterTemplates {
  private static templates: Record<string, ReferralTemplate> = {
    'Cardiology': {
      specialty: 'Cardiology',
      suggestedQuestions: [
        'Please evaluate for coronary artery disease and provide risk stratification',
        'Assessment of chest pain and exercise tolerance testing if indicated',
        'Evaluation of palpitations and consideration for cardiac monitoring',
        'Assessment of heart failure and optimization of medical therapy',
        'Evaluation of hypertension and cardiovascular risk factors'
      ],
      relevantHistoryTemplate: 'Presents with chest discomfort/palpitations. Risk factors include [list relevant: hypertension, diabetes, smoking, family history]. Symptoms [describe pattern, triggers, associated symptoms].',
      examinationTemplate: 'Cardiovascular examination reveals [heart rate, blood pressure, heart sounds, murmurs, peripheral pulses, signs of fluid retention].',
      urgencyGuidelines: 'STAT for acute coronary syndrome, URGENT for unstable symptoms, ROUTINE for risk factor assessment',
      commonInvestigations: ['ECG', 'Echocardiogram', 'Stress testing', 'Cardiac enzymes', 'Lipid profile']
    },
    'Neurology': {
      specialty: 'Neurology',
      suggestedQuestions: [
        'Please evaluate headaches and exclude secondary causes',
        'Assessment of neurological symptoms and consideration for imaging',
        'Evaluation of memory concerns and cognitive assessment',
        'Assessment of weakness/numbness and neurological examination',
        'Evaluation of seizure-like episodes and EEG if indicated'
      ],
      relevantHistoryTemplate: 'Presents with neurological symptoms [describe onset, character, progression]. Associated symptoms include [headache, weakness, sensory changes, cognitive changes].',
      examinationTemplate: 'Neurological examination shows [mental status, cranial nerves, motor function, sensory function, reflexes, coordination, gait].',
      urgencyGuidelines: 'STAT for stroke symptoms, URGENT for progressive weakness, ROUTINE for chronic symptoms',
      commonInvestigations: ['CT/MRI brain', 'EEG', 'Nerve conduction studies', 'Lumbar puncture']
    },
    'Gastroenterology': {
      specialty: 'Gastroenterology',
      suggestedQuestions: [
        'Please evaluate abdominal pain and consider endoscopic assessment',
        'Assessment of GI bleeding and urgent endoscopy if indicated',
        'Evaluation of inflammatory bowel disease and management optimization',
        'Assessment of liver function abnormalities',
        'Evaluation of dysphagia and consideration for upper endoscopy'
      ],
      relevantHistoryTemplate: 'Presents with gastrointestinal symptoms [abdominal pain, nausea, vomiting, change in bowel habits, weight loss]. Associated features include [timing with meals, alleviating/aggravating factors].',
      examinationTemplate: 'Abdominal examination reveals [inspection, palpation findings, bowel sounds, hepatosplenomegaly, masses, tenderness].',
      urgencyGuidelines: 'STAT for GI bleeding, URGENT for severe pain/obstruction, ROUTINE for chronic symptoms',
      commonInvestigations: ['Upper/lower endoscopy', 'CT abdomen', 'Liver function tests', 'Inflammatory markers']
    },
    'Endocrinology': {
      specialty: 'Endocrinology',
      suggestedQuestions: [
        'Please evaluate diabetes management and optimization of glycemic control',
        'Assessment of thyroid function abnormalities',
        'Evaluation of unexplained weight changes and metabolic assessment',
        'Assessment of suspected hormonal disorders',
        'Evaluation of osteoporosis and bone health assessment'
      ],
      relevantHistoryTemplate: 'Presents with endocrine-related symptoms [polyuria, polydipsia, weight changes, fatigue, heat/cold intolerance]. Medical history includes [diabetes, thyroid disease, hormonal issues].',
      examinationTemplate: 'Physical examination shows [vital signs, weight changes, thyroid palpation, signs of hormonal excess/deficiency].',
      urgencyGuidelines: 'URGENT for diabetic emergencies/severe hormonal imbalance, ROUTINE for chronic management',
      commonInvestigations: ['HbA1c', 'Thyroid function tests', 'Cortisol levels', 'Bone density scan']
    },
    'Rheumatology': {
      specialty: 'Rheumatology',
      suggestedQuestions: [
        'Please evaluate joint pain and assess for inflammatory arthritis',
        'Assessment of connective tissue disease and autoimmune screening',
        'Evaluation of fibromyalgia and chronic pain management',
        'Assessment of lupus-like symptoms and serological evaluation',
        'Evaluation of osteoarthritis and treatment optimization'
      ],
      relevantHistoryTemplate: 'Presents with musculoskeletal symptoms [joint pain, stiffness, swelling]. Pattern includes [morning stiffness duration, affected joints, symmetric/asymmetric]. Family history of [autoimmune conditions].',
      examinationTemplate: 'Musculoskeletal examination reveals [joint swelling, tenderness, range of motion, deformities, rashes, lymphadenopathy].',
      urgencyGuidelines: 'URGENT for acute arthritis/systemic symptoms, ROUTINE for chronic joint pain',
      commonInvestigations: ['RF, Anti-CCP', 'ANA, Anti-dsDNA', 'ESR, CRP', 'Joint X-rays', 'Joint fluid analysis']
    },
    'Psychiatry': {
      specialty: 'Psychiatry',
      suggestedQuestions: [
        'Please evaluate mood symptoms and consider treatment optimization',
        'Assessment of anxiety disorders and therapeutic interventions',
        'Evaluation of psychiatric symptoms and medication management',
        'Assessment of suicidal ideation and risk stratification',
        'Evaluation of cognitive concerns and mental status assessment'
      ],
      relevantHistoryTemplate: 'Presents with psychiatric symptoms [mood changes, anxiety, sleep disturbance, cognitive concerns]. Duration [acute/chronic], triggers [stressors, life events], impact on function.',
      examinationTemplate: 'Mental status examination shows [appearance, behavior, speech, mood, affect, thought process, perception, cognition, insight, judgment].',
      urgencyGuidelines: 'STAT for suicidal ideation/psychosis, URGENT for severe symptoms, ROUTINE for stable chronic conditions',
      commonInvestigations: ['PHQ-9', 'GAD-7', 'Cognitive screening', 'Substance abuse screening']
    },
    'Orthopedics': {
      specialty: 'Orthopedics',
      suggestedQuestions: [
        'Please evaluate joint pain and consider surgical intervention',
        'Assessment of fracture healing and orthopedic management',
        'Evaluation of back pain and spinal assessment',
        'Assessment of sports-related injury and rehabilitation needs',
        'Evaluation of arthritis and joint replacement candidacy'
      ],
      relevantHistoryTemplate: 'Presents with musculoskeletal complaint [location, mechanism of injury, functional limitation]. Pain character [mechanical/inflammatory], aggravating factors [activity, rest].',
      examinationTemplate: 'Orthopedic examination reveals [inspection, palpation, range of motion, stability tests, neurological assessment, gait analysis].',
      urgencyGuidelines: 'STAT for fractures/dislocations, URGENT for acute injuries, ROUTINE for chronic conditions',
      commonInvestigations: ['X-rays', 'MRI', 'CT scan', 'Bone scan', 'Joint aspiration']
    },
    'Dermatology': {
      specialty: 'Dermatology',
      suggestedQuestions: [
        'Please evaluate skin lesion and assess for malignancy',
        'Assessment of chronic skin condition and treatment optimization',
        'Evaluation of rash and dermatological diagnosis',
        'Assessment of suspicious mole and dermoscopy',
        'Evaluation of hair loss and trichological assessment'
      ],
      relevantHistoryTemplate: 'Presents with dermatological concern [description of lesion/rash, duration, associated symptoms]. Risk factors include [sun exposure, family history, previous skin cancer].',
      examinationTemplate: 'Dermatological examination shows [distribution, morphology, color, size of lesions, associated findings].',
      urgencyGuidelines: 'URGENT for suspected malignancy/severe rash, ROUTINE for chronic skin conditions',
      commonInvestigations: ['Dermoscopy', 'Biopsy', 'Patch testing', 'Fungal culture']
    },
    'Oncology': {
      specialty: 'Oncology',
      suggestedQuestions: [
        'Please evaluate for suspected malignancy and staging assessment',
        'Assessment of cancer treatment options and multidisciplinary planning',
        'Evaluation of tumor markers and surveillance imaging',
        'Assessment of treatment response and follow-up planning',
        'Evaluation of cancer-related symptoms and supportive care'
      ],
      relevantHistoryTemplate: 'Presents with concerning symptoms [weight loss, fatigue, mass, abnormal imaging]. Risk factors include [smoking, family history, previous cancer]. Performance status [functional assessment].',
      examinationTemplate: 'Physical examination reveals [lymphadenopathy, masses, hepatosplenomegaly, signs of metastatic disease].',
      urgencyGuidelines: 'URGENT for suspected malignancy, STAT for oncological emergencies',
      commonInvestigations: ['CT staging', 'Tumor markers', 'Biopsy', 'PET scan', 'Bone marrow biopsy']
    },
    'Emergency Medicine': {
      specialty: 'Emergency Medicine',
      suggestedQuestions: [
        'Please provide urgent assessment and stabilization',
        'Evaluation of acute symptoms requiring immediate attention',
        'Assessment of potential life-threatening condition',
        'Urgent diagnostic workup and treatment initiation',
        'Evaluation and management of acute medical emergency'
      ],
      relevantHistoryTemplate: 'Presents acutely with [chief complaint, onset, severity]. Associated symptoms [systematic review]. Risk factors for acute conditions.',
      examinationTemplate: 'Urgent physical examination shows [vital signs, general appearance, focused system examination based on presentation].',
      urgencyGuidelines: 'STAT - Immediate evaluation required for acute presentation',
      commonInvestigations: ['ECG', 'Chest X-ray', 'Blood gases', 'Emergency blood work', 'CT scan']
    }
  };

  static getTemplate(specialty: string, chiefComplaint?: string): ReferralTemplate {
    const template = this.templates[specialty];
    
    if (!template) {
      // Return a generic template if specialty not found
      return {
        specialty,
        suggestedQuestions: [
          `Please evaluate and provide specialist assessment for ${specialty.toLowerCase()} condition`,
          `Clinical consultation and management recommendations`,
          `Diagnostic workup and treatment planning`
        ],
        relevantHistoryTemplate: `Presents with symptoms requiring ${specialty.toLowerCase()} evaluation. [Please describe relevant history]`,
        examinationTemplate: `Physical examination findings relevant to ${specialty.toLowerCase()} assessment. [Please describe findings]`,
        urgencyGuidelines: 'ROUTINE unless otherwise indicated',
        commonInvestigations: ['As clinically indicated']
      };
    }

    // Customize template based on chief complaint if provided
    if (chiefComplaint) {
      template.suggestedQuestions = this.customizeQuestions(template.suggestedQuestions, chiefComplaint, specialty);
    }

    return template;
  }

  private static customizeQuestions(questions: string[], chiefComplaint: string, specialty: string): string[] {
    const complaint = chiefComplaint.toLowerCase();
    const customized = [...questions];

    // Add specific questions based on chief complaint and specialty
    if (specialty === 'Cardiology' && complaint.includes('chest pain')) {
      customized.unshift('Urgent assessment of chest pain and exclusion of acute coronary syndrome');
    }
    
    if (specialty === 'Neurology' && complaint.includes('headache')) {
      customized.unshift('Evaluation of headache pattern and exclusion of secondary causes');
    }
    
    if (specialty === 'Gastroenterology' && complaint.includes('abdominal pain')) {
      customized.unshift('Assessment of abdominal pain and consideration for endoscopic evaluation');
    }

    return customized;
  }

  static generateLetterPreview(data: LetterGenerationData): string {
    const date = new Date().toLocaleDateString();
    const urgencyText = data.urgency === 'stat' ? 'URGENT - ' : data.urgency === 'urgent' ? 'URGENT - ' : '';
    
    return `${date}

${urgencyText}Re: ${data.patient.name} (${data.patient.patientId}) - ${data.specialty} Referral

Dear Colleague,

I would be grateful for your specialist assessment of this ${data.patient.age}-year-old ${data.patient.gender} patient.

CLINICAL QUESTION:
${data.clinicalQuestion}

CHIEF COMPLAINT:
${data.chiefComplaint}

RELEVANT HISTORY:
${data.relevantHistory || 'Please see attached clinical notes'}

EXAMINATION FINDINGS:
${data.examinationFindings || 'Please see attached assessment'}

INVESTIGATIONS COMPLETED:
${data.investigationsCompleted || 'As per attached results'}

${data.urgency === 'stat' ? 'This patient requires immediate attention due to the acute nature of their presentation.' : 
  data.urgency === 'urgent' ? 'I would appreciate urgent assessment of this patient.' : 
  'I would be grateful for your assessment at your earliest convenience.'}

Thank you for your expertise in managing this patient.

Yours sincerely,

Dr. [Your Name]
Medical Practice
Phone: (000) 000-0000
Email: practice@medical.com`;
  }

  static getSpecialtyList(): string[] {
    return Object.keys(this.templates);
  }

  static getCommonInvestigations(specialty: string): string[] {
    const template = this.templates[specialty];
    return template?.commonInvestigations || [];
  }

  static getUrgencyGuidelines(specialty: string): string {
    const template = this.templates[specialty];
    return template?.urgencyGuidelines || 'ROUTINE unless otherwise indicated';
  }
}