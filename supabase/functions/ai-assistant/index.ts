import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateQuestionsRequest {
  action: string;
  chiefComplaint: string;
  previousAnswers?: Record<string, any>;
}

interface GenerateDifferentialRequest {
  action: string;
  chiefComplaint: string;
  answers: Record<string, any>;
  rosData?: Record<string, any>;
}

interface GenerateTreatmentRequest {
  action: string;
  condition: string;
  severity: string;
  patientData: any;
  differentialDiagnoses: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { action, chiefComplaint } = requestBody;
    
    if (!action) {
      throw new Error('Action parameter is required');
    }

    console.log(`Processing action: ${action}`);

    if (action === 'generate-questions') {
      const { previousAnswers = {} }: GenerateQuestionsRequest = requestBody;
      
      console.log(`Generating questions for: "${chiefComplaint}"`);
      
      const systemPrompt = `You are a clinical AI assistant helping to generate focused medical history questions for a patient presenting with "${chiefComplaint}".

Generate 4-6 relevant questions that follow the SOCRATES/OLDCARTS framework (Site, Onset, Character, Radiation, Associated symptoms, Timing, Exacerbating/Relieving factors, Severity).

Return a JSON array of question objects with this exact format:
[
  {
    "id": "unique_id_here",
    "text": "Question text here?",
    "type": "multiple-choice|yes-no|text|scale",
    "options": ["Option 1", "Option 2"] (only for multiple-choice),
    "category": "onset|duration|severity|location|quality|radiation|associated|timing|triggers",
    "required": true
  }
]

Make questions specific to the chief complaint "${chiefComplaint}". For pain complaints, include severity scale questions. For timing questions, use appropriate time ranges. Keep questions clinically relevant and focused.`;

      const userPrompt = `Chief complaint: ${chiefComplaint}
${Object.keys(previousAnswers).length > 0 ? `Previous answers: ${JSON.stringify(previousAnswers)}` : ''}

Generate focused clinical questions for this presentation.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const questions = JSON.parse(jsonMatch[0]);
      console.log(`Generated ${questions.length} questions for: ${chiefComplaint}`);

      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-differential') {
      const { answers, rosData = {} }: GenerateDifferentialRequest = requestBody;

      console.log(`Generating differential diagnosis for: "${chiefComplaint}"`);

      const systemPrompt = `You are a clinical AI assistant generating differential diagnoses. Analyze the patient presentation and provide the most likely diagnoses with clinical reasoning.

Return a JSON array of differential diagnoses with this exact format:
[
  {
    "condition": "Condition name",
    "probability": 85,
    "explanation": "Clinical reasoning for this diagnosis",
    "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"]
  }
]

Provide 3-5 differential diagnoses ranked by likelihood (probability 1-100). Include both common and serious conditions that must be ruled out. Base probabilities on clinical evidence and epidemiology.`;

      const userPrompt = `Chief complaint: ${chiefComplaint}

Patient answers to history questions:
${JSON.stringify(answers, null, 2)}

Review of Systems findings:
${JSON.stringify(rosData, null, 2)}

Generate differential diagnoses with clinical reasoning.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 3000
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const differentials = JSON.parse(jsonMatch[0]);
      console.log(`Generated ${differentials.length} differential diagnoses for: ${chiefComplaint}`);

      return new Response(JSON.stringify({ differentials }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-clinical-support') {
      const { differentialDiagnoses, answers, rosData = {} } = requestBody;

      console.log(`Generating clinical decision support for: "${chiefComplaint}"`);

      const systemPrompt = `You are a clinical AI assistant providing investigation recommendations and clinical decision support. Analyze the patient presentation and provide structured clinical guidance.

Return a JSON object with this exact format:
{
  "investigations": [
    {
      "investigation": {
        "id": "unique_id",
        "name": "Investigation Name",
        "type": "laboratory|imaging|cardiac|pulmonary|other",
        "category": "Category",
        "indication": "Clinical indication",
        "urgency": "routine|urgent|stat",
        "cost": "low|moderate|high",
        "rationale": "Scientific rationale"
      },
      "priority": 1,
      "clinicalRationale": "Why this test is recommended",
      "contraindications": ["contraindication1", "contraindication2"]
    }
  ],
  "redFlags": [
    {
      "condition": "Condition name",
      "severity": "high|medium|low",
      "description": "Description of the red flag",
      "immediateActions": ["action1", "action2"]
    }
  ],
  "guidelines": [
    {
      "title": "Guideline title",
      "source": "Guideline source",
      "recommendation": "Specific recommendation",
      "evidenceLevel": "A|B|C|D",
      "applicableConditions": ["condition1", "condition2"]
    }
  ],
  "treatmentRecommendations": ["treatment1", "treatment2"],
  "followUpRecommendations": ["followup1", "followup2"]
}

Provide evidence-based recommendations prioritized by clinical importance and cost-effectiveness.`;

      const userPrompt = `Chief complaint: ${chiefComplaint}

Differential diagnoses:
${JSON.stringify(differentialDiagnoses, null, 2)}

Patient answers to history questions:
${JSON.stringify(answers, null, 2)}

Review of Systems findings:
${JSON.stringify(rosData, null, 2)}

Generate comprehensive clinical decision support including investigation recommendations, red flag identification, and clinical guidelines.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 4000
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const clinicalSupport = JSON.parse(jsonMatch[0]);
      console.log(`Generated clinical decision support for: ${chiefComplaint}`);

      return new Response(JSON.stringify({ clinicalSupport }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-treatment-recommendations') {
      const { condition, severity, patientData, differentialDiagnoses }: GenerateTreatmentRequest = requestBody;

      console.log(`Generating treatment recommendations for: "${condition}" (${severity})`);

      const systemPrompt = `You are a clinical AI assistant providing evidence-based treatment recommendations. Analyze the patient presentation and provide comprehensive treatment guidance including medications, pathways, and management plans.

Return a JSON object with this exact format:
{
  "medications": [
    {
      "name": "Medication name",
      "genericName": "Generic name",
      "dosage": "Dosage",
      "frequency": "Frequency",
      "route": "oral|iv|im|topical|inhaled",
      "duration": "Duration",
      "indication": "Clinical indication", 
      "category": "antibiotic|analgesic|antihypertensive|other",
      "evidenceLevel": "A|B|C|D",
      "rationale": "Clinical rationale",
      "sideEffects": ["effect1", "effect2"],
      "contraindications": ["contra1", "contra2"],
      "interactions": ["drug1", "drug2"],
      "monitoring": ["parameter1", "parameter2"]
    }
  ],
  "treatmentPathway": {
    "firstLine": ["treatment1", "treatment2"],
    "secondLine": ["treatment1", "treatment2"],
    "duration": "Treatment duration",
    "monitoringRequired": ["monitor1", "monitor2"],
    "successCriteria": ["criteria1", "criteria2"]
  },
  "nonPharmacological": ["intervention1", "intervention2"],
  "lifestyle": ["recommendation1", "recommendation2"],
  "followUp": {
    "primaryCare": "1-2 weeks",
    "specialist": "As needed",
    "investigations": ["test1", "test2"]
  },
  "prognosis": {
    "shortTerm": "Short-term outlook",
    "longTerm": "Long-term outlook"
  },
  "complications": ["complication1", "complication2"],
  "warningSigns": ["sign1", "sign2"]
}

Provide evidence-based treatment recommendations following current clinical guidelines.`;

      const userPrompt = `Condition: ${condition}
Severity: ${severity}

Patient Data:
${JSON.stringify(patientData, null, 2)}

Differential Diagnoses:
${JSON.stringify(differentialDiagnoses, null, 2)}

Generate comprehensive treatment recommendations including medications, treatment pathways, lifestyle modifications, and follow-up plans.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 4000
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const treatmentRecommendations = JSON.parse(jsonMatch[0]);
      console.log(`Generated treatment recommendations for: ${condition}`);

      return new Response(JSON.stringify({ treatmentRecommendations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
