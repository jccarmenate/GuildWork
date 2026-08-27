export type UserRole = "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
export type Seniority = "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "PRINCIPAL";
export type Proficiency = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type BugStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "WONT_FIX";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string | null;
  contactName: string | null;
  contactEmail: string | null;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string | null;
}

export interface DeveloperSkill {
  id: string;
  skillId: string;
  proficiency: Proficiency;
  skill: Skill;
}

export interface DeveloperProfile {
  id: string;
  userId: string;
  seniority: Seniority;
  bio: string | null;
  mentorId: string | null;
  user: { id: string; name: string; email: string };
  skills: DeveloperSkill[];
  mentor?: { user: { id: string; name: string } } | null;
  assignments?: { project: Project }[];
}

export interface ProjectAssignment {
  id: string;
  projectId: string;
  developerId: string;
  roleOnProject: string | null;
  hoursAllocated: number | null;
  developer: { id: string; user: { id: string; name: string } };
}

export interface ProjectSkill {
  id: string;
  skillId: string;
  skill: Skill;
}

export interface Bug {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  severity: Severity;
  status: BugStatus;
  reportedByUserId: string;
  assignedToDeveloperId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface BugComment {
  id: string;
  bugId: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string };
}

export interface BugAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedBy: { id: string; name: string };
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  priority: Priority;
  status: ProjectStatus;
  budget: number | null;
  startDate: string;
  endDate: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  requiredSkills?: ProjectSkill[];
  assignments?: ProjectAssignment[];
  bugs?: Bug[];
}
