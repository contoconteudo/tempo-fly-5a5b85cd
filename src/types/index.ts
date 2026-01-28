export type UserRole = 'admin' | 'user';

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  user_roles: UserRole[];
}

// Existing types remain the same but will be updated to include project_id
export interface Lead {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  temperature: 'hot' | 'warm' | 'cold';
  origin: string;
  stage: 'new' | 'contact' | 'meeting_scheduled' | 'meeting_done' | 'proposal' | 'followup' | 'negotiation' | 'won' | 'lost';
  lastContact: string;
  notes: string;
  createdAt: string;
  stageChangedAt: string;
}

export interface Client {
  id: string;
  project_id: string;
  user_id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  segment: string;
  package: string;
  monthlyValue: number;
  status: 'active' | 'inactive' | 'churn';
  npsHistory: NPSRecord[];
  startDate: string;
  notes: string;
}

export interface NPSRecord {
  id: string;
  client_id: string;
  month: number;
  year: number;
  score: number;
  notes: string;
  recordedAt: string;
}

export interface Objective {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string;
  valueType: 'financial' | 'quantity' | 'percentage';
  targetValue: number;
  currentValue: number;
  deadline: string;
  status: 'on_track' | 'at_risk' | 'behind';
  createdAt: string;
  progressLogs: ProgressLog[];
  isCommercial: boolean;
  dataSources: ('crm' | 'clients')[];
}

export interface ProgressLog {
  id: string;
  objective_id: string;
  month: number;
  year: number;
  value: number;
  description: string;
  date: string;
}