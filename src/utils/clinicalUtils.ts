
// ABOUTME: Clinical utility functions for calculations and formatting
// ABOUTME: Provides reusable clinical calculation and formatting utilities

export class ClinicalUtils {
  static formatVitalSigns(vitals: any) {
    return {
      bloodPressure: `${vitals.systolicBP || 120}/${vitals.diastolicBP || 80} mmHg`,
      heartRate: `${vitals.heartRate || 80} bpm`,
      respiratoryRate: `${vitals.respiratoryRate || 16} /min`,
      temperature: `${vitals.temperature || 37}°C`,
      oxygenSaturation: `${vitals.oxygenSaturation || 98}%`
    };
  }

  static calculateBMI(weight: number, height: number): number {
    if (weight <= 0 || height <= 0) return 0;
    return weight / ((height / 100) ** 2);
  }

  static interpretBMI(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  static formatMedication(medication: any): string {
    return `${medication.name} ${medication.dosage} ${medication.frequency}`;
  }

  static categorizeUrgency(urgency: string): {
    color: string;
    text: string;
  } {
    switch (urgency.toLowerCase()) {
      case 'stat':
        return { color: 'bg-red-500', text: 'STAT' };
      case 'urgent':
        return { color: 'bg-orange-500', text: 'URGENT' };
      case 'routine':
        return { color: 'bg-green-500', text: 'ROUTINE' };
      default:
        return { color: 'bg-gray-500', text: 'UNKNOWN' };
    }
  }

  static calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  static formatTimeAgo(date: string): string {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }
}
