// ABOUTME: Component for systematic physical examination documentation
// ABOUTME: Uses a Spatial-Exception paradigm: "Normal" by default, expand on exception
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PhysicalExamData } from '@/types/physical-exam';
import { useMedical } from '@/context/MedicalContext';
import { HeartPulse, User, Activity, Bone, PersonStanding, CheckCircle, AlertCircle } from 'lucide-react';

const examSystems = [
  {
    name: 'general',
    label: 'General Appearance',
    zone: 'general',
    findings: ['Appears in distress', 'Lethargic', 'Toxic-appearing', 'Cachectic', 'Obese', 'Malnourished', 'Agitated']
  },
  {
    name: 'heent',
    label: 'HEENT',
    zone: 'head',
    findings: ['Pupils unequal/unreactive', 'Scleral icterus', 'Pharyngeal erythema', 'Tonsillar exudate', 'TM erythema/bulging', 'Sinus tenderness', 'Cervical lymphadenopathy']
  },
  {
    name: 'neurological',
    label: 'Neurological',
    zone: 'head',
    findings: ['Altered mental status', 'Focal motor deficit', 'Focal sensory deficit', 'Cranial nerve deficit', 'Gait abnormality', 'Abnormal reflexes', 'Speech deficit']
  },
  {
    name: 'cardiovascular',
    label: 'Cardiovascular',
    zone: 'chest',
    findings: [
      'Tachycardia',
      'Bradycardia',
      'Irregular rhythm',
      'Murmur present',
      'Gallop (S3/S4)',
      'Friction rub',
      'JVD',
      'Diminished pulses'
    ]
  },
  {
    name: 'pulmonary',
    label: 'Respiratory',
    zone: 'chest',
    findings: [
      'Tachypnea',
      'Wheezes',
      'Crackles/rales',
      'Rhonchi',
      'Decreased breath sounds',
      'Use of accessory muscles',
      'Stridor'
    ]
  },
  {
    name: 'abdomen',
    label: 'Gastrointestinal',
    zone: 'abdomen',
    findings: [
      'Tenderness',
      'Rebound/Guarding',
      'Rigidity',
      'Distended',
      'Hypoactive bowel sounds',
      'Hyperactive bowel sounds',
      'Hepatomegaly',
      'Splenomegaly',
      'Organomegaly'
    ]
  },
  {
    name: 'musculoskeletal',
    label: 'Musculoskeletal',
    zone: 'extremities',
    findings: [
      'Joint swelling',
      'Tenderness',
      'Limited ROM',
      'Deformity',
      'Muscle spasm',
      'Calf tenderness',
      'Pedal edema'
    ]
  },
  {
    name: 'skin',
    label: 'Skin',
    zone: 'general',
    findings: [
      'Rash',
      'Lesion',
      'Erythema',
      'Warmth',
      'Fluctuance',
      'Induration',
      'Cyanosis',
      'Pallor',
      'Bruising',
      'Poor skin turgor',
      'Jaundice'
    ]
  }
];

const BODY_ZONES = [
  { id: 'head', label: 'Head & Neck', icon: User },
  { id: 'chest', label: 'Chest', icon: HeartPulse },
  { id: 'abdomen', label: 'Abdomen', icon: Activity },
  { id: 'extremities', label: 'Extremities', icon: Bone },
  { id: 'general', label: 'General/Skin', icon: PersonStanding }
];

export function PhysicalExamination() {
  const { state, dispatch } = useMedical();

  const initializeSystems = () => {
    const initial: Record<string, any> = {};
    examSystems.forEach(sys => {
      initial[sys.name] = { normal: true, findings: [], notes: '' };
    });
    return { ...initial, ...(state.peData?.systems || {}) };
  };

  const [data, setData] = useState<PhysicalExamData>(state.peData || {
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      temperature: '',
      oxygenSaturation: ''
    },
    systems: initializeSystems(),
    generalAppearance: ''
  });

  useEffect(() => {
    const payload = { ...data };
    const generalSys = data.systems['general'];
    
    // Auto-sync generalAppearance for backward compatibility with ClinicalSummary
    if (generalSys && !generalSys.normal) {
      payload.generalAppearance = [...generalSys.findings, generalSys.notes].filter(Boolean).join('. ');
    } else {
      payload.generalAppearance = 'Alert and Oriented x3, Well-developed, No Acute Distress.';
    }
    
    dispatch({ type: 'SET_PE_DATA', payload });
  }, [data, dispatch]);

  const handleVitalSignChange = (field: string, value: string) => {
    setData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [field]: value
      }
    }));
  };

  const markZoneAbnormal = (zoneId: string) => {
    setData(prev => {
      const newSystems = { ...prev.systems };
      examSystems.forEach(sys => {
        if (sys.zone === zoneId) {
          newSystems[sys.name] = { 
            normal: false, 
            findings: newSystems[sys.name]?.findings || [], 
            notes: newSystems[sys.name]?.notes || '' 
          };
        }
      });
      return { ...prev, systems: newSystems };
    });
  };

  const restoreNormal = (systemName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setData(prev => ({
      ...prev,
      systems: {
        ...prev.systems,
        [systemName]: { normal: true, findings: [], notes: '' }
      }
    }));
  };

  const markSystemAbnormal = (systemName: string) => {
    setData(prev => ({
      ...prev,
      systems: {
        ...prev.systems,
        [systemName]: { 
          normal: false, 
          findings: prev.systems[systemName]?.findings || [], 
          notes: prev.systems[systemName]?.notes || '' 
        }
      }
    }));
  };

  const toggleFinding = (systemName: string, finding: string) => {
    setData(prev => {
      const currentFindings = prev.systems[systemName]?.findings || [];
      const newFindings = currentFindings.includes(finding)
        ? currentFindings.filter(f => f !== finding)
        : [...currentFindings, finding];

      return {
        ...prev,
        systems: {
          ...prev.systems,
          [systemName]: {
            ...prev.systems[systemName],
            normal: false,
            findings: newFindings
          }
        }
      };
    });
  };

  const handleSystemNotes = (systemName: string, notes: string) => {
    setData(prev => ({
      ...prev,
      systems: {
        ...prev.systems,
        [systemName]: {
          ...prev.systems[systemName],
          notes,
          normal: prev.systems[systemName]?.normal || false,
          findings: prev.systems[systemName]?.findings || []
        }
      }
    }));
  };

  return (
    <div className="w-full">
      <Card className="bg-transparent border-none shadow-none max-w-[95%] mx-auto">
        <CardHeader className="px-0 pt-0 pb-6">
          <CardTitle className="text-xl sm:text-2xl">Physical Examination</CardTitle>
          <p className="text-sm text-muted-foreground">Select an abnormal zone to expand related systems. Default is Normal.</p>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            
            {/* COMPACT VITALS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
              <div className="space-y-1.5">
                <Label htmlFor="bp" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">BP</Label>
                <Input
                  id="bp"
                  placeholder="120/80"
                  value={data.vitalSigns.bloodPressure}
                  onChange={(e) => handleVitalSignChange('bloodPressure', e.target.value)}
                  className="h-8 text-sm bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hr" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">HR</Label>
                <Input
                  id="hr"
                  placeholder="72"
                  value={data.vitalSigns.heartRate}
                  onChange={(e) => handleVitalSignChange('heartRate', e.target.value)}
                  className="h-8 text-sm bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rr" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">RR</Label>
                <Input
                  id="rr"
                  placeholder="16"
                  value={data.vitalSigns.respiratoryRate}
                  onChange={(e) => handleVitalSignChange('respiratoryRate', e.target.value)}
                  className="h-8 text-sm bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="temp" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Temp</Label>
                <Input
                  id="temp"
                  placeholder="98.6°F"
                  value={data.vitalSigns.temperature}
                  onChange={(e) => handleVitalSignChange('temperature', e.target.value)}
                  className="h-8 text-sm bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o2sat" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">O2 Sat</Label>
                <Input
                  id="o2sat"
                  placeholder="98%"
                  value={data.vitalSigns.oxygenSaturation}
                  onChange={(e) => handleVitalSignChange('oxygenSaturation', e.target.value)}
                  className="h-8 text-sm bg-background"
                />
              </div>
            </div>

            {/* TOP ROW: BODY ZONES */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {BODY_ZONES.map(zone => {
                const isAbnormal = examSystems.some(sys => sys.zone === zone.id && !data.systems[sys.name]?.normal);
                return (
                  <Button
                    key={zone.id}
                    type="button"
                    variant={isAbnormal ? "default" : "outline"}
                    className={cn(
                      "h-16 flex flex-col gap-1.5", 
                      isAbnormal ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 shadow-sm" : "bg-card hover:bg-muted"
                    )}
                    onClick={() => markZoneAbnormal(zone.id)}
                  >
                    <zone.icon className="h-5 w-5" />
                    <span className="text-xs font-semibold">{zone.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* WATERFALL: SYSTEM LIST */}
            <div className="space-y-3 mt-6">
              {examSystems.map((sys) => {
                const isNormal = data.systems[sys.name]?.normal;
                
                if (isNormal) {
                  return (
                    <div 
                      key={sys.name}
                      className="flex items-center justify-between p-3 bg-green-50/40 border border-green-200/60 rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
                      onClick={() => markSystemAbnormal(sys.name)}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-green-800 text-sm">{sys.label}</span>
                      </div>
                      <Badge variant="outline" className="bg-green-100/50 text-green-700 border-green-200 text-xs">Normal</Badge>
                    </div>
                  );
                }

                return (
                  <div key={sys.name} className="p-4 bg-orange-50/30 border border-orange-200 rounded-lg shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-orange-800 text-sm">{sys.label}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-green-700 hover:bg-green-100" onClick={(e) => restoreNormal(sys.name, e)}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Restore to Normal
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {sys.findings.map((finding) => {
                        const isChecked = data.systems[sys.name]?.findings?.includes(finding) || false;
                        return (
                          <label 
                            key={finding} 
                            className="flex items-start space-x-2.5 p-2 rounded-md hover:bg-orange-100/50 transition-colors cursor-pointer"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleFinding(sys.name, finding)}
                              className="mt-0.5 border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <span className={cn("text-xs font-medium leading-tight", isChecked ? "text-orange-900" : "text-foreground")}>
                              {finding}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    
                    <Input
                      placeholder={`Specific notes for ${sys.label}...`}
                      value={data.systems[sys.name]?.notes || ''}
                      onChange={(e) => handleSystemNotes(sys.name, e.target.value)}
                      className="h-8 text-sm bg-white"
                    />
                  </div>
                );
              })}
            </div>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
