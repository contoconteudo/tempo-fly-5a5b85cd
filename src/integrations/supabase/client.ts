/**
 * Supabase Client - Preparado para integração futura
 * 
 * Este arquivo está preparado para quando o backend for reativado.
 * Por enquanto, o sistema usa dados mockados em localStorage.
 * 
 * Para ativar o Supabase:
 * 1. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
 * 2. Atualize os hooks (useAuth, useUserRole, etc.) para usar este client
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variáveis de ambiente do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as variáveis estão configuradas
const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Cria o client apenas se estiver configurado
// Caso contrário, retorna um mock que não faz nada
export const supabase: SupabaseClient = isConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// Flag para verificar se o Supabase está disponível
export const isSupabaseConfigured = isConfigured;

// Log informativo apenas em desenvolvimento
if (import.meta.env.DEV && !isConfigured) {
  console.info(
    '%c📦 Modo Demonstração Ativo',
    'color: #10b981; font-weight: bold;',
    '\nO sistema está usando dados mockados.',
    '\nPara ativar o Supabase, configure as variáveis de ambiente.'
  );
}
