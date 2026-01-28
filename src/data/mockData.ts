/**
 * Tipos e configurações para integração com Backend (Supabase).
 * 
 * ⚠️ AVISO IMPORTANTE:
 * Este arquivo contém APENAS definições de tipos e configurações.
 * Os dados reais virão do Supabase quando o backend for configurado.
 * 
 * Para migração: Veja BACKEND_INTEGRATION.md
 */

import { Lead, Client, Objective, NPSRecord } from "@/types";

// ============================================
// TIPOS E ENUMS - Replicar no Supabase
// ============================================

export type AppRole = "admin" | "gestor" | "comercial" | "analista";
export type ModulePermission = "dashboard" | "crm" | "clients" | "objectives" | "strategy" | "settings" | "admin";
export type CompanyAccess = string; // ID do espaço/empresa

export interface MockUser {
  id: string;
  email: string;
  password?: string; // Removido em produção - gerenciado pelo Supabase Auth
  full_name: string;
  role: AppRole;
  modules: ModulePermission[];
  companies: CompanyAccess[];
  created_at: string;
}

// ============================================
// CREDENCIAIS DE DEMONSTRAÇÃO (DESENVOLVIMENTO)
// ============================================

/**
 * Credenciais para modo de demonstração local.
 * 
 * ⚠️ REMOVER EM PRODUÇÃO
 * Quando o Supabase Auth estiver ativo:
 * 1. Este array ficará vazio (DEMO_MODE_ONLY = false)
 * 2. Autenticação via supabase.auth.signInWithPassword()
 * 3. Roles carregadas da tabela user_roles
 */
const DEMO_MODE_ONLY = import.meta.env.DEV || !import.meta.env.VITE_SUPABASE_URL;

// Usuários mockados removidos. A autenticação agora depende do Supabase.
export const MOCK_USERS: MockUser[] = [];

// ============================================
// PERMISSÕES - Configuração de módulos
// ============================================

export const ALL_MODULES: { id: ModulePermission; label: string; description: string }[] = [
  { id: "dashboard", label: "Dashboard", description: "Visão geral e métricas do sistema" },
  { id: "strategy", label: "Estratégia", description: "Objetivos e metas estratégicas" },
  { id: "crm", label: "CRM", description: "Gestão de leads e oportunidades" },
  { id: "clients", label: "Clientes", description: "Gestão de clientes ativos" },
  { id: "settings", label: "Configurações", description: "Configurações pessoais" },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, ModulePermission[]> = {
  admin: ["dashboard", "strategy", "crm", "clients", "settings", "admin"],
  gestor: ["dashboard", "strategy", "crm", "clients", "settings"],
  comercial: ["dashboard", "crm", "clients", "settings"],
  analista: ["dashboard", "settings"],
};

// ============================================
// STORAGE KEYS - Para localStorage (desenvolvimento)
// ============================================

export const USER_PERMISSIONS_KEY = "conto-user-permissions";

// Chaves de autenticação mockadas removidas, pois useAuth não as usa mais.
export const MOCK_STORAGE_KEYS = {
  CURRENT_USER: "conto-current-user-deprecated",
  REGISTERED_USERS: "conto-registered-users-deprecated",
} as const;

// ============================================
// DADOS INICIAIS VAZIOS - Backend irá popular
// ============================================

export const MOCK_LEADS: Lead[] = [];
export const MOCK_CLIENTS: Client[] = [];
export const MOCK_OBJECTIVES: Objective[] = [];