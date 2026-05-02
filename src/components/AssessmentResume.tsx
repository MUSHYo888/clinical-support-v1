// ABOUTME: Assessment resume component for continuing interrupted assessments
// ABOUTME: Allows users to resume partially completed assessments from any step

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface InProgressAssessment {
  id: string;
  patientName: string;
  chiefComplaint: string;
  currentStep: number;
  lastUpdated: string;
  answersCount: number;
  totalSteps: number;
}

interface AssessmentResumeProps {
  onResumeAssessment: (assessmentId: string) => void;
  onNewAssessment: () => void;
}

export function AssessmentResume({ onResumeAssessment, onNewAssessment }: AssessmentResumeProps) {
  const [inProgressAssessments, setInProgressAssessments] = useState<InProgressAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInProgressAssessments();
  }, []);

  const loadInProgressAssessments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get assessments that are in progress
      const { data: assessments, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          id,
          chief_complaint,
          current_step,
          updated_at,
          status,
          patient_id,
          patients!inner(name)
        `)
        .eq('status', 'in-progress')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (assessmentError) throw assessmentError;

      // Get answer counts for each assessment
      const assessmentIds = assessments?.map(a => a.id) || [];
      const { data: answerCounts, error: answerError } = await supabase
        .from('answers')
        .select('assessment_id')
        .in('assessment_id', assessmentIds);

      if (answerError) throw answerError;

      // Transform data
      const inProgress: InProgressAssessment[] = assessments?.map(assessment => {
        const answersCount = answerCounts?.filter(a => a.assessment_id === assessment.id).length || 0;
        
        return {
          id: assessment.id,
          patientName: assessment.patients.name,
          chiefComplaint: assessment.chief_complaint,
          currentStep: assessment.current_step,
          lastUpdated: assessment.updated_at,
          answersCount,
          totalSteps: 5 // HPI, ROS, PMH, PE, Assessment
        };
      }) || [];

      setInProgressAssessments(inProgress);
    } catch (err) {
      console.error('Error loading in-progress assessments:', err);
      setError('Failed to load assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAssessment = async (assessmentId: string) => {
    try {
      // Delete in reverse dependency order
      await supabase.from('answers').delete().eq('assessment_id', assessmentId);
      await supabase.from('questions').delete().eq('assessment_id', assessmentId);
      await supabase.from('review_of_systems').delete().eq('assessment_id', assessmentId);
      await supabase.from('assessments').delete().eq('id', assessmentId);
      
      // Refresh the list
      await loadInProgressAssessments();
    } catch (err) {
      console.error('Error deleting assessment:', err);
      setError('Failed to delete assessment. Please try again.');
    }
  };

  const getStepName = (step: number) => {
    const steps = ['History', 'Review of Systems', 'Past Medical History', 'Physical Exam', 'Assessment'];
    return steps[step - 1] || 'Unknown';
  };

  const getProgressPercent = (step: number, totalSteps: number) => {
    return Math.round((step / totalSteps) * 100);
  };

  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return 'Less than 1 hour ago';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hours ago`;
    } else {
      return `${Math.floor(diffHours / 24)} days ago`;
    }
  };

  if (loading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading assessments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resume Assessment</span>
            <Button onClick={onNewAssessment} className="bg-teal-600 hover:bg-teal-700">
              Start New Assessment
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {inProgressAssessments.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments in progress</h3>
              <p className="text-gray-600 mb-4">You don't have any incomplete assessments to resume.</p>
              <Button onClick={onNewAssessment} className="bg-teal-600 hover:bg-teal-700">
                Start Your First Assessment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                You have {inProgressAssessments.length} assessment{inProgressAssessments.length !== 1 ? 's' : ''} in progress. 
                Click "Resume" to continue where you left off.
              </p>

              {inProgressAssessments.map((assessment) => (
                <Card key={assessment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{assessment.patientName}</h4>
                          <Badge variant="outline">
                            Step {assessment.currentStep}: {getStepName(assessment.currentStep)}
                          </Badge>
                          <Badge variant="secondary">
                            {getProgressPercent(assessment.currentStep, assessment.totalSteps)}% Complete
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-2">
                          <strong>Chief Complaint:</strong> {assessment.chiefComplaint}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Last updated: {formatLastUpdated(assessment.lastUpdated)}</span>
                          <span>Answers: {assessment.answersCount}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAssessment(assessment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          onClick={() => onResumeAssessment(assessment.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}