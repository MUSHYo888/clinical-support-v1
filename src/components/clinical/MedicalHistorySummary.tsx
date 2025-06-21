
// ABOUTME: Medical history summary component for PMH and PE data
// ABOUTME: Displays structured view of past medical history and physical examination

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MedicalHistorySummaryProps {
  pmhData?: {
    conditions: string[];
    medications: string[];
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-2">Medical Conditions</h5>
                <ul className="text-sm space-y-1">
                  {pmhData.conditions.map((condition, idx) => (
                    <li key={idx}>• {condition}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">Current Medications</h5>
                <ul className="text-sm space-y-1">
                  {pmhData.medications.map((medication, idx) => (
                    <li key={idx}>• {medication}</li>
                  ))}
                </ul>
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
