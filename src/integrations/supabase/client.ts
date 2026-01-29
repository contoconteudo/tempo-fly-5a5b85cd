/**
 * Supabase Client - Configurado para produção
 * 
 * SEGURANÇA: Prefere variáveis de ambiente, com fallback para valores hardcoded em dev.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback para desenvolvimento (valores hardcoded)
const FALLBACK_SUPABASE_URL = "https://bpdqqmckynmvmklniwbr.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHFxbWNreW5tdm1rbG5pd2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjY4NTcsImV4cCI6MjA4NTIwMjg1N30.MTsKrCXltmTbGvXr8jLPzA2u1dMzSW3MoTl7uqW6ofU";

// Usa variáveis de ambiente se disponíveis, senão usa fallback
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

// Aviso em desenvolvimento se usando fallback
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    "[Supabase] Usando credenciais hardcoded. " +
    "Em produção, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente."
  );
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'conto-auth-token',
  },
});

export const isSupabaseConfigured = true;
