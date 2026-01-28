# SQL Completo para Supabase - Painel Conto

Execute todos os blocos SQL abaixo **em ordem** no SQL Editor do Supabase.

## 📋 Conexão

```
URL: https://pzeverrrrptauqcdeulx.supabase.co
```

---

## 1️⃣ ENUMS (Tipos Personalizados)

```sql
-- =============================================
-- PASSO 1: CRIAR ENUMS
-- =============================================

-- Roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'comercial', 'analista', 'user');

-- Estágios do funil de leads
CREATE TYPE public.lead_stage AS ENUM (
  'new', 
  'contact', 
  'meeting_scheduled', 
  'meeting_done', 
  'proposal', 
  'followup', 
  'negotiation', 
  'won', 
  'lost'
);

-- Temperatura do lead
CREATE TYPE public.lead_temperature AS ENUM ('hot', 'warm', 'cold');

-- Status do cliente
CREATE TYPE public.client_status AS ENUM ('active', 'inactive', 'churn');

-- Status de assinatura
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing', 'paused');

-- Tipo de valor do objetivo
CREATE TYPE public.objective_value_type AS ENUM ('financial', 'quantity', 'percentage');

-- Status do objetivo
CREATE TYPE public.objective_status AS ENUM ('on_track', 'at_risk', 'behind');
```

---

## 2️⃣ TABELA DE ROLES

```sql
-- =============================================
-- PASSO 2: TABELA USER_ROLES
-- IMPORTANTE: Criar ANTES da função has_role
-- =============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Índice
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

---

## 3️⃣ FUNÇÃO AUXILIAR (Security Definer)

```sql
-- =============================================
-- PASSO 3: FUNÇÃO PARA VERIFICAR ROLE
-- Evita recursão em políticas RLS
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Políticas de user_roles (agora que has_role existe)
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
```

---

## 4️⃣ TABELA DE PERFIS

```sql
-- =============================================
-- PASSO 4: TABELA PROFILES
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 5️⃣ TABELA DE ESPAÇOS (Workspaces)

```sql
-- =============================================
-- PASSO 5: TABELA SPACES
-- =============================================

CREATE TABLE public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#c4378f',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_spaces_user_id ON public.spaces(user_id);

-- RLS
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

-- Política
CREATE POLICY "Users can manage own spaces"
  ON public.spaces FOR ALL
  USING (auth.uid() = user_id);
```

---

## 6️⃣ TABELA DE LEADS

```sql
-- =============================================
-- PASSO 6: TABELA LEADS
-- =============================================

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  value DECIMAL(15,2) DEFAULT 0,
  temperature lead_temperature DEFAULT 'warm',
  origin TEXT,
  stage lead_stage DEFAULT 'new',
  last_contact TIMESTAMPTZ,
  stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_space_id ON public.leads(space_id);
CREATE INDEX idx_leads_stage ON public.leads(stage);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política
CREATE POLICY "Users can manage own leads"
  ON public.leads FOR ALL
  USING (auth.uid() = user_id);
```

---

## 7️⃣ TABELA DE CLIENTES

```sql
-- =============================================
-- PASSO 7: TABELA CLIENTS
-- =============================================

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  company TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT,
  segment TEXT,
  package TEXT,
  monthly_value DECIMAL(15,2) DEFAULT 0,
  status client_status DEFAULT 'active',
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_space_id ON public.clients(space_id);
CREATE INDEX idx_clients_status ON public.clients(status);

-- RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Política
CREATE POLICY "Users can manage own clients"
  ON public.clients FOR ALL
  USING (auth.uid() = user_id);
```

---

## 8️⃣ TABELA DE HISTÓRICO NPS

```sql
-- =============================================
-- PASSO 8: TABELA NPS_RECORDS
-- =============================================

CREATE TABLE public.nps_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_nps_client_id ON public.nps_records(client_id);
CREATE INDEX idx_nps_user_id ON public.nps_records(user_id);
CREATE UNIQUE INDEX idx_nps_unique_month ON public.nps_records(client_id, month, year);

-- RLS
ALTER TABLE public.nps_records ENABLE ROW LEVEL SECURITY;

-- Política
CREATE POLICY "Users can manage own NPS records"
  ON public.nps_records FOR ALL
  USING (auth.uid() = user_id);
```

---

## 9️⃣ TABELA DE OBJETIVOS

```sql
-- =============================================
-- PASSO 9: TABELA OBJECTIVES
-- =============================================

CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  value_type objective_value_type DEFAULT 'quantity',
  target_value DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) DEFAULT 0,
  deadline DATE NOT NULL,
  status objective_status DEFAULT 'on_track',
  is_commercial BOOLEAN DEFAULT FALSE,
  data_sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_objectives_user_id ON public.objectives(user_id);
CREATE INDEX idx_objectives_space_id ON public.objectives(space_id);
CREATE INDEX idx_objectives_deadline ON public.objectives(deadline);

-- RLS
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

-- Política
CREATE POLICY "Users can manage own objectives"
  ON public.objectives FOR ALL
  USING (auth.uid() = user_id);
```

---

## 🔟 TABELA DE LOGS DE PROGRESSO

```sql
-- =============================================
-- PASSO 10: TABELA PROGRESS_LOGS
-- =============================================

CREATE TABLE public.progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  description TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_progress_objective_id ON public.progress_logs(objective_id);
CREATE INDEX idx_progress_user_id ON public.progress_logs(user_id);
CREATE UNIQUE INDEX idx_progress_unique_month ON public.progress_logs(objective_id, month, year);

-- RLS
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

-- Política
CREATE POLICY "Users can manage own progress logs"
  ON public.progress_logs FOR ALL
  USING (auth.uid() = user_id);
```

---

## 1️⃣1️⃣ TABELA DE PLANOS

```sql
-- =============================================
-- PASSO 11: TABELA PLANS
-- =============================================

CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  interval TEXT DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Anyone can view active plans"
  ON public.plans FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage plans"
  ON public.plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
```

---

## 1️⃣2️⃣ TABELA DE ASSINATURAS

```sql
-- =============================================
-- PASSO 12: TABELA SUBSCRIPTIONS
-- =============================================

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status subscription_status DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
```

---

## 1️⃣3️⃣ CONFIGURAR PRIMEIRO ADMIN

Após criar seu primeiro usuário (via signup), execute:

```sql
-- =============================================
-- PASSO 13: ATRIBUIR ROLE ADMIN
-- Substitua 'SEU_USER_ID_AQUI' pelo ID real do usuário
-- =============================================

-- Para encontrar o ID do usuário, execute:
SELECT id, email FROM auth.users;

-- Depois, insira a role admin:
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU_USER_ID_AQUI', 'admin');
```

---

## 1️⃣4️⃣ DADOS INICIAIS (Opcional)

```sql
-- =============================================
-- PASSO 14: INSERIR PLANOS DE EXEMPLO
-- =============================================

INSERT INTO public.plans (name, description, price, features) VALUES
('Básico', 'Ideal para pequenas empresas', 97.00, '["Até 50 leads", "1 espaço", "Suporte por email"]'),
('Profissional', 'Para empresas em crescimento', 197.00, '["Até 500 leads", "5 espaços", "Suporte prioritário", "Relatórios avançados"]'),
('Enterprise', 'Para grandes operações', 497.00, '["Leads ilimitados", "Espaços ilimitados", "Suporte 24/7", "API access", "White-label"]');
```

---

## 📌 Configurações Adicionais no Dashboard

### Authentication → URL Configuration

1. **Site URL**: `https://seudominio.com.br`
2. **Redirect URLs**:
   - `https://seudominio.com.br`
   - `https://seudominio.com.br/*`
   - `http://localhost:8080` (para desenvolvimento)

### Authentication → Email Templates

Configure os templates de email em português se necessário.

---

## ✅ Verificação

Após executar todos os SQLs, verifique:

```sql
-- Listar todas as tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar políticas RLS
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://pzeverrrrptauqcdeulx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZXZlcnJycnB0YXVxY2RldWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDk5MzYsImV4cCI6MjA4NTE4NTkzNn0.bN62M65CdVksL1ZNy4t_x-sdZBLXQftZotz8WzPkCMA
```
