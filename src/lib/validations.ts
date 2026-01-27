/**
 * Validações centralizadas para todos os formulários do sistema.
 * Utiliza Zod para validação segura de inputs.
 * 
 * IMPORTANTE PARA BACKEND:
 * - Estas validações devem ser replicadas no servidor
 * - Nunca confie apenas em validação client-side
 */

import { z } from "zod";

// Constantes de limites - usar também no backend
export const VALIDATION_LIMITS = {
  NAME_MAX: 100,
  COMPANY_MAX: 100,
  EMAIL_MAX: 255,
  PHONE_MAX: 20,
  NOTES_MAX: 1000,
  DESCRIPTION_MAX: 500,
  SEGMENT_MAX: 50,
  ORIGIN_MAX: 50,
  VALUE_MIN: 0,
  VALUE_MAX: 999999999,
  NPS_MIN: 0,
  NPS_MAX: 10,
} as const;

// Regex para validações
const PHONE_REGEX = /^[\d\s\-()+ ]{8,20}$/;

// Schema para Lead
export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(VALIDATION_LIMITS.NAME_MAX, `Nome deve ter no máximo ${VALIDATION_LIMITS.NAME_MAX} caracteres`),
  company: z
    .string()
    .trim()
    .min(1, "Empresa é obrigatória")
    .max(VALIDATION_LIMITS.COMPANY_MAX, `Empresa deve ter no máximo ${VALIDATION_LIMITS.COMPANY_MAX} caracteres`),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(VALIDATION_LIMITS.EMAIL_MAX, `Email deve ter no máximo ${VALIDATION_LIMITS.EMAIL_MAX} caracteres`)
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.PHONE_MAX, `Telefone deve ter no máximo ${VALIDATION_LIMITS.PHONE_MAX} caracteres`)
    .refine((val) => !val || PHONE_REGEX.test(val), "Telefone inválido")
    .or(z.literal("")),
  value: z
    .number()
    .min(VALIDATION_LIMITS.VALUE_MIN, "Valor não pode ser negativo")
    .max(VALIDATION_LIMITS.VALUE_MAX, "Valor muito alto"),
  temperature: z.enum(["hot", "warm", "cold"]),
  origin: z
    .string()
    .max(VALIDATION_LIMITS.ORIGIN_MAX, `Origem deve ter no máximo ${VALIDATION_LIMITS.ORIGIN_MAX} caracteres`),
  stage: z.enum([
    "new",
    "contact",
    "meeting_scheduled",
    "meeting_done",
    "proposal",
    "followup",
    "negotiation",
    "won",
    "lost",
  ]),
  notes: z
    .string()
    .max(VALIDATION_LIMITS.NOTES_MAX, `Notas devem ter no máximo ${VALIDATION_LIMITS.NOTES_MAX} caracteres`),
});

export type LeadFormData = z.infer<typeof leadSchema>;

// Schema para Cliente
export const clientSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, "Nome da empresa é obrigatório")
    .max(VALIDATION_LIMITS.COMPANY_MAX, `Empresa deve ter no máximo ${VALIDATION_LIMITS.COMPANY_MAX} caracteres`),
  contact: z
    .string()
    .trim()
    .min(1, "Nome do contato é obrigatório")
    .max(VALIDATION_LIMITS.NAME_MAX, `Contato deve ter no máximo ${VALIDATION_LIMITS.NAME_MAX} caracteres`),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(VALIDATION_LIMITS.EMAIL_MAX, `Email deve ter no máximo ${VALIDATION_LIMITS.EMAIL_MAX} caracteres`),
  phone: z
    .string()
    .trim()
    .min(1, "Telefone é obrigatório")
    .max(VALIDATION_LIMITS.PHONE_MAX, `Telefone deve ter no máximo ${VALIDATION_LIMITS.PHONE_MAX} caracteres`),
  segment: z
    .string()
    .min(1, "Segmento é obrigatório")
    .max(VALIDATION_LIMITS.SEGMENT_MAX, `Segmento deve ter no máximo ${VALIDATION_LIMITS.SEGMENT_MAX} caracteres`),
  package: z.string().min(1, "Pacote é obrigatório"),
  monthlyValue: z
    .number()
    .min(VALIDATION_LIMITS.VALUE_MIN, "Valor deve ser positivo")
    .max(VALIDATION_LIMITS.VALUE_MAX, "Valor muito alto"),
  status: z.enum(["active", "inactive", "churn"]),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  notes: z
    .string()
    .max(VALIDATION_LIMITS.NOTES_MAX, `Notas devem ter no máximo ${VALIDATION_LIMITS.NOTES_MAX} caracteres`)
    .optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Schema para Objetivo
export const objectiveSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(VALIDATION_LIMITS.NAME_MAX, `Nome deve ter no máximo ${VALIDATION_LIMITS.NAME_MAX} caracteres`),
  description: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX, `Descrição deve ter no máximo ${VALIDATION_LIMITS.DESCRIPTION_MAX} caracteres`),
  valueType: z.enum(["financial", "quantity", "percentage"]),
  targetValue: z
    .number()
    .positive("Valor deve ser maior que zero")
    .max(VALIDATION_LIMITS.VALUE_MAX, "Valor muito alto"),
  deadline: z.string().min(1, "Prazo é obrigatório"),
  isCommercial: z.boolean(),
  dataSources: z.array(z.enum(["crm", "clients"])),
}).refine(
  (data) => !data.isCommercial || data.dataSources.length > 0,
  { message: "Selecione pelo menos uma fonte de dados", path: ["dataSources"] }
);

export type ObjectiveFormData = z.infer<typeof objectiveSchema>;

// Schema para registro de NPS
export const npsRecordSchema = z.object({
  score: z
    .number()
    .int("Nota deve ser um número inteiro")
    .min(VALIDATION_LIMITS.NPS_MIN, "Nota mínima é 0")
    .max(VALIDATION_LIMITS.NPS_MAX, "Nota máxima é 10"),
  notes: z
    .string()
    .max(VALIDATION_LIMITS.NOTES_MAX, `Notas devem ter no máximo ${VALIDATION_LIMITS.NOTES_MAX} caracteres`)
    .optional(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

export type NPSRecordFormData = z.infer<typeof npsRecordSchema>;

// Schema para registro de progresso
export const progressLogSchema = z.object({
  value: z
    .number()
    .min(0, "Valor não pode ser negativo")
    .max(VALIDATION_LIMITS.VALUE_MAX, "Valor muito alto"),
  description: z
    .string()
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX, `Descrição deve ter no máximo ${VALIDATION_LIMITS.DESCRIPTION_MAX} caracteres`),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

export type ProgressLogFormData = z.infer<typeof progressLogSchema>;
