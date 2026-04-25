"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  ArrowUpRight,
  MoreHorizontal,
  Calendar,
  LayoutGrid,
  FileText,
  ClipboardList,
  Languages,
  Archive,
  Brain,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  ChevronDown,
  ListTodo,
  Plus,
  CheckCircle2,
  Circle,
  GraduationCap,
  User,
  Phone,
  MapPin,
  Stethoscope,
  ExternalLink,
  Library,
  Search,
  BookOpen,
  Calculator,
  Globe,
  LogOut,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// --- KPI Card Component & Types ---
type Tone = "default" | "primary" | "success" | "warning" | "danger";
type Size = "sm" | "md" | "lg";
type Trend = "up" | "down" | "flat";

export type KpiCardProps = {
  label: string;
  value: string | number | React.ReactNode;
  delta?: number | string;
  trend?: Trend;
  caption?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  size?: Size;
  compact?: boolean;
  className?: string;
};

const toneMap: Record<Tone, { card: string; value: string; deltaUp: string; deltaDown: string }> = {
  default: {
    card: "bg-zinc-100/70 dark:bg-zinc-900/50 ring-1 ring-zinc-200 dark:ring-zinc-800",
    value: "text-zinc-950 dark:text-zinc-50",
    deltaUp: "text-emerald-600 dark:text-emerald-400",
    deltaDown: "text-rose-600 dark:text-rose-400",
  },
  primary: {
    card: "bg-blue-100/70 dark:bg-blue-900/30 ring-1 ring-blue-200/60 dark:ring-blue-800/60",
    value: "text-blue-700 dark:text-blue-200",
    deltaUp: "text-emerald-600 dark:text-emerald-400",
    deltaDown: "text-rose-600 dark:text-rose-400",
  },
  success: {
    card: "bg-emerald-100/70 dark:bg-emerald-900/30 ring-1 ring-emerald-200/60 dark:ring-emerald-800/60",
    value: "text-emerald-700 dark:text-emerald-200",
    deltaUp: "text-emerald-700 dark:text-emerald-300",
    deltaDown: "text-rose-600 dark:text-rose-400",
  },
  warning: {
    card: "bg-amber-100/70 dark:bg-amber-900/30 ring-1 ring-amber-200/60 dark:ring-amber-800/60",
    value: "text-amber-700 dark:text-amber-200",
    deltaUp: "text-emerald-600 dark:text-emerald-400",
    deltaDown: "text-rose-600 dark:text-rose-400",
  },
  danger: {
    card: "bg-rose-100/70 dark:bg-rose-900/30 ring-1 ring-rose-200/60 dark:ring-rose-800/60",
    value: "text-rose-700 dark:text-rose-200",
    deltaUp: "text-emerald-600 dark:text-emerald-400",
    deltaDown: "text-rose-700 dark:text-rose-300",
  },
};

const sizeMap: Record<Size, { pad: string; label: string; value: string; caption: string; icon: string }> = {
  sm: {
    pad: "p-3",
    label: "text-xs",
    value: "text-xl",
    caption: "text-[11px]",
    icon: "h-4 w-4",
  },
  md: {
    pad: "p-4",
    label: "text-sm",
    value: "text-2xl",
    caption: "text-xs",
    icon: "h-5 w-5",
  },
  lg: {
    pad: "p-6",
    label: "text-sm",
    value: "text-3xl",
    caption: "text-sm",
    icon: "h-6 w-6",
  },
};

function KpiCard({
  label,
  value,
  delta,
  trend = "flat",
  caption,
  icon,
  tone = "primary",
  size = "md",
  compact = false,
  className,
}: KpiCardProps) {
  const t = toneMap[tone];
  const s = sizeMap[size];

  const deltaValue = typeof delta === "number" ? `${delta > 0 ? "+" : ""}${delta}%` : delta;

  const isUp = trend === "up";
  const isDown = trend === "down";
  const DeltaIcon = isUp ? TrendingUp : isDown ? TrendingDown : Activity;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl shadow-sm",
        t.card,
        s.pad,
        !compact && "min-h-[92px]",
        className
      )}
    >
      <span className="pointer-events-none absolute -right-6 -top-6 inline-flex h-16 w-16 rounded-full bg-black/5 dark:bg-white/5" />
      <span className="pointer-events-none absolute -right-2 -top-2 inline-flex h-8 w-8 rounded-full bg-black/5 dark:bg-white/5" />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className={cn("font-medium text-zinc-700 dark:text-zinc-300", s.label)}>{label}</div>
          <div className={cn("font-semibold tracking-tight", t.value, s.value)}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
          {caption ? <div className={cn("text-zinc-500 dark:text-zinc-400", s.caption)}>{caption}</div> : null}
        </div>

        <div className="flex items-center gap-2">
          {typeof deltaValue !== "undefined" && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isUp ? t.deltaUp : isDown ? t.deltaDown : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <DeltaIcon className="h-4 w-4" aria-hidden />
              {deltaValue}
            </div>
          )}
          {icon ? <div className={cn("rounded-full bg-white/40 p-1 dark:bg-white/10", s.icon)}>{icon}</div> : null}
        </div>
      </div>

      <div className="bg-current/40 mt-3 h-0.5 w-16 rounded opacity-60" />
    </div>
  );
}

const generateVignette = (patient: any) => {
  if (!patient) return "";
  const demo = `A ${patient.age}-year-old ${patient.gender}`;
  const ddx = patient.differentials && patient.differentials.length > 0 
    ? patient.differentials.map((d: any) => `- ${d.name}`).join('\n') 
    : "- Pending";
  
  return `📚 CLINICAL CASE STUDY\n\n` +
         `1️⃣ PRESENTATION:\n${demo} presents to the ER/Clinic.\nChief Complaint: ${patient.chiefComplaint}\n\n` +
         `2️⃣ KEY FINDINGS:\n[Insert Vitals/Physical Exam here]\n\n` +
         `3️⃣ DIFFERENTIAL DIAGNOSIS:\n${ddx}\n\n` +
         `4️⃣ CLINICAL QUESTION:\nWhat is the most appropriate next step in management?`;
};

// --- Main Dashboard Component ---
export default function NewMedicalDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("Current Shift");
  const [activeFilter, setActiveFilter] = useState("All Cases");
  const [searchQueryPatients, setSearchQueryPatients] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [showHandoff, setShowHandoff] = useState(false);
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [teachingCase, setTeachingCase] = useState<any | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [vignetteText, setVignetteText] = useState("");
  const [showStudyHub, setShowStudyHub] = useState(false);
  const [selectedStudyPatient, setSelectedStudyPatient] = useState<any | null>(null);
  const [showToolkit, setShowToolkit] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState([
    { id: 1, text: "Chase morning CBC for Patient #456", completed: false },
    { id: 2, text: "Page Cardiology for Bed 7 consult", completed: false },
    { id: 3, text: "Re-check BP for Sarah Connor in 30 mins", completed: true }
  ]);
  const [newTask, setNewTask] = useState("");

  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatientsData = async () => {
      setLoadingPatients(true);
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select(`
            id,
            chief_complaint,
            status,
            updated_at,
            patients (
              id,
              name,
              age,
              gender,
              patient_id
            ),
            differential_diagnoses (
              condition_name,
              probability
            )
          `)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const mapped = data.map((a: any) => {
            const patientData = Array.isArray(a.patients) ? a.patients[0] : a.patients;
            return {
              id: a.id,
              patientId: patientData?.patient_id || 'UNKNOWN',
              realPatientId: patientData?.id,
              name: patientData?.name || 'Unknown Patient',
              age: patientData?.age || 0,
              gender: patientData?.gender || 'unknown',
              date: new Date(a.updated_at).toLocaleDateString(),
              chiefComplaint: a.chief_complaint,
              status: a.status === 'completed' ? 'Finalized' : (a.status === 'in-progress' ? 'In Progress' : 'Incomplete'),
              differentials: (a.differential_diagnoses || []).map((d: any) => ({
                name: d.condition_name,
                confidence: d.probability,
                resources: []
              })),
              soapNotes: []
            };
          });
          setPatients(mapped);
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatientsData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await signOut();
    navigate("/auth");
  };

  const currentTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const currentDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const toggleExpand = (id: string) => setExpandedPatientId(prev => prev === id ? null : id);

  const toggleTask = (id: number) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask("");
    }
  };

  const filteredPatients = (patients || []).filter(patient => {
    const matchesFilter = activeFilter === "All Cases" 
      || (activeFilter === "Incomplete" && patient.status === "Incomplete")
      || (activeFilter === "In Progress" && patient.status === "In Progress")
      || (activeFilter === "Finalized" && patient.status === "Finalized");
      
    const matchesSearch = 
      patient.name?.toLowerCase().includes(searchQueryPatients.toLowerCase()) ||
      patient.patientId?.toLowerCase().includes(searchQueryPatients.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const totalPatients = patients.length;
  const inProgressCount = patients.filter(p => p.status === 'In Progress').length;
  const incompleteCount = patients.filter(p => p.status === 'Incomplete').length;
  const finalizedCount = patients.filter(p => p.status === 'Finalized' || p.status === 'completed').length; 

  return (
    <Sheet>
      <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">History Pro Clinical Workspace</div>
            <div className="flex items-center gap-4 mt-2">
              <div className="h-12 w-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center border-2 border-teal-500 shrink-0">
                <Stethoscope className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Dr. Muslim</h1>
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    On Wards
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><User className="h-3 w-3"/> Medical Extern</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/> Internal Medicine</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> Pager: #4922</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium text-foreground">{currentTime}</div>
                <div className="text-xs text-muted-foreground">{currentDate}</div>
              </div>
            </div>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <ListTodo className="mr-2 h-4 w-4" />
                Ward Tasks
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {tasks.filter(t => !t.completed).length}
                </span>
              </Button>
            </SheetTrigger>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              {selectedPeriod}
            </Button>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Command Ribbon */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center gap-3 bg-muted/30 border border-border rounded-lg p-2 mb-6 shadow-sm"
        >
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" onClick={() => navigate('/intake')}>
            <ClipboardList className="mr-2 h-4 w-4" /> Start New Intake
          </Button>
          <div className="flex items-center gap-2 border-l border-border pl-3 ml-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setShowStudyHub(true)}>
              <Brain className="mr-2 h-4 w-4" /> Review Differentials
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setShowToolkit(true)}>
              <Calculator className="mr-2 h-4 w-4" /> Clinical Toolkit
            </Button>
          </div>
          <div className="sm:ml-auto">
            <Button variant="secondary" onClick={() => setShowHandoff(!showHandoff)} className="shadow-sm border border-border">
              <ClipboardList className="mr-2 h-4 w-4" /> Generate Shift Handoff
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0 }}>
            <KpiCard 
              label="Active Ward Patients" 
              value={loadingPatients ? <Loader2 className="h-6 w-6 animate-spin" /> : totalPatients} 
              tone="primary" 
              icon={<Users className="h-4 w-4" />} 
              caption="currently assigned" 
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <KpiCard 
              label="In Progress" 
              value={loadingPatients ? <Loader2 className="h-6 w-6 animate-spin" /> : inProgressCount} 
              tone="warning" 
              icon={<Brain className="h-4 w-4" />} 
              caption="Awaiting DDx review" 
              trend="up" 
              delta={2} 
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <KpiCard 
              label="Incomplete" 
              value={loadingPatients ? <Loader2 className="h-6 w-6 animate-spin" /> : incompleteCount} 
              tone="danger" 
              icon={<AlertTriangle className="h-4 w-4" />} 
              caption="Missing intake data" 
              trend="down" 
              delta={-1} 
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
            <KpiCard 
              label="Finalized" 
              value={loadingPatients ? <Loader2 className="h-6 w-6 animate-spin" /> : finalizedCount} 
              tone="success" 
              icon={<FileText className="h-4 w-4" />} 
              caption="Ready for EMR export" 
              trend="up" 
              delta={4} 
            />
          </motion.div>
        </div>

        {/* Recent Patients Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>Recent Patients</CardTitle>
                  <CardDescription>Latest patient assessments and updates</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2">
                <div className="flex flex-row overflow-x-auto gap-2 scrollbar-hide w-full sm:w-auto">
                  <Button variant={activeFilter === "All Cases" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("All Cases")}>All Cases</Button>
                  <Button variant={activeFilter === "Incomplete" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("Incomplete")}>Incomplete</Button>
                  <Button variant={activeFilter === "In Progress" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("In Progress")}>In Progress</Button>
                  <Button variant={activeFilter === "Finalized" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("Finalized")}>Finalized</Button>
                </div>
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search patients by name or ID..." 
                    className="pl-8 h-9" 
                    value={searchQueryPatients}
                    onChange={(e) => setSearchQueryPatients(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPatients ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                  <p>Loading patient records...</p>
                </div>
              ) : patients.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="mb-4">No patients currently assigned to your ward. Click 'Start New Intake' to begin.</p>
                  <Button onClick={() => navigate('/intake')}>Start New Intake</Button>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No patients match the current filter or search.</p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {filteredPatients.map((patient) => (
                  <div key={patient.id} className="rounded-lg border overflow-hidden bg-card transition-colors">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpand(patient.id)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">{patient.age} years • {patient.gender}</p>
                        <p className="text-sm text-muted-foreground italic truncate max-w-md">{patient.chiefComplaint}</p>
                      </div>
                      <div className="px-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                          patient.status === "Finalized" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          patient.status === "In Progress" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                        )}>
                          {patient.status}
                        </span>
                      </div>
                      <div className="flex items-center text-right">
                        <div className="flex flex-col items-end gap-1">
                        <p className="font-medium text-foreground">ID: {patient.patientId}</p>
                        <p className="text-sm text-muted-foreground">{patient.date}</p>
                        </div>
                        
                        <div className="h-8 w-px bg-border ml-4" />
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button 
                            variant="outline" 
                            className="hover:bg-primary hover:text-primary-foreground transition-all"
                            onClick={(e) => { e.stopPropagation(); navigate(`/patient/${patient.id}`); }}
                          >
                            View Full Case
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                          </Button>
                          <ChevronDown className={cn("h-5 w-5 transition-transform duration-200 ml-2 text-muted-foreground", expandedPatientId === patient.id ? "rotate-180" : "")} />
                        </div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedPatientId === patient.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-muted/10 p-6 border-t border-border flex flex-col md:flex-row gap-6">
                            {/* Left Column: History & Foundation */}
                            <div className="flex-1 space-y-5">
                              <Button
                                variant="outline"
                                className="w-full justify-start h-auto py-3 bg-muted/50 border-border hover:bg-muted"
                                disabled={patient.status === "Incomplete"}
                              >
                                <FileText className="h-5 w-5 mr-3 text-primary" />
                                <div className="flex flex-col items-start gap-0.5 text-left">
                                  <span className="font-medium text-foreground">View Completed History</span>
                                  <span className="text-xs text-muted-foreground font-normal">Original H&P document</span>
                                </div>
                              </Button>
                              
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                  <Brain className="h-4 w-4 text-primary" />
                                  Baseline Assessment
                                </h4>
                                <div className="space-y-3">
                                  {patient.differentials && patient.differentials.map((diff: any, idx: number) => (
                                    <div key={idx} className="flex flex-col gap-1">
                                      <div className="flex justify-between text-sm">
                                        <span className="font-medium text-foreground">{diff.name}</span>
                                        <span className="text-muted-foreground">{diff.confidence}%</span>
                                      </div>
                                      <div className="bg-muted rounded-full h-1.5 w-full overflow-hidden">
                                        <div 
                                          className="bg-primary rounded-full h-1.5 transition-all duration-500 ease-out" 
                                          style={{ width: `${diff.confidence}%` }} 
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <Separator orientation="vertical" className="hidden md:block h-auto" />
                            <Separator orientation="horizontal" className="block md:hidden w-full" />

                            {/* Right Column: SOAP Timeline */}
                            <div className="flex-1 space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                  <ClipboardList className="h-4 w-4 text-primary" />
                                  Progress Notes (SOAP)
                                </h4>
                                <Button size="sm" className="h-8 gap-1 bg-primary text-primary-foreground" disabled={patient.status === "Incomplete"}>
                                  <Plus className="h-3.5 w-3.5" /> New SOAP Note
                                </Button>
                              </div>

                              {patient.status === "Incomplete" ? (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md flex gap-2 text-sm text-amber-800 dark:text-amber-400">
                                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                  <p>Initial History and Physical (H&P) must be finalized before adding SOAP notes.</p>
                                </div>
                              ) : patient.soapNotes && patient.soapNotes.length > 0 ? (
                                <div className="space-y-3 pl-2 border-l-2 border-muted ml-1">
                                  {patient.soapNotes.map((note: any) => (
                                    <div key={note.id} className="relative">
                                      <div className="absolute w-2.5 h-2.5 bg-primary rounded-full -left-[14px] top-1.5 border-2 border-background" />
                                      <div className="p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors cursor-pointer shadow-sm">
                                        <p className="text-xs font-semibold text-primary mb-1">{note.date}</p>
                                        <p className="text-sm text-muted-foreground truncate">{note.preview}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-4 text-center border rounded-md border-dashed bg-muted/20">
                                  <p className="text-sm text-muted-foreground">No progress notes recorded for this admission.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Shift Sign-Out / SBAR Handoff */}
        {showHandoff && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle>End of Shift Handoff Report (SBAR)</CardTitle>
                  <CardDescription>Structured clinical handoff for incoming team</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Print/Copy
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-4">
                  {recentPatients.map((patient) => (
                    <div key={patient.id} className="bg-muted/30 p-4 rounded-lg border">
                      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                        <span className="font-semibold text-foreground">{patient.name} • {patient.age}/{patient.gender}</span>
                        <span className="text-sm text-muted-foreground">ID: {patient.patientId}</span>
                      </div>
                      <div className="space-y-2 text-sm text-foreground">
                        <p><span className="font-semibold">S (Situation):</span> {patient.chiefComplaint}</p>
                        <p><span className="font-semibold">B (Background):</span> Admitted for observation. Pending labs.</p>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">A (Assessment):</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap",
                            patient.status === "Finalized" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                            patient.status === "In Progress" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                            "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                          )}>
                            {patient.status}
                          </span>
                        </div>
                        <p><span className="font-semibold">R (Recommendation):</span> Monitor overnight. Review morning CBC.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Ward Tasks & To-Dos</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex gap-2">
          <Input 
            value={newTask} 
            onChange={(e) => setNewTask(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && addTask()} 
            placeholder="Add a new task..." 
          />
          <Button onClick={addTask} size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(100vh-150px)] pb-4 scrollbar-hide">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors">
              <button onClick={() => toggleTask(task.id)} className="mt-0.5 shrink-0 focus:outline-none">
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <span className={cn("text-sm", task.completed ? "line-through text-muted-foreground" : "text-foreground")}>
                {task.text}
              </span>
            </div>
          ))}
        </div>
      </SheetContent>

      {/* Vignette Studio Modal */}
      <Dialog open={!!teachingCase} onOpenChange={(open) => !open && setTeachingCase(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vignette Studio (Anonymized)</DialogTitle>
            <DialogDescription>PHI has been removed. Review and edit before exporting to Telegram.</DialogDescription>
          </DialogHeader>
          <Textarea 
            value={vignetteText} 
            onChange={(e) => setVignetteText(e.target.value)} 
            rows={12} 
            className="font-mono text-sm resize-none"
          />
          <DialogFooter>
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(vignetteText);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }}
              className={isCopied ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
            >
              {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {isCopied ? "Copied!" : "Copy to Clipboard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Study Hub Modal */}
      <Dialog open={showStudyHub} onOpenChange={setShowStudyHub}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Library className="h-6 w-6 text-primary" />
              Study Hub & Clinical Guidelines
            </DialogTitle>
            <DialogDescription>
              Review AI-generated differential diagnoses and access official medical literature.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Left Sidebar */}
            <div className="w-1/3 border-r overflow-y-auto p-4 space-y-2 bg-muted/10">
              {patients.map(p => (
                <button
                  key={p.id}
                  className={cn("w-full text-left p-3 rounded-lg border transition-colors", selectedStudyPatient?.id === p.id ? "bg-primary/10 border-primary/30" : "hover:bg-muted bg-card")}
                  onClick={() => setSelectedStudyPatient(p)}
                >
                  <div className="font-medium text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.chiefComplaint}</div>
                </button>
              ))}
            </div>
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-background">
              {!selectedStudyPatient ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                  <p>Select a patient to review their differentials.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground">{selectedStudyPatient?.name}</h3>
                    <p className="text-muted-foreground">{selectedStudyPatient?.chiefComplaint}</p>
                  </div>
                  {selectedStudyPatient?.differentials?.map((diff: any, idx: number) => (
                    <Card key={idx} className="overflow-hidden">
                      <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{diff.name}</CardTitle>
                          <Badge variant={idx === 0 ? "default" : "secondary"}>{diff.confidence}% Match</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            Reference Toolkit
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {diff.resources?.map((res: any, rIdx: number) => (
                              <a key={rIdx} href={res.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-full hover:bg-secondary/80 transition-colors shadow-sm">
                                {res.site}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        </div>
                        <Separator />
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(diff.name + " official clinical guidelines 2026")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 border rounded-md hover:bg-muted transition-colors shadow-sm"
                          >
                            <Search className="h-4 w-4 text-blue-500" />
                            Search Official Guidelines
                          </a>
                          <a
                            href={`https://www.uptodate.com/contents/search?search=${encodeURIComponent(diff.name)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 border rounded-md hover:bg-muted transition-colors shadow-sm"
                          >
                            <Search className="h-4 w-4 text-emerald-500" />
                            UpToDate Search
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clinical Toolkit Modal */}
      <Dialog open={showToolkit} onOpenChange={(open) => { setShowToolkit(open); if (!open) setSearchQuery(""); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Calculator className="h-6 w-6 text-primary" />
              Clinical Toolkit
            </DialogTitle>
            <DialogDescription>
              Access global medical search providers and common clinical calculators.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="stat-search" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stat-search" className="flex items-center gap-2">
                <Search className="h-4 w-4" /> Stat-Search
              </TabsTrigger>
              <TabsTrigger value="medmath" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" /> MedMath
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stat-search" className="space-y-6 pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Enter condition, drug, or clinical question..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <a href={`https://www.uptodate.com/contents/search?search=${encodeURIComponent(searchQuery)}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium">UpToDate</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <a href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(searchQuery)}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">PubMed</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <a href={`https://search.medscape.com/search/?q=${encodeURIComponent(searchQuery)}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium">Medscape</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <a href={`https://scholar.google.com/scholar?q=${encodeURIComponent(searchQuery)}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-5 w-5 text-amber-600" />
                    <span className="font-medium text-wrap text-center leading-tight">Google Scholar</span>
                  </a>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="medmath" className="space-y-6 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <a href="https://www.mdcalc.com/calc/3939/ckd-epi-equations-glomerular-filtration-rate-gfr" target="_blank" rel="noreferrer">
                    <Calculator className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-wrap text-center leading-tight">GFR (CKD-EPI)</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <a href="https://www.mdcalc.com/calc/115/wells-criteria-pulmonary-embolism" target="_blank" rel="noreferrer">
                    <Calculator className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-wrap text-center leading-tight">Wells Criteria (PE)</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <a href="https://www.mdcalc.com/calc/801/chads2-score-atrial-fibrillation-stroke-risk" target="_blank" rel="noreferrer">
                    <Calculator className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-wrap text-center leading-tight">CHADS2-VASc</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <a href="https://www.mdcalc.com/calc/29/body-mass-index-bmi" target="_blank" rel="noreferrer">
                    <Calculator className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-wrap text-center leading-tight">BMI</span>
                  </a>
                </Button>
              </div>
              <Separator />
              <Button className="w-full py-6 text-lg" variant="secondary" asChild>
                <a href="https://www.mdcalc.com" target="_blank" rel="noreferrer">
                  <Globe className="mr-2 h-5 w-5" /> Open All Calculators on MDCalc
                </a>
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}