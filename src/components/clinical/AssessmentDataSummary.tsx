
// ABOUTME: Assessment data summary component showing key metrics
// ABOUTME: Displays counts and status of completed assessment sections

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface AssessmentDataSummaryProps {
  answersCount: number;
  rosCount: number;
  pmhComplete: boolean;
  differentialsCount: number;
}

export function AssessmentDataSummary({ 
  answersCount, 
  rosCount, 
  pmhComplete, 
  differentialsCount 
}: AssessmentDataSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="font-medium">History Questions</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{answersCount}</p>
          <p className="text-sm text-gray-600">Questions answered</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium">Review of Systems</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{rosCount}</p>
          <p className="text-sm text-gray-600">Systems reviewed</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-orange-600" />
            <span className="font-medium">Past Medical History</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {pmhComplete ? 'Complete' : 'Pending'}
          </p>
          <p className="text-sm text-gray-600">Medical history</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-purple-600" />
            <span className="font-medium">Differential Diagnoses</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{differentialsCount}</p>
          <p className="text-sm text-gray-600">Conditions considered</p>
        </CardContent>
      </Card>
    </div>
  );
}
