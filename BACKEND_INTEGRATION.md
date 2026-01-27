# Conto CMS - Guia de Integração Backend

Este documento descreve a estrutura do frontend e fornece orientações para integração com backend.

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── clients/         # Componentes de gestão de clientes
│   ├── crm/             # Componentes do CRM (leads)
│   ├── dashboard/       # Cards e widgets do dashboard
│   ├── layout/          # Layout (Sidebar, Header)
│   ├── objectives/      # Componentes de objetivos estratégicos
│   └── ui/              # Componentes base (shadcn/ui)
├── hooks/               # Hooks customizados
│   ├── useLeads.ts      # CRUD de leads
│   ├── useClients.ts    # CRUD de clientes
│   ├── useObjectives.ts # CRUD de objetivos
│   └── useLocalStorage.ts # Persistência atual (localStorage)
├── lib/
│   ├── constants.ts     # Constantes do sistema
│   ├── validations.ts   # Schemas de validação Zod
│   └── utils.ts         # Utilitários gerais
├── pages/               # Páginas da aplicação
└── types/               # Definições TypeScript
```

## 🗃️ Modelos de Dados

### Lead (CRM)
```typescript
interface Lead {
  id: string;                    // UUID
  name: string;                  // Nome do contato (max 100 chars)
  company: string;               // Nome da empresa (max 100 chars)
  email: string;                 // Email (max 255 chars)
  phone: string;                 // Telefone (max 20 chars)
  value: number;                 // Valor estimado do negócio
  temperature: "hot" | "warm" | "cold";
  origin: string;                // Fonte do lead (max 50 chars)
  stage: LeadStage;              // Etapa do pipeline
  lastContact: string;           // Data ISO (YYYY-MM-DD)
  notes: string;                 // Observações (max 1000 chars)
  createdAt: string;             // Data ISO
  stageChangedAt: string;        // Timestamp ISO para automações
}

type LeadStage = 
  | "new"              // Novo
  | "contact"          // Contato Realizado
  | "meeting_scheduled" // Agendou Reunião
  | "meeting_done"     // Reunião Feita
  | "proposal"         // Proposta Enviada
  | "followup"         // Follow Up
  | "negotiation"      // Negociação
  | "won"              // Ganho
  | "lost";            // Perdido
```

### Client (Clientes)
```typescript
interface Client {
  id: string;                    // UUID
  company: string;               // Nome da empresa (max 100 chars)
  contact: string;               // Nome do contato (max 100 chars)
  email: string;                 // Email (max 255 chars)
  phone: string;                 // Telefone (max 20 chars)
  segment: string;               // Segmento (max 50 chars)
  package: string;               // Pacote contratado
  monthlyValue: number;          // Valor mensal (MRR)
  status: "active" | "inactive" | "churn";
  npsHistory: NPSRecord[];       // Histórico de NPS
  startDate: string;             // Data de início (YYYY-MM-DD)
  notes: string;                 // Observações (max 1000 chars)
}

interface NPSRecord {
  id: string;
  month: number;                 // 1-12
  year: number;
  score: number;                 // 0-10
  notes: string;
  recordedAt: string;            // Data ISO
}
```

### Objective (Objetivos Estratégicos)
```typescript
interface Objective {
  id: string;
  name: string;                  // Nome do objetivo (max 100 chars)
  description: string;           // Descrição (max 500 chars)
  valueType: "financial" | "quantity" | "percentage";
  targetValue: number;           // Meta a atingir
  currentValue: number;          // Valor atual
  deadline: string;              // Prazo (YYYY-MM-DD)
  status: "on_track" | "at_risk" | "behind"; // Calculado
  createdAt: string;
  progressLogs: ProgressLog[];
  isCommercial: boolean;         // Se usa dados automáticos
  dataSources: CommercialDataSource[];
}

interface ProgressLog {
  id: string;
  month: number;
  year: number;
  value: number;
  description: string;
  date: string;
}

type CommercialDataSource = "crm" | "clients";
```

## 🔄 Substituição da Persistência

### Arquivos a Modificar

1. **`src/hooks/useLeads.ts`**
   - Substituir `useLocalStorage` por chamadas à API
   - Manter a mesma interface de retorno

2. **`src/hooks/useClients.ts`**
   - Substituir `useLocalStorage` por chamadas à API
   - Manter funções de cálculo de NPS

3. **`src/hooks/useObjectives.ts`**
   - Substituir `useLocalStorage` por chamadas à API
   - Manter lógica de cálculo automático para metas comerciais

### Exemplo de Migração (useLeads)

```typescript
// Antes (localStorage)
const [leads, setLeads] = useLocalStorage<Lead[]>(STORAGE_KEY, initialLeads);

// Depois (API com React Query)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useLeads() {
  const queryClient = useQueryClient();
  
  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => api.getLeads(),
  });

  const addLeadMutation = useMutation({
    mutationFn: api.createLead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  // ... resto das mutations
}
```

## ✅ Validações

Todas as validações estão em `src/lib/validations.ts` usando Zod.

**IMPORTANTE**: Replicar todas as validações no backend. Nunca confiar apenas em validação client-side.

### Limites de Campos
```typescript
const VALIDATION_LIMITS = {
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
};
```

## 🔐 Segurança

### Recomendações

1. **Autenticação**
   - Implementar sistema de login/logout
   - Usar JWT ou session tokens
   - Adicionar refresh token para sessões longas

2. **Autorização (RLS)**
   - Implementar Row Level Security
   - Usuários só podem ver dados da própria organização
   - Níveis de acesso: Admin, Gestor, Comercial, Analista

3. **Roles (Perfis de Usuário)**
   ```sql
   -- NUNCA armazenar roles na tabela de usuários
   CREATE TYPE app_role AS ENUM ('admin', 'manager', 'sales', 'analyst');
   
   CREATE TABLE user_roles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     role app_role NOT NULL,
     UNIQUE (user_id, role)
   );
   ```

4. **Validação de Inputs**
   - Sanitizar todos os inputs no servidor
   - Escapar caracteres especiais para prevenir XSS
   - Usar prepared statements para prevenir SQL Injection

5. **Rate Limiting**
   - Limitar requisições por IP/usuário
   - Implementar throttling em endpoints sensíveis

## 🔄 Automações

### Lead Automation
- Leads em "proposal" por mais de 24h devem mover para "followup"
- Implementar via cron job ou trigger no banco

```typescript
// Lógica atual em useLeads.ts
const PROPOSAL_TO_FOLLOWUP_HOURS = 24;
```

### Cálculo de Status de Objetivos
```typescript
function calculateStatus(currentValue, targetValue, deadline): ObjectiveStatus {
  const progress = (currentValue / targetValue) * 100;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const totalDays = (deadlineDate - startOfYear) / msPerDay;
  const daysElapsed = (now - startOfYear) / msPerDay;
  const expectedProgress = (daysElapsed / totalDays) * 100;

  if (progress >= expectedProgress - 10) return "on_track";
  if (progress >= expectedProgress - 25) return "at_risk";
  return "behind";
}
```

## 📊 Métricas Calculadas

### Pipeline Stats
- Total de leads ativos (excluindo "lost")
- Valor total no pipeline
- Propostas enviadas (proposal + negotiation + won)
- Taxa de conversão (won / total * 100)
- Leads em negociação (excluindo won e lost)

### Client Stats
- Clientes ativos
- MRR total
- Ticket médio
- NPS médio global

## 🚀 Próximos Passos

1. [ ] Configurar Supabase ou outro backend
2. [ ] Criar tabelas seguindo os modelos acima
3. [ ] Implementar RLS para multi-tenancy
4. [ ] Criar API endpoints ou usar Supabase client diretamente
5. [ ] Migrar hooks para usar React Query
6. [ ] Implementar autenticação
7. [ ] Criar sistema de roles
8. [ ] Configurar automações (cron/triggers)
9. [ ] Adicionar logs de auditoria
10. [ ] Implementar backup automático

## 📞 Contato

Para dúvidas sobre a implementação, consultar a documentação dos tipos em `src/types/index.ts` e as constantes em `src/lib/constants.ts`.
