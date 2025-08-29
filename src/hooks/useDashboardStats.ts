// ABOUTME: Hook for fetching real-time dashboard statistics from database
// ABOUTME: Provides comprehensive metrics for active assessments, completed assessments, and performance data

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalPatients: number;
  activeAssessments: number;
  completedToday: number;
  avgTimePerAssessment: string;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  // Get total patients count
  const { count: totalPatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true });

  // Get active assessments (in-progress status)
  const { count: activeAssessments } = await supabase
    .from('assessments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'in-progress');

  // Get assessments completed today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { count: completedToday } = await supabase
    .from('assessments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('updated_at', today.toISOString())
    .lt('updated_at', tomorrow.toISOString());

  // Calculate average time per assessment from completed assessments
  const { data: completedAssessments } = await supabase
    .from('assessments')
    .select('created_at, updated_at')
    .eq('status', 'completed')
    .limit(50); // Sample last 50 completed assessments

  let avgTimePerAssessment = '0 min';
  if (completedAssessments && completedAssessments.length > 0) {
    const totalTime = completedAssessments.reduce((sum, assessment) => {
      const start = new Date(assessment.created_at);
      const end = new Date(assessment.updated_at);
      return sum + (end.getTime() - start.getTime());
    }, 0);
    
    const avgTimeMs = totalTime / completedAssessments.length;
    const avgTimeMinutes = Math.round(avgTimeMs / (1000 * 60));
    avgTimePerAssessment = `${avgTimeMinutes} min`;
  }

  return {
    totalPatients: totalPatients || 0,
    activeAssessments: activeAssessments || 0,
    completedToday: completedToday || 0,
    avgTimePerAssessment
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 20000, // Consider data stale after 20 seconds
  });
}