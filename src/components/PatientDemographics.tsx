import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PatientDemographicsProps {
  formData: {
    name: string;
    age: string;
    gender: string;
    location: string;
    patientId: string;
  };
  updateField: (field: string, value: any) => void;
}

export function PatientDemographics({ formData, updateField }: PatientDemographicsProps) {
  return (
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
    </div>
  );
}