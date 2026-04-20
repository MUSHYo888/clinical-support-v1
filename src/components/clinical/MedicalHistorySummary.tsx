
// ABOUTME: Medical history summary component for PMH and PE data
// ABOUTME: Displays structured view of past medical history and physical examination

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MedicalHistorySummaryProps {
  pmhData?: {
    conditions: string[];
    medications: string[];
    surgeries?: string[];
    allergies?: string[];
    familyHistory?: string;
    socialHistory?: string;
  };
  peData?: {
    vitalSigns: {
      bloodPressure: string;
      heartRate: string;
      respiratoryRate: string;
      temperature: string;
      oxygenSaturation: string;
    };
    systems: Record<string, {
      normal: boolean;
      findings: string[];
    }>;
  };
}

export function MedicalHistorySummary({ pmhData, peData }: MedicalHistorySummaryProps) {
  return (
    <div className="space-y-6">
      {/* Past Medical History */}
      {pmhData && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="text-lg">Past Medical History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-1">Medical Conditions</h5>
                  {pmhData.conditions?.length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {pmhData.conditions.map((condition, idx) => (
                        <li key={idx}>• {condition}</li>
                      ))}
                    </ul>
                  ) : <span className="text-sm text-muted-foreground italic">None reported</span>}
                </div>
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-1">Previous Surgeries</h5>
                  {pmhData.surgeries?.length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {pmhData.surgeries.map((surgery, idx) => (
                        <li key={idx}>• {surgery}</li>
                      ))}
                    </ul>
                  ) : <span className="text-sm text-muted-foreground italic">None reported</span>}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-1">Current Medications</h5>
                  {pmhData.medications?.length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {pmhData.medications.map((medication, idx) => (
                        <li key={idx}>• {medication}</li>
                      ))}
                    </ul>
                  ) : <span className="text-sm text-muted-foreground italic">None reported</span>}
                </div>
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-1">Allergies</h5>
                  {pmhData.allergies?.length > 0 ? (
                    <ul className="text-sm space-y-1 text-destructive font-medium">
                      {pmhData.allergies.map((allergy, idx) => (
                        <li key={idx}>• {allergy}</li>
                      ))}
                    </ul>
                  ) : <span className="text-sm text-muted-foreground italic">No known allergies</span>}
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-1">Family History</h5>
                  <p className="text-sm whitespace-pre-wrap">{pmhData.familyHistory || <span className="text-muted-foreground italic">Not reported</span>}</p>
                </div>
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-1">Social History</h5>
                  <p className="text-sm whitespace-pre-wrap">{pmhData.socialHistory || <span className="text-muted-foreground italic">Not reported</span>}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Physical Examination */}
      {peData && (
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader>
            <CardTitle className="text-lg">Physical Examination</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium mb-2">Vital Signs</h5>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>BP: {peData.vitalSigns.bloodPressure}</div>
                  <div>HR: {peData.vitalSigns.heartRate}</div>
                  <div>RR: {peData.vitalSigns.respiratoryRate}</div>
                  <div>Temp: {peData.vitalSigns.temperature}</div>
                  <div>O2: {peData.vitalSigns.oxygenSaturation}</div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">System Examination</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(peData.systems).map(([system, findings]) => (
                    <div key={system} className="text-sm">
                      <span className="font-medium">{system}:</span>
                      {findings.normal ? (
                        <span className="text-green-600 ml-2">Normal</span>
                      ) : (
                        <div className="ml-2">
                          {findings.findings.map((finding, idx) => (
                            <div key={idx}>• {finding}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
