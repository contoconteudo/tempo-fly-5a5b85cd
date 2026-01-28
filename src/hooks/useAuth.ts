import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Tipo simplificado do usuário para a interface
export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  // Carrega sessão inicial e monitora mudanças
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Se não configurado, permanece no modo mock (embora o Login.tsx precise ser atualizado)
      setIsLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || "",
        };
        setUser(authUser);
        // Disparar evento para notificar outros hooks (como useUserRole e CompanyContext)
        window.dispatchEvent(new CustomEvent("auth-user-changed", { detail: authUser }));
      } else {
        setUser(null);
        window.dispatchEvent(new CustomEvent("auth-user-changed", { detail: null }));
      }
      setIsLoading(false);
    });

    // Carregar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || "",
        };
        setUser(authUser);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase não configurado. Verifique as variáveis de ambiente.");
    }
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, options?: { full_name?: string }): Promise<void> => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase não configurado. Verifique as variáveis de ambiente.");
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: options?.full_name || email.split('@')[0],
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
    
    toast.info("Verifique seu email para confirmar o cadastro.", { duration: 5000 });
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      return;
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    setUser(null);
    setSession(null);
  }, []);

  return {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
}