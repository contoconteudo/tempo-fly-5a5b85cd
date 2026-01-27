/**
 * Constantes centralizadas do sistema.
 * Facilita manutenção e integração com backend.
 */

import { LeadStage, LeadTemperature, ClientStatus, ObjectiveValueType, ObjectiveStatus, CommercialDataSource } from "@/types";

// ============================================
// CONFIGURAÇÕES DE LEADS/CRM
// ============================================

export const LEAD_STAGES: Record<LeadStage, { name: string; color: string }> = {
  new: { name: "Novo", color: "bg-muted-foreground" },
  contact: { name: "Contato Realizado", color: "bg-primary" },
  meeting_scheduled: { name: "Agendou Reunião", color: "bg-primary/70" },
  meeting_done: { name: "Reunião Feita", color: "bg-accent" },
  proposal: { name: "Proposta Enviada", color: "bg-warning" },
  followup: { name: "Follow Up", color: "bg-orange-500" },
  negotiation: { name: "Negociação", color: "bg-success" },
  won: { name: "Ganho", color: "bg-success" },
  lost: { name: "Perdido", color: "bg-destructive" },
};

export const LEAD_TEMPERATURES: Record<LeadTemperature, { label: string; emoji: string }> = {
  hot: { label: "Quente", emoji: "🔥" },
  warm: { label: "Morno", emoji: "🌡️" },
  cold: { label: "Frio", emoji: "❄️" },
};

export const LEAD_ORIGINS = [
  "Tráfego Pago",
  "Orgânico",
  "Indicação",
  "LinkedIn",
  "Evento",
  "Outbound",
  "Site",
  "Outro",
] as const;

// Ordem das etapas no pipeline (excluindo lost por padrão)
export const PIPELINE_STAGES: LeadStage[] = [
  "new",
  "contact",
  "meeting_scheduled",
  "meeting_done",
  "proposal",
  "followup",
  "negotiation",
  "won",
  "lost",
];

// ============================================
// CONFIGURAÇÕES DE CLIENTES
// ============================================

export const CLIENT_STATUSES: Record<ClientStatus, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-success/10 text-success border-success/20" },
  inactive: { label: "Inativo", className: "bg-warning/10 text-warning border-warning/20" },
  churn: { label: "Churn", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const CLIENT_PACKAGES = ["PF/Básico", "Start", "Completão", "Enterprise"] as const;

export const CLIENT_SEGMENTS = [
  "Tecnologia",
  "Saúde",
  "Varejo",
  "Serviços",
  "Educação",
  "Indústria",
  "Financeiro",
  "Outro",
] as const;

// ============================================
// CONFIGURAÇÕES DE OBJETIVOS
// ============================================

export const OBJECTIVE_VALUE_TYPES: Record<ObjectiveValueType, { label: string; prefix: string; suffix: string }> = {
  financial: { label: "Financeiro (R$)", prefix: "R$ ", suffix: "" },
  quantity: { label: "Quantidade", prefix: "", suffix: "" },
  percentage: { label: "Porcentagem (%)", prefix: "", suffix: "%" },
};

export const OBJECTIVE_STATUSES: Record<ObjectiveStatus, { label: string; className: string; barColor: string }> = {
  on_track: { label: "No prazo", className: "bg-success/10 text-success", barColor: "bg-success" },
  at_risk: { label: "Em risco", className: "bg-warning/10 text-warning", barColor: "bg-warning" },
  behind: { label: "Atrasado", className: "bg-destructive/10 text-destructive", barColor: "bg-destructive" },
};

export const DATA_SOURCES: Record<CommercialDataSource, { label: string; description: string }> = {
  crm: { label: "CRM (Novas Vendas)", description: "Leads convertidos em negócios fechados" },
  clients: { label: "Clientes Ativos", description: "MRR de clientes com status ativo" },
};

// ============================================
// CONFIGURAÇÕES GERAIS
// ============================================

export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

// Chaves de localStorage - MANTER CONSISTÊNCIA COM BACKEND
export const STORAGE_KEYS = {
  LEADS: "conto-leads",
  CLIENTS: "conto-clients",
  OBJECTIVES: "conto-objectives",
} as const;

// ============================================
// CONFIGURAÇÕES DE AUTOMAÇÃO
// ============================================

export const AUTOMATION_CONFIG = {
  // Tempo em horas para mover lead de "proposal" para "followup"
  PROPOSAL_TO_FOLLOWUP_HOURS: 24,
  // Intervalo de verificação de automação (em milissegundos)
  AUTOMATION_CHECK_INTERVAL: 60 * 1000, // 1 minuto
  // Dias sem contato para considerar lead "frio"
  COLD_LEAD_DAYS: 7,
  // Dias em negociação para alertar
  STALE_NEGOTIATION_DAYS: 7,
  // Dias para alerta de deadline próximo
  DEADLINE_WARNING_DAYS: 30,
} as const;

// ============================================
// CONFIGURAÇÕES DE NPS
// ============================================

export const NPS_CONFIG = {
  PROMOTER_MIN: 9, // 9-10 são promotores
  PASSIVE_MIN: 7, // 7-8 são passivos
  // 0-6 são detratores
} as const;

export function getNPSCategory(score: number): "promoter" | "passive" | "detractor" {
  if (score >= NPS_CONFIG.PROMOTER_MIN) return "promoter";
  if (score >= NPS_CONFIG.PASSIVE_MIN) return "passive";
  return "detractor";
}

export function getNPSColor(score: number): string {
  if (score >= NPS_CONFIG.PROMOTER_MIN) return "text-success";
  if (score >= NPS_CONFIG.PASSIVE_MIN) return "text-warning";
  return "text-destructive";
}
