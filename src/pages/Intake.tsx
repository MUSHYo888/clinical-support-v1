"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ChevronRight, ChevronLeft, CheckCircle2, Loader2, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMedical } from "@/context/MedicalContext";

import { AssessmentHeader } from "@/components/AssessmentHeader";
import { AssessmentProgress } from "@/components/AssessmentProgress";
import { ChiefComplaintSelector } from "@/components/ChiefComplaintSelector";
import { ReviewOfSystemsComponent } from "@/components/ReviewOfSystemsComponent";
import { PastMedicalHistory } from "@/components/PastMedicalHistory";
import { PhysicalExamination } from "@/components/PhysicalExamination";
import { DifferentialDiagnosisEngine } from "@/components/DifferentialDiagnosisEngine";

export default function Intake() {
  const navigate = useNavigate();
  const { dispatch } = useMedical();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    patientId: '',
    location: '',
    chiefComplaint: '',
    pmhData: null,
    peData: null
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const steps = [
    "Demographics & Chief Complaint",
    "Review of Systems & History",
    "Physical Examination",
    "Differential Diagnosis"
  ];

  const handleNext = () => {
    if (step === 1 && (!formData.name || !formData.age || !formData.gender || !formData.chiefComplaint)) {
      toast.error("Please complete demographics and select a chief complaint.");
      return;
    }
    setStep(s => Math.min(s + 1, 4));
  };

  const handlePrev = () => {
    setStep(s => Math.max(s - 1, 1));
  };

  const handleCompleteIntake = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required to save patient data.");

      // 1. Create Patient Record
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          patient_id: formData.patientId || `PAT-${Date.now().toString().slice(-6)}`,
          location: formData.location || 'Triage',
          healthcare_provider_id: user.id
        })
        .select().single();

      if (patientError) throw patientError;

      // 2. Create Assessment Record
      const { error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          patient_id: patient.id,
          chief_complaint: formData.chiefComplaint,
          status: 'completed',
          current_step: 4
        });

      if (assessmentError) throw assessmentError;

      toast.success("Intake completed and saved successfully!");
      navigate("/");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save intake data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Top Navigation */}
        <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        {/* Main Form Card */}
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader>
            <AssessmentHeader chiefComplaint={formData.chiefComplaint || "Not selected"} />
            <AssessmentProgress 
              currentStep={step} 
              totalSteps={4} 
              steps={steps} 
              progressPercent={(step / 4) * 100} 
              answersCount={0} 
            />
          </CardHeader>
          
          <CardContent>
            <motion.div 
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="min-h-[350px]"
            >
              {/* STEP 1: Demographics & Chief Complaint */}
              {step === 1 && (
                <div className="space-y-8">
                  <h3 className="text-lg font-semibold border-b pb-2">Patient Demographics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Jane Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label>Age *</Label>
                      <Input type="number" value={formData.age} onChange={e => updateField('age', e.target.value)} placeholder="e.g. 45" />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender *</Label>
                      <Select value={formData.gender} onValueChange={v => updateField('gender', v)}>
                        <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Patient ID</Label>
                      <Input value={formData.patientId} onChange={e => updateField('patientId', e.target.value)} placeholder="Auto-generated if empty" />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">Select Chief Complaint *</h3>
                    <div className="border rounded-lg bg-muted/10 p-2 [&_.p-6]:px-0 [&_.p-6]:pt-2 [&_.shadow-lg]:shadow-none">
                      <ChiefComplaintSelector 
                        onSelect={(cc) => {
                          updateField('chiefComplaint', cc);
                          toast.success(`Selected Chief Complaint: ${cc}`);
                        }}
                        onBack={() => {}} 
                      />
                      {formData.chiefComplaint && (
                        <div className="mt-4 p-4 mx-4 mb-4 bg-primary/10 text-primary rounded-md font-medium text-center border border-primary/20">
                          Selected Chief Complaint: {formData.chiefComplaint}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: ROS & PMH */}
              {step === 2 && (
                <div className="space-y-8 [&_.p-6]:px-0 [&_.shadow-lg]:shadow-none">
                  <ReviewOfSystemsComponent 
                    onComplete={() => toast.success("ROS data recorded.")}
                    onBack={() => {}}
                  />
                  <PastMedicalHistory 
                    onSubmit={(data) => {
                      updateField('pmhData', data);
                      dispatch({ type: 'SET_PMH_DATA', payload: data });
                      toast.success("PMH data recorded.");
                    }}
                    onBack={() => {}}
                  />
                </div>
              )}

              {/* STEP 3: Physical Examination */}
              {step === 3 && (
                <div className="[&_.p-6]:px-0 [&_.shadow-lg]:shadow-none">
                  <PhysicalExamination 
                    chiefComplaint={formData.chiefComplaint}
                    onComplete={(data) => {
                      updateField('peData', data);
                      dispatch({ type: 'SET_PE_DATA', payload: data });
                      toast.success("Physical Exam data recorded.");
                    }}
                    onBack={() => {}}
                  />
                </div>
              )}

              {/* STEP 4: DDx Engine */}
              {step === 4 && (
                <div className="[&_.p-6]:px-0 [&_.shadow-lg]:shadow-none">
                  <DifferentialDiagnosisEngine 
                    chiefComplaint={formData.chiefComplaint}
                  />
                </div>
              )}
              
            </motion.div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t mt-8 gap-4">
              <Button variant="outline" onClick={handlePrev} disabled={step === 1 || loading} className="w-full sm:w-auto">
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {step < 4 ? (
                  <Button onClick={handleNext} className="w-full sm:w-auto">
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleCompleteIntake} disabled={loading} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Complete Intake
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
