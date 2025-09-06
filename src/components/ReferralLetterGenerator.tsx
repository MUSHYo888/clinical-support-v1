// ABOUTME: Referral letter generation component with specialty recommendations and templates
// ABOUTME: Handles creating professional medical referral letters with AI-powered clinical intelligence

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Send, ArrowLeft, Lightbulb, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { ClinicalReportService } from '@/services/reporting/ClinicalReportService';
import { PDFGeneratorService } from '@/services/reporting/PDFGeneratorService';
import { SpecialtyRecommendationService } from '@/services/SpecialtyRecommendationService';
import { ReferralLetterTemplates } from '@/services/ReferralLetterTemplates';
import { Patient, DifferentialDiagnosis } from '@/types/medical';
import { ReferralLetter } from '@/types/reporting';

interface ReferralLetterGeneratorProps {
  assessmentId: string;
  patient: Patient;
  chiefComplaint: string;
  differentials: DifferentialDiagnosis[];
  answers: Record<string, any>;
  rosData: Record<string, any>;
  onSave: (referral: ReferralLetter) => void;
  onCancel: () => void;
}

const URGENCY_OPTIONS = [
  { value: 'routine', label: 'Routine', description: 'Standard referral timeframe' },
  { value: 'urgent', label: 'Urgent', description: 'Requires prompt attention' },
  { value: 'stat', label: 'STAT', description: 'Immediate medical attention required' }
] as const;

export function ReferralLetterGenerator({
  assessmentId,
  patient,
  chiefComplaint,
  differentials,
  answers,
  rosData,
  onSave,
  onCancel
}: ReferralLetterGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [specialty, setSpecialty] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientFacility, setRecipientFacility] = useState('');
  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [clinicalQuestion, setClinicalQuestion] = useState('');
  const [relevantHistory, setRelevantHistory] = useState('');
  const [examinationFindings, setExaminationFindings] = useState('');
  const [investigationsCompleted, setInvestigationsCompleted] = useState('');
  
  const [recommendedSpecialties, setRecommendedSpecialties] = useState<Array<{specialty: string, reason: string, confidence: number}>>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [letterPreview, setLetterPreview] = useState('');

  useEffect(() => {
    generateRecommendations();
  }, []);

  useEffect(() => {
    if (specialty) {
      generateTemplateContent();
    }
  }, [specialty, chiefComplaint, differentials]);

  const generateRecommendations = async () => {
    try {
      setGenerating(true);
      
      // Get specialty recommendations
      const specialtyRecs = await SpecialtyRecommendationService.getSpecialtyRecommendations(
        chiefComplaint,
        differentials,
        answers,
        rosData
      );
      setRecommendedSpecialties(specialtyRecs);
      
      // Auto-select highest confidence specialty if very confident
      if (specialtyRecs.length > 0 && specialtyRecs[0].confidence > 0.8) {
        setSpecialty(specialtyRecs[0].specialty);
      }
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Unable to generate specialty recommendations');
    } finally {
      setGenerating(false);
    }
  };

  const generateTemplateContent = async () => {
    try {
      const template = ReferralLetterTemplates.getTemplate(specialty, chiefComplaint);
      
      // Set suggested questions
      setSuggestedQuestions(template.suggestedQuestions);
      
      // Auto-populate fields if empty
      if (!clinicalQuestion && template.suggestedQuestions.length > 0) {
        setClinicalQuestion(template.suggestedQuestions[0]);
      }
      
      if (!relevantHistory) {
        setRelevantHistory(template.relevantHistoryTemplate);
      }
      
      if (!examinationFindings) {
        setExaminationFindings(template.examinationTemplate);
      }
      
      // Generate letter preview
      updateLetterPreview();
      
    } catch (error) {
      console.error('Error generating template content:', error);
    }
  };

  const updateLetterPreview = () => {
    const preview = ReferralLetterTemplates.generateLetterPreview({
      specialty,
      patient,
      chiefComplaint,
      clinicalQuestion,
      relevantHistory,
      examinationFindings,
      investigationsCompleted,
      urgency
    });
    setLetterPreview(preview);
  };

  const handleSpecialtySelect = (selectedSpecialty: string) => {
    setSpecialty(selectedSpecialty);
  };

  const handleSuggestedQuestionSelect = (question: string) => {
    setClinicalQuestion(question);
    updateLetterPreview();
  };

  const handleSaveReferral = async () => {
    if (!specialty || !clinicalQuestion) {
      toast.error('Please select a specialty and provide a clinical question');
      return;
    }

    try {
      setLoading(true);
      
      const letterContent = {
        patientDetails: {
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          patientId: patient.patientId
        },
        clinicalSummary: `Chief complaint: ${chiefComplaint}. ${relevantHistory}`,
        specificRequest: clinicalQuestion,
        investigations: investigationsCompleted ? [investigationsCompleted] : [],
        urgencyReason: urgency === 'urgent' ? 'Requires prompt attention' : urgency === 'stat' ? 'Immediate attention required' : undefined,
        contactDetails: {
          referringPhysician: 'Dr. [Your Name]',
          facility: 'Medical Practice',
          phone: '(000) 000-0000',
          email: 'practice@medical.com'
        }
      };

      const referral = await ClinicalReportService.createReferralLetter(
        assessmentId,
        specialty,
        clinicalQuestion,
        letterContent,
        urgency
      );

      // Set additional fields
      const updatedReferral = {
        ...referral,
        recipientName,
        recipientFacility,
        relevantHistory,
        examinationFindings,
        investigationsCompleted
      };

      toast.success('Referral letter created successfully');
      onSave(updatedReferral);
      
    } catch (error) {
      console.error('Error saving referral letter:', error);
      toast.error('Failed to create referral letter');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!specialty || !clinicalQuestion) {
      toast.error('Please complete the referral letter first');
      return;
    }

    try {
      setLoading(true);
      
      const referralData: ReferralLetter = {
        id: 'preview',
        assessmentId,
        specialty,
        recipientName,
        recipientFacility,
        urgency,
        clinicalQuestion,
        relevantHistory,
        examinationFindings,
        investigationsCompleted,
        letterContent: {
          patientDetails: {
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            patientId: patient.patientId
          },
          clinicalSummary: `Chief complaint: ${chiefComplaint}. ${relevantHistory}`,
          specificRequest: clinicalQuestion,
          investigations: investigationsCompleted ? [investigationsCompleted] : [],
          contactDetails: {
            referringPhysician: 'Dr. [Your Name]',
            facility: 'Medical Practice'
          }
        },
        createdAt: new Date().toISOString(),
        status: 'draft'
      };

      const pdfBlob = await PDFGeneratorService.generateReferralLetterPDF(referralData, patient);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `referral-letter-${patient.name.replace(/\s+/g, '-')}-${specialty}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Referral letter downloaded successfully');
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5 text-primary" />
            <span>Generate Referral Letter</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Create a professional referral letter for {patient.name} with AI-powered specialty recommendations
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Specialty Recommendations */}
          {generating ? (
            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing case for specialty recommendations...</span>
            </div>
          ) : recommendedSpecialties.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold">AI-Recommended Specialties</h3>
              </div>
              <div className="grid gap-2">
                {recommendedSpecialties.slice(0, 3).map((rec, index) => (
                  <div
                    key={rec.specialty}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      specialty === rec.specialty 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleSpecialtySelect(rec.specialty)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{rec.specialty}</span>
                        <Badge variant="outline" className="ml-2">
                          {Math.round(rec.confidence * 100)}% match
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Referral Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="specialty">Specialty *</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cardiology">Cardiology</SelectItem>
                    <SelectItem value="Neurology">Neurology</SelectItem>
                    <SelectItem value="Gastroenterology">Gastroenterology</SelectItem>
                    <SelectItem value="Endocrinology">Endocrinology</SelectItem>
                    <SelectItem value="Rheumatology">Rheumatology</SelectItem>
                    <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                    <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                    <SelectItem value="Dermatology">Dermatology</SelectItem>
                    <SelectItem value="Oncology">Oncology</SelectItem>
                    <SelectItem value="Emergency Medicine">Emergency Medicine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select value={urgency} onValueChange={(value: 'routine' | 'urgent' | 'stat') => setUrgency(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recipientName">Recipient Doctor (Optional)</Label>
                <Input
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Dr. Smith"
                />
              </div>

              <div>
                <Label htmlFor="recipientFacility">Facility (Optional)</Label>
                <Input
                  id="recipientFacility"
                  value={recipientFacility}
                  onChange={(e) => setRecipientFacility(e.target.value)}
                  placeholder="City Hospital Cardiology Department"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="clinicalQuestion">Clinical Question *</Label>
                <Textarea
                  id="clinicalQuestion"
                  value={clinicalQuestion}
                  onChange={(e) => {
                    setClinicalQuestion(e.target.value);
                    updateLetterPreview();
                  }}
                  placeholder="What specific question or evaluation are you requesting?"
                  rows={3}
                />
                {suggestedQuestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">Suggested questions:</p>
                    <div className="space-y-1">
                      {suggestedQuestions.slice(0, 3).map((question, index) => (
                        <button
                          key={index}
                          type="button"
                          className="text-xs text-primary hover:text-primary/80 text-left block"
                          onClick={() => handleSuggestedQuestionSelect(question)}
                        >
                          • {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="relevantHistory">Relevant History</Label>
                <Textarea
                  id="relevantHistory"
                  value={relevantHistory}
                  onChange={(e) => {
                    setRelevantHistory(e.target.value);
                    updateLetterPreview();
                  }}
                  placeholder="Brief relevant history..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="examinationFindings">Key Examination Findings</Label>
                <Textarea
                  id="examinationFindings"
                  value={examinationFindings}
                  onChange={(e) => {
                    setExaminationFindings(e.target.value);
                    updateLetterPreview();
                  }}
                  placeholder="Relevant physical examination findings..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="investigations">Investigations Completed</Label>
                <Textarea
                  id="investigations"
                  value={investigationsCompleted}
                  onChange={(e) => {
                    setInvestigationsCompleted(e.target.value);
                    updateLetterPreview();
                  }}
                  placeholder="ECG, blood tests, imaging..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Letter Preview */}
          {letterPreview && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Letter Preview</span>
                </h3>
                <div className="p-4 bg-muted/30 rounded-lg border text-sm font-mono whitespace-pre-line">
                  {letterPreview}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={loading || !specialty || !clinicalQuestion}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              
              <Button
                onClick={handleSaveReferral}
                disabled={loading || !specialty || !clinicalQuestion}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Save Referral Letter
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}