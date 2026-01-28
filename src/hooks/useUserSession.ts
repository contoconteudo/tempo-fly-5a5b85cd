/**
 * Hook centralizado para sessão do usuário com cache via React Query.
 * Substitui múltiplas chamadas redundantes ao banco por uma única fonte de verdade.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "gestor" | "comercial" | "analista";
export type ModulePermission = "dashboard" | "crm" | "clients" | "objectives" | "strategy" | "settings" | "admin";

export interface UserSession {
  user: {
    id: string;
    email: string;
    fullName: string;
  } | null;
  role: AppRole | null;
  modules: ModulePermission[];
  spaces: string[];
  isAdmin: boolean;
}

const QUERY_KEY = ["user-session"];
const SPACES_KEY = ["available-spaces"];

// Carregar dados de permissão do usuário em uma única query otimizada
async function fetchUserSession(userId: string): Promise<Omit<UserSession, "user">> {
  // Buscar role e permissões em paralelo
  const [roleResult, permResult, spacesResult] = await Promise.all([
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_permissions")
      .select("allowed_modules, allowed_spaces")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("spaces")
      .select("id")
  ]);

  const role = (roleResult.data?.role as AppRole) || null;
  const isAdmin = role === "admin";
  
  // Se admin, tem acesso total
  if (isAdmin) {
    const allSpaceIds = spacesResult.data?.map(s => s.id) || [];
    const allModules: ModulePermission[] = ["dashboard", "strategy", "crm", "clients", "settings", "admin"];
    return {
      role,
      modules: allModules,
      spaces: allSpaceIds,
      isAdmin: true,
    };
  }

  return {
    role,
    modules: (permResult.data?.allowed_modules || []) as ModulePermission[],
    spaces: permResult.data?.allowed_spaces || [],
    isAdmin: false,
  };
}

// Carregar espaços disponíveis
async function fetchAvailableSpaces() {
  const { data, error } = await supabase
    .from("spaces")
    .select("id, label, description, color, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao carregar espaços:", error);
    return [];
  }

  return data || [];
}

export function useUserSession() {
  const queryClient = useQueryClient();

  // Query para sessão do usuário - com cache de 5 minutos
  const sessionQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<UserSession> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          user: null,
          role: null,
          modules: [],
          spaces: [],
          isAdmin: false,
        };
      }

      const permissions = await fetchUserSession(user.id);
      
      return {
        user: {
          id: user.id,
          email: user.email || "",
          fullName: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
        },
        ...permissions,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Query para espaços disponíveis - com cache de 10 minutos
  const spacesQuery = useQuery({
    queryKey: SPACES_KEY,
    queryFn: fetchAvailableSpaces,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Escutar mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
          // Invalidar cache para forçar reload
          await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
          
          // Disparar evento para componentes legacy
          const mappedUser = session?.user ? {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name,
          } : null;
          window.dispatchEvent(new CustomEvent("auth-user-changed", { detail: mappedUser }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Escutar mudanças de espaços
  useEffect(() => {
    const handleSpacesChange = () => {
      queryClient.invalidateQueries({ queryKey: SPACES_KEY });
    };

    window.addEventListener("spaces-changed", handleSpacesChange);
    return () => window.removeEventListener("spaces-changed", handleSpacesChange);
  }, [queryClient]);

  // Funções auxiliares
  const hasRole = useCallback((checkRole: AppRole): boolean => {
    return sessionQuery.data?.role === checkRole;
  }, [sessionQuery.data?.role]);

  const canAccessModule = useCallback((module: ModulePermission): boolean => {
    if (!sessionQuery.data?.role) return false;
    if (sessionQuery.data.isAdmin) return true;
    return sessionQuery.data.modules.includes(module);
  }, [sessionQuery.data]);

  const canAccessSpace = useCallback((spaceId: string): boolean => {
    if (!sessionQuery.data?.role) return false;
    if (sessionQuery.data.isAdmin) return true;
    return sessionQuery.data.spaces.includes(spaceId);
  }, [sessionQuery.data]);

  // Invalidar cache manualmente
  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  const refreshSpaces = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SPACES_KEY });
  }, [queryClient]);

  return {
    // Dados da sessão
    user: sessionQuery.data?.user || null,
    role: sessionQuery.data?.role || null,
    modules: sessionQuery.data?.modules || [],
    allowedSpaces: sessionQuery.data?.spaces || [],
    isAdmin: sessionQuery.data?.isAdmin || false,
    
    // Estados de loading
    isLoading: sessionQuery.isLoading,
    isAuthenticated: !!sessionQuery.data?.user,
    
    // Espaços disponíveis
    availableSpaces: spacesQuery.data || [],
    spacesLoading: spacesQuery.isLoading,
    
    // Funções auxiliares
    hasRole,
    canAccessModule,
    canAccessSpace,
    refreshSession,
    refreshSpaces,
  };
}
