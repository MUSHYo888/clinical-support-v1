
// ABOUTME: Treatment recommendations component displaying medication suggestions and treatment pathways
// ABOUTME: Shows drug interactions, discharge planning, and evidence-based treatment protocols

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Pill, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  FileText,
  Heart,
  Activity,
  Shield,
  Calendar
} from 'lucide-react';
import { TreatmentRecommendation, DrugInteraction, DischargePlan } from '@/types/treatment-management';
import { TreatmentManagementService } from '@/services/treatmentManagementService';

interface TreatmentRecommendationsProps {
  condition: string;
  severity: string;
  patientData: any;
  differentialDiagnoses: any[];
  onBack: () => void;
  onComplete: () => void;
}

export function TreatmentRecommendations({
  condition,
  severity,
  patientData,
  differentialDiagnoses,
  onBack,
  onComplete
}: TreatmentRecommendationsProps) {
  const [activeTab, setActiveTab] = useState('medications');
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [dischargePlan, setDischargePlan] = useState<DischargePlan | null>(null);

  const treatmentRec = TreatmentManagementService.generateTreatmentRecommendation(
    condition,
    severity,
    patientData,
    differentialDiagnoses
  );

  const handleMedicationToggle = (medicationId: string) => {
    setSelectedMedications(prev => 
      prev.includes(medicationId)
        ? prev.filter(id => id !== medicationId)
        : [...prev, medicationId]
    );
  };

  const handleGenerateDischargePlan = () => {
    const selectedMeds = treatmentRec.medicationSuggestions
      .filter(ms => selectedMedications.includes(ms.medication.id))
      .map(ms => ms.medication);
    
    const plan = TreatmentManagementService.generateDischargePlan(
      patientData.id || 'temp-id',
      condition,
      { medications: selectedMeds },
      selectedMeds
    );
    
    setDischargePlan(plan);
    setActiveTab('discharge');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'major': return 'bg-red-500';
      case 'contraindicated': return 'bg-red-700';
      default: return 'bg-gray-500';
    }
  };

  const getEvidenceColor = (level: string) => {
    switch (level) {
      case 'A': return 'bg-green-600';
      case 'B': return 'bg-blue-600';
      case 'C': return 'bg-yellow-600';
      case 'D': return 'bg-gray-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Pill className="h-6 w-6 text-green-600" />
            <span>Treatment & Management Recommendations</span>
          </CardTitle>
          <p className="text-gray-600">
            Condition: <span className="font-medium">{condition}</span> | 
            Severity: <span className="font-medium capitalize">{severity}</span>
          </p>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="pathway">Treatment Pathway</TabsTrigger>
              <TabsTrigger value="interactions">Drug Interactions</TabsTrigger>
              <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
              <TabsTrigger value="discharge">Discharge Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="medications" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Medication Suggestions</h3>
                <Badge variant="outline" className="text-xs">
                  {treatmentRec.medicationSuggestions.length} medications available
                </Badge>
              </div>

              <div className="space-y-4">
                {treatmentRec.medicationSuggestions.map((medSuggestion, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium">{medSuggestion.medication.name}</h4>
                            <Badge 
                              variant="secondary" 
                              className={`${getEvidenceColor(medSuggestion.evidenceLevel)} text-white`}
                            >
                              Evidence Level {medSuggestion.evidenceLevel}
                            </Badge>
                            {medSuggestion.contraindicated && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Contraindicated
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {medSuggestion.medication.genericName} | {medSuggestion.medication.dosage} {medSuggestion.medication.frequency}
                          </p>
                          <p className="text-gray-700 mb-3">{medSuggestion.rationale}</p>
                        </div>
                        <div className="ml-4">
                          <Button
                            variant={selectedMedications.includes(medSuggestion.medication.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleMedicationToggle(medSuggestion.medication.id)}
                            disabled={medSuggestion.contraindicated}
                          >
                            {selectedMedications.includes(medSuggestion.medication.id) ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Selected
                              </>
                            ) : (
                              'Select'
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium mb-2">Administration</h5>
                          <ul className="space-y-1 text-gray-600">
                            <li>Route: {medSuggestion.medication.route}</li>
                            <li>Duration: {medSuggestion.medication.duration}</li>
                            <li>Cost: {medSuggestion.medication.cost}</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Side Effects</h5>
                          <ul className="space-y-1 text-gray-600">
                            {medSuggestion.medication.sideEffects.slice(0, 3).map((effect, idx) => (
                              <li key={idx}>• {effect}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Monitoring</h5>
                          <ul className="space-y-1 text-gray-600">
                            {medSuggestion.monitoring.parameters.slice(0, 3).map((param, idx) => (
                              <li key={idx}>• {param}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {medSuggestion.interactions.length > 0 && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">Drug Interactions</span>
                          </div>
                          {medSuggestion.interactions.map((interaction, idx) => (
                            <div key={idx} className="text-sm text-yellow-700">
                              Interaction with {interaction.drug2}: {interaction.description}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedMedications.length > 0 && (
                <div className="flex justify-center pt-4">
                  <Button onClick={handleGenerateDischargePlan} className="bg-green-600 hover:bg-green-700">
                    Generate Discharge Plan ({selectedMedications.length} medications)
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pathway" className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Treatment Pathway</h3>
                <Badge variant="outline">{treatmentRec.treatmentPathway.guidelineSource}</Badge>
              </div>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-lg mb-3 flex items-center">
                        <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">1</span>
                        First-Line Therapy
                      </h4>
                      <div className="ml-8 space-y-4">
                        <div>
                          <h5 className="font-medium mb-2">Medications</h5>
                          {treatmentRec.treatmentPathway.firstLineTherapy.medications.map((med, idx) => (
                            <div key={idx} className="text-sm bg-gray-50 p-2 rounded mb-1">
                              {med.name} - {med.dosage} {med.frequency}
                            </div>
                          ))}
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Non-Pharmacological</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {treatmentRec.treatmentPathway.firstLineTherapy.nonPharmacological.map((item, idx) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Success Criteria</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {treatmentRec.treatmentPathway.firstLineTherapy.successCriteria.map((criteria, idx) => (
                              <li key={idx}>• {criteria}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {treatmentRec.treatmentPathway.specialistReferral && (
                      <div>
                        <h4 className="font-medium text-lg mb-3 flex items-center">
                          <User className="h-5 w-5 text-blue-600 mr-2" />
                          Specialist Referral
                        </h4>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm mb-2">
                            <strong>Specialty:</strong> {treatmentRec.treatmentPathway.specialistReferral.specialty}
                          </p>
                          <p className="text-sm mb-2">
                            <strong>Urgency:</strong> {treatmentRec.treatmentPathway.specialistReferral.urgency}
                          </p>
                          <div>
                            <strong className="text-sm">Referral Criteria:</strong>
                            <ul className="text-sm mt-1 space-y-1">
                              {treatmentRec.treatmentPathway.specialistReferral.criteria.map((criteria, idx) => (
                                <li key={idx}>• {criteria}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold">Drug Interaction Analysis</h3>
              </div>

              {treatmentRec.medicationSuggestions.some(ms => ms.interactions.length > 0) ? (
                <div className="space-y-4">
                  {treatmentRec.medicationSuggestions
                    .filter(ms => ms.interactions.length > 0)
                    .map((medSuggestion, index) => (
                      <Card key={index} className="border-l-4 border-l-red-500">
                        <CardContent className="p-6">
                          <h4 className="font-medium mb-4">{medSuggestion.medication.name} Interactions</h4>
                          <div className="space-y-3">
                            {medSuggestion.interactions.map((interaction, idx) => (
                              <div key={idx} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">
                                    {interaction.drug1} + {interaction.drug2}
                                  </span>
                                  <Badge 
                                    variant="secondary" 
                                    className={`${getSeverityColor(interaction.severity)} text-white`}
                                  >
                                    {interaction.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{interaction.description}</p>
                                <div className="text-sm">
                                  <p><strong>Clinical Effect:</strong> {interaction.clinicalEffect}</p>
                                  <p><strong>Management:</strong> {interaction.management}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-green-600">No Drug Interactions Detected</p>
                    <p className="text-gray-600">The suggested medications have no known interactions.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="lifestyle" className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-5 w-5 text-pink-600" />
                <h3 className="text-lg font-semibold">Lifestyle & Non-Pharmacological Treatment</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg">Non-Pharmacological Treatments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {treatmentRec.nonPharmacological.map((treatment, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{treatment}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg">Lifestyle Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {treatmentRec.lifestyle.map((recommendation, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="text-lg">Prognosis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium">Short-term:</p>
                      <p className="text-gray-600">{treatmentRec.prognosis.shortTerm}</p>
                    </div>
                    <div>
                      <p className="font-medium">Long-term:</p>
                      <p className="text-gray-600">{treatmentRec.prognosis.longTerm}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <CardTitle className="text-lg">Potential Complications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {treatmentRec.complications.potential.map((complication, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span>{complication}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="discharge" className="space-y-4">
              {dischargePlan ? (
                <>
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="h-5 w-5 text-teal-600" />
                    <h3 className="text-lg font-semibold">Discharge Plan</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-l-4 border-l-teal-500">
                      <CardHeader>
                        <CardTitle className="text-lg">Discharge Readiness</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(dischargePlan.dischargeReadiness).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              {value ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="text-lg">Follow-up Plan</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="font-medium">Primary Care</p>
                          <p className="text-sm text-gray-600">
                            {dischargePlan.followUp.primaryCare.timeframe} - {dischargePlan.followUp.primaryCare.purpose}
                          </p>
                        </div>
                        {dischargePlan.followUp.specialist && (
                          <div>
                            <p className="font-medium">{dischargePlan.followUp.specialist.specialty}</p>
                            <p className="text-sm text-gray-600">
                              {dischargePlan.followUp.specialist.timeframe} - {dischargePlan.followUp.specialist.purpose}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-l-4 border-l-red-500">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                        Warning Signs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3 font-medium">Return to emergency department if you experience:</p>
                      <ul className="space-y-1">
                        {dischargePlan.warningSigns.map((sign, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                            <span>{sign}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Discharge Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dischargePlan.instructions.map((instruction, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <Badge 
                              variant={instruction.importance === 'critical' ? 'destructive' : 'secondary'}
                              className="text-xs mt-1"
                            >
                              {instruction.importance}
                            </Badge>
                            <div>
                              <p className="font-medium capitalize">{instruction.category}</p>
                              <p className="text-sm text-gray-600">{instruction.instruction}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600">No Discharge Plan Generated</p>
                    <p className="text-gray-500">Select medications and generate a discharge plan first.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              Back to Assessment
            </Button>
            <Button onClick={onComplete} className="bg-teal-600 hover:bg-teal-700">
              Complete Treatment Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
