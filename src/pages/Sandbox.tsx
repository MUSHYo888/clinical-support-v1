import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Activity, Stethoscope, Microscope, AlertTriangle, History, Pill, ClipboardList, FileText, ShieldAlert, HeartPulse, PenTool, TrendingUp, TrendingDown, BookOpen, Check, Copy } from 'lucide-react';

// --- Mock Data ---
const mockPatient = {
  name: "John Doe",
  age: 45,
  gender: "Male",
  chiefComplaint: "Chest Pain",
  vitals: {
    bp: { current: "145/90", trend: "up", delta: "+15" },
    hr: { current: "98", trend: "up", delta: "+12" },
    rr: { current: "18", trend: "stable", delta: "" },
    temp: { current: "37.2°C", trend: "stable", delta: "" },
    spo2: { current: "97%", trend: "down", delta: "-2%" }
  },
  hpi: "Patient presents with sudden onset, crushing sub-sternal chest pain that started 2 hours ago while mowing the lawn. Pain radiates to the left arm and jaw. Associated with diaphoresis and mild nausea.",
  ros: {
    cardiovascular: ["Positive for chest pain", "Positive for diaphoresis"],
    gastrointestinal: ["Positive for mild nausea", "Negative for vomiting"],
    respiratory: ["Negative for shortness of breath"]
  },
  pertinentNegatives: ["No tearing back pain", "No hemoptysis", "No unilateral leg swelling"],
  pmh: ["Hypertension", "Type 2 Diabetes", "Hyperlipidemia"],
  medications: ["Lisinopril 10mg daily", "Metformin 500mg BID", "Atorvastatin 40mg daily"],
  allergies: ["Penicillin (Hives)"]
};

const mockDDx = [
  {
    id: 1,
    condition: "Acute Coronary Syndrome (STEMI)",
    likelihood: "High",
    probability: 85,
    rationale: "Classic presentation of exertional, crushing chest pain radiating to jaw/arm with diaphoresis in a 45yo male with elevated BP.",
    investigations: ["STAT 12-lead ECG", "High-sensitivity Troponin", "CXR"],
    guideline: "2021 AHA/ACC Chest Pain Evaluation Guidelines"
  },
  {
    id: 2,
    condition: "Gastroesophageal Reflux Disease (GERD)",
    likelihood: "Medium",
    probability: 10,
    rationale: "Can mimic anginal pain and present with nausea, though exertion trigger is less typical.",
    investigations: ["Therapeutic trial of PPI", "Consider outpatient endoscopy if ECG negative"],
    guideline: "2022 ACG Clinical Guideline for the Diagnosis and Management of GERD"
  },
  {
    id: 3,
    condition: "Musculoskeletal Chest Pain",
    likelihood: "Low",
    probability: 5,
    rationale: "Unlikely given the quality of pain and diaphoresis, but lawn mowing involved physical exertion.",
    investigations: ["Physical exam for reproducible chest wall tenderness"],
    guideline: "2015 ACP Guidelines for Non-cardiac Chest Pain"
  }
];

const mockRiskScore = {
  name: "HEART Score for Major Cardiac Events",
  score: 7,
  riskLevel: "High Risk (50-65% MACE at 6 weeks)"
};

const mockRedFlags = [
  "Possible acute coronary syndrome due to exertional crushing chest pain",
  "Elevated blood pressure in setting of suspected ACS (145/90)",
];

const mockTreatmentRecommendations = [
  "STAT Aspirin 325mg chewed",
  "Sublingual Nitroglycerin 0.4mg q5min PRN for chest pain (max 3 doses)",
  "Establish peripheral IV access x2",
];

const mockFollowUpRecommendations = [
  "Immediate Cardiology consult",
  "Admit to cardiac monitoring unit/telemetry",
  "Serial cardiac enzymes every 3-6 hours",
  "Repeat 12-lead ECG if symptoms change or recur"
];

const mockSOAPNote = `S: 45yo M presents with sudden onset, crushing sub-sternal chest pain x 2 hrs, starting while mowing lawn. Radiates to L arm/jaw. Associated with diaphoresis and mild nausea. No SOB.

O: BP 145/90, HR 98, RR 18, Temp 37.2°C, SpO2 97%. Appears in mild distress, diaphoretic.

A: 45yo M with typical exertional angina symptoms, high suspicion for Acute Coronary Syndrome (STEMI).

P: 
- STAT 12-lead ECG
- High-sensitivity Troponin
- Aspirin 325mg chewed
- Sublingual NTG 0.4mg
- Immediate Cardiology consult`;

const Sandbox = () => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mockSOAPNote);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getLikelihoodBadge = (likelihood: string) => {
    switch (likelihood) {
      case 'High':
        return <Badge variant="destructive">High Likelihood</Badge>;
      case 'Medium':
        return <Badge variant="warning">Medium Likelihood</Badge>;
      case 'Low':
        return <Badge variant="secondary">Low Likelihood</Badge>;
      default:
        return <Badge variant="outline">{likelihood}</Badge>;
    }
  };

  const renderVital = (label: string, vital: { current: string, trend: string, delta: string }, isBadUp: boolean, isBadDown: boolean) => {
    let trendColor = "text-muted-foreground";
    if (vital.trend === 'up' && isBadUp) trendColor = "text-red-500";
    if (vital.trend === 'down' && isBadDown) trendColor = "text-red-500";

    return (
      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="font-semibold text-gray-900">{vital.current}</span>
          {vital.trend === 'up' && <TrendingUp className={`h-3.5 w-3.5 ${trendColor}`} />}
          {vital.trend === 'down' && <TrendingDown className={`h-3.5 w-3.5 ${trendColor}`} />}
          {vital.delta && <span className={`text-xs font-medium ${trendColor}`}>{vital.delta}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50/50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Clinical Workspace Prototype</h1>
            <p className="text-muted-foreground">EHR Assessment & Plan Layout Sandbox</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Subjective / Objective */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Patient Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="font-medium text-lg">{mockPatient.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {mockPatient.age} yo {mockPatient.gender}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Chief Complaint</div>
                      <div className="text-sm text-destructive font-medium">{mockPatient.chiefComplaint}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 p-3 rounded-lg border">
                      {renderVital('BP', mockPatient.vitals.bp, true, false)}
                      {renderVital('HR', mockPatient.vitals.hr, true, false)}
                      {renderVital('RR', mockPatient.vitals.rr, true, false)}
                      {renderVital('SpO2', mockPatient.vitals.spo2, false, true)}
                    </div>
                  </div>
                  
                  {/* Anatomical Localization Map */}
                  <div className="w-full sm:w-28 flex flex-col items-center justify-center p-3 border rounded-lg bg-muted/30 shrink-0 shadow-inner">
                    <div className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Pain Map</div>
                    <div className="w-16 h-28 relative">
                      <svg viewBox="0 0 100 150" className="w-full h-full text-gray-300">
                        <g stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="50" cy="20" r="14" />
                          <path d="M 46 34 L 46 42 M 54 34 L 54 42" />
                          <path d="M 25 45 C 35 40 65 40 75 45 L 80 100 C 70 105 30 105 20 100 Z" />
                          <path d="M 25 45 L 10 90 L 15 115" />
                          <path d="M 75 45 L 90 90 L 85 115" />
                        </g>
                        <ellipse cx="50" cy="65" rx="16" ry="14" className="fill-red-500/50" />
                        <path d="M 75 45 L 90 90 L 85 115" stroke="rgba(239, 68, 68, 0.5)" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Subjective
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-semibold mb-1">History of Present Illness</div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {mockPatient.hpi}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">Pertinent Negatives</div>
                  <div className="flex flex-wrap gap-2">
                    {mockPatient.pertinentNegatives.map((neg, i) => (
                      <Badge key={i} variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
                        {neg}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">Review of Systems</div>
                  <div className="space-y-2 text-sm">
                    {Object.entries(mockPatient.ros).map(([sys, findings]) => (
                      <div key={sys}>
                        <span className="capitalize font-medium text-gray-900">{sys}:</span>
                        <ul className="list-disc pl-4 mt-1 text-gray-700">
                          {findings.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="h-5 w-5 text-primary" />
                  Medical History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-semibold mb-1">Past Medical History</div>
                  <div className="flex flex-wrap gap-2">
                    {mockPatient.pmh.map((condition, idx) => (
                      <Badge key={idx} variant="secondary">{condition}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1">Home Medications</div>
                  <ul className="list-disc pl-4 text-sm text-gray-700">
                    {mockPatient.medications.map((med, idx) => (
                      <li key={idx}>{med}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1 text-destructive">Allergies</div>
                  <div className="flex flex-wrap gap-2">
                    {mockPatient.allergies.map((allergy, idx) => (
                      <Badge key={idx} variant="destructive">{allergy}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Drafted Clinical Note
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyToClipboard}
                  className={`transition-all duration-300 ${isCopied ? "text-green-600 border-green-200 bg-green-50 hover:bg-green-50 hover:text-green-600" : ""}`}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-lg border text-sm font-mono whitespace-pre-wrap text-gray-700 leading-relaxed shadow-inner">
                  {mockSOAPNote}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Assessment / Plan */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-l-4 border-l-orange-500 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HeartPulse className="h-5 w-5 text-orange-600" />
                  Clinical Risk Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                  <div>
                    <h4 className="font-semibold text-gray-900">{mockRiskScore.name}</h4>
                    <p className="text-sm font-medium text-orange-800 mt-1">{mockRiskScore.riskLevel}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{mockRiskScore.score}</div>
                    <div className="text-xs text-orange-800 font-bold uppercase tracking-wider mt-1">Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {mockRedFlags.length > 0 && (
              <Alert variant="destructive" className="bg-red-50/50 border-red-200">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="text-lg font-semibold mb-2">Clinical Warnings / Red Flags</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1">
                    {mockRedFlags.map((flag, idx) => (
                      <li key={idx} className="font-medium">{flag}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Card className="border-t-4 border-t-primary shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Differential Diagnoses & Plan
                </CardTitle>
                <CardDescription>AI-generated clinical reasoning and suggested workup.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockDDx.map((ddx) => (
                  <div key={ddx.id} className="p-4 rounded-xl border bg-card transition-all hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{ddx.condition}</h3>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          Probability: {ddx.probability}%
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getLikelihoodBadge(ddx.likelihood)}
                      </div>
                    </div>

                    <div className="text-sm text-gray-700 mb-4 bg-muted/30 p-3 rounded-lg">
                      <span className="font-medium text-gray-900">Clinical Rationale: </span>
                      {ddx.rationale}
                    </div>

                    <div>
                      <div className="text-sm font-medium flex items-center gap-1.5 mb-3 text-destructive">
                        <Microscope className="h-4 w-4" />
                        STAT Orders (CPOE)
                      </div>
                      <div className="space-y-2.5 bg-muted/20 p-3 rounded-lg border shadow-sm">
                        {ddx.investigations.map((inv, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <Checkbox id={`ddx-${ddx.id}-inv-${idx}`} className="mt-0.5 border-gray-400 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive" />
                            <Label htmlFor={`ddx-${ddx.id}-inv-${idx}`} className="text-sm font-medium cursor-pointer leading-tight text-gray-700">
                              {inv}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Separator className="mb-3" />
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground italic">
                        <BookOpen className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Evidence Basis: {ddx.guideline}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Pill className="h-5 w-5 text-primary" />
                    Treatment Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {mockTreatmentRecommendations.map((treatment, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{treatment}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Follow-up
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {mockFollowUpRecommendations.map((followUp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{followUp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 bg-muted/40 border rounded-lg flex items-start gap-3 text-sm text-muted-foreground mt-6 shadow-sm">
              <ShieldAlert className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <p>
                <strong className="text-gray-700">DISCLAIMER:</strong> This assessment is generated by AI Clinical Decision Support (or fallback protocols) and is for informational purposes only. It must be independently verified by a qualified healthcare professional.
              </p>
            </div>
          </div>

        </div>

        {/* BOTTOM: Disposition & Attestation */}
        <Card className="shadow-sm border-t-4 border-t-blue-600">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PenTool className="h-5 w-5 text-blue-600" />
              Disposition & Attestation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between">
              <span className="font-semibold text-gray-700">Patient Disposition:</span>
              <Badge className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-1.5 font-bold uppercase tracking-wider">Status: ADMIT TO CATH LAB</Badge>
            </div>
            <div className="pt-6 pb-2 border-t border-dashed flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1 text-sm text-gray-500">
                <p>I have personally evaluated the patient and formulated the above plan.</p>
                <p>Time of completion: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="text-right">
                <div className="text-lg mb-1 text-gray-800 font-serif italic">Electronically signed by: _________________ , MD</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Attending Physician</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Sandbox;