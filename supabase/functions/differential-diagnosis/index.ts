import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { 
      chiefComplaint, 
      answers, 
      rosData, 
      pmhData, 
      peData, 
      assessmentId 
    } = await req.json();

    console.log('Generating differential diagnosis for:', chiefComplaint);

    // Prepare clinical context for AI analysis
    const clinicalContext = {
      chiefComplaint,
      presentingSymptoms: extractPresentingSymptoms(answers),
      reviewOfSystems: formatROSData(rosData),
      pastMedicalHistory: pmhData,
      physicalExam: formatPEData(peData),
      riskFactors: extractRiskFactors(pmhData, answers)
    };

    // Generate differential diagnosis using GPT-5
    const differentialDiagnoses = await generateDifferentialDiagnosis(clinicalContext);

    // Save to database if assessmentId provided
    if (assessmentId && differentialDiagnoses.length > 0) {
      const { error: saveError } = await supabase
        .from('differential_diagnoses')
        .delete()
        .eq('assessment_id', assessmentId);

      if (saveError) {
        console.error('Error clearing existing diagnoses:', saveError);
      }

      for (const diagnosis of differentialDiagnoses) {
        const { error: insertError } = await supabase
          .from('differential_diagnoses')
          .insert({
            assessment_id: assessmentId,
            condition_name: diagnosis.condition,
            probability: diagnosis.probability,
            explanation: diagnosis.explanation,
            key_features: diagnosis.keyFeatures
          });

        if (insertError) {
          console.error('Error saving diagnosis:', insertError);
        }
      }
    }

    return new Response(JSON.stringify({ 
      differentialDiagnoses,
      clinicalRecommendations: generateClinicalRecommendations(differentialDiagnoses),
      riskStratification: calculateRiskStratification(differentialDiagnoses)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in differential-diagnosis function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate differential diagnosis',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateDifferentialDiagnosis(clinicalContext: any) {
  const prompt = `You are an expert clinical diagnostician. Analyze the following clinical presentation and generate a comprehensive differential diagnosis list with confidence scoring.

CLINICAL PRESENTATION:
Chief Complaint: ${clinicalContext.chiefComplaint}

Presenting Symptoms: ${JSON.stringify(clinicalContext.presentingSymptoms, null, 2)}

Review of Systems: ${JSON.stringify(clinicalContext.reviewOfSystems, null, 2)}

Past Medical History: ${JSON.stringify(clinicalContext.pastMedicalHistory, null, 2)}

Physical Examination: ${JSON.stringify(clinicalContext.physicalExam, null, 2)}

Risk Factors: ${JSON.stringify(clinicalContext.riskFactors, null, 2)}

INSTRUCTIONS:
1. Generate 5-8 most likely differential diagnoses
2. Rank by probability (0-100%)
3. Provide clinical reasoning for each diagnosis
4. Include key supporting and conflicting features
5. Consider both common and serious conditions
6. Use evidence-based clinical reasoning

Return as JSON array with this exact structure:
[
  {
    "condition": "Condition Name",
    "probability": 85,
    "explanation": "Detailed clinical reasoning for this diagnosis",
    "keyFeatures": ["Supporting feature 1", "Supporting feature 2"],
    "conflictingFeatures": ["Feature that argues against"],
    "urgency": "high|moderate|low",
    "category": "infectious|cardiovascular|respiratory|neurological|etc",
    "redFlags": ["Red flag 1", "Red flag 2"] or []
  }
]`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages: [
        { 
          role: 'system', 
          content: 'You are a world-class clinical diagnostician with expertise in differential diagnosis. Respond only with valid JSON.' 
        },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 2000
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    // Fallback differential diagnoses based on chief complaint
    return generateFallbackDifferentials(clinicalContext.chiefComplaint);
  }
}

function extractPresentingSymptoms(answers: any): string[] {
  const symptoms: string[] = [];
  
  Object.values(answers || {}).forEach((answer: any) => {
    if (answer.value && typeof answer.value === 'string') {
      symptoms.push(answer.value);
    }
    if (answer.notes) {
      symptoms.push(answer.notes);
    }
  });
  
  return symptoms.filter(s => s.length > 0);
}

function formatROSData(rosData: any): any {
  if (!rosData) return {};
  
  const formatted: any = {};
  Object.keys(rosData).forEach(system => {
    const systemData = rosData[system];
    if (systemData) {
      formatted[system] = {
        positive: systemData.positive || [],
        negative: systemData.negative || [],
        notes: systemData.notes || ''
      };
    }
  });
  
  return formatted;
}

function formatPEData(peData: any): any {
  if (!peData) return {};
  
  return {
    vitalSigns: peData.vitalSigns || {},
    systems: peData.systems || {},
    generalAppearance: peData.generalAppearance || ''
  };
}

function extractRiskFactors(pmhData: any, answers: any): string[] {
  const riskFactors: string[] = [];
  
  if (pmhData) {
    if (pmhData.conditions) riskFactors.push(...pmhData.conditions);
    if (pmhData.medications) riskFactors.push(...pmhData.medications);
    if (pmhData.allergies) riskFactors.push(...pmhData.allergies);
    if (pmhData.familyHistory) riskFactors.push(pmhData.familyHistory);
    if (pmhData.socialHistory) riskFactors.push(pmhData.socialHistory);
  }
  
  return riskFactors.filter(rf => rf && rf.length > 0);
}

function generateClinicalRecommendations(diagnoses: any[]): any {
  const highProbDiagnoses = diagnoses.filter(d => d.probability > 70);
  const redFlagConditions = diagnoses.filter(d => d.redFlags && d.redFlags.length > 0);
  const urgentConditions = diagnoses.filter(d => d.urgency === 'high');
  
  return {
    immediateActions: urgentConditions.length > 0 ? [
      'Consider urgent evaluation and treatment',
      'Monitor vital signs closely',
      'Ensure appropriate follow-up'
    ] : [],
    investigationPriority: highProbDiagnoses.map(d => ({
      condition: d.condition,
      recommendedTests: getRecommendedTests(d.condition, d.category)
    })),
    redFlagAlert: redFlagConditions.length > 0,
    followUpRecommendations: [
      'Re-evaluate if symptoms worsen or new symptoms develop',
      'Consider specialist referral if diagnosis remains uncertain',
      'Patient education regarding warning signs'
    ]
  };
}

function calculateRiskStratification(diagnoses: any[]): any {
  const highRiskCount = diagnoses.filter(d => d.urgency === 'high').length;
  const redFlagCount = diagnoses.filter(d => d.redFlags && d.redFlags.length > 0).length;
  const averageProbability = diagnoses.reduce((sum, d) => sum + d.probability, 0) / diagnoses.length;
  
  let overallRisk = 'low';
  if (highRiskCount > 0 || redFlagCount > 0) {
    overallRisk = 'high';
  } else if (averageProbability > 60) {
    overallRisk = 'moderate';
  }
  
  return {
    overallRisk,
    riskFactors: {
      highUrgencyConditions: highRiskCount,
      redFlagConditions: redFlagCount,
      diagnosticConfidence: Math.round(averageProbability)
    },
    recommendations: generateRiskBasedRecommendations(overallRisk)
  };
}

function getRecommendedTests(condition: string, category: string): string[] {
  const testMap: { [key: string]: string[] } = {
    'cardiovascular': ['ECG', 'Troponins', 'BNP/NT-proBNP', 'Echocardiogram'],
    'respiratory': ['Chest X-ray', 'ABG', 'Pulmonary function tests', 'CT chest'],
    'neurological': ['CT head', 'MRI brain', 'EEG', 'Lumbar puncture'],
    'infectious': ['Blood cultures', 'Urinalysis', 'CRP/ESR', 'Procalcitonin'],
    'gastrointestinal': ['Abdominal CT', 'Liver function tests', 'Lipase', 'Colonoscopy']
  };
  
  return testMap[category] || ['Complete blood count', 'Basic metabolic panel', 'Urinalysis'];
}

function generateRiskBasedRecommendations(riskLevel: string): string[] {
  const recommendations: { [key: string]: string[] } = {
    'high': [
      'Immediate medical evaluation required',
      'Consider emergency department referral',
      'Initiate urgent diagnostic workup',
      'Continuous monitoring recommended'
    ],
    'moderate': [
      'Schedule prompt follow-up within 24-48 hours',
      'Initiate targeted diagnostic testing',
      'Patient education regarding warning signs',
      'Consider specialist consultation'
    ],
    'low': [
      'Routine follow-up as clinically indicated',
      'Conservative management appropriate',
      'Monitor symptom progression',
      'Patient reassurance and education'
    ]
  };
  
  return recommendations[riskLevel] || recommendations['low'];
}

function generateFallbackDifferentials(chiefComplaint: string): any[] {
  // Evidence-based fallback diagnoses based on common chief complaints
  const fallbackMap: { [key: string]: any[] } = {
    'chest pain': [
      {
        condition: 'Coronary Artery Disease',
        probability: 65,
        explanation: 'Most common cause of chest pain in adults',
        keyFeatures: ['Exertional chest pain', 'Risk factors present'],
        conflictingFeatures: [],
        urgency: 'high',
        category: 'cardiovascular',
        redFlags: ['Acute onset', 'Radiation to arm']
      }
    ],
    'shortness of breath': [
      {
        condition: 'Asthma',
        probability: 55,
        explanation: 'Common reversible airway disease',
        keyFeatures: ['Wheezing', 'Response to bronchodilators'],
        conflictingFeatures: [],
        urgency: 'moderate',
        category: 'respiratory',
        redFlags: ['Severe respiratory distress']
      }
    ]
  };
  
  const key = Object.keys(fallbackMap).find(k => 
    chiefComplaint.toLowerCase().includes(k.toLowerCase())
  );
  
  return key ? fallbackMap[key] : [{
    condition: 'Clinical Assessment Required',
    probability: 50,
    explanation: 'Detailed clinical evaluation needed for accurate diagnosis',
    keyFeatures: ['Presenting symptoms require further evaluation'],
    conflictingFeatures: [],
    urgency: 'moderate',
    category: 'general',
    redFlags: []
  }];
}