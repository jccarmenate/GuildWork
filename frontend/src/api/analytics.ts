import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./client";

export interface BugSeverityRow {
  severity: string;
  count: number;
  avgResolutionHours: number | null;
}

export interface WorkloadRow {
  developerId: string;
  name: string;
  activeAssignments: number;
  openBugs: number;
}

export interface MentorshipRow {
  mentorId: string;
  mentorName: string;
  mentees: { developerId: string; name: string; resolvedBugCount: number }[];
}

export interface ProjectCompletionResult {
  byClient: { clientId: string; clientName: string; total: number; completionRate: number }[];
  byPriority: { priority: string; total: number; completionRate: number }[];
}

export interface SkillCoverageRow {
  skillId: string;
  name: string;
  developersWithSkill: number;
  activeProjectsRequiring: number;
  gap: number;
}

export interface TopPerformerRow {
  developerId: string;
  name: string;
  resolvedHighSeverityCount: number;
  avgResolutionHours: number | null;
}

export function useBugSeverityAnalytics() {
  return useQuery({ queryKey: ["analytics", "bug-severity"], queryFn: () => apiFetch<BugSeverityRow[]>("/api/analytics/bug-severity") });
}

export function useWorkloadAnalytics() {
  return useQuery({ queryKey: ["analytics", "workload"], queryFn: () => apiFetch<WorkloadRow[]>("/api/analytics/workload") });
}

export function useMentorshipAnalytics() {
  return useQuery({ queryKey: ["analytics", "mentorship"], queryFn: () => apiFetch<MentorshipRow[]>("/api/analytics/mentorship") });
}

export function useProjectCompletionAnalytics() {
  return useQuery({
    queryKey: ["analytics", "project-completion"],
    queryFn: () => apiFetch<ProjectCompletionResult>("/api/analytics/project-completion")
  });
}

export function useSkillCoverageAnalytics() {
  return useQuery({ queryKey: ["analytics", "skill-coverage"], queryFn: () => apiFetch<SkillCoverageRow[]>("/api/analytics/skill-coverage") });
}

export function useTopPerformersAnalytics() {
  return useQuery({ queryKey: ["analytics", "top-performers"], queryFn: () => apiFetch<TopPerformerRow[]>("/api/analytics/top-performers") });
}
