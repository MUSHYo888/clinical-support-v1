
// ABOUTME: Form component for creating new patients with real-time data persistence
// ABOUTME: Validates patient data and saves to Supabase database
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Patient } from '@/types/medical';
import { useCreatePatient } from '@/hooks/usePatients';
import { useMedical } from '@/hooks/useMedical';

interface NewPatientFormProps {
  onSubmit: (patient: Patient) => void;
  onCancel: () => void;
}

export function NewPatientForm({ onSubmit, onCancel }: NewPatientFormProps) {
  const { dispatch } = useMedical();
  const createPatientMutation = useCreatePatient();
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    patientId: '',
    location: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const generatePatientId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PAT-${timestamp}${random}`;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Patient name is required';
    }

    if (!formData.age || parseInt(formData.age) < 0 || parseInt(formData.age) > 150) {
      newErrors.age = 'Please enter a valid age (0-150)';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select a gender';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const patientData = {
      name: formData.name.trim(),
      age: parseInt(formData.age),
      gender: formData.gender as 'male' | 'female' | 'other',
      patientId: formData.patientId || generatePatientId(),
      location: formData.location.trim()
    };

    try {
      const newPatient = await createPatientMutation.mutateAsync(patientData);
      dispatch({ type: 'SET_CURRENT_PATIENT', payload: newPatient });
      onSubmit(newPatient);
    } catch (error) {
      console.error('Error creating patient:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl sm:text-2xl text-center">New Patient Registration</CardTitle>
          <p className="text-center text-sm sm:text-base text-muted-foreground">
            Enter patient information to begin assessment
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter patient's full name"
                  className={`h-11 ${errors.name ? 'border-destructive' : ''}`}
                />
                {errors.name && <p className="text-destructive text-xs sm:text-sm">{errors.name}</p>}
              </div>

              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Enter age"
                  min="0"
                  max="150"
                  className={`h-11 ${errors.age ? 'border-destructive' : ''}`}
                />
                {errors.age && <p className="text-destructive text-xs sm:text-sm">{errors.age}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger className={`h-11 ${errors.gender ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-destructive text-xs sm:text-sm">{errors.gender}</p>}
              </div>

              {/* Patient ID */}
              <div className="space-y-2">
                <Label htmlFor="patientId" className="text-sm font-medium">Patient ID</Label>
                <Input
                  id="patientId"
                  value={formData.patientId}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="h-11"
                />
                <p className="text-xs sm:text-sm text-muted-foreground">Leave empty to auto-generate</p>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">Location/Ward *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter ward or department"
                className={`h-11 ${errors.location ? 'border-destructive' : ''}`}
              />
              {errors.location && <p className="text-destructive text-xs sm:text-sm">{errors.location}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={createPatientMutation.isPending}
                className="h-11 sm:h-10 w-full sm:w-auto hover-lift"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-primary hover:bg-primary/90 h-11 sm:h-10 w-full sm:w-auto hover-lift"
                disabled={createPatientMutation.isPending}
                size="lg"
              >
                {createPatientMutation.isPending ? 'Creating...' : 'Create Patient'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
