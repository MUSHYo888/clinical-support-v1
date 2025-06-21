
// ABOUTME: Differential diagnosis display component
// ABOUTME: Shows ranked differential diagnoses with probabilities and clinical reasoning

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DifferentialDiagnosis } from '@/types/medical';

interface DifferentialDiagnosisListProps {
  differentials: DifferentialDiagnosis[];
}

export function DifferentialDiagnosisList({ differentials }: DifferentialDiagnosisListProps) {
  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'bg-red-500';
    if (probability >= 50) return 'bg-orange-500';
    if (probability >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProbabilityText = (probability: number) => {
    if (probability >= 70) return 'High';
    if (probability >= 50) return 'Moderate';
    if (probability >= 30) return 'Low-Moderate';
    return 'Low';
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Differential Diagnoses</h3>
      <div className="space-y-4">
        {differentials.map((diagnosis, index) => (
          <Card key={index} className="border-l-4 border-l-teal-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">
                    {diagnosis.condition}
                  </h4>
                  <div className="flex items-center space-x-3 mt-2">
                    <Badge 
                      variant="secondary" 
                      className={`${getProbabilityColor(diagnosis.probability)} text-white`}
                    >
                      {diagnosis.probability}% - {getProbabilityText(diagnosis.probability)} Probability
                    </Badge>
                  </div>
                </div>
                <div className="ml-4">
                  <Progress 
                    value={diagnosis.probability} 
                    className="w-24 h-2"
                  />
                </div>
              </div>

              <p className="text-gray-700 mb-4">{diagnosis.explanation}</p>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Key Clinical Features:</h5>
                <div className="flex flex-wrap gap-2">
                  {diagnosis.keyFeatures.map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
